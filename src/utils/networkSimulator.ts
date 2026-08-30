import { 
  NetworkTopology, 
  NetworkDevice, 
  PacketTraceResult, 
  PacketHop, 
  RoutingTableEntry, 
  DnsRecord, 
  DhcpScope, 
  FirewallRule 
} from '../types';
import { ipToNumber, cidrToMask, isSameSubnet } from './subnetCalculator';

// Helper: match IP against CIDR subnet (e.g., is "192.168.10.15" in "192.168.10.0/24")
export function isIpInSubnet(ip: string, subnetWithCidr: string): boolean {
  if (subnetWithCidr === 'ANY' || subnetWithCidr === '0.0.0.0/0') return true;
  try {
    const [netIp, cidrStr] = subnetWithCidr.split('/');
    const cidr = cidrStr ? Number(cidrStr) : 32;
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return false;
    const mask = cidrToMask(cidr);
    return isSameSubnet(ip, netIp, mask);
  } catch {
    return false;
  }
}

/** Longest Prefix Match Router Decision Engine */
export function lookupRoutingTable(
  routingTable: RoutingTableEntry[] | undefined,
  destIp: string,
  connectedInterfaces: { ip: string; subnetMask: string; name: string }[]
): {
  matchedRoute?: RoutingTableEntry | { destination: string; nextHop: string; interface: string; type: string };
  action: 'forward' | 'drop';
  reason: string;
} {
  try { ipToNumber(destIp); } catch { return { action: 'drop', reason: `Invalid destination IPv4 address: ${destIp}` }; }

  for (const iface of connectedInterfaces) {
    if (iface.ip && iface.subnetMask && isSameSubnet(destIp, iface.ip, iface.subnetMask)) {
      return {
        matchedRoute: { destination: iface.ip, nextHop: 'Directly Connected', interface: iface.name, type: 'connected' },
        action: 'forward',
        reason: `Directly connected network on interface ${iface.name}`
      };
    }
  }

  if (!routingTable || routingTable.length === 0) {
    return { action: 'drop', reason: `No matching route in routing table for destination ${destIp} and no default gateway configured (Network Unreachable)` };
  }

  const matches: { route: RoutingTableEntry; prefixLen: number }[] = [];
  for (const route of routingTable) {
    if (route.destination === '0.0.0.0' || route.destination === 'default') {
      matches.push({ route, prefixLen: 0 });
      continue;
    }
    try {
      const mask = route.subnetMask || (route.cidr !== undefined ? cidrToMask(route.cidr) : '255.255.255.0');
      if (isSameSubnet(destIp, route.destination, mask)) {
        const prefixLen = maskToPrefixLength(mask);
        matches.push({ route, prefixLen });
      }
    } catch { /* Ignore malformed route entries. */ }
  }

  if (matches.length === 0) return { action: 'drop', reason: `Routing table has no route to ${destIp} (ICMP Destination Host/Network Unreachable)` };

  matches.sort((a, b) => b.prefixLen - a.prefixLen);
  const bestMatch = matches[0].route;
  return {
    matchedRoute: bestMatch,
    action: 'forward',
    reason: `Matched ${bestMatch.destination}/${bestMatch.cidr !== undefined ? bestMatch.cidr : matches[0].prefixLen} via next-hop ${bestMatch.nextHop} on ${bestMatch.interface} (LPM /${matches[0].prefixLen})`
  };
}

function maskToPrefixLength(mask: string): number {
  const bits = ipToNumber(mask).toString(2).padStart(32, '0');
  if (bits.includes('01')) throw new Error(`Invalid non-contiguous subnet mask: ${mask}`);
  return bits.replace(/0/g, '').length;
}

/** Stateful Firewall Rule Evaluator */
export function evaluateFirewall(
  rules: FirewallRule[] | undefined,
  sourceIp: string,
  destIp: string,
  protocol: string,
  port: number
): { allowed: boolean; matchedRule?: FirewallRule; reason: string } {
  if (!rules || rules.length === 0) return { allowed: true, reason: 'No firewall rules defined (Default Allow)' };

  const activeRules = [...rules].filter(r => r.enabled !== false).sort((a, b) => a.priority - b.priority);
  for (const rule of activeRules) {
    const srcMatch = isIpInSubnet(sourceIp, rule.sourceSubnet);
    const dstMatch = isIpInSubnet(destIp, rule.destSubnet);
    const protoMatch = rule.protocol === 'ANY' || rule.protocol.toUpperCase() === protocol.toUpperCase();

    let portMatch = true;
    if (rule.portRange && rule.portRange !== 'ANY') {
      portMatch = parsePortRange(rule.portRange, port);
    }

    if (srcMatch && dstMatch && protoMatch && portMatch) {
      const allowed = rule.action !== 'DENY';
      return {
        allowed,
        matchedRule: rule,
        reason: allowed
          ? `Traffic permitted by Firewall Rule #${rule.priority} "${rule.name}": ALLOW ${rule.protocol}`
          : `Traffic blocked by Firewall Rule #${rule.priority} "${rule.name}": DENY ${rule.protocol} from ${rule.sourceSubnet} to ${rule.destSubnet}`
      };
    }
  }

  return { allowed: true, reason: 'Implicit default allow (No matching explicit rule)' };
}

function parsePortRange(value: string, port: number): boolean {
  if (!Number.isInteger(port) || port < 0 || port > 65535) return false;
  return value.split(',').some(part => {
    const item = part.trim();
    if (!item) return false;
    if (/^\d+$/.test(item)) return Number(item) === port;
    const match = item.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) return false;
    const start = Number(match[1]);
    const end = Number(match[2]);
    return start >= 0 && end <= 65535 && start <= end && port >= start && port <= end;
  });
}

/** DNS Resolution Engine */
export function resolveDns(domainOrIp: string, dnsServerDevice: NetworkDevice | undefined): {
  resolvedIp?: string; recordType?: string; found: boolean; explanation: string;
} {
  const query = domainOrIp.trim();
  if (!query.includes('.')) return { found: false, explanation: 'Invalid domain query format' };

  try {
    ipToNumber(query);
    return { resolvedIp: query, recordType: 'Direct IPv4', found: true, explanation: 'Direct IPv4 destination, bypassing DNS resolution.' };
  } catch { /* Treat as hostname. */ }

  if (!dnsServerDevice || !dnsServerDevice.services?.dnsServer) {
    const commonDomains: Record<string, string> = {
      'google.com': '142.250.190.46',
      'netlab.local': '192.168.1.100',
      'gateway.local': '192.168.1.1',
      'intranet.corp': '10.0.0.50',
      'cctv.campus': '192.168.40.10'
    };
    const resolved = commonDomains[query.toLowerCase()];
    if (resolved) return { resolvedIp: resolved, recordType: 'A Record', found: true, explanation: `Resolved ${query} to ${resolved} via simulator DNS.` };
    return { found: false, explanation: `DNS Query failed: Server "${dnsServerDevice?.name || 'Default DNS'}" has no record for "${query}". (NXDOMAIN)` };
  }

  const records: DnsRecord[] = dnsServerDevice.services.dnsRecords || [];
  const matched = records.find(r => r.domain.toLowerCase() === query.toLowerCase());
  if (matched) return { resolvedIp: matched.value, recordType: matched.type, found: true, explanation: `DNS Server ${dnsServerDevice.name} resolved ${query} -> ${matched.value} (${matched.type} Record, TTL ${matched.ttl}s).` };
  return { found: false, explanation: `DNS Server ${dnsServerDevice.name} returned NXDOMAIN for ${query}.` };
}

/** DHCP Simulation (DORA Workflow) */
export function simulateDhcpRequest(clientDevice: NetworkDevice, dhcpServerDevice: NetworkDevice): {
  success: boolean; assignedIp?: string; subnetMask?: string; gateway?: string; dns?: string;
  steps: { step: string; from: string; to: string; description: string }[]; failureReason?: string;
} {
  const scope: DhcpScope | undefined = dhcpServerDevice.services?.dhcpScope;
  if (!scope || !dhcpServerDevice.services?.dhcpServer) {
    return { success: false, steps: [], failureReason: `Device ${dhcpServerDevice.name} does not have an active DHCP service or scope configured.` };
  }

  try {
    ipToNumber(scope.startIp); ipToNumber(scope.gateway); ipToNumber(scope.dnsServer);
  } catch {
    return { success: false, steps: [], failureReason: 'DHCP scope contains an invalid IPv4 address.' };
  }

  const steps = [
    { step: 'DHCP DISCOVER', from: clientDevice.name, to: '255.255.255.255 (Broadcast)', description: `${clientDevice.name} broadcasts a DHCP Discover on the local broadcast domain.` },
    { step: 'DHCP OFFER', from: dhcpServerDevice.name, to: clientDevice.name, description: `${dhcpServerDevice.name} offers IP address ${scope.startIp} with lease duration of ${scope.leaseDurationHours} hours.` },
    { step: 'DHCP REQUEST', from: clientDevice.name, to: dhcpServerDevice.name, description: `${clientDevice.name} requests the offered address ${scope.startIp}.` },
    { step: 'DHCP ACK', from: dhcpServerDevice.name, to: clientDevice.name, description: `${dhcpServerDevice.name} acknowledges the lease and provides Gateway (${scope.gateway}) and DNS (${scope.dnsServer}).` }
  ];

  return { success: true, assignedIp: scope.startIp, subnetMask: scope.subnetMask, gateway: scope.gateway, dns: scope.dnsServer, steps };
}

/** Comprehensive Packet Journey & Hop-by-Hop Trace Engine */
export function simulatePacketTrace(
  topology: NetworkTopology,
  sourceIdOrIp: string,
  destIdOrIp: string,
  protocol: 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' = 'ICMP',
  destPort: number = 80
): PacketTraceResult {
  const devices = topology.devices;
  const connections = topology.connections;
  const srcDev = devices.find(d => d.id === sourceIdOrIp || d.ip === sourceIdOrIp || d.name.toLowerCase() === sourceIdOrIp.toLowerCase());
  let dstDev = devices.find(d => d.id === destIdOrIp || d.ip === destIdOrIp || d.name.toLowerCase() === destIdOrIp.toLowerCase());
  let targetIp = destIdOrIp;

  if (!srcDev) return { success: false, sourceDevice: sourceIdOrIp, destinationDevice: destIdOrIp, totalHops: 0, hops: [], summary: `Source node '${sourceIdOrIp}' does not exist in active topology.`, failureReason: 'Source device missing' };

  if (!dstDev && !/^\d+\.\d+\.\d+\.\d+$/.test(destIdOrIp)) {
    const dnsServer = devices.find(d => d.services?.dnsServer || d.ip === srcDev.dns);
    const dnsRes = resolveDns(destIdOrIp, dnsServer);
    if (dnsRes.found && dnsRes.resolvedIp) {
      targetIp = dnsRes.resolvedIp;
      dstDev = devices.find(d => d.ip === targetIp);
    } else {
      return { success: false, sourceDevice: srcDev.name, destinationDevice: destIdOrIp, totalHops: 1, hops: [], summary: dnsRes.explanation, failureReason: 'DNS resolution failed' };
    }
  }

  const srcIp = srcDev.ip || '0.0.0.0';
  const dstIp = dstDev ? (dstDev.ip || targetIp) : targetIp;
  try { ipToNumber(dstIp); } catch {
    return { success: false, sourceDevice: srcDev.name, destinationDevice: dstIp, totalHops: 1, hops: [], summary: `Destination '${dstIp}' is not a valid IPv4 address.`, failureReason: 'Invalid destination IP' };
  }

  if (srcDev.status === 'down') return makeFailure(srcDev, dstDev, dstIp, srcIp, protocol, 'Interface Down', 'Physical', 'Interface disabled', `${srcDev.name} is powered off or administratively down.`);
  if (!srcDev.ip) return makeFailure(srcDev, dstDev, dstIp, srcIp, protocol, 'Unconfigured IP', 'Network', 'Missing IPv4 address', `${srcDev.name} has no IPv4 address configured.`);

  // Only UP links participate in path selection. This prevents BFS from choosing a broken shortcut.
  const graph: Record<string, { neighborId: string; connectionId: string; type: string; status: string }[]> = {};
  devices.forEach(d => { graph[d.id] = []; });
  connections.forEach(conn => {
    if (conn.status === 'down') return;
    if (graph[conn.sourceDeviceId] && graph[conn.targetDeviceId]) {
      graph[conn.sourceDeviceId].push({ neighborId: conn.targetDeviceId, connectionId: conn.id, type: conn.type, status: conn.status });
      graph[conn.targetDeviceId].push({ neighborId: conn.sourceDeviceId, connectionId: conn.id, type: conn.type, status: conn.status });
    }
  });

  const isLocalSubnet = isSameSubnet(srcDev.ip, dstIp, srcDev.subnetMask || '255.255.255.0');
  if (!isLocalSubnet && !srcDev.gateway && srcDev.type !== 'router') {
    return makeFailure(srcDev, dstDev, dstIp, srcIp, protocol, 'No Default Gateway', 'Network', 'Missing Default Gateway', `${srcDev.name} has no default gateway for off-subnet traffic.`, 'Configure a gateway in the same subnet as the source interface.');
  }

  const queue: { currentId: string; path: string[] }[] = [{ currentId: srcDev.id, path: [srcDev.id] }];
  const visited = new Set<string>([srcDev.id]);
  let foundPath: string[] | null = null;
  const targetDeviceId = dstDev ? dstDev.id : '';

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;
    if (targetDeviceId && currentId === targetDeviceId) { foundPath = path; break; }
    for (const neighbor of graph[currentId] || []) {
      if (!visited.has(neighbor.neighborId)) {
        visited.add(neighbor.neighborId);
        queue.push({ currentId: neighbor.neighborId, path: [...path, neighbor.neighborId] });
      }
    }
  }

  if (!foundPath) {
    return makeFailure(srcDev, dstDev, dstIp, srcIp, protocol, 'No Physical Route', 'Physical', 'Unreachable topology path', `No active path exists between ${srcDev.name} and ${dstDev ? dstDev.name : dstIp}.`, 'Check device status and ensure every required link is UP.');
  }

  const hops: PacketHop[] = [];
  let ttl = 64;
  let hasFailed = false;
  let failureReason = '';
  let dropTip = '';
  const arpSequence: { step: number; description: string; source: string; target: string; type: 'request' | 'reply' }[] = [];

  for (let i = 0; i < foundPath.length; i++) {
    const currentDev = devices.find(d => d.id === foundPath[i])!;
    const isFirstHop = i === 0;
    const isLastHop = i === foundPath.length - 1;
    const nextDev = !isLastHop ? devices.find(d => d.id === foundPath[i + 1]) : null;

    // A device that is down must not participate in forwarding even if a stale topology path exists.
    if (currentDev.status === 'down') {
      hops.push(makeHop(currentDev, srcIp, dstIp, protocol, ttl, 'Interface Down', 'Physical', 'dropped', 'Interface disabled', `${currentDev.name} is down and cannot forward traffic.`, nextDev));
      hasFailed = true; failureReason = `Interface down on ${currentDev.name}`; dropTip = 'Power on the device or enable its interface.'; break;
    }

    if (currentDev.type === 'switch' && isFirstHop && nextDev && srcDev.vlan && dstDev?.vlan && srcDev.vlan !== dstDev.vlan && !devices.some(d => d.type === 'router' || d.type === 'firewall')) {
      hops.push(makeHop(currentDev, srcIp, dstIp, protocol, ttl, 'VLAN Segmentation Drop', 'Data Link', 'dropped', 'VLAN Isolation', `${currentDev.name} isolated VLAN ${srcDev.vlan} from VLAN ${dstDev.vlan}.`, nextDev));
      hasFailed = true; failureReason = `VLAN Isolation: VLAN ${srcDev.vlan} cannot talk to VLAN ${dstDev.vlan} without a router`; dropTip = 'Add an inter-VLAN router/L3 switch or place both endpoints in the same VLAN.'; break;
    }

    if (currentDev.type === 'firewall' || currentDev.services?.firewallEnabled) {
      const fwEval = evaluateFirewall(currentDev.services?.firewallRules, srcIp, dstIp, protocol, destPort);
      if (!fwEval.allowed) {
        hops.push(makeHop(currentDev, srcIp, dstIp, protocol, ttl, 'Firewall Drop (ACL DENY)', 'Network', 'dropped', 'Blocked by Firewall Rule', `${currentDev.name} blocked the packet: ${fwEval.reason}`, nextDev));
        hasFailed = true; failureReason = fwEval.reason; dropTip = `Adjust the firewall rule to allow ${protocol} traffic on port ${destPort}.`; break;
      }
    }

    let hopAction = 'Forwarded';
    let hopExplanation = `Intermediate device forwarded traffic toward ${nextDev?.name || 'the destination'}.`;
    let whyExplanation = 'Intermediate device forwarded traffic through an active link.';
    let hopLayer: 'Application' | 'Transport' | 'Network' | 'Data Link' | 'Physical' = 'Network';

    if (isFirstHop) {
      hopAction = 'Packet Origination & ARP Lookup';
      hopExplanation = `${currentDev.name} encapsulated ${protocol} into IPv4 (Src: ${srcIp}, Dst: ${dstIp}) and resolved the next-hop MAC address.`;
      whyExplanation = 'The source host determines whether the destination is local or must be reached through the default gateway, then resolves the next-hop MAC with ARP.';
      hopLayer = 'Network';
      const arpTarget = isLocalSubnet ? dstIp : (srcDev.gateway || dstIp);
      arpSequence.push({ step: 1, description: `${currentDev.name} broadcasts ARP Request "Who has ${arpTarget}? Tell ${srcIp}"`, source: currentDev.name, target: 'FF:FF:FF:FF:FF:FF (Broadcast)', type: 'request' });
      if (nextDev) arpSequence.push({ step: 2, description: `${nextDev.name} unicasts an ARP Reply for ${arpTarget}.`, source: nextDev.name, target: currentDev.name, type: 'reply' });
    } else if (isLastHop) {
      hopAction = 'Destination Received & Decapsulated';
      hopExplanation = `${currentDev.name} received the IPv4 packet for ${dstIp}, decapsulated it, and processed the ${protocol} request.`;
      whyExplanation = 'The destination host accepts packets addressed to its interface and delivers the payload to the appropriate protocol handler.';
      hopLayer = 'Application';
    } else if (currentDev.type === 'router') {
      ttl--;
      if (ttl <= 0) {
        hops.push(makeHop(currentDev, srcIp, dstIp, protocol, ttl, 'TTL Expired', 'Network', 'dropped', 'TTL expired', `${currentDev.name} discarded the packet because its IPv4 TTL reached zero.`, nextDev));
        hasFailed = true; failureReason = 'TTL expired'; dropTip = 'Check for a routing loop in the simulated topology.'; break;
      }
      hopAction = `L3 Routing & TTL Decrement (TTL=${ttl})`;
      hopExplanation = `${currentDev.name} performed a routing decision, decremented IPv4 TTL to ${ttl}, rewrote the Layer-2 headers, and forwarded the frame.`;
      whyExplanation = 'Routers forward based on destination IP and decrement TTL at every routed hop to prevent packets from looping forever.';
      hopLayer = 'Network';
    } else if (currentDev.type === 'switch') {
      hopAction = 'L2 MAC Switching';
      hopExplanation = `${currentDev.name} forwarded the Ethernet frame toward ${nextDev?.name || 'the destination'} using its Layer-2 switching function.`;
      whyExplanation = 'A Layer-2 switch forwards Ethernet frames without decrementing the IPv4 TTL.';
      hopLayer = 'Data Link';
    }

    hops.push({
      hopNumber: i + 1, deviceId: currentDev.id, deviceName: currentDev.name, deviceType: currentDev.type,
      action: hopAction, explanation: hopExplanation, whyExplanation, layer: hopLayer,
      sourceIp: srcIp, destIp: dstIp, sourceMac: currentDev.mac || '00:50:56:A1:B2:C3',
      destMac: nextDev ? (nextDev.mac || '00:50:56:D4:E5:F6') : (dstDev?.mac || '00:50:56:D4:E5:F6'),
      protocol, port: destPort, ttl, status: 'forwarded',
      layerData: {
        l2: { srcMac: currentDev.mac || '00:50:56:A1:B2:C3', destMac: nextDev?.mac || dstDev?.mac || '00:50:56:D4:E5:F6', vlanId: currentDev.vlan || 1, frameType: '0x0800 (IPv4)' },
        l3: { srcIp, destIp: dstIp, ttl, protocol },
        l4: { srcPort: 49152 + Math.floor(Math.random() * 10000), destPort, tcpFlags: protocol === 'HTTP' || protocol === 'HTTPS' || protocol === 'SSH' ? '[SYN]' : undefined },
        l7: { protocol, messageType: protocol === 'ICMP' ? 'Echo Request (Type 8, Code 0)' : `${protocol} Request` }
      }
    });
  }

  if (hasFailed) return { success: false, sourceDevice: srcDev.name, destinationDevice: dstDev ? dstDev.name : targetIp, totalHops: hops.length, hops, summary: `Packet trace failed at hop ${hops.length}: ${failureReason}`, failureReason, troubleshootingTip: dropTip, arpSequence };
  return { success: true, sourceDevice: srcDev.name, destinationDevice: dstDev ? dstDev.name : targetIp, totalHops: hops.length, hops, summary: `Successful end-to-end transmission: ${srcDev.name} (${srcIp}) <---> ${dstDev ? dstDev.name : targetIp} via ${hops.length} network hops.`, arpSequence };
}

function makeHop(
  device: NetworkDevice, sourceIp: string, destIp: string, protocol: string, ttl: number,
  action: string, layer: 'Application' | 'Transport' | 'Network' | 'Data Link' | 'Physical',
  status: 'forwarded' | 'dropped', dropReason: string, explanation: string, nextDev?: NetworkDevice | null
): PacketHop {
  return {
    hopNumber: 1, deviceId: device.id, deviceName: device.name, deviceType: device.type, action, explanation,
    whyExplanation: explanation, layer, sourceIp, destIp, protocol, ttl, status, dropReason,
    sourceMac: device.mac || '00:50:56:A1:B2:C3', destMac: nextDev?.mac || '00:50:56:D4:E5:F6'
  };
}

function makeFailure(
  srcDev: NetworkDevice, dstDev: NetworkDevice | undefined, dstIp: string, srcIp: string, protocol: string,
  action: string, layer: 'Network' | 'Physical', dropReason: string, explanation: string, troubleshootingTip = ''
): PacketTraceResult {
  const hop = makeHop(srcDev, srcIp, dstIp, protocol, 64, action, layer, 'dropped', dropReason, explanation);
  return {
    success: false, sourceDevice: srcDev.name, destinationDevice: dstDev ? dstDev.name : dstIp, totalHops: 1,
    hops: [hop], summary: `Transmission failed: ${explanation}`, failureReason: dropReason, troubleshootingTip
  };
}
