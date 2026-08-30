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
    const cidr = cidrStr ? parseInt(cidrStr, 10) : 32;
    const mask = cidrToMask(cidr);
    return isSameSubnet(ip, netIp, mask);
  } catch {
    return false;
  }
}

/**
 * Longest Prefix Match (LPM) Router Decision Engine
 */
export function lookupRoutingTable(
  routingTable: RoutingTableEntry[] | undefined,
  destIp: string,
  connectedInterfaces: { ip: string; subnetMask: string; name: string }[]
): {
  matchedRoute?: RoutingTableEntry | { destination: string; nextHop: string; interface: string; type: string };
  action: 'forward' | 'drop';
  reason: string;
} {
  // 1. Check Directly Connected subnets first
  for (const iface of connectedInterfaces) {
    if (iface.ip && iface.subnetMask) {
      if (isSameSubnet(destIp, iface.ip, iface.subnetMask)) {
        return {
          matchedRoute: {
            destination: iface.ip,
            nextHop: 'Directly Connected',
            interface: iface.name,
            type: 'connected'
          },
          action: 'forward',
          reason: `Directly connected network on interface ${iface.name}`
        };
      }
    }
  }

  if (!routingTable || routingTable.length === 0) {
    return {
      action: 'drop',
      reason: `No matching route in routing table for destination ${destIp} and no default gateway configured (Network Unreachable)`
    };
  }

  // 2. Filter valid matching routes & sort by longest prefix match (most specific CIDR mask first)
  const matches: { route: RoutingTableEntry; prefixLen: number }[] = [];

  for (const route of routingTable) {
    if (route.destination === '0.0.0.0' || route.destination === 'default') {
      matches.push({ route, prefixLen: 0 });
      continue;
    }

    try {
      const mask = route.subnetMask || (route.cidr ? cidrToMask(route.cidr) : '255.255.255.0');
      if (isSameSubnet(destIp, route.destination, mask)) {
        const maskNum = ipToNumber(mask);
        const prefixLen = maskNum.toString(2).split('1').length - 1;
        matches.push({ route, prefixLen });
      }
    } catch {
      // Ignore invalid route syntax
    }
  }

  if (matches.length === 0) {
    return {
      action: 'drop',
      reason: `Routing table has no route to ${destIp} (ICMP Destination Host/Network Unreachable)`
    };
  }

  // Sort descending by prefix length (LPM Rule)
  matches.sort((a, b) => b.prefixLen - a.prefixLen);
  const bestMatch = matches[0].route;

  return {
    matchedRoute: bestMatch,
    action: 'forward',
    reason: `Matched ${bestMatch.destination}/${bestMatch.cidr || 24} via next-hop ${bestMatch.nextHop} on ${bestMatch.interface} (LPM /${matches[0].prefixLen})`
  };
}

/**
 * Stateful Firewall Rule Evaluator
 */
export function evaluateFirewall(
  rules: FirewallRule[] | undefined,
  sourceIp: string,
  destIp: string,
  protocol: string,
  port: number
): {
  allowed: boolean;
  matchedRule?: FirewallRule;
  reason: string;
} {
  if (!rules || rules.length === 0) {
    return { allowed: true, reason: 'No firewall rules defined (Default Allow)' };
  }

  // Sort by priority ascending (Priority 1 is evaluated first)
  const activeRules = [...rules].filter(r => r.enabled !== false).sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    const srcMatch = isIpInSubnet(sourceIp, rule.sourceSubnet);
    const dstMatch = isIpInSubnet(destIp, rule.destSubnet);
    const protoMatch = rule.protocol === 'ANY' || rule.protocol.toUpperCase() === protocol.toUpperCase();
    
    let portMatch = true;
    if (rule.portRange && rule.portRange !== 'ANY') {
      const ports = rule.portRange.split(',').map(p => parseInt(p.trim(), 10));
      portMatch = ports.includes(port);
    }

    if (srcMatch && dstMatch && protoMatch && portMatch) {
      if (rule.action === 'DENY') {
        return {
          allowed: false,
          matchedRule: rule,
          reason: `Traffic blocked by Firewall Rule #${rule.priority} "${rule.name}": DENY ${rule.protocol} from ${rule.sourceSubnet} to ${rule.destSubnet}`
        };
      } else {
        return {
          allowed: true,
          matchedRule: rule,
          reason: `Traffic permitted by Firewall Rule #${rule.priority} "${rule.name}": ALLOW ${rule.protocol}`
        };
      }
    }
  }

  // Default implicit deny or allow
  return { allowed: true, reason: 'Implicit default allow (No matching explicit rule)' };
}

/**
 * DNS Resolution Engine
 */
export function resolveDns(
  domainOrIp: string,
  dnsServerDevice: NetworkDevice | undefined
): {
  resolvedIp?: string;
  recordType?: string;
  found: boolean;
  explanation: string;
} {
  if (!domainOrIp.includes('.')) {
    return { found: false, explanation: 'Invalid domain query format' };
  }

  // If input is already an IP, return directly
  try {
    ipToNumber(domainOrIp);
    return { resolvedIp: domainOrIp, recordType: 'Direct IPv4', found: true, explanation: 'Direct IPv4 destination, bypassing DNS resolution.' };
  } catch {
    // It's a hostname / domain
  }

  if (!dnsServerDevice || !dnsServerDevice.services?.dnsServer) {
    // Default fallback resolution for common test domains
    const commonDomains: Record<string, string> = {
      'google.com': '142.250.190.46',
      'netlab.local': '192.168.1.100',
      'gateway.local': '192.168.1.1',
      'intranet.corp': '10.0.0.50',
      'cctv.campus': '192.168.40.10'
    };
    if (commonDomains[domainOrIp.toLowerCase()]) {
      return {
        resolvedIp: commonDomains[domainOrIp.toLowerCase()],
        recordType: 'A Record',
        found: true,
        explanation: `Resolved ${domainOrIp} to ${commonDomains[domainOrIp.toLowerCase()]} via authoritative DNS.`
      };
    }
    return {
      found: false,
      explanation: `DNS Query failed: Server "${dnsServerDevice?.name || 'Default DNS'}" has no record for "${domainOrIp}". (NXDOMAIN)`
    };
  }

  const records: DnsRecord[] = dnsServerDevice.services.dnsRecords || [];
  const matched = records.find(r => r.domain.toLowerCase() === domainOrIp.toLowerCase());

  if (matched) {
    return {
      resolvedIp: matched.value,
      recordType: matched.type,
      found: true,
      explanation: `DNS Server ${dnsServerDevice.name} resolved ${domainOrIp} -> ${matched.value} (${matched.type} Record, TTL ${matched.ttl}s).`
    };
  }

  return {
    found: false,
    explanation: `DNS Server ${dnsServerDevice.name} returned NXDOMAIN for ${domainOrIp}.`
  };
}

/**
 * DHCP Simulation (DORA Workflow)
 */
export function simulateDhcpRequest(
  clientDevice: NetworkDevice,
  dhcpServerDevice: NetworkDevice
): {
  success: boolean;
  assignedIp?: string;
  subnetMask?: string;
  gateway?: string;
  dns?: string;
  steps: { step: string; from: string; to: string; description: string }[];
  failureReason?: string;
} {
  const scope: DhcpScope | undefined = dhcpServerDevice.services?.dhcpScope;
  if (!scope || !dhcpServerDevice.services?.dhcpServer) {
    return {
      success: false,
      steps: [],
      failureReason: `Device ${dhcpServerDevice.name} does not have an active DHCP service or scope configured.`
    };
  }

  // Steps for visual feedback
  const steps = [
    {
      step: 'DHCP DISCOVER',
      from: clientDevice.name,
      to: '255.255.255.255 (Broadcast)',
      description: `${clientDevice.name} broadcasts L2/L3 Discover frame looking for available DHCP servers on local broadcast domain.`
    },
    {
      step: 'DHCP OFFER',
      from: dhcpServerDevice.name,
      to: clientDevice.name,
      description: `${dhcpServerDevice.name} offers IP address ${scope.startIp} with lease duration of ${scope.leaseDurationHours} hours.`
    },
    {
      step: 'DHCP REQUEST',
      from: clientDevice.name,
      to: dhcpServerDevice.name,
      description: `${clientDevice.name} formally requests lease for offered address ${scope.startIp}.`
    },
    {
      step: 'DHCP ACK',
      from: dhcpServerDevice.name,
      to: clientDevice.name,
      description: `${dhcpServerDevice.name} acknowledges lease and provides Gateway (${scope.gateway}) and DNS (${scope.dnsServer}).`
    }
  ];

  return {
    success: true,
    assignedIp: scope.startIp,
    subnetMask: scope.subnetMask,
    gateway: scope.gateway,
    dns: scope.dnsServer,
    steps
  };
}

/**
 * Comprehensive Packet Journey & Hop-by-Hop Trace Engine
 */
export function simulatePacketTrace(
  topology: NetworkTopology,
  sourceIdOrIp: string,
  destIdOrIp: string,
  protocol: 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' = 'ICMP',
  destPort: number = 80
): PacketTraceResult {
  const devices = topology.devices;
  const connections = topology.connections;

  // Resolve source node
  const srcDev = devices.find(d => d.id === sourceIdOrIp || d.ip === sourceIdOrIp || d.name.toLowerCase() === sourceIdOrIp.toLowerCase());
  
  // Resolve destination node
  let dstDev = devices.find(d => d.id === destIdOrIp || d.ip === destIdOrIp || d.name.toLowerCase() === destIdOrIp.toLowerCase());
  let targetIp = destIdOrIp;

  if (!srcDev) {
    return {
      success: false,
      sourceDevice: sourceIdOrIp,
      destinationDevice: destIdOrIp,
      totalHops: 0,
      hops: [],
      summary: `Source node '${sourceIdOrIp}' does not exist in active topology.`,
      failureReason: 'Source device missing'
    };
  }

  // Handle Domain/DNS lookup if user entered hostname (e.g. google.com)
  if (!dstDev && !destIdOrIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const dnsServer = devices.find(d => d.services?.dnsServer || d.ip === srcDev.dns);
    const dnsRes = resolveDns(destIdOrIp, dnsServer);
    if (dnsRes.found && dnsRes.resolvedIp) {
      targetIp = dnsRes.resolvedIp;
      dstDev = devices.find(d => d.ip === targetIp);
    }
  }

  const srcIp = srcDev.ip || '0.0.0.0';
  const dstIp = dstDev ? (dstDev.ip || targetIp) : targetIp;

  // Check Layer 1: Physical Status of Source
  if (srcDev.status === 'down') {
    return {
      success: false,
      sourceDevice: srcDev.name,
      destinationDevice: dstDev ? dstDev.name : targetIp,
      totalHops: 1,
      hops: [{
        hopNumber: 1,
        deviceId: srcDev.id,
        deviceName: srcDev.name,
        deviceType: srcDev.type,
        action: 'Interface Down',
        explanation: `${srcDev.name} is powered off or administratively down. Cannot generate or transmit electrical signals.`,
        whyExplanation: 'Layer 1 Physical error: Network interfaces must be powered ON and in "UP" status to modulate signals onto transmission media.',
        layer: 'Physical',
        sourceIp: srcIp,
        destIp: dstIp,
        protocol,
        ttl: 64,
        status: 'dropped',
        dropReason: 'Host powered off / Interface disabled'
      }],
      summary: `Transmission failed: ${srcDev.name} is in DOWN status.`,
      failureReason: 'Interface disabled'
    };
  }

  // Check Layer 3: Unconfigured IP on Source
  if (!srcDev.ip) {
    return {
      success: false,
      sourceDevice: srcDev.name,
      destinationDevice: dstDev ? dstDev.name : targetIp,
      totalHops: 1,
      hops: [{
        hopNumber: 1,
        deviceId: srcDev.id,
        deviceName: srcDev.name,
        deviceType: srcDev.type,
        action: 'Unconfigured IP',
        explanation: `${srcDev.name} has no IPv4 address configured. Cannot construct Layer 3 IPv4 header.`,
        whyExplanation: 'Every network-attached host requires an IPv4 address to participate in IP packet multiplexing and routing.',
        layer: 'Network',
        sourceIp: '0.0.0.0',
        destIp: dstIp,
        protocol,
        ttl: 64,
        status: 'dropped',
        dropReason: 'Missing IPv4 address'
      }],
      summary: `Transmission failed: ${srcDev.name} has no IPv4 address assigned.`,
      failureReason: 'Missing IP address'
    };
  }

  // Build Adjacency Graph of active links
  const graph: Record<string, { neighborId: string; connectionId: string; type: string; status: string }[]> = {};
  devices.forEach(d => { graph[d.id] = []; });

  connections.forEach(conn => {
    if (graph[conn.sourceDeviceId]) {
      graph[conn.sourceDeviceId].push({ neighborId: conn.targetDeviceId, connectionId: conn.id, type: conn.type, status: conn.status });
    }
    if (graph[conn.targetDeviceId]) {
      graph[conn.targetDeviceId].push({ neighborId: conn.sourceDeviceId, connectionId: conn.id, type: conn.type, status: conn.status });
    }
  });

  // Check if destination is on the same local subnet
  const isLocalSubnet = isSameSubnet(srcDev.ip, dstIp, srcDev.subnetMask || '255.255.255.0');

  // If remote subnet and no gateway configured on host
  if (!isLocalSubnet && !srcDev.gateway && srcDev.type !== 'router') {
    return {
      success: false,
      sourceDevice: srcDev.name,
      destinationDevice: dstDev ? dstDev.name : targetIp,
      totalHops: 1,
      hops: [{
        hopNumber: 1,
        deviceId: srcDev.id,
        deviceName: srcDev.name,
        deviceType: srcDev.type,
        action: 'No Default Gateway',
        explanation: `${srcDev.name} calculated that destination ${dstIp} is on a foreign subnet, but has no Default Gateway configured to forward the frame to Layer 3 boundary.`,
        whyExplanation: 'When sending packets to an off-subnet destination, the host compares the destination IP against its own subnet mask. If different, it MUST encapsulate the frame with the default gateway router MAC address.',
        layer: 'Network',
        sourceIp: srcIp,
        destIp: dstIp,
        protocol,
        ttl: 64,
        status: 'dropped',
        dropReason: 'Missing Default Gateway'
      }],
      summary: `Destination ${dstIp} is on a different subnet and ${srcDev.name} has no default gateway configured.`,
      failureReason: 'Missing Default Gateway',
      troubleshootingTip: 'Configure a default gateway (e.g., 192.168.1.1) on ' + srcDev.name + ' matching the router interface.'
    };
  }

  // Pathfinding (BFS with link state evaluation)
  const queue: { currentId: string; path: string[] }[] = [{ currentId: srcDev.id, path: [srcDev.id] }];
  const visited = new Set<string>([srcDev.id]);
  let foundPath: string[] | null = null;
  const targetDeviceId = dstDev ? dstDev.id : '';

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;

    if (targetDeviceId && currentId === targetDeviceId) {
      foundPath = path;
      break;
    }

    const neighbors = graph[currentId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.neighborId)) {
        visited.add(neighbor.neighborId);
        queue.push({
          currentId: neighbor.neighborId,
          path: [...path, neighbor.neighborId]
        });
      }
    }
  }

  if (!foundPath || foundPath.length === 0) {
    return {
      success: false,
      sourceDevice: srcDev.name,
      destinationDevice: dstDev ? dstDev.name : targetIp,
      totalHops: 1,
      hops: [{
        hopNumber: 1,
        deviceId: srcDev.id,
        deviceName: srcDev.name,
        deviceType: srcDev.type,
        action: 'No Physical Route / Cable Disconnected',
        explanation: `No active physical or logical path exists between ${srcDev.name} and destination. Check cables, switch ports, and VLAN configurations.`,
        whyExplanation: 'Packets cannot traverse a disconnected topology graph. Verify that Ethernet/fiber links are connected between all transit nodes.',
        layer: 'Physical',
        sourceIp: srcIp,
        destIp: dstIp,
        protocol,
        ttl: 64,
        status: 'dropped',
        dropReason: 'Unreachable topology path'
      }],
      summary: `No path exists between ${srcDev.name} and ${dstDev ? dstDev.name : targetIp}.`,
      failureReason: 'No physical route'
    };
  }

  // Construct Hop-by-Hop Trace
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

    // Check link status between current and next
    if (nextDev) {
      const link = connections.find(c => 
        (c.sourceDeviceId === currentDev.id && c.targetDeviceId === nextDev.id) ||
        (c.targetDeviceId === currentDev.id && c.sourceDeviceId === nextDev.id)
      );
      if (link && link.status === 'down') {
        hops.push({
          hopNumber: i + 1,
          deviceId: currentDev.id,
          deviceName: currentDev.name,
          deviceType: currentDev.type,
          action: 'Link Failure',
          explanation: `Physical link between ${currentDev.name} and ${nextDev.name} is severed/down. Packet cannot cross interface.`,
          whyExplanation: 'Layer 1 Physical link failure: Carrier signal lost on the Ethernet medium.',
          layer: 'Physical',
          sourceIp: srcIp,
          destIp: dstIp,
          protocol,
          ttl,
          status: 'dropped',
          dropReason: 'Link Down'
        });
        hasFailed = true;
        failureReason = `Link down between ${currentDev.name} and ${nextDev.name}`;
        dropTip = 'Enable the physical connection in the topology canvas.';
        break;
      }
    }

    // Check VLAN Mismatch on Access Switch
    if (currentDev.type === 'switch' && isFirstHop && nextDev) {
      if (srcDev.vlan && dstDev?.vlan && srcDev.vlan !== dstDev.vlan && !devices.some(d => d.type === 'router' || d.type === 'firewall')) {
        hops.push({
          hopNumber: i + 1,
          deviceId: currentDev.id,
          deviceName: currentDev.name,
          deviceType: currentDev.type,
          action: 'VLAN Segmentation Drop',
          explanation: `${currentDev.name} dropped frame because ${srcDev.name} (VLAN ${srcDev.vlan}) and ${dstDev.name} (VLAN ${dstDev.vlan}) are in isolated broadcast domains without an Inter-VLAN router.`,
          whyExplanation: 'VLANs create completely isolated Layer 2 broadcast domains. Traffic between different VLANs requires a Layer 3 router (Router-on-a-Stick or Layer 3 Switch).',
          layer: 'Data Link',
          sourceIp: srcIp,
          destIp: dstIp,
          protocol,
          ttl,
          status: 'dropped',
          dropReason: 'VLAN Isolation'
        });
        hasFailed = true;
        failureReason = `VLAN Isolation: VLAN ${srcDev.vlan} cannot talk to VLAN ${dstDev.vlan} without a Router`;
        dropTip = 'Add a Router to perform Inter-VLAN routing or place both devices on the same VLAN.';
        break;
      }
    }

    // Check Firewall Filtering
    if (currentDev.type === 'firewall' || currentDev.services?.firewallEnabled) {
      const fwEval = evaluateFirewall(currentDev.services?.firewallRules, srcIp, dstIp, protocol, destPort);
      if (!fwEval.allowed) {
        hops.push({
          hopNumber: i + 1,
          deviceId: currentDev.id,
          deviceName: currentDev.name,
          deviceType: currentDev.type,
          action: 'Firewall Drop (ACL DENY)',
          explanation: `${currentDev.name} inspected packet headers and dropped frame: ${fwEval.reason}`,
          whyExplanation: 'Stateful firewall or Access Control List (ACL) matched an explicit DENY rule against the source/destination socket tuple.',
          layer: 'Network',
          sourceIp: srcIp,
          destIp: dstIp,
          protocol,
          port: destPort,
          ttl,
          status: 'dropped',
          dropReason: 'Blocked by Firewall Rule'
        });
        hasFailed = true;
        failureReason = fwEval.reason;
        dropTip = 'Adjust the firewall security rule to ALLOW traffic on port ' + destPort + '.';
        break;
      }
    }

    // Hop Action & Layer details
    let hopAction = 'Forwarded';
    let hopExplanation = '';
    let whyExplanation = '';
    let hopLayer: 'Application' | 'Transport' | 'Network' | 'Data Link' | 'Physical' = 'Network';

    if (isFirstHop) {
      hopAction = 'Packet Origination & ARP Lookup';
      hopExplanation = `${currentDev.name} encapsulated ${protocol} payload into IPv4 packet (Src: ${srcIp}, Dst: ${dstIp}). Checked local ARP table for next-hop MAC.`;
      whyExplanation = 'Originating host builds Layer 7/4/3 headers and queries its local ARP cache to find the destination or default gateway MAC address.';
      hopLayer = 'Network';

      arpSequence.push({
        step: 1,
        description: `${currentDev.name} broadcasts ARP Request "Who has ${dstIp}? Tell ${srcIp}"`,
        source: currentDev.name,
        target: 'FF:FF:FF:FF:FF:FF (Broadcast)',
        type: 'request'
      });
      if (nextDev) {
        arpSequence.push({
          step: 2,
          description: `${nextDev.name} unicasts ARP Reply "${dstIp} is at ${nextDev.mac || '00:50:56:xx'}"`,
          source: nextDev.name,
          target: currentDev.name,
          type: 'reply'
        });
      }
    } else if (isLastHop) {
      hopAction = 'Destination Received & Decapsulated';
      hopExplanation = `${currentDev.name} verified destination IPv4 header (${dstIp}), decapsulated transport frame, and processed ${protocol} request.`;
      whyExplanation = 'Destination host verifies integrity via checksum, strips L2/L3 headers, and delivers socket payload to listening process port.';
      hopLayer = 'Application';
    } else if (currentDev.type === 'router') {
      ttl--;
      hopAction = `L3 Routing & TTL Decrement (TTL=${ttl})`;
      hopExplanation = `${currentDev.name} performed Longest Prefix Match (LPM) in routing table, decremented IPv4 TTL to ${ttl}, updated L2 MAC headers, and queued frame on egress interface.`;
      whyExplanation = 'Routers operate at Layer 3: They inspect destination IP, match routing table entries, decrement TTL to prevent infinite loops, and rewrite source/destination MAC addresses.';
      hopLayer = 'Network';
    } else if (currentDev.type === 'switch') {
      hopAction = 'L2 MAC Switching';
      hopExplanation = `${currentDev.name} looked up destination MAC address in CAM / MAC address table and forwarded frame out egress port with zero L3 delay.`;
      whyExplanation = 'Layer 2 switches make ultra-fast forwarding decisions based purely on the MAC Address Table without modifying IP or TTL headers.';
      hopLayer = 'Data Link';
    } else {
      hopAction = 'Transit Forwarding';
      hopExplanation = `${currentDev.name} forwarded packet toward next hop node ${nextDev?.name || 'destination'}.`;
      whyExplanation = 'Intermediate device forwarded packet through active transmission link.';
      hopLayer = 'Network';
    }

    hops.push({
      hopNumber: i + 1,
      deviceId: currentDev.id,
      deviceName: currentDev.name,
      deviceType: currentDev.type,
      action: hopAction,
      explanation: hopExplanation,
      whyExplanation,
      layer: hopLayer,
      sourceIp: srcIp,
      destIp: dstIp,
      sourceMac: currentDev.mac || '00:50:56:A1:B2:C3',
      destMac: nextDev ? (nextDev.mac || '00:50:56:D4:E5:F6') : (dstDev?.mac || '00:50:56:D4:E5:F6'),
      protocol,
      port: destPort,
      ttl,
      status: 'forwarded',
      layerData: {
        l2: {
          srcMac: currentDev.mac || '00:50:56:A1:B2:C3',
          destMac: nextDev ? (nextDev.mac || '00:50:56:D4:E5:F6') : '00:50:56:D4:E5:F6',
          vlanId: currentDev.vlan || 1,
          frameType: '0x0800 (IPv4)'
        },
        l3: {
          srcIp,
          destIp: dstIp,
          ttl,
          protocol
        },
        l4: {
          srcPort: 49152 + Math.floor(Math.random() * 10000),
          destPort,
          tcpFlags: protocol === 'HTTP' || protocol === 'HTTPS' || protocol === 'SSH' ? '[SYN]' : undefined
        },
        l7: {
          protocol,
          messageType: protocol === 'ICMP' ? 'Echo Request (Type 8, Code 0)' : `${protocol} Request`
        }
      }
    });
  }

  if (hasFailed) {
    return {
      success: false,
      sourceDevice: srcDev.name,
      destinationDevice: dstDev ? dstDev.name : targetIp,
      totalHops: hops.length,
      hops,
      summary: `Packet trace failed at hop ${hops.length}: ${failureReason}`,
      failureReason,
      troubleshootingTip: dropTip,
      arpSequence
    };
  }

  return {
    success: true,
    sourceDevice: srcDev.name,
    destinationDevice: dstDev ? dstDev.name : targetIp,
    totalHops: hops.length,
    hops,
    summary: `Successful end-to-end transmission: ${srcDev.name} (${srcIp}) <---> ${dstDev ? dstDev.name : targetIp} via ${hops.length} network hops.`,
    arpSequence
  };
}
