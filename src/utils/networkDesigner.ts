import { 
  ProjectPlanningRequirements, 
  NetworkTopology, 
  VlanDefinition, 
  IpamNetwork, 
  DeviceInventoryItem, 
  CapacityCalculationResult, 
  NetworkDevice, 
  NetworkConnection,
  FirewallRule
} from '../types';
import { calculateSubnet, cidrToMask } from './subnetCalculator';

export function calculateCapacityAndBandwidth(req: ProjectPlanningRequirements): CapacityCalculationResult {
  // CCTV: ~4 Mbps per 1080p H.265 stream
  const cctvBandwidthMbps = req.cctvCameras * 4;

  // VoIP: ~100 Kbps (0.1 Mbps) per active G.711 call channel
  const voipBandwidthMbps = Math.round(req.voipPhones * 0.1);

  // User access: ~5-10 Mbps average per concurrent user
  const userAccessBandwidthMbps = Math.round(req.totalUsers * 3.5);

  const totalBandwidthNeededMbps = cctvBandwidthMbps + voipBandwidthMbps + userAccessBandwidthMbps + (req.serversNeeded * 20);

  // Internet plan recommendation
  let recommendedInternetPlan = '100 Mbps Dedicated Fiber';
  if (totalBandwidthNeededMbps > 1000) {
    recommendedInternetPlan = '2 Gbps Redundant Dedicated Enterprise DIA';
  } else if (totalBandwidthNeededMbps > 500) {
    recommendedInternetPlan = '1 Gbps Synchronous Fiber with 4G/5G Backup';
  } else if (totalBandwidthNeededMbps > 200) {
    recommendedInternetPlan = '500 Mbps Business Fiber DIA';
  } else if (totalBandwidthNeededMbps > 100) {
    recommendedInternetPlan = '300 Mbps Business Fiber DIA';
  }

  // PoE Power Budget:
  // Access Points: ~15W (802.3af/at)
  // CCTV Cameras: ~12W (802.3af)
  // VoIP Phones: ~7W (802.3af)
  const poePowerWatts = (req.wifiAccessPoints * 15) + (req.cctvCameras * 12) + (req.voipPhones * 7);

  // Total active switch ports needed (+ 20% growth margin)
  const rawPorts = req.totalUsers + req.wifiAccessPoints + req.cctvCameras + req.voipPhones + req.serversNeeded + (req.campusFloors * 2);
  const switchPortCount = Math.ceil((rawPorts * 1.25) / 24) * 24;

  // File Transfer Times for 10 GB dataset
  const fileTransferTimes = [
    { size: '100 MB Document Bundle', timeFastEthernet: '8.4 seconds', timeGigabit: '0.8 seconds', time10Gigabit: '0.08 seconds' },
    { size: '1 GB HD Video Stream', timeFastEthernet: '1.4 minutes', timeGigabit: '8.5 seconds', time10Gigabit: '0.85 seconds' },
    { size: '10 GB Full System Image', timeFastEthernet: '14.2 minutes', timeGigabit: '1.4 minutes', time10Gigabit: '8.5 seconds' },
    { size: '50 GB Database Backup', timeFastEthernet: '1.2 hours', timeGigabit: '7.1 minutes', time10Gigabit: '42.8 seconds' }
  ];

  return {
    totalBandwidthNeededMbps,
    cctvBandwidthMbps,
    voipBandwidthMbps,
    userAccessBandwidthMbps,
    recommendedInternetPlan,
    poePowerWatts,
    wifiApCount: req.wifiAccessPoints,
    switchPortCount,
    fileTransferTimes
  };
}

/**
 * Enterprise Network Design Generator:
 * Generates complete VLAN plan, IPAM hierarchy, Device Inventory, Topology, and Firewall zones.
 */
export function generateEnterpriseNetworkDesign(req: ProjectPlanningRequirements): {
  topology: NetworkTopology;
  vlans: VlanDefinition[];
  ipamNetworks: IpamNetwork[];
  inventory: DeviceInventoryItem[];
  firewallRules: FirewallRule[];
  executiveSummary: string;
} {
  const orgSlug = req.organizationName.replace(/\s+/g, '-').toLowerCase();

  // 1. VLAN Architecture
  const vlans: VlanDefinition[] = [
    {
      id: 'vlan-10',
      vlanId: 10,
      name: 'MGMT-INFRA',
      purpose: 'Core routers, switches, firewalls, and PDU management plane',
      subnet: '10.10.10.0',
      cidr: 24,
      gateway: '10.10.10.1',
      dhcpRange: 'Static Only (10.10.10.10 - 10.10.10.200)',
      securityZone: 'Management',
      description: 'Strictly isolated out-of-band management network.'
    },
    {
      id: 'vlan-20',
      vlanId: 20,
      name: 'SERVERS-DC',
      purpose: 'On-premises directory services, file servers, internal apps',
      subnet: '10.10.20.0',
      cidr: 24,
      gateway: '10.10.20.1',
      dhcpRange: 'Static Only (10.10.20.10 - 10.10.20.250)',
      securityZone: 'Internal',
      description: 'Protected server farm segment behind perimeter firewall.'
    },
    {
      id: 'vlan-30',
      vlanId: 30,
      name: 'STAFF-USERS',
      purpose: 'Workstations, laptops, and administrative department staff',
      subnet: '10.10.30.0',
      cidr: 23, // 510 usable hosts
      gateway: '10.10.30.1',
      dhcpRange: '10.10.30.50 - 10.10.31.250',
      securityZone: 'Internal',
      description: 'Primary corporate LAN for faculty, engineers, and employees.'
    },
    {
      id: 'vlan-40',
      vlanId: 40,
      name: 'VOIP-TELEPHONY',
      purpose: 'IP Desk Phones, conference room units, SIP PBX trunk',
      subnet: '10.10.40.0',
      cidr: 24,
      gateway: '10.10.40.1',
      dhcpRange: '10.10.40.20 - 10.10.40.250 (Option 150 TFTP)',
      securityZone: 'Internal',
      description: 'QoS prioritized voice traffic with DSCP EF tagging.'
    },
    {
      id: 'vlan-50',
      vlanId: 50,
      name: 'CCTV-SURVEILLANCE',
      purpose: 'IP Cameras, Network Video Recorders (NVR), Access Control',
      subnet: '10.10.50.0',
      cidr: 24,
      gateway: '10.10.50.1',
      dhcpRange: '10.10.50.20 - 10.10.50.250',
      securityZone: 'Internal',
      description: 'High throughput camera segment isolated from general internet.'
    }
  ];

  if (req.guestNetwork) {
    vlans.push({
      id: 'vlan-99',
      vlanId: 99,
      name: 'GUEST-WIFI',
      purpose: 'Visitor laptops, smartphones, untrusted personal devices',
      subnet: '172.16.99.0',
      cidr: 23,
      gateway: '172.16.99.1',
      dhcpRange: '172.16.99.20 - 172.16.100.250',
      securityZone: 'Guest',
      description: 'Captive portal guest network with strict client isolation.'
    });
  }

  // 2. IPAM Networks
  const ipamNetworks: IpamNetwork[] = vlans.map(v => {
    const subInfo = calculateSubnet(v.subnet, v.cidr);
    return {
      id: `ipam-${v.vlanId}`,
      name: v.name,
      vlanId: v.vlanId,
      networkAddress: subInfo.networkAddress,
      cidr: v.cidr,
      subnetMask: subInfo.subnetMask,
      gateway: v.gateway,
      broadcastAddress: subInfo.broadcastAddress,
      usableStart: subInfo.firstUsableIp,
      usableEnd: subInfo.lastUsableIp,
      totalHosts: subInfo.totalHosts,
      usableHosts: subInfo.usableHosts,
      usedHosts: v.vlanId === 10 ? 8 : v.vlanId === 20 ? 5 : 25,
      dhcpStart: v.gateway.replace(/\.1$/, '.20'),
      dhcpEnd: v.gateway.replace(/\.1$/, '.240'),
      securityZone: v.securityZone,
      allocations: [
        {
          id: `alloc-${v.vlanId}-gw`,
          ip: v.gateway,
          hostname: `${orgSlug}-gw-vlan${v.vlanId}`,
          status: 'reserved',
          purpose: 'Default Gateway L3 Interface (SVI / Subinterface)',
          vlanId: v.vlanId,
          assignedAt: new Date().toISOString()
        }
      ],
      description: v.purpose
    };
  });

  // 3. Device Inventory
  const inventory: DeviceInventoryItem[] = [
    {
      id: 'inv-fw-1',
      name: 'Edge Perimeter Firewall',
      hostname: `${orgSlug}-fw01`,
      deviceType: 'firewall',
      manufacturer: 'Fortinet / Cisco',
      model: 'FortiGate 100F / ASA 5516-X',
      managementIp: '10.10.10.254',
      macAddress: '00:50:56:A1:00:01',
      location: 'MDF Main Server Room Rack 1 (U40)',
      vlan: 10,
      status: 'up',
      notes: 'Active-Standby HA cluster pair for perimeter security & NAT.'
    },
    {
      id: 'inv-rtr-1',
      name: 'Core Border Router',
      hostname: `${orgSlug}-rtr01`,
      deviceType: 'router',
      manufacturer: 'Cisco Systems',
      model: 'Cisco Catalyst 8300 / ISR 4431',
      managementIp: '10.10.10.1',
      macAddress: '00:50:56:A1:00:02',
      location: 'MDF Main Server Room Rack 1 (U38)',
      vlan: 10,
      status: 'up',
      notes: 'Dual BGP WAN uplinks + Inter-VLAN 802.1Q routing engine.'
    },
    {
      id: 'inv-sw-core',
      name: 'Core Layer 3 Switch',
      hostname: `${orgSlug}-core-sw01`,
      deviceType: 'switch',
      manufacturer: 'Cisco Systems',
      model: 'Catalyst 9300 48-Port 10G SFP+',
      managementIp: '10.10.10.2',
      macAddress: '00:50:56:A1:00:03',
      location: 'MDF Main Server Room Rack 1 (U36)',
      vlan: 10,
      status: 'up',
      notes: 'High-speed 10G/40G backplane distribution aggregator.'
    },
    {
      id: 'inv-srv-dc',
      name: 'Primary Domain Controller & DNS',
      hostname: `${orgSlug}-dc01`,
      deviceType: 'server',
      manufacturer: 'Dell PowerEdge',
      model: 'PowerEdge R650 1U',
      managementIp: '10.10.20.10',
      macAddress: '00:50:56:B2:00:10',
      location: 'MDF Main Server Room Rack 2 (U20)',
      vlan: 20,
      status: 'up',
      notes: 'Active Directory, DNS Resolver, DHCP Server Engine.'
    }
  ];

  // Add Floor Access Switches
  for (let f = 1; f <= Math.min(req.campusFloors, 4); f++) {
    inventory.push({
      id: `inv-sw-fl${f}`,
      name: `Floor ${f} Access PoE Switch`,
      hostname: `${orgSlug}-fl${f}-sw01`,
      deviceType: 'switch',
      manufacturer: 'Cisco Systems',
      model: 'Catalyst 9200L 48-Port PoE+',
      managementIp: `10.10.10.${10 + f}`,
      macAddress: `00:50:56:C3:0${f}:01`,
      location: `IDF Floor ${f} Telecomm Closet`,
      vlan: 10,
      status: 'up',
      notes: `802.3at PoE+ distribution for Floor ${f} APs, Cameras, and Workstations.`
    });
  }

  // 4. Firewall Rules
  const firewallRules: FirewallRule[] = [
    {
      id: 'fw-rule-1',
      priority: 1,
      name: 'Drop All Inbound from Untrusted Edge',
      sourceSubnet: 'ANY',
      destSubnet: '10.10.10.0/24',
      protocol: 'ANY',
      action: 'DENY',
      description: 'Block all direct unsolicited traffic to internal management subnet.',
      enabled: true
    },
    {
      id: 'fw-rule-2',
      priority: 2,
      name: 'Guest Network Isolation from Internal LAN',
      sourceSubnet: '172.16.99.0/23',
      destSubnet: '10.10.0.0/16',
      protocol: 'ANY',
      action: 'DENY',
      description: 'Prevent Guest Wi-Fi clients from accessing internal servers, staff PCs, and cameras.',
      enabled: true
    },
    {
      id: 'fw-rule-3',
      priority: 3,
      name: 'Allow Staff Outbound Web Browsing (HTTP/HTTPS)',
      sourceSubnet: '10.10.30.0/23',
      destSubnet: 'ANY',
      protocol: 'TCP',
      portRange: '80, 443, 8080',
      action: 'ALLOW',
      description: 'Permit secure HTTP/HTTPS outbound traffic for staff workstations.',
      enabled: true
    },
    {
      id: 'fw-rule-4',
      priority: 4,
      name: 'Allow Internal DNS Queries',
      sourceSubnet: 'ANY',
      destSubnet: '10.10.20.10/32',
      protocol: 'UDP',
      portRange: '53',
      action: 'ALLOW',
      description: 'Permit clients on all VLANs to query internal DNS resolver.',
      enabled: true
    }
  ];

  // 5. Hierarchical Topology Canvas
  const devices: NetworkDevice[] = [
    {
      id: 'dev-internet',
      name: 'Internet Edge (ISP)',
      hostname: 'isp-gateway',
      type: 'internet',
      x: 480,
      y: 60,
      ip: '203.0.113.1',
      subnetMask: '255.255.255.252',
      mac: '00:50:56:EE:00:01',
      status: 'up'
    },
    {
      id: 'dev-fw',
      name: 'Perimeter Firewall',
      hostname: `${orgSlug}-fw01`,
      type: 'firewall',
      x: 480,
      y: 160,
      ip: '10.10.10.254',
      subnetMask: '255.255.255.0',
      gateway: '203.0.113.1',
      mac: '00:50:56:A1:00:01',
      status: 'up',
      services: {
        firewallEnabled: true,
        firewallRules
      }
    },
    {
      id: 'dev-core-router',
      name: 'Core L3 Router',
      hostname: `${orgSlug}-rtr01`,
      type: 'router',
      x: 480,
      y: 270,
      ip: '10.10.10.1',
      subnetMask: '255.255.255.0',
      gateway: '10.10.10.254',
      mac: '00:50:56:A1:00:02',
      status: 'up',
      routingTable: [
        { destination: '10.10.20.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interface: 'Gi0/1', type: 'connected' },
        { destination: '10.10.30.0', subnetMask: '255.255.254.0', nextHop: 'Directly Connected', interface: 'Gi0/2', type: 'connected' },
        { destination: '10.10.40.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interface: 'Gi0/3', type: 'connected' },
        { destination: '10.10.50.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interface: 'Gi0/4', type: 'connected' },
        { destination: '0.0.0.0', subnetMask: '0.0.0.0', nextHop: '10.10.10.254', interface: 'Gi0/0', type: 'default' }
      ]
    },
    {
      id: 'dev-sw-core',
      name: 'Core Distribution Switch',
      hostname: `${orgSlug}-core-sw01`,
      type: 'switch',
      x: 480,
      y: 380,
      mac: '00:50:56:A1:00:03',
      status: 'up',
      vlan: 10
    },
    {
      id: 'dev-srv-dc',
      name: 'DC & DNS Server',
      hostname: `${orgSlug}-dc01`,
      type: 'server',
      x: 200,
      y: 380,
      ip: '10.10.20.10',
      subnetMask: '255.255.255.0',
      gateway: '10.10.20.1',
      mac: '00:50:56:B2:00:10',
      status: 'up',
      vlan: 20,
      services: {
        dnsServer: true,
        dhcpServer: true,
        dhcpScope: {
          id: 'dhcp-staff',
          name: 'Staff DHCP Scope',
          network: '10.10.30.0',
          subnetMask: '255.255.254.0',
          cidr: 23,
          gateway: '10.10.30.1',
          dnsServer: '10.10.20.10',
          startIp: '10.10.30.50',
          endIp: '10.10.31.250',
          leaseDurationHours: 8
        }
      }
    },
    {
      id: 'dev-sw-fl1',
      name: 'Floor 1 PoE Switch',
      hostname: `${orgSlug}-fl1-sw01`,
      type: 'switch',
      x: 320,
      y: 490,
      mac: '00:50:56:C3:01:01',
      status: 'up',
      vlan: 30
    },
    {
      id: 'dev-sw-fl2',
      name: 'Floor 2 PoE Switch',
      hostname: `${orgSlug}-fl2-sw01`,
      type: 'switch',
      x: 640,
      y: 490,
      mac: '00:50:56:C3:02:01',
      status: 'up',
      vlan: 30
    },
    {
      id: 'dev-pc-staff',
      name: 'Staff Workstation-01',
      hostname: `${orgSlug}-staff-pc01`,
      type: 'pc',
      x: 200,
      y: 600,
      ip: '10.10.30.51',
      subnetMask: '255.255.254.0',
      gateway: '10.10.30.1',
      dns: '10.10.20.10',
      mac: '00:50:56:D4:01:51',
      status: 'up',
      vlan: 30
    },
    {
      id: 'dev-ap-fl1',
      name: 'Floor 1 Wi-Fi 6 AP',
      hostname: `${orgSlug}-fl1-ap01`,
      type: 'access_point',
      x: 380,
      y: 600,
      ip: '10.10.10.51',
      subnetMask: '255.255.255.0',
      gateway: '10.10.10.1',
      mac: '00:50:56:D4:01:99',
      status: 'up',
      vlan: 10
    },
    {
      id: 'dev-cctv-cam',
      name: 'Main Lobby CCTV Cam',
      hostname: `${orgSlug}-cctv-cam01`,
      type: 'camera',
      x: 580,
      y: 600,
      ip: '10.10.50.21',
      subnetMask: '255.255.255.0',
      gateway: '10.10.50.1',
      mac: '00:50:56:D4:05:21',
      status: 'up',
      vlan: 50
    },
    {
      id: 'dev-printer',
      name: 'Admin Dept Printer',
      hostname: `${orgSlug}-admin-prt01`,
      type: 'printer',
      x: 760,
      y: 600,
      ip: '10.10.30.25',
      subnetMask: '255.255.254.0',
      gateway: '10.10.30.1',
      mac: '00:50:56:D4:03:25',
      status: 'up',
      vlan: 30
    }
  ];

  const connections: NetworkConnection[] = [
    { id: 'conn-isp-fw', sourceDeviceId: 'dev-internet', targetDeviceId: 'dev-fw', type: 'fiber', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-fw-rtr', sourceDeviceId: 'dev-fw', targetDeviceId: 'dev-core-router', type: 'fiber', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-rtr-swcore', sourceDeviceId: 'dev-core-router', targetDeviceId: 'dev-sw-core', type: 'fiber', status: 'up', bandwidthMbps: 10000 },
    { id: 'conn-swcore-dc', sourceDeviceId: 'dev-sw-core', targetDeviceId: 'dev-srv-dc', type: 'ethernet', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-swcore-fl1', sourceDeviceId: 'dev-sw-core', targetDeviceId: 'dev-sw-fl1', type: 'fiber', status: 'up', bandwidthMbps: 10000 },
    { id: 'conn-swcore-fl2', sourceDeviceId: 'dev-sw-core', targetDeviceId: 'dev-sw-fl2', type: 'fiber', status: 'up', bandwidthMbps: 10000 },
    { id: 'conn-fl1-pc', sourceDeviceId: 'dev-sw-fl1', targetDeviceId: 'dev-pc-staff', type: 'ethernet', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-fl1-ap', sourceDeviceId: 'dev-sw-fl1', targetDeviceId: 'dev-ap-fl1', type: 'ethernet', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-fl2-cam', sourceDeviceId: 'dev-sw-fl2', targetDeviceId: 'dev-cctv-cam', type: 'ethernet', status: 'up', bandwidthMbps: 1000 },
    { id: 'conn-fl2-prt', sourceDeviceId: 'dev-sw-fl2', targetDeviceId: 'dev-printer', type: 'ethernet', status: 'up', bandwidthMbps: 1000 }
  ];

  const topology: NetworkTopology = {
    id: `topo-${orgSlug}-${Date.now()}`,
    name: `${req.organizationName} Enterprise Architecture`,
    description: `Complete full-scale campus network architecture designed for ${req.totalUsers} users across ${req.campusFloors} floors with ${vlans.length} segmented VLANs, perimeter security, and high-availability core routing.`,
    category: 'Enterprise Campus',
    devices,
    connections,
    vlans,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const executiveSummary = `Generated 3-Tier Hierarchical Network Design (Core, Distribution, Access) for "${req.organizationName}". Architecture encompasses ${vlans.length} dedicated VLANs, ${inventory.length} provisioned infrastructure hardware items, ${ipamNetworks.length} IPAM subnets, and stateful perimeter firewall rules.`;

  return {
    topology,
    vlans,
    ipamNetworks,
    inventory,
    firewallRules,
    executiveSummary
  };
}

/**
 * Cisco IOS-Style Configuration Generator
 */
export function generateCiscoIosConfiguration(device: NetworkDevice, topology: NetworkTopology): string {
  const lines: string[] = [];
  const hostname = device.hostname || device.name.toLowerCase().replace(/\s+/g, '-');

  lines.push(`! =======================================================`);
  lines.push(`! Cisco IOS Configuration Script`);
  lines.push(`! Target Device: ${device.name} (${device.type.toUpperCase()})`);
  lines.push(`! Generated by NET-LAB 2.0 Engineering Engine`);
  lines.push(`! =======================================================`);
  lines.push(`enable`);
  lines.push(`configure terminal`);
  lines.push(`hostname ${hostname}`);
  lines.push(`no ip domain-lookup`);
  lines.push(`service password-encryption`);
  lines.push(`banner motd ^C Authorized Access Only - NET-LAB Secure Node ${hostname} ^C`);
  lines.push(`!`);

  if (device.type === 'router' || device.type === 'firewall') {
    lines.push(`! --- Layer 3 Routing & Interface Setup ---`);
    lines.push(`ip routing`);
    lines.push(`interface GigabitEthernet0/0`);
    lines.push(` description Uplink to Edge / Firewall`);
    lines.push(` ip address ${device.ip || '10.10.10.1'} ${device.subnetMask || '255.255.255.0'}`);
    lines.push(` no shutdown`);
    lines.push(`!`);

    // Subinterfaces for Inter-VLAN routing
    if (topology.vlans && topology.vlans.length > 0) {
      topology.vlans.forEach(v => {
        lines.push(`interface GigabitEthernet0/1.${v.vlanId}`);
        lines.push(` description Subinterface for ${v.name}`);
        lines.push(` encapsulation dot1Q ${v.vlanId}`);
        lines.push(` ip address ${v.gateway} ${cidrToMask(v.cidr)}`);
        lines.push(` no shutdown`);
        lines.push(`!`);
      });
    }

    if (device.routingTable && device.routingTable.length > 0) {
      lines.push(`! --- Static & Default Routing ---`);
      device.routingTable.forEach(r => {
        lines.push(`ip route ${r.destination} ${r.subnetMask} ${r.nextHop}`);
      });
      lines.push(`!`);
    } else if (device.gateway) {
      lines.push(`ip route 0.0.0.0 0.0.0.0 ${device.gateway}`);
      lines.push(`!`);
    }

    // DHCP Pool
    if (device.services?.dhcpServer && device.services.dhcpScope) {
      const s = device.services.dhcpScope;
      lines.push(`! --- DHCP Server Configuration ---`);
      lines.push(`ip dhcp excluded-address ${s.gateway}`);
      lines.push(`ip dhcp pool ${s.name.replace(/\s+/g, '_')}`);
      lines.push(` network ${s.network} ${s.subnetMask}`);
      lines.push(` default-router ${s.gateway}`);
      lines.push(` dns-server ${s.dnsServer}`);
      lines.push(` lease 1 0 0`);
      lines.push(`!`);
    }
  } else if (device.type === 'switch') {
    lines.push(`! --- Layer 2 VLAN & Trunking Setup ---`);
    if (topology.vlans && topology.vlans.length > 0) {
      topology.vlans.forEach(v => {
        lines.push(`vlan ${v.vlanId}`);
        lines.push(` name ${v.name}`);
        lines.push(`!`);
      });
    }

    lines.push(`interface range GigabitEthernet0/1-2`);
    lines.push(` description 802.1Q Uplink Trunk to Core`);
    lines.push(` switchport mode trunk`);
    lines.push(` switchport trunk allowed vlan all`);
    lines.push(` no shutdown`);
    lines.push(`!`);

    lines.push(`interface range GigabitEthernet0/3-24`);
    lines.push(` description Access Ports for Endpoints`);
    lines.push(` switchport mode access`);
    lines.push(` switchport access vlan ${device.vlan || 30}`);
    lines.push(` spanning-tree portfast`);
    lines.push(` no shutdown`);
    lines.push(`!`);

    lines.push(`interface vlan 10`);
    lines.push(` description In-Band Management SVI`);
    lines.push(` ip address ${device.ip || '10.10.10.15'} 255.255.255.0`);
    lines.push(` no shutdown`);
    lines.push(`ip default-gateway 10.10.10.1`);
    lines.push(`!`);
  } else {
    // Host / Server
    lines.push(`! --- Host Interface IP Configuration ---`);
    lines.push(`! IP Address: ${device.ip || '0.0.0.0'}`);
    lines.push(`! Subnet Mask: ${device.subnetMask || '255.255.255.0'}`);
    lines.push(`! Default Gateway: ${device.gateway || 'None'}`);
    lines.push(`! DNS Resolver: ${device.dns || '8.8.8.8'}`);
  }

  lines.push(`line con 0`);
  lines.push(` logging synchronous`);
  lines.push(` exec-timeout 15 0`);
  lines.push(`line vty 0 4`);
  lines.push(` transport input ssh`);
  lines.push(` login local`);
  lines.push(`!`);
  lines.push(`end`);
  lines.push(`write memory`);

  return lines.join('\n');
}
