import { SubnetCalculationResult, VLSMSubnetRequest, VLSMSubnetResult } from '../types';

export function ipToNumber(ip: string): number {
  const parts = ip.trim().split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address format: "${ip}". Expected 4 octets between 0-255.`);
  }
  return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

export function cidrToMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) throw new Error('CIDR prefix must be between 0 and 32');
  if (cidr === 0) return '0.0.0.0';
  const maskNum = ((0xFFFFFFFF << (32 - cidr)) >>> 0);
  return numberToIp(maskNum);
}

export function maskToCidr(mask: string): number {
  const maskNum = ipToNumber(mask);
  let binary = maskNum.toString(2);
  while (binary.length < 32) binary = '0' + binary;
  const match = binary.match(/^1*/);
  const ones = match ? match[0].length : 0;
  if (binary.indexOf('01') !== -1) {
    throw new Error(`Invalid non-contiguous subnet mask: ${mask}`);
  }
  return ones;
}

export function ipToBinaryString(ip: string): string {
  return ip.split('.').map(octet => {
    const bin = parseInt(octet, 10).toString(2);
    return bin.padStart(8, '0');
  }).join('.');
}

export function calculateSubnet(ipStr: string, cidrOrMask: number | string): SubnetCalculationResult {
  const cleanIp = ipStr.trim();
  let cidr: number;
  if (typeof cidrOrMask === 'number') {
    cidr = cidrOrMask;
  } else if (cidrOrMask.includes('.')) {
    cidr = maskToCidr(cidrOrMask);
  } else {
    cidr = parseInt(cidrOrMask, 10);
  }

  if (isNaN(cidr) || cidr < 0 || cidr > 32) {
    throw new Error('Invalid CIDR prefix (0-32)');
  }

  const ipNum = ipToNumber(cleanIp);
  const maskNum = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
  const wildcardNum = (~maskNum) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

  const firstUsableNum = cidr >= 31 ? networkNum : networkNum + 1;
  const lastUsableNum = cidr >= 31 ? broadcastNum : broadcastNum - 1;

  const firstOctet = parseInt(cleanIp.split('.')[0], 10);
  let ipClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'Classless' = 'Classless';
  if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D';
  else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'E';

  // RFC 1918 Private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const isPrivate = (
    firstOctet === 10 ||
    (firstOctet === 172 && parseInt(cleanIp.split('.')[1], 10) >= 16 && parseInt(cleanIp.split('.')[1], 10) <= 31) ||
    (firstOctet === 192 && parseInt(cleanIp.split('.')[1], 10) === 168)
  );

  const subnetMask = numberToIp(maskNum);
  const wildcardMask = numberToIp(wildcardNum);
  const networkAddress = numberToIp(networkNum);
  const broadcastAddress = numberToIp(broadcastNum);
  const firstUsableIp = numberToIp(firstUsableNum);
  const lastUsableIp = numberToIp(lastUsableNum);

  const hexMask = '0x' + maskNum.toString(16).toUpperCase().padStart(8, '0');
  const ipv6Equivalent = `::ffff:${cleanIp}`;

  return {
    ip: cleanIp,
    cidr,
    subnetMask,
    wildcardMask,
    networkAddress,
    broadcastAddress,
    firstUsableIp,
    lastUsableIp,
    usableHosts,
    totalHosts,
    ipClass,
    isPrivate,
    ipBinary: ipToBinaryString(cleanIp),
    maskBinary: ipToBinaryString(subnetMask),
    networkBinary: ipToBinaryString(networkAddress),
    broadcastBinary: ipToBinaryString(broadcastAddress),
    hexMask,
    ipv6Equivalent,
    binary: {
      ip: ipToBinaryString(cleanIp),
      mask: ipToBinaryString(subnetMask)
    }
  };
}

export function calculateVLSM(
  baseNetwork: string,
  baseCidr: number,
  requirements: VLSMSubnetRequest[]
): VLSMSubnetResult[] {
  // Sort requirements descending by hosts needed (Rule #1 of VLSM)
  const sorted = [...requirements].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
  let currentIpNum = (ipToNumber(baseNetwork) & ipToNumber(cidrToMask(baseCidr))) >>> 0;

  const results: VLSMSubnetResult[] = [];

  for (const req of sorted) {
    if (req.hostsNeeded <= 0) continue;
    // Calculate required host bits
    let hostBits = 1;
    while (Math.pow(2, hostBits) - 2 < req.hostsNeeded) {
      hostBits++;
    }
    // For point-to-point /30 or /31 links:
    if (req.hostsNeeded === 2) hostBits = 2; // /30
    if (req.hostsNeeded === 1) hostBits = 2; // /30 standard

    const subnetCidr = 32 - hostBits;
    const allocatedHosts = Math.pow(2, hostBits) - 2;
    const maskStr = cidrToMask(subnetCidr);
    const maskNum = ipToNumber(maskStr);
    const wildcardNum = (~maskNum) >>> 0;

    const netNum = (currentIpNum & maskNum) >>> 0;
    const bcastNum = (netNum | wildcardNum) >>> 0;

    const firstUsable = numberToIp(netNum + 1);
    const lastUsable = numberToIp(bcastNum - 1);

    results.push({
      name: req.name,
      hostsNeeded: req.hostsNeeded,
      allocatedHosts,
      cidr: subnetCidr,
      subnetMask: maskStr,
      networkAddress: numberToIp(netNum),
      broadcastAddress: numberToIp(bcastNum),
      usableRange: `${firstUsable} - ${lastUsable}`,
      firstUsableIp: firstUsable,
      lastUsableIp: lastUsable,
      wastedHosts: Math.max(0, allocatedHosts - req.hostsNeeded)
    });

    // Advance to next subnet block
    currentIpNum = (bcastNum + 1) >>> 0;
  }

  return results;
}

export function analyzeIP(ipStr: string): {
  type: string;
  scope: string;
  isRfc1918: boolean;
  isLoopback: boolean;
  isApipa: boolean;
  isMulticast: boolean;
  defaultMask: string;
  defaultCidr: number;
} {
  const ipNum = ipToNumber(ipStr);
  const firstOctet = (ipNum >>> 24) & 255;
  const secondOctet = (ipNum >>> 16) & 255;

  const isLoopback = firstOctet === 127;
  const isApipa = firstOctet === 169 && secondOctet === 254;
  const isMulticast = firstOctet >= 224 && firstOctet <= 239;
  const isRfc1918 = (
    firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168)
  );

  let type = 'Public Routable IPv4';
  let scope = 'Global Internet';
  let defaultMask = '255.255.255.0';
  let defaultCidr = 24;

  if (isLoopback) {
    type = 'Loopback Diagnostic Address';
    scope = 'Host-Local Only';
    defaultMask = '255.0.0.0';
    defaultCidr = 8;
  } else if (isApipa) {
    type = 'APIPA / Link-Local Auto-Assigned (DHCP Failure)';
    scope = 'Local Link Only (Non-Routable)';
    defaultMask = '255.255.0.0';
    defaultCidr = 16;
  } else if (isMulticast) {
    type = 'Class D Multicast Group';
    scope = 'Multicast Routing Plane';
    defaultMask = '240.0.0.0';
    defaultCidr = 4;
  } else if (isRfc1918) {
    type = 'RFC 1918 Private Address Space';
    scope = 'Internal Enterprise / Campus (Requires NAT for Internet)';
    if (firstOctet === 10) { defaultMask = '255.0.0.0'; defaultCidr = 8; }
    else if (firstOctet === 172) { defaultMask = '255.240.0.0'; defaultCidr = 12; }
    else { defaultMask = '255.255.0.0'; defaultCidr = 16; }
  }

  return {
    type,
    scope,
    isRfc1918,
    isLoopback,
    isApipa,
    isMulticast,
    defaultMask,
    defaultCidr
  };
}

/**
 * Route Summarization (CIDR Supernetting)
 * Takes a list of IPv4 subnets (e.g. 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24)
 * and calculates the summary route (192.168.0.0/22).
 */
export function summarizeRoutes(routes: string[]): {
  summaryRoute: string;
  summaryMask: string;
  summaryCidr: number;
  coveredRoutes: string[];
  explanation: string;
} {
  if (!routes || routes.length === 0) {
    throw new Error('No routes provided for summarization');
  }

  const cleanRoutes = routes.map(r => r.trim()).filter(Boolean);
  if (cleanRoutes.length === 1) {
    const [ip, cidrStr] = cleanRoutes[0].split('/');
    const cidr = cidrStr ? parseInt(cidrStr, 10) : 24;
    return {
      summaryRoute: cleanRoutes[0],
      summaryMask: cidrToMask(cidr),
      summaryCidr: cidr,
      coveredRoutes: cleanRoutes,
      explanation: 'Single route provided, matches exact prefix.'
    };
  }

  // Convert each network to 32-bit binary string
  const binaryList = cleanRoutes.map(r => {
    const [ip] = r.split('/');
    const num = ipToNumber(ip);
    return num.toString(2).padStart(32, '0');
  });

  // Find common binary prefix length
  let commonBits = 0;
  for (let i = 0; i < 32; i++) {
    const bit = binaryList[0][i];
    const allMatch = binaryList.every(b => b[i] === bit);
    if (allMatch) {
      commonBits++;
    } else {
      break;
    }
  }

  const summaryBinary = binaryList[0].substring(0, commonBits).padEnd(32, '0');
  const summaryNum = parseInt(summaryBinary, 2) >>> 0;
  const summaryIp = numberToIp(summaryNum);
  const summaryMask = cidrToMask(commonBits);

  return {
    summaryRoute: `${summaryIp}/${commonBits}`,
    summaryMask,
    summaryCidr: commonBits,
    coveredRoutes: cleanRoutes,
    explanation: `Found ${commonBits} matching leading binary bits across ${cleanRoutes.length} subnets. Aggregated into summary supernet ${summaryIp}/${commonBits}.`
  };
}

/**
 * Next Available IP Suggester & Validator for IPAM
 */
export function suggestNextAvailableIp(
  networkIp: string,
  cidr: number,
  usedIps: string[],
  reservedIps: string[] = []
): {
  suggestedIp: string | null;
  totalUsable: number;
  usedCount: number;
  availableCount: number;
  isExhausted: boolean;
} {
  const subnetInfo = calculateSubnet(networkIp, cidr);
  const startNum = ipToNumber(subnetInfo.firstUsableIp);
  const endNum = ipToNumber(subnetInfo.lastUsableIp);

  const usedSet = new Set(usedIps.map(ip => ip.trim()));
  const reservedSet = new Set(reservedIps.map(ip => ip.trim()));

  let suggested: string | null = null;
  let usedCount = 0;

  for (let n = startNum; n <= endNum; n++) {
    const currentIp = numberToIp(n);
    if (usedSet.has(currentIp) || reservedSet.has(currentIp)) {
      usedCount++;
    } else if (!suggested) {
      suggested = currentIp;
    }
  }

  const totalUsable = subnetInfo.usableHosts;
  const availableCount = Math.max(0, totalUsable - usedCount);

  return {
    suggestedIp: suggested,
    totalUsable,
    usedCount,
    availableCount,
    isExhausted: availableCount === 0
  };
}

/**
 * IP Allocation Validator:
 * Validates whether an IP can be assigned to a device within a given subnet
 */
export function validateIpAssignment(
  candidateIp: string,
  networkIp: string,
  cidr: number,
  existingIps: { ip: string; deviceName: string }[]
): {
  valid: boolean;
  errorCode?: 'INVALID_FORMAT' | 'NETWORK_ADDRESS' | 'BROADCAST_ADDRESS' | 'OUTSIDE_SUBNET' | 'DUPLICATE_IP' | 'RESERVED_GATEWAY';
  message: string;
} {
  let candNum: number;
  try {
    candNum = ipToNumber(candidateIp);
  } catch (e: any) {
    return { valid: false, errorCode: 'INVALID_FORMAT', message: e.message };
  }

  const subnet = calculateSubnet(networkIp, cidr);
  const netNum = ipToNumber(subnet.networkAddress);
  const bcastNum = ipToNumber(subnet.broadcastAddress);

  if (candNum === netNum) {
    return {
      valid: false,
      errorCode: 'NETWORK_ADDRESS',
      message: `${candidateIp} is the Network Identifier (all host bits 0) and cannot be assigned to an interface.`
    };
  }

  if (candNum === bcastNum) {
    return {
      valid: false,
      errorCode: 'BROADCAST_ADDRESS',
      message: `${candidateIp} is the Subnet Broadcast Address (all host bits 1) and is reserved for L3 broadcasts.`
    };
  }

  if (candNum < netNum || candNum > bcastNum) {
    return {
      valid: false,
      errorCode: 'OUTSIDE_SUBNET',
      message: `${candidateIp} does not belong to subnet ${subnet.networkAddress}/${cidr} (Usable range: ${subnet.firstUsableIp} - ${subnet.lastUsableIp}).`
    };
  }

  const duplicate = existingIps.find(e => e.ip === candidateIp);
  if (duplicate) {
    return {
      valid: false,
      errorCode: 'DUPLICATE_IP',
      message: `IP Address Conflict: ${candidateIp} is already assigned to "${duplicate.deviceName}". Duplicate IPv4 addresses cause ARP table flapping and packet drops.`
    };
  }

  return {
    valid: true,
    message: `${candidateIp} is valid and available in ${subnet.networkAddress}/${cidr}.`
  };
}

/**
 * Checks if two IP addresses reside in the same IP subnet given a subnet mask or CIDR
 */
export function isSameSubnet(ip1: string, ip2: string, maskOrCidr: string | number): boolean {
  try {
    const num1 = ipToNumber(ip1);
    const num2 = ipToNumber(ip2);
    let maskNum: number;
    if (typeof maskOrCidr === 'number') {
      maskNum = maskOrCidr === 0 ? 0 : ((0xFFFFFFFF << (32 - maskOrCidr)) >>> 0);
    } else if (maskOrCidr.includes('.')) {
      maskNum = ipToNumber(maskOrCidr);
    } else {
      const cidr = parseInt(maskOrCidr, 10);
      maskNum = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
    }
    return (num1 & maskNum) === (num2 & maskNum);
  } catch {
    return false;
  }
}

/**
 * Checks if an IP is within a CIDR subnet string like "192.168.1.0/24"
 */
export function isIpInSubnet(ip: string, subnetCidrStr: string): boolean {
  try {
    const [netIp, cidrStr] = subnetCidrStr.split('/');
    const cidr = parseInt(cidrStr || '24', 10);
    return isSameSubnet(ip, netIp, cidr);
  } catch {
    return false;
  }
}

