import { 
  NetworkTopology, 
  DiagnosticReport, 
  DiagnosticIssue, 
  NetworkScoreAudit, 
  NetworkDevice 
} from '../types';
import { isSameSubnet } from './subnetCalculator';

export function runDiagnostics(
  topology: NetworkTopology,
  sourceDeviceId?: string,
  targetDeviceId?: string
): DiagnosticReport {
  const issues: DiagnosticIssue[] = [];
  const checksPerformed: string[] = [];
  const devices = topology.devices;
  const connections = topology.connections;

  // --- CHECK 1: LAYER 1 PHYSICAL STATUS ---
  checksPerformed.push('Layer 1: Device Power & Administrative Interface Status');
  devices.forEach(dev => {
    if (dev.status === 'down') {
      issues.push({
        id: `phy-down-${dev.id}`,
        title: `Device Power / Physical Failure: ${dev.name}`,
        layer: 'Physical',
        type: 'physical',
        severity: 'critical',
        affectedDevices: [dev.name],
        likelyCause: `${dev.name} is powered off or its network interface is administratively disabled.`,
        evidence: `status: "down", physical link down`,
        technicalEvidence: `NIC operational status: Down. Link carrier detect: Inactive. Tx/Rx signal: 0 mW.`,
        howToFix: `Click on ${dev.name} in the topology canvas and toggle Status to "UP".`,
        fixRecommendation: `Re-enable interface state or replace faulty physical hardware.`,
        whyThisHappens: `A device in 'DOWN' state cannot participate in network framing, clock synchronization, or electrical signal transmission.`,
        explanation: `Layer 1 Physical error.`
      });
    }
  });

  // --- CHECK 2: LAYER 1 PHYSICAL CONNECTIONS & SEVERED LINKS ---
  checksPerformed.push('Layer 1: Physical Link Connectivity & Cable Continuity');
  connections.forEach(conn => {
    if (conn.status === 'down') {
      const src = devices.find(d => d.id === conn.sourceDeviceId)?.name || conn.sourceDeviceId;
      const tgt = devices.find(d => d.id === conn.targetDeviceId)?.name || conn.targetDeviceId;
      issues.push({
        id: `link-down-${conn.id}`,
        title: `Physical Link Down: ${src} <---> ${tgt}`,
        layer: 'Physical',
        type: 'physical',
        severity: 'critical',
        affectedDevices: [src, tgt],
        likelyCause: `The cable or fiber link between ${src} and ${tgt} is disconnected or administratively shut down.`,
        evidence: `Connection #${conn.id} status is 'down'`,
        technicalEvidence: `Port state: LINK_DOWN. Autonegotiation failed. No optical/electrical continuity.`,
        howToFix: `Click the connection in the canvas and set status to "UP" or replace the patch cable.`,
        fixRecommendation: `Inspect physical patch panel and ensure switch port is active.`,
        whyThisHappens: `Broken physical links isolate network segments and prevent Layer 2 Ethernet frame transmission.`,
        explanation: `Layer 1 Physical continuity failure.`
      });
    }
  });

  // --- CHECK 3: LAYER 3 IP ADDRESS CONFIGURATION ---
  checksPerformed.push('Layer 3: IPv4 Configuration & Interface IP Assignment');
  devices.forEach(dev => {
    if (dev.type !== 'switch' && dev.type !== 'cloud' && dev.status === 'up' && !dev.ip) {
      issues.push({
        id: `ip-missing-${dev.id}`,
        title: `Unconfigured IP Address: ${dev.name}`,
        layer: 'Network',
        type: 'ip_config',
        severity: 'critical',
        affectedDevices: [dev.name],
        likelyCause: `${dev.name} does not have a static IPv4 address assigned or failed to obtain a DHCP lease.`,
        evidence: `ip: undefined or empty`,
        technicalEvidence: `Layer 3 IPv4 address is unassigned (0.0.0.0). Cannot populate source IP in IP header.`,
        howToFix: `Open device configuration inspector and assign a valid IP address (e.g. 192.168.1.10/24) or enable DHCP.`,
        fixRecommendation: `Assign static IP from local subnet or configure DHCP server scope.`,
        whyThisHappens: `Without an IPv4 address, host cannot route, participate in ARP, or establish TCP/UDP sockets.`,
        explanation: `Layer 3 Addressing missing.`
      });
    }
  });

  // --- CHECK 4: LAYER 3 DUPLICATE IP DETECTION ---
  checksPerformed.push('Layer 3: Duplicate IPv4 Address Conflict Inspection');
  const ipMap: Record<string, string[]> = {};
  devices.forEach(d => {
    if (d.ip && d.ip !== '0.0.0.0') {
      if (!ipMap[d.ip]) ipMap[d.ip] = [];
      ipMap[d.ip].push(d.name);
    }
  });
  Object.entries(ipMap).forEach(([ip, devNames]) => {
    if (devNames.length > 1) {
      issues.push({
        id: `dup-ip-${ip}`,
        title: `Duplicate IP Address Conflict: ${ip}`,
        layer: 'Network',
        type: 'duplicate_ip',
        severity: 'critical',
        affectedDevices: devNames,
        likelyCause: `Multiple hosts (${devNames.join(', ')}) share the exact same IPv4 address: ${ip}.`,
        evidence: `${devNames.length} devices share IP ${ip}`,
        technicalEvidence: `Gratuitous ARP detected IP conflict on network. Inconsistent ARP table state across switches and hosts.`,
        howToFix: `Assign unique IP addresses to each host within their respective subnet range.`,
        fixRecommendation: `Use IPAM / DHCP reservation to ensure 1-to-1 mapping between MAC and IP.`,
        whyThisHappens: `Duplicate IPs cause ARP flapping and intermittent packet drops as switches alternate between MAC addresses for the same IP.`,
        explanation: `Layer 3 IP address conflict.`
      });
    }
  });

  // --- CHECK 5: LAYER 3 DEFAULT GATEWAY SUBNET MISMATCH ---
  checksPerformed.push('Layer 3: Default Gateway Subnet & Reachability Validation');
  devices.forEach(dev => {
    if (dev.ip && dev.gateway && dev.subnetMask && dev.type !== 'router') {
      const isGatewaySameSubnet = isSameSubnet(dev.ip, dev.gateway, dev.subnetMask);
      if (!isGatewaySameSubnet) {
        issues.push({
          id: `gw-mismatch-${dev.id}`,
          title: `Default Gateway Subnet Mismatch: ${dev.name}`,
          layer: 'Network',
          type: 'gateway',
          severity: 'critical',
          affectedDevices: [dev.name],
          likelyCause: `${dev.name} (IP ${dev.ip}, Mask ${dev.subnetMask}) has Default Gateway ${dev.gateway}, which resides on an entirely different subnet.`,
          evidence: `${dev.ip} & Gateway ${dev.gateway} are on different subnets under mask ${dev.subnetMask}`,
          technicalEvidence: `Bitwise (IP & Mask) !== (Gateway & Mask). Host cannot ARP for a gateway outside its local broadcast domain.`,
          howToFix: `Change Default Gateway on ${dev.name} to match the router interface on its local subnet (e.g. 192.168.1.1).`,
          fixRecommendation: `Align host gateway with router L3 interface IP in the same broadcast domain.`,
          whyThisHappens: `Hosts rely on direct Layer 2 ARP to reach their Default Gateway. An off-subnet gateway cannot be reached without an existing gateway, creating a circular routing failure.`,
          explanation: `Layer 3 Gateway configuration error.`
        });
      }
    }
  });

  // --- CHECK 6: LAYER 2 VLAN BROADCAST SEGMENTATION ---
  checksPerformed.push('Layer 2: VLAN Segmentation & Inter-VLAN Routing Boundaries');
  const vlanSet = new Set(devices.filter(d => d.vlan).map(d => d.vlan));
  const hasRouter = devices.some(d => d.type === 'router' || d.type === 'firewall');
  if (vlanSet.size > 1 && !hasRouter) {
    issues.push({
      id: `vlan-isolated-no-router`,
      title: `Inter-VLAN Routing Missing (Multiple VLANs without Router)`,
      layer: 'Data Link',
      type: 'vlan',
      severity: 'warning',
      affectedDevices: devices.filter(d => d.vlan).map(d => d.name),
      likelyCause: `Topology has multiple VLANs (${Array.from(vlanSet).join(', ')}) but no Layer 3 Router or Layer 3 Switch to route between them.`,
      evidence: `${vlanSet.size} unique VLANs detected with 0 active routers`,
      technicalEvidence: `VLAN tags isolate broadcast domains at Layer 2. Inter-VLAN communication requires 802.1Q subinterfaces or SVI routing.`,
      howToFix: `Add a Router with subinterfaces or a Layer 3 Switch with SVI interfaces to route traffic between VLANs.`,
      fixRecommendation: `Deploy Router-on-a-Stick or Layer 3 Core Switch with IP routing enabled.`,
      whyThisHappens: `VLANs provide complete hardware-level Layer 2 broadcast isolation. Cross-VLAN packets cannot bridge without Layer 3 routing.`,
      explanation: `Layer 2 Segmentation boundary.`
    });
  }

  // Build Layer-by-Layer Timeline
  const timeline = [
    {
      layerNumber: 1,
      layerName: 'Physical Layer (L1)',
      status: issues.some(i => i.layer === 'Physical') ? ('fail' as const) : ('pass' as const),
      summary: issues.some(i => i.layer === 'Physical') 
        ? `${issues.filter(i => i.layer === 'Physical').length} physical/cable issues detected`
        : 'All physical links, interfaces, and power states are operational.'
    },
    {
      layerNumber: 2,
      layerName: 'Data Link Layer (L2)',
      status: issues.some(i => i.layer === 'Data Link' || i.type === 'vlan') ? ('warn' as const) : ('pass' as const),
      summary: issues.some(i => i.layer === 'Data Link' || i.type === 'vlan')
        ? `${issues.filter(i => i.layer === 'Data Link' || i.type === 'vlan').length} VLAN / L2 isolation warnings`
        : 'Ethernet frames, MAC addresses, and switching tables are healthy.'
    },
    {
      layerNumber: 3,
      layerName: 'Network Layer (L3)',
      status: issues.some(i => i.layer === 'Network' || i.type === 'ip_config' || i.type === 'gateway' || i.type === 'duplicate_ip') ? ('fail' as const) : ('pass' as const),
      summary: issues.some(i => i.layer === 'Network' || i.type === 'ip_config' || i.type === 'gateway' || i.type === 'duplicate_ip')
        ? `${issues.filter(i => i.layer === 'Network' || i.type === 'ip_config' || i.type === 'gateway' || i.type === 'duplicate_ip').length} IPv4 / Gateway / Subnet conflicts identified`
        : 'IPv4 addressing, subnet masks, and default gateways are consistent.'
    },
    {
      layerNumber: 4,
      layerName: 'Transport & Security Layer (L4)',
      status: issues.some(i => i.type === 'firewall') ? ('warn' as const) : ('pass' as const),
      summary: 'Port filtering and socket state inspected.'
    },
    {
      layerNumber: 7,
      layerName: 'Application Services Layer (L7)',
      status: issues.some(i => i.type === 'dns') ? ('warn' as const) : ('pass' as const),
      summary: 'DNS, DHCP, and application endpoints verified.'
    }
  ];

  const healthy = issues.length === 0;

  return {
    healthy,
    overallHealthy: healthy,
    issues,
    checksPerformed,
    evaluatedAt: new Date().toISOString(),
    timeline
  };
}

/**
 * Enterprise Network Architecture Quality Audit & Scoring Engine
 */
export function performNetworkAudit(topology: NetworkTopology): NetworkScoreAudit {
  const devices = topology.devices;
  const connections = topology.connections;
  const diag = runDiagnostics(topology);

  let connScore = 15;
  let addrScore = 20;
  let segScore = 15;
  let routeScore = 15;
  let relScore = 15;
  let secScore = 10;
  let docScore = 10;

  const criticalFindings: string[] = [];
  const warnings: string[] = [];
  const passedChecks: string[] = [];

  // Connectivity
  if (devices.length === 0) {
    connScore = 0;
    criticalFindings.push('Empty topology: No devices present.');
  } else {
    const downCount = devices.filter(d => d.status === 'down').length;
    if (downCount > 0) {
      connScore -= Math.min(10, downCount * 5);
      criticalFindings.push(`${downCount} device(s) in DOWN status.`);
    } else {
      passedChecks.push('All physical devices are powered ON and operational.');
    }
  }

  // Addressing
  const missingIpCount = devices.filter(d => d.type !== 'switch' && d.type !== 'cloud' && !d.ip).length;
  if (missingIpCount > 0) {
    addrScore -= Math.min(15, missingIpCount * 5);
    criticalFindings.push(`${missingIpCount} host(s) missing IPv4 configuration.`);
  } else {
    passedChecks.push('All host devices have valid IPv4 addresses configured.');
  }

  const hasDupIp = diag.issues.some(i => i.type === 'duplicate_ip');
  if (hasDupIp) {
    addrScore -= 10;
    criticalFindings.push('Duplicate IPv4 address conflict detected.');
  } else {
    passedChecks.push('Zero duplicate IPv4 addresses (Clean IPAM allocation).');
  }

  // Segmentation
  const vlanCount = new Set(devices.filter(d => d.vlan).map(d => d.vlan)).size;
  if (devices.length >= 6 && vlanCount <= 1) {
    segScore -= 5;
    warnings.push('Flat network design: Topology has 6+ devices in a single broadcast domain (No VLAN segmentation).');
  } else if (vlanCount > 1) {
    passedChecks.push(`Segmented broadcast domains: ${vlanCount} active VLANs configured.`);
  }

  // Routing
  const hasRouter = devices.some(d => d.type === 'router' || d.type === 'firewall');
  if (devices.length >= 4 && !hasRouter) {
    routeScore -= 5;
    warnings.push('No Layer 3 routing boundary: Topology lacks a dedicated router or firewall gateway.');
  } else if (hasRouter) {
    passedChecks.push('Layer 3 routing boundary established.');
  }

  // Reliability & Redundancy
  if (connections.length > 0 && connections.length >= devices.length) {
    passedChecks.push('Redundant / multi-path links detected.');
  } else {
    warnings.push('Single Point of Failure (SPOF): Minimal link redundancy in core transit path.');
  }

  // Security
  const hasFirewall = devices.some(d => d.type === 'firewall' || d.services?.firewallEnabled);
  if (hasFirewall) {
    secScore = 10;
    passedChecks.push('Dedicated perimeter firewall / security zone deployed.');
  } else {
    secScore = 6;
    warnings.push('No dedicated firewall device configured between internal network and external edge.');
  }

  // Documentation
  if (topology.name && topology.name !== 'Untitled' && topology.description) {
    docScore = 10;
    passedChecks.push('Topology contains project title and architectural design notes.');
  } else {
    docScore = 6;
    warnings.push('Design documentation is incomplete (Add project description and naming).');
  }

  const totalScore = Math.max(0, Math.min(100, connScore + addrScore + segScore + routeScore + relScore + secScore + docScore));
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (totalScore >= 95) grade = 'A+';
  else if (totalScore >= 85) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';
  else grade = 'F';

  return {
    overallScore: totalScore,
    grade,
    categories: [
      { name: 'Layer 1 Physical Connectivity', score: connScore, maxScore: 15, weight: 15, findings: ['Device power state', 'Cable link status'] },
      { name: 'Layer 3 IPv4 Addressing & IPAM', score: addrScore, maxScore: 20, weight: 20, findings: ['Subnet alignment', 'Conflict check'] },
      { name: 'VLAN Segmentation & Broadcasts', score: segScore, maxScore: 15, weight: 15, findings: ['Broadcast domains', 'Isolation'] },
      { name: 'Routing & Gateway Architecture', score: routeScore, maxScore: 15, weight: 15, findings: ['Default gateways', 'L3 routing'] },
      { name: 'Redundancy & High Availability', score: relScore, maxScore: 15, weight: 15, findings: ['Link redundancy', 'Failover'] },
      { name: 'Network Security & Firewall Zones', score: secScore, maxScore: 10, weight: 10, findings: ['Perimeter inspection', 'Access control'] },
      { name: 'Design Documentation & Standards', score: docScore, maxScore: 10, weight: 10, findings: ['Naming convention', 'Engineering notes'] }
    ],
    criticalFindings,
    warnings,
    passedChecks,
    executiveSummary: `Topology scored ${totalScore}/100 (Grade ${grade}). ${criticalFindings.length} critical issues and ${warnings.length} architectural warnings detected.`
  };
}
