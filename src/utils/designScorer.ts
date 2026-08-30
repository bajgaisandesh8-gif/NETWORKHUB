import { NetworkTopology } from '../types';

export interface DesignEvaluationResult {
  score: number;
  categoryScores: {
    addressing: { score: number; max: number; feedback: string[] };
    connectivity: { score: number; max: number; feedback: string[] };
    segmentation: { score: number; max: number; feedback: string[] };
    redundancy: { score: number; max: number; feedback: string[] };
    security: { score: number; max: number; feedback: string[] };
    scalability: { score: number; max: number; feedback: string[] };
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  overallSummary: string;
  recommendations: string[];
}

export function evaluateTopologyDesign(topology: NetworkTopology): DesignEvaluationResult {
  const devices = topology.devices || [];
  const connections = topology.connections || [];

  let addrScore = 0;
  const addrFeedback: string[] = [];
  let connScore = 0;
  const connFeedback: string[] = [];
  let segScore = 0;
  const segFeedback: string[] = [];
  let redScore = 0;
  const redFeedback: string[] = [];
  let secScore = 0;
  const secFeedback: string[] = [];
  let scalScore = 0;
  const scalFeedback: string[] = [];

  if (devices.length === 0) {
    return {
      score: 0,
      categoryScores: {
        addressing: { score: 0, max: 20, feedback: ['No devices found in topology.'] },
        connectivity: { score: 0, max: 20, feedback: ['No links established.'] },
        segmentation: { score: 0, max: 15, feedback: ['No segmentation.'] },
        redundancy: { score: 0, max: 15, feedback: ['No redundancy.'] },
        security: { score: 0, max: 15, feedback: ['No security layer.'] },
        scalability: { score: 0, max: 15, feedback: ['Empty topology.'] }
      },
      grade: 'F',
      overallSummary: 'Add network devices and establish connections to begin the NET-LAB Design Evaluation.',
      recommendations: ['Add at least one router, switch, and end devices.']
    };
  }

  // 1. Addressing (Max 20)
  const endDevices = devices.filter(d => ['pc', 'laptop', 'server', 'printer'].includes(d.type));
  const configuredEndDevices = endDevices.filter(d => d.ip && d.ip !== '0.0.0.0' && d.subnetMask);
  
  if (endDevices.length > 0) {
    const configRatio = configuredEndDevices.length / endDevices.length;
    addrScore += Math.round(configRatio * 12);
    if (configRatio === 1) {
      addrFeedback.push('All end hosts possess valid IPv4 addresses and subnet masks.');
    } else {
      addrFeedback.push(`${endDevices.length - configuredEndDevices.length} end devices are missing IP/Mask configurations.`);
    }
  } else {
    addrScore += 10;
  }

  // Gateway consistency
  const devicesWithGateway = endDevices.filter(d => d.gateway);
  if (devicesWithGateway.length > 0) {
    addrScore += 4;
    addrFeedback.push('Default gateway pointers configured on hosts.');
  }

  // Duplicate IP check
  const ipSet = new Set<string>();
  let hasDuplicates = false;
  devices.forEach(d => {
    if (d.ip && d.ip !== '0.0.0.0') {
      if (ipSet.has(d.ip)) hasDuplicates = true;
      ipSet.add(d.ip);
    }
  });

  if (!hasDuplicates && ipSet.size > 0) {
    addrScore += 4;
    addrFeedback.push('Clean addressing plan with zero duplicate IP collisions.');
  } else if (hasDuplicates) {
    addrFeedback.push('Duplicate IP conflict detected on network.');
  }

  // 2. Connectivity (Max 20)
  const connectedDeviceIds = new Set<string>();
  connections.forEach(c => {
    if (c.status !== 'down') {
      connectedDeviceIds.add(c.sourceDeviceId);
      connectedDeviceIds.add(c.targetDeviceId);
    }
  });

  const connectedRatio = devices.length > 0 ? connectedDeviceIds.size / devices.length : 0;
  connScore += Math.round(connectedRatio * 15);
  if (connectedRatio >= 0.9) {
    connFeedback.push('Comprehensive physical/wireless cabling across topology.');
  } else {
    connFeedback.push(`${devices.length - connectedDeviceIds.size} devices are disconnected.`);
  }

  const hasSwitchOrRouter = devices.some(d => d.type === 'switch' || d.type === 'router');
  if (hasSwitchOrRouter) {
    connScore += 5;
    connFeedback.push('Proper centralized intermediate nodes (switches/routers).');
  }

  // 3. Segmentation (Max 15)
  const vlans = new Set(devices.map(d => d.vlan).filter(v => v !== undefined && v > 0));
  const switches = devices.filter(d => d.type === 'switch');
  const routers = devices.filter(d => d.type === 'router');

  if (switches.length > 0) {
    segScore += 6;
    segFeedback.push('Layer 2 collision domain isolation using Ethernet switches.');
  }
  if (vlans.size > 1) {
    segScore += 5;
    segFeedback.push(`VLAN segmentation deployed across ${vlans.size} broadcast domains.`);
  } else {
    segFeedback.push('Single broadcast domain detected. Consider creating VLANs for guest/staff/servers.');
  }
  if (routers.length > 0) {
    segScore += 4;
    segFeedback.push('Layer 3 routing boundary established.');
  }

  // 4. Redundancy (Max 15)
  if (switches.length >= 2 && connections.length > devices.length) {
    redScore += 8;
    redFeedback.push('Multiple switch links providing path resilience (requires STP).');
  } else {
    redFeedback.push('Single point of failure: Consider redundant switch uplinks.');
  }
  if (routers.length >= 2) {
    redScore += 7;
    redFeedback.push('Dual-router gateway redundancy for high availability.');
  } else {
    redFeedback.push('Single default gateway router.');
  }

  // 5. Security (Max 15)
  const firewalls = devices.filter(d => d.type === 'firewall');
  if (firewalls.length > 0) {
    secScore += 10;
    secFeedback.push('Perimeter/Internal Firewall inspection deployed.');
  } else {
    secFeedback.push('No Firewall detected. Network perimeter is unshielded.');
  }
  const hasVlanIsolation = vlans.size > 1;
  if (hasVlanIsolation) {
    secScore += 5;
    secFeedback.push('Network traffic compartmentalized with VLAN isolation.');
  }

  // 6. Scalability (Max 15)
  if (devices.length >= 4 && switches.length >= 1) {
    scalScore += 8;
    scalFeedback.push('Hierarchical network topology accommodates future expansion.');
  }
  if (routers.length > 0 && switches.length > 0) {
    scalScore += 7;
    scalFeedback.push('Modular Access-Distribution-Core network tiering.');
  }

  const totalScore = Math.min(100, addrScore + connScore + segScore + redScore + secScore + scalScore);

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 60) grade = 'C';
  else if (totalScore >= 50) grade = 'D';

  const recommendations: string[] = [];
  if (firewalls.length === 0) recommendations.push('Add a Firewall between the Router and the Internet/Servers.');
  if (vlans.size <= 1 && endDevices.length >= 3) recommendations.push('Segment end hosts into VLANs (e.g. VLAN 10 Staff, VLAN 20 Guests, VLAN 30 Servers).');
  if (routers.length === 0) recommendations.push('Add a Layer 3 Router to route traffic between distinct subnets and the Internet.');
  if (devices.length - connectedDeviceIds.size > 0) recommendations.push('Connect all unlinked devices using Ethernet or Fiber links.');

  return {
    score: totalScore,
    categoryScores: {
      addressing: { score: addrScore, max: 20, feedback: addrFeedback },
      connectivity: { score: connScore, max: 20, feedback: connFeedback },
      segmentation: { score: segScore, max: 15, feedback: segFeedback },
      redundancy: { score: redScore, max: 15, feedback: redFeedback },
      security: { score: secScore, max: 15, feedback: secFeedback },
      scalability: { score: scalScore, max: 15, feedback: scalFeedback }
    },
    grade,
    overallSummary: `NET-LAB Design Evaluation: ${totalScore}/100 (Grade ${grade}). Evaluates addressing, connectivity, segmentation, redundancy, security, and scalability.`,
    recommendations
  };
}
