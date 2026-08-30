import { SubnetCalculationResult, VLSMSubnetRequest, VLSMSubnetResult } from '../types';

export function ipToNumber(ip: string): number {
  const parts = ip.trim().split('.');
  if (parts.length !== 4 || parts.some(p => !/^\d+$/.test(p))) {
    throw new Error(`Invalid IPv4 address format: "${ip}". Expected 4 octets between 0-255.`);
  }
  const octets = parts.map(Number);
  if (octets.some(p => p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address format: "${ip}". Expected 4 octets between 0-255.`);
  }
  return ((octets[0] << 24) >>> 0) + ((octets[1] << 16) >>> 0) + ((octets[2] << 8) >>> 0) + octets[3];
}

export function numberToIp(num: number): string {
  if (!Number.isFinite(num) || num < 0 || num > 0xFFFFFFFF || !Number.isInteger(num)) {
    throw new Error(`Invalid IPv4 integer: ${num}`);
  }
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

export function cidrToMask(cidr: number): string {
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) throw new Error('CIDR prefix must be an integer between 0 and 32');
  if (cidr === 0) return '0.0.0.0';
  const maskNum = ((0xFFFFFFFF << (32 - cidr)) >>> 0);
  return numberToIp(maskNum);
}

export function maskToCidr(mask: string): number {
  const maskNum = ipToNumber(mask);
  let binary = maskNum.toString(2).padStart(32, '0');
  const match = binary.match(/^1*/);
  const ones = match ? match[0].length : 0;
  if (binary.includes('01')) {
    throw new Error(`Invalid non-contiguous subnet mask: ${mask}`);
  }
  return ones;
}

export function ipToBinaryString(ip: string): string {
  const parts = ip.trim().split('.');
  if (parts.length !== 4 || parts.some(octet => !/^\d+$/.test(octet) || Number(octet) > 255)) {
    throw new Error(`Invalid IPv4 address: "${ip}"`);
  }
  return parts.map(octet => Number(octet).toString(2).padStart(8, '0')).join('.');
}

function parseCidr(value: number | string): number {
  const cidr = typeof value === 'number'
    ? value
    : value.includes('.')
      ? maskToCidr(value)
      : Number(value.trim());
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
    throw new Error('Invalid CIDR prefix (0-32)');
  }
  return cidr;
}

export function calculateSubnet(ipStr: string, cidrOrMask: number | string): SubnetCalculationResult {
  const cleanIp = ipStr.trim();
  const cidr = parseCidr(cidrOrMask);
  const ipNum = ipToNumber(cleanIp);
  const maskNum = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
  const wildcardNum = (~maskNum) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr === 31 ? 2 : cidr === 32 ? 1 : Math.max(0, totalHosts - 2);
  const firstUsableNum = cidr >= 31 ? networkNum : networkNum + 1;
  const lastUsableNum = cidr >= 31 ? broadcastNum : broadcastNum - 1;

  const firstOctet = Number(cleanIp.split('.')[0]);
  let ipClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'Classless' = 'Classless';
  if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D';
  else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'E';

  const secondOctet = Number(cleanIp.split('.')[1]);
  const isPrivate = firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168);

  const subnetMask = numberToIp(maskNum);
  const wildcardMask = numberToIp(wildcardNum);
  const networkAddress = numberToIp(networkNum);
  const broadcastAddress = numberToIp(broadcastNum);
  const firstUsableIp = numberToIp(firstUsableNum);
  const lastUsableIp = numberToIp(lastUsableNum);

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
    hexMask: '0x' + maskNum.toString(16).toUpperCase().padStart(8, '0'),
    ipv6Equivalent: `::ffff:${cleanIp}`,
    binary: { ip: ipToBinaryString(cleanIp), mask: ipToBinaryString(subnetMask) }
  };
}

export function calculateVLSM(
  baseNetwork: string,
  baseCidr: number,
  requirements: VLSMSubnetRequest[]
): VLSMSubnetResult[] {
  if (!Number.isInteger(baseCidr) || baseCidr < 0 || baseCidr > 30) {
    throw new Error('VLSM base CIDR must be an integer between 0 and 30');
  }
  if (!Array.isArray(requirements) || requirements.length === 0) {
    throw new Error('At least one VLSM host requirement is required');
  }

  const baseIpNum = ipToNumber(baseNetwork);
  const baseMaskNum = ipToNumber(cidrToMask(baseCidr));
  const baseNetworkNum = (baseIpNum & baseMaskNum) >>> 0;
  const baseBroadcastNum = (baseNetworkNum | ((~baseMaskNum) >>> 0)) >>> 0;

  const sorted = requirements
    .filter(req => Number.isFinite(req.hostsNeeded) && req.hostsNeeded > 0)
    .map(req => ({ ...req, hostsNeeded: Math.ceil(req.hostsNeeded) }))
    .sort((a, b) => b.hostsNeeded - a.hostsNeeded);

  if (sorted.length === 0) throw new Error('Host requirements must contain at least one positive value');

  let currentIpNum = baseNetworkNum;
  const results: VLSMSubnetResult[] = [];

  for (const req of sorted) {
    let hostBits = 2; // Minimum standard VLSM allocation is /30 (2 usable hosts).
    while (hostBits < 32 && Math.pow(2, hostBits) - 2 < req.hostsNeeded) hostBits++;
    if (hostBits > 30) {
      throw new Error(`Requirement "${req.name}" needs too many hosts for IPv4 VLSM: ${req.hostsNeeded}`);
    }

    const subnetCidr = 32 - hostBits;
    const maskNum = ipToNumber(cidrToMask(subnetCidr));
    const wildcardNum = (~maskNum) >>> 0;
    const blockSize = Math.pow(2, hostBits);

    // Every VLSM block must begin on its own natural boundary.
    const netNum = (currentIpNum & maskNum) >>> 0;
    const bcastNum = (netNum + blockSize - 1) >>> 0;

    if (netNum < baseNetworkNum || bcastNum > baseBroadcastNum || bcastNum < netNum) {
      throw new Error(`VLSM requirements exceed available address space in ${numberToIp(baseNetworkNum)}/${baseCidr}`);
    }

    const firstUsable = netNum + 1;
    const lastUsable = bcastNum - 1;
    const allocatedHosts = blockSize - 2;

    results.push({
      name: req.name,
      hostsNeeded: req.hostsNeeded,
      allocatedHosts,
      cidr: subnetCidr,
      subnetMask: cidrToMask(subnetCidr),
      networkAddress: numberToIp(netNum),
      broadcastAddress: numberToIp(bcastNum),
      usableRange: `${numberToIp(firstUsable)} - ${numberToIp(lastUsable)}`,
      firstUsableIp: numberToIp(firstUsable),
      lastUsableIp: numberToIp(lastUsable),
      wastedHosts: allocatedHosts - req.hostsNeeded
    });

    currentIpNum = bcastNum + 1;
    if (currentIpNum > baseBroadcastNum) break;
  }

  if (results.length !== sorted.length) {
    throw new Error(`VLSM allocation could not satisfy all ${sorted.length} requirements within ${numberToIp(baseNetworkNum)}/${baseCidr}`);
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
  const isRfc1918 = firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168);

  let type = 'Public Routable IPv4';
  let scope = 'Global Internet';
  let defaultMask = '255.255.255.0';
  let defaultCidr = 24;
  if (isLoopback) { type = 'Loopback Diagnostic Address'; scope = 'Host-Local Only'; defaultMask = '255.0.0.0'; defaultCidr = 8; }
  else if (isApipa) { type = 'APIPA / Link-Local Auto-Assigned (DHCP Failure)'; scope = 'Local Link Only (Non-Routable)'; defaultMask = '255.255.0.0'; defaultCidr = 16; }
  else if (isMulticast) { type = 'Class D Multicast Group'; scope = 'Multicast Routing Plane'; defaultMask = '240.0.0.0'; defaultCidr = 4; }
  else if (isRfc1918) {
    type = 'RFC 1918 Private Address Space';
    scope = 'Internal Enterprise / Campus (Requires NAT for Internet)';
    if (firstOctet === 10) { defaultMask = '255.0.0.0'; defaultCidr = 8; }
    else if (firstOctet === 172) { defaultMask = '255.240.0.0'; defaultCidr = 12; }
    else { defaultMask = '255.255.0.0'; defaultCidr = 16; }
  }
  return { type, scope, isRfc1918, isLoopback, isApipa, isMulticast, defaultMask, defaultCidr };
}

export function summarizeRoutes(routes: string[]): {
  summaryRoute: string;
  summaryMask: string;
  summaryCidr: number;
  coveredRoutes: string[];
  explanation: string;
} {
  if (!routes || routes.length === 0) throw new Error('No routes provided for summarization');
  const cleanRoutes = routes.map(r => r.trim()).filter(Boolean);
  if (cleanRoutes.length === 0) throw new Error('No valid routes provided for summarization');

  const parsed = cleanRoutes.map(route => {
    const parts = route.split('/');
    if (parts.length !== 2 || !/^\d+$/.test(parts[1])) throw new Error(`Invalid CIDR route: ${route}`);
    const cidr = Number(parts[1]);
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) throw new Error(`Invalid CIDR prefix in route: ${route}`);
    const ipNum = ipToNumber(parts[0]);
    const maskNum = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
    return { route, cidr, network: (ipNum & maskNum) >>> 0 };
  });

  const binaryList = parsed.map(r => r.network.toString(2).padStart(32, '0'));
  let commonBits = 0;
  for (let i = 0; i < 32; i++) {
    if (binaryList.every(b => b[i] === binaryList[0][i])) commonBits++;
    else break;
  }

  const summaryBinary = binaryList[0].slice(0, commonBits).padEnd(32, '0');
  const summaryIp = numberToIp(parseInt(summaryBinary, 2) >>> 0);
  const summaryMask = cidrToMask(commonBits);
  return {
    summaryRoute: `${summaryIp}/${commonBits}`,
    summaryMask,
    summaryCidr: commonBits,
    coveredRoutes: cleanRoutes,
    explanation: `Found ${commonBits} matching leading binary bits across ${cleanRoutes.length} routes. The result is the smallest CIDR supernet that contains all supplied network addresses.`
  };
}

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
    if (usedSet.has(currentIp) || reservedSet.has(currentIp)) usedCount++;
    else if (!suggested) suggested = currentIp;
  }
  const totalUsable = subnetInfo.usableHosts;
  const availableCount = Math.max(0, totalUsable - usedCount);
  return { suggestedIp: suggested, totalUsable, usedCount, availableCount, isExhausted: availableCount === 0 };
}

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
  try { candNum = ipToNumber(candidateIp); }
  catch (e: any) { return { valid: false, errorCode: 'INVALID_FORMAT', message: e.message }; }
  const subnet = calculateSubnet(networkIp, cidr);
  const netNum = ipToNumber(subnet.networkAddress);
  const bcastNum = ipToNumber(subnet.broadcastAddress);
  if (candNum === netNum) return { valid: false, errorCode: 'NETWORK_ADDRESS', message: `${candidateIp} is the Network Identifier (all host bits 0) and cannot be assigned to an interface.` };
  if (candNum === bcastNum && cidr < 31) return { valid: false, errorCode: 'BROADCAST_ADDRESS', message: `${candidateIp} is the Subnet Broadcast Address (all host bits 1) and is reserved for L3 broadcasts.` };
  if (candNum < netNum || candNum > bcastNum) return { valid: false, errorCode: 'OUTSIDE_SUBNET', message: `${candidateIp} does not belong to subnet ${subnet.networkAddress}/${cidr} (Usable range: ${subnet.firstUsableIp} - ${subnet.lastUsableIp}).` };
  const duplicate = existingIps.find(e => e.ip.trim() === candidateIp.trim());
  if (duplicate) return { valid: false, errorCode: 'DUPLICATE_IP', message: `IP Address Conflict: ${candidateIp} is already assigned to "${duplicate.deviceName}". Duplicate IPv4 addresses can cause ARP conflicts and packet delivery failures.` };
  return { valid: true, message: `${candidateIp} is valid and available in ${subnet.networkAddress}/${cidr}.` };
}

export function isSameSubnet(ip1: string, ip2: string, maskOrCidr: string | number): boolean {
  try {
    const num1 = ipToNumber(ip1);
    const num2 = ipToNumber(ip2);
    const cidr = parseCidr(maskOrCidr);
    const maskNum = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
    return ((num1 & maskNum) >>> 0) === ((num2 & maskNum) >>> 0);
  } catch { return false; }
}

export function isIpInSubnet(ip: string, subnetCidrStr: string): boolean {
  try {
    const [netIp, cidrStr] = subnetCidrStr.trim().split('/');
    if (!netIp || cidrStr === undefined) return false;
    return isSameSubnet(ip, netIp, Number(cidrStr));
  } catch { return false; }
}
