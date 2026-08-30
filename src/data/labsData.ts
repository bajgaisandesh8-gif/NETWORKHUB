import { PracticalLab } from '../types';

export const LABS_DATA: PracticalLab[] = [
  {
    id: 'lab-01',
    labNumber: 1,
    title: 'Build a Basic Local Area Network (LAN)',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    objective: 'Construct a 2-PC single broadcast domain network connected by an Ethernet switch and verify peer-to-peer ping connectivity.',
    scenario: 'A branch office needs two workstations (PC1 and PC2) connected to a 24-port FastEthernet switch. Both machines must communicate directly on the 192.168.1.0/24 subnet.',
    requiredKnowledge: ['IPv4 Addressing', 'Subnet Masks (/24)', 'Ethernet Switching', 'ICMP Ping'],
    starterTopology: {
      devices: [
        { id: 'pc1', name: 'PC1', type: 'pc', x: 120, y: 220, ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:50:79:66:68:01', status: 'up' },
        { id: 'sw1', name: 'Switch1', type: 'switch', x: 340, y: 220, status: 'up' },
        { id: 'pc2', name: 'PC2', type: 'pc', x: 560, y: 220, ip: '', subnetMask: '255.255.255.0', mac: '00:50:79:66:68:02', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc1', targetDeviceId: 'sw1', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw1', targetDeviceId: 'pc2', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Assign an IP address in the 192.168.1.0/24 subnet to PC2 (e.g. 192.168.1.20).', hint: 'Click PC2 on the canvas, open the Configuration inspector, and enter IP: 192.168.1.20, Subnet Mask: 255.255.255.0.', validationKey: 'pc2_ip_configured' },
      { id: 't2', instruction: 'Run a Packet Trace from PC1 to PC2.', hint: 'Use the Packet Trace tool with Source PC1 and Destination 192.168.1.20.', validationKey: 'packet_trace_success' },
      { id: 't3', instruction: 'Inspect the ARP resolution step in the Packet Journey timeline.', hint: 'Look at Hop 1 to see how PC1 broadcasts ARP to resolve PC2 MAC address.', validationKey: 'arp_inspected' }
    ],
    expectedResult: 'PC1 successfully transmits ICMP Echo Request frames through Switch1 to PC2 and receives Echo Reply.',
    explanation: 'Within a single Layer 2 broadcast domain, devices on the same subnet resolve each other using ARP broadcasts and communicate through Ethernet switch MAC table forwarding without requiring a default gateway router.',
    passingScore: 100
  },
  {
    id: 'lab-02',
    labNumber: 2,
    title: 'Configure IPv4 Addressing & Default Gateway',
    category: 'Addressing',
    difficulty: 'Beginner',
    estimatedMinutes: 20,
    objective: 'Configure static IPv4 addresses, subnet masks, and default gateways on a dual-subnet topology connected by a central router.',
    scenario: 'Marketing (Subnet A: 192.168.10.0/24) and Engineering (Subnet B: 192.168.20.0/24) need to route packets through Router1 (Gateway A: 192.168.10.1, Gateway B: 192.168.20.1).',
    requiredKnowledge: ['Default Gateways', 'Cross-Subnet Routing', 'Subnet Mask Calculation'],
    starterTopology: {
      devices: [
        { id: 'pc10', name: 'Marketing-PC', type: 'pc', x: 100, y: 150, ip: '192.168.10.5', subnetMask: '255.255.255.0', gateway: '192.168.10.1', status: 'up' },
        { id: 'sw10', name: 'Switch-Mkt', type: 'switch', x: 250, y: 150, status: 'up' },
        { id: 'r1', name: 'Router1', type: 'router', x: 400, y: 220, ip: '192.168.10.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'sw20', name: 'Switch-Eng', type: 'switch', x: 550, y: 290, status: 'up' },
        { id: 'pc20', name: 'Eng-Server', type: 'server', x: 700, y: 290, ip: '192.168.20.100', subnetMask: '255.255.255.0', gateway: '', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc10', targetDeviceId: 'sw10', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw10', targetDeviceId: 'r1', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'r1', targetDeviceId: 'sw20', type: 'ethernet', status: 'up' },
        { id: 'c4', sourceDeviceId: 'sw20', targetDeviceId: 'pc20', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Configure Default Gateway 192.168.20.1 on Eng-Server.', hint: 'Open Eng-Server inspector and set Gateway to 192.168.20.1.', validationKey: 'gateway_configured' },
      { id: 't2', instruction: 'Verify routing path from Marketing-PC to Eng-Server using Packet Trace.', hint: 'Trace packet from Marketing-PC to 192.168.20.100.', validationKey: 'inter_subnet_ping' }
    ],
    expectedResult: 'Packets leave Subnet A, are routed through Router1 with TTL decrement, and arrive at Eng-Server.',
    explanation: 'When a host sends data to a destination IP on a different subnet, it cannot use ARP to find the remote MAC. Instead, it sends the frame to its Default Gateway router.',
    passingScore: 100
  },
  {
    id: 'lab-03',
    labNumber: 3,
    title: 'Subnet a /24 Network into 4 Equal Subnets (/26)',
    category: 'Addressing',
    difficulty: 'Intermediate',
    estimatedMinutes: 25,
    objective: 'Divide 192.168.100.0/24 into four /26 subnets (62 usable hosts each) and apply them to 4 department branches.',
    scenario: 'You are allocated 192.168.100.0/24. Subnet it into 4 equal blocks: HR, Sales, IT, and Finance.',
    requiredKnowledge: ['CIDR Subnetting', 'Binary Math', 'Usable Host Range', 'Broadcast Addresses'],
    starterTopology: {
      devices: [
        { id: 'r_core', name: 'Core-Router', type: 'router', x: 380, y: 180, status: 'up' },
        { id: 'sw_hr', name: 'SW-HR', type: 'switch', x: 180, y: 80, status: 'up' },
        { id: 'sw_sales', name: 'SW-Sales', type: 'switch', x: 580, y: 80, status: 'up' },
        { id: 'sw_it', name: 'SW-IT', type: 'switch', x: 180, y: 280, status: 'up' },
        { id: 'sw_fin', name: 'SW-Finance', type: 'switch', x: 580, y: 280, status: 'up' },
        { id: 'pc_hr', name: 'HR-PC', type: 'pc', x: 60, y: 80, ip: '192.168.100.10', subnetMask: '255.255.255.192', gateway: '192.168.100.1', status: 'up' },
        { id: 'pc_sales', name: 'Sales-PC', type: 'pc', x: 700, y: 80, ip: '192.168.100.70', subnetMask: '255.255.255.192', gateway: '192.168.100.65', status: 'up' },
        { id: 'pc_it', name: 'IT-PC', type: 'pc', x: 60, y: 280, ip: '192.168.100.130', subnetMask: '255.255.255.192', gateway: '192.168.100.129', status: 'up' },
        { id: 'pc_fin', name: 'Finance-PC', type: 'pc', x: 700, y: 280, ip: '192.168.100.195', subnetMask: '255.255.255.192', gateway: '192.168.100.193', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc_hr', targetDeviceId: 'sw_hr', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw_hr', targetDeviceId: 'r_core', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'pc_sales', targetDeviceId: 'sw_sales', type: 'ethernet', status: 'up' },
        { id: 'c4', sourceDeviceId: 'sw_sales', targetDeviceId: 'r_core', type: 'ethernet', status: 'up' },
        { id: 'c5', sourceDeviceId: 'pc_it', targetDeviceId: 'sw_it', type: 'ethernet', status: 'up' },
        { id: 'c6', sourceDeviceId: 'sw_it', targetDeviceId: 'r_core', type: 'ethernet', status: 'up' },
        { id: 'c7', sourceDeviceId: 'pc_fin', targetDeviceId: 'sw_fin', type: 'ethernet', status: 'up' },
        { id: 'c8', sourceDeviceId: 'sw_fin', targetDeviceId: 'r_core', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Use the Subnet Calculator to calculate 192.168.100.0/26 subnet boundaries.', hint: 'In the Tools Hub, input 192.168.100.0 with CIDR /26 to view the 4 subnet blocks (.0, .64, .128, .192).', validationKey: 'subnet_calculated' },
      { id: 't2', instruction: 'Verify all 4 departments can route to Core-Router.', hint: 'Run packet traces from each department PC to its respective default gateway.', validationKey: 'all_subnets_routed' }
    ],
    expectedResult: 'All 4 /26 subnets operate with 255.255.255.192 subnet mask and 62 usable hosts each.',
    explanation: 'Borrowing 2 bits from the host portion creates 2^2 = 4 subnets with 2^6 - 2 = 62 usable hosts per subnet.',
    passingScore: 100
  },
  {
    id: 'lab-04',
    labNumber: 4,
    title: 'Configure DHCP Server & Address Allocation',
    category: 'Services',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    objective: 'Deploy a centralized DHCP server to lease IP configuration to dynamic client hosts.',
    scenario: 'New laptop clients in the conference room need automatic IP assignment via DHCP DORA handshake.',
    requiredKnowledge: ['DHCP DORA', 'UDP Ports 67/68', 'Broadcast Discovery'],
    starterTopology: {
      devices: [
        { id: 'dhcp_srv', name: 'DHCP-Server', type: 'server', x: 200, y: 100, ip: '192.168.1.2', subnetMask: '255.255.255.0', services: { dhcpServer: true }, status: 'up' },
        { id: 'sw_dhcp', name: 'Main-Switch', type: 'switch', x: 380, y: 180, status: 'up' },
        { id: 'laptop1', name: 'Client-Laptop', type: 'laptop', x: 560, y: 180, ip: '0.0.0.0', subnetMask: '255.255.255.0', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'dhcp_srv', targetDeviceId: 'sw_dhcp', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw_dhcp', targetDeviceId: 'laptop1', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Inspect DHCP-Server configuration in the topology builder.', hint: 'Verify DHCP service is enabled with pool 192.168.1.50-100.', validationKey: 'dhcp_service_checked' },
      { id: 't2', instruction: 'Assign IP 192.168.1.50 to Client-Laptop from the DHCP pool.', hint: 'Set Client-Laptop IP to 192.168.1.50 and Gateway to 192.168.1.1.', validationKey: 'dhcp_lease_assigned' }
    ],
    expectedResult: 'Client-Laptop receives dynamic IPv4 configuration via DHCP DORA exchange.',
    explanation: 'DHCP eliminates manual static IP configuration errors using Discover, Offer, Request, and Acknowledgment.',
    passingScore: 100
  },
  {
    id: 'lab-05',
    labNumber: 5,
    title: 'Understand DNS Name Resolution',
    category: 'Services',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    objective: 'Trace a DNS lookup from client workstation to authoritative DNS server for domain resolution.',
    scenario: 'Workstation queries netlab.local to find the IP address of the Internal Web Server.',
    requiredKnowledge: ['DNS UDP 53', 'A Records', 'Recursive vs Authoritative'],
    starterTopology: {
      devices: [
        { id: 'pc_user', name: 'User-PC', type: 'pc', x: 120, y: 200, ip: '192.168.1.10', subnetMask: '255.255.255.0', dns: '192.168.1.53', status: 'up' },
        { id: 'sw_dns', name: 'Switch-LAN', type: 'switch', x: 320, y: 200, status: 'up' },
        { id: 'dns_srv', name: 'DNS-Server', type: 'server', x: 520, y: 120, ip: '192.168.1.53', subnetMask: '255.255.255.0', services: { dnsServer: true }, status: 'up' },
        { id: 'web_srv', name: 'Web-Server', type: 'server', x: 520, y: 280, ip: '192.168.1.80', subnetMask: '255.255.255.0', services: { webServer: true }, status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc_user', targetDeviceId: 'sw_dns', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw_dns', targetDeviceId: 'dns_srv', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'sw_dns', targetDeviceId: 'web_srv', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace DNS query packet from User-PC to DNS-Server (192.168.1.53) on port 53.', hint: 'Use Packet Trace with Protocol DNS and Destination 192.168.1.53.', validationKey: 'dns_trace_run' },
      { id: 't2', instruction: 'Trace HTTP request from User-PC to Web-Server (192.168.1.80) on port 80.', hint: 'Use Packet Trace with Protocol HTTP and Destination 192.168.1.80.', validationKey: 'http_trace_run' }
    ],
    expectedResult: 'DNS query resolves netlab.local to 192.168.1.80, followed by successful HTTP session.',
    explanation: 'Before establishing a TCP handshake with a domain name, the client must resolve the hostname into an IP address via DNS.',
    passingScore: 100
  },
  {
    id: 'lab-06',
    labNumber: 6,
    title: 'ARP Protocol & MAC Address Table Investigation',
    category: 'Switching',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    objective: 'Investigate how Layer 2 switches populate CAM tables through ARP broadcasts and unicast frame forwarding.',
    scenario: 'Analyze packet encapsulation headers to observe how Source MAC addresses are learned by switch ingress ports.',
    requiredKnowledge: ['ARP Broadcast FF:FF:FF:FF:FF:FF', 'MAC Tables (CAM)', 'Layer 2 Encapsulation'],
    starterTopology: {
      devices: [
        { id: 'pc_a', name: 'Host-A', type: 'pc', x: 100, y: 150, ip: '10.0.0.1', subnetMask: '255.0.0.0', mac: 'AA:AA:AA:11:11:11', status: 'up' },
        { id: 'pc_b', name: 'Host-B', type: 'pc', x: 100, y: 270, ip: '10.0.0.2', subnetMask: '255.0.0.0', mac: 'BB:BB:BB:22:22:22', status: 'up' },
        { id: 'sw_cam', name: 'Core-Switch', type: 'switch', x: 350, y: 210, status: 'up' },
        { id: 'pc_c', name: 'Host-C', type: 'pc', x: 600, y: 210, ip: '10.0.0.3', subnetMask: '255.0.0.0', mac: 'CC:CC:CC:33:33:33', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc_a', targetDeviceId: 'sw_cam', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'pc_b', targetDeviceId: 'sw_cam', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'sw_cam', targetDeviceId: 'pc_c', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace packet from Host-A to Host-C and observe ARP encapsulation.', hint: 'Run Packet Trace with Source Host-A and Destination Host-C.', validationKey: 'arp_layer2_traced' }
    ],
    expectedResult: 'Switch learns Host-A MAC on Port 1, floods broadcast, and records Host-C MAC on Port 3 upon receiving reply.',
    explanation: 'Switches build forwarding tables dynamically by reading incoming source MAC addresses.',
    passingScore: 100
  },
  {
    id: 'lab-07',
    labNumber: 7,
    title: 'VLAN Segmentation & Broadcast Domain Isolation',
    category: 'Switching',
    difficulty: 'Intermediate',
    estimatedMinutes: 25,
    objective: 'Implement 802.1Q VLAN tags (VLAN 10 Sales, VLAN 20 Accounting) to enforce Layer 2 traffic isolation.',
    scenario: 'Sales and Accounting share one physical switch but must be partitioned into separate broadcast domains for security.',
    requiredKnowledge: ['IEEE 802.1Q', 'Access Ports', 'Broadcast Domains'],
    starterTopology: {
      devices: [
        { id: 'sales_1', name: 'Sales-1', type: 'pc', x: 120, y: 120, ip: '192.168.10.11', subnetMask: '255.255.255.0', vlan: 10, status: 'up' },
        { id: 'sales_2', name: 'Sales-2', type: 'pc', x: 120, y: 280, ip: '192.168.10.12', subnetMask: '255.255.255.0', vlan: 10, status: 'up' },
        { id: 'vlan_sw', name: 'VLAN-Switch', type: 'switch', x: 360, y: 200, status: 'up' },
        { id: 'acct_1', name: 'Acct-1', type: 'pc', x: 600, y: 120, ip: '192.168.20.21', subnetMask: '255.255.255.0', vlan: 20, status: 'up' },
        { id: 'acct_2', name: 'Acct-2', type: 'pc', x: 600, y: 280, ip: '192.168.20.22', subnetMask: '255.255.255.0', vlan: 20, status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'sales_1', targetDeviceId: 'vlan_sw', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sales_2', targetDeviceId: 'vlan_sw', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'vlan_sw', targetDeviceId: 'acct_1', type: 'ethernet', status: 'up' },
        { id: 'c4', sourceDeviceId: 'vlan_sw', targetDeviceId: 'acct_2', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Test connectivity within VLAN 10 (Sales-1 to Sales-2).', hint: 'Trace packet from Sales-1 to Sales-2 — it should succeed.', validationKey: 'intra_vlan_success' },
      { id: 't2', instruction: 'Test connectivity between VLAN 10 and VLAN 20 (Sales-1 to Acct-1).', hint: 'Trace packet from Sales-1 to Acct-1 — observe VLAN isolation drop.', validationKey: 'inter_vlan_isolated' }
    ],
    expectedResult: 'Intra-VLAN frames communicate freely; inter-VLAN frames are blocked by the switch.',
    explanation: 'VLANs split a single physical switch into isolated logical switches, preventing unauthorized lateral movement.',
    passingScore: 100
  },
  {
    id: 'lab-08',
    labNumber: 8,
    title: 'Inter-VLAN Routing with Router-on-a-Stick',
    category: 'Routing',
    difficulty: 'Intermediate',
    estimatedMinutes: 25,
    objective: 'Connect a Layer 3 Router to enable controlled communication between VLAN 10 and VLAN 20.',
    scenario: 'Add a router with 802.1Q trunk link to route traffic between isolated Sales and Accounting VLANs.',
    requiredKnowledge: ['802.1Q Trunking', 'Sub-interfaces', 'Inter-VLAN Routing'],
    starterTopology: {
      devices: [
        { id: 'pc_v10', name: 'Host-VLAN10', type: 'pc', x: 120, y: 150, ip: '192.168.10.5', subnetMask: '255.255.255.0', gateway: '192.168.10.1', vlan: 10, status: 'up' },
        { id: 'trunk_sw', name: 'Trunk-Switch', type: 'switch', x: 350, y: 150, status: 'up' },
        { id: 'r_roas', name: 'RoaS-Router', type: 'router', x: 350, y: 20, ip: '192.168.10.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'pc_v20', name: 'Host-VLAN20', type: 'pc', x: 580, y: 150, ip: '192.168.20.5', subnetMask: '255.255.255.0', gateway: '192.168.20.1', vlan: 20, status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'pc_v10', targetDeviceId: 'trunk_sw', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'trunk_sw', targetDeviceId: 'r_roas', type: 'fiber', status: 'up' },
        { id: 'c3', sourceDeviceId: 'trunk_sw', targetDeviceId: 'pc_v20', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace packet from Host-VLAN10 to Host-VLAN20 through RoaS-Router.', hint: 'Run Packet Trace from Host-VLAN10 to 192.168.20.5.', validationKey: 'roas_trace_verified' }
    ],
    expectedResult: 'Frame travels up the trunk link, router decapsulates VLAN 10 tag, routes packet, re-encapsulates with VLAN 20 tag, and delivers to Host-VLAN20.',
    explanation: 'Router-on-a-Stick enables inter-VLAN routing over a single physical link by utilizing 802.1Q sub-interfaces.',
    passingScore: 100
  },
  {
    id: 'lab-09',
    labNumber: 9,
    title: 'Static Routing & Default Routes Configuration',
    category: 'Routing',
    difficulty: 'Intermediate',
    estimatedMinutes: 25,
    objective: 'Configure static routes and default routes (0.0.0.0/0) across a multi-router WAN mesh.',
    scenario: 'Connect Headquarters Router to Branch Office Router across a Point-to-Point WAN serial link.',
    requiredKnowledge: ['Static Routes', 'Default Route (0.0.0.0/0)', 'Next-Hop IP'],
    starterTopology: {
      devices: [
        { id: 'hq_pc', name: 'HQ-Workstation', type: 'pc', x: 100, y: 200, ip: '10.1.1.10', subnetMask: '255.255.255.0', gateway: '10.1.1.1', status: 'up' },
        { id: 'r_hq', name: 'HQ-Router', type: 'router', x: 280, y: 200, ip: '10.1.1.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'r_branch', name: 'Branch-Router', type: 'router', x: 500, y: 200, ip: '10.2.2.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'br_pc', name: 'Branch-PC', type: 'pc', x: 680, y: 200, ip: '10.2.2.20', subnetMask: '255.255.255.0', gateway: '10.2.2.1', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'hq_pc', targetDeviceId: 'r_hq', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'r_hq', targetDeviceId: 'r_branch', type: 'fiber', status: 'up' },
        { id: 'c3', sourceDeviceId: 'r_branch', targetDeviceId: 'br_pc', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace end-to-end packet journey from HQ-Workstation to Branch-PC.', hint: 'Use Packet Trace to follow WAN forwarding between HQ-Router and Branch-Router.', validationKey: 'wan_packet_traced' }
    ],
    expectedResult: 'Packets traverse the fiber WAN link between HQ-Router and Branch-Router with multiple routing hops.',
    explanation: 'Static routing defines fixed paths to remote networks, ideal for small stub networks with predictable traffic patterns.',
    passingScore: 100
  },
  {
    id: 'lab-10',
    labNumber: 10,
    title: 'OSPF Dynamic Link-State Routing Concepts',
    category: 'Routing',
    difficulty: 'Advanced',
    estimatedMinutes: 30,
    objective: 'Analyze OSPF Area 0 backbone link-state advertisements and shortest-path computation.',
    scenario: 'Triangular 3-router backbone dynamically computes the lowest cost route when a link fails.',
    requiredKnowledge: ['Dijkstra Algorithm', 'OSPF Area 0', 'Link-State Advertisements (LSA)'],
    starterTopology: {
      devices: [
        { id: 'r1_ospf', name: 'OSPF-Router-1', type: 'router', x: 200, y: 100, ip: '172.16.1.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'r2_ospf', name: 'OSPF-Router-2', type: 'router', x: 500, y: 100, ip: '172.16.2.1', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'r3_ospf', name: 'OSPF-Router-3', type: 'router', x: 350, y: 280, ip: '172.16.3.1', subnetMask: '255.255.255.0', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'r1_ospf', targetDeviceId: 'r2_ospf', type: 'fiber', status: 'up' },
        { id: 'c2', sourceDeviceId: 'r2_ospf', targetDeviceId: 'r3_ospf', type: 'fiber', status: 'up' },
        { id: 'c3', sourceDeviceId: 'r3_ospf', targetDeviceId: 'r1_ospf', type: 'fiber', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace packet from OSPF-Router-1 to OSPF-Router-2.', hint: 'Verify direct fiber link path.', validationKey: 'ospf_direct_traced' }
    ],
    expectedResult: 'OSPF routers exchange Hello packets and maintain identical Link-State Databases (LSDB).',
    explanation: 'OSPF uses the Dijkstra algorithm to calculate the shortest path tree, converging rapidly when topology changes occur.',
    passingScore: 100
  },
  {
    id: 'lab-11',
    labNumber: 11,
    title: 'Wireless Network Design & Access Point Density',
    category: 'Design',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    objective: 'Design a high-density 802.11ax WiFi network with centralized Access Points and calculate capacity.',
    scenario: 'Deploy wireless coverage for 80 concurrent mobile clients across office zones.',
    requiredKnowledge: ['802.11 Channels', 'SSID & WPA3 Security', 'Access Point Placement'],
    starterTopology: {
      devices: [
        { id: 'ap_main', name: 'Office-AP-1', type: 'access_point', x: 300, y: 180, ip: '192.168.50.2', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'sw_poe', name: 'PoE-Switch', type: 'switch', x: 120, y: 180, status: 'up' },
        { id: 'laptop_w1', name: 'User-Laptop-1', type: 'laptop', x: 500, y: 120, ip: '192.168.50.10', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'laptop_w2', name: 'User-Laptop-2', type: 'laptop', x: 500, y: 240, ip: '192.168.50.11', subnetMask: '255.255.255.0', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'sw_poe', targetDeviceId: 'ap_main', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'ap_main', targetDeviceId: 'laptop_w1', type: 'wireless', status: 'up' },
        { id: 'c3', sourceDeviceId: 'ap_main', targetDeviceId: 'laptop_w2', type: 'wireless', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Use the WiFi Capacity Estimator in the Tools Hub to calculate required AP density.', hint: 'Navigate to Tools -> WiFi Capacity Estimator and input 80 clients.', validationKey: 'wifi_tool_used' }
    ],
    expectedResult: 'Wireless clients associate over 5GHz channels with minimal co-channel interference.',
    explanation: 'Modern wireless design balances coverage area with airtime capacity, avoiding overlapping 2.4GHz channels.',
    passingScore: 100
  },
  {
    id: 'lab-12',
    labNumber: 12,
    title: 'Firewall Policy & Access Control Troubleshooting',
    category: 'Security',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    objective: 'Diagnose why HTTPS traffic succeeds but SSH is dropped at the perimeter firewall.',
    scenario: 'Developers can browse the web server but cannot SSH for remote maintenance because port 22 is blocked in the firewall ACL.',
    requiredKnowledge: ['Firewall ACLs', 'Stateful Inspection', 'Port Filtering (TCP 22 vs 443)'],
    starterTopology: {
      devices: [
        { id: 'admin_pc', name: 'Admin-PC', type: 'pc', x: 100, y: 200, ip: '192.168.1.10', subnetMask: '255.255.255.0', status: 'up' },
        { id: 'sw_lan', name: 'Internal-Switch', type: 'switch', x: 260, y: 200, status: 'up' },
        { id: 'fw_sec', name: 'Edge-Firewall', type: 'firewall', x: 420, y: 200, ip: '192.168.1.1', subnetMask: '255.255.255.0', services: { firewallEnabled: true, blockedPorts: [22] }, status: 'up' },
        { id: 'dmz_srv', name: 'DMZ-Server', type: 'server', x: 620, y: 200, ip: '10.0.0.100', subnetMask: '255.255.255.0', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'admin_pc', targetDeviceId: 'sw_lan', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'sw_lan', targetDeviceId: 'fw_sec', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'fw_sec', targetDeviceId: 'dmz_srv', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Trace SSH packet (port 22) from Admin-PC to DMZ-Server and observe the Firewall Drop.', hint: 'Use Packet Trace with Protocol SSH / Port 22.', validationKey: 'ssh_firewall_drop' },
      { id: 't2', instruction: 'Unblock port 22 on Edge-Firewall and re-verify connectivity.', hint: 'Click Edge-Firewall, clear blocked port 22 in the inspector, and re-trace.', validationKey: 'firewall_unblocked' }
    ],
    expectedResult: 'Firewall drops unauthorized ports based on ACL policies and logs inspection decisions.',
    explanation: 'Firewalls enforce security boundaries by evaluating Layer 3/4 headers against ordered rule sets.',
    passingScore: 100
  },
  {
    id: 'lab-13',
    labNumber: 13,
    title: 'Network Failure Diagnosis & Root Cause Analysis',
    category: 'Security',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    objective: 'Utilize automated diagnostics and simulated CLI tools to find and fix 3 hidden network bugs.',
    scenario: 'Branch office reports complete outage: An IP conflict, a wrong default gateway, and a disconnected switch link.',
    requiredKnowledge: ['Root Cause Analysis', 'IP Conflicts', 'Gateway Troubleshooting'],
    starterTopology: {
      devices: [
        { id: 'user1', name: 'User-PC-1', type: 'pc', x: 100, y: 120, ip: '192.168.1.10', subnetMask: '255.255.255.0', gateway: '192.168.99.1', status: 'up' },
        { id: 'user2', name: 'User-PC-2', type: 'pc', x: 100, y: 260, ip: '192.168.1.10', subnetMask: '255.255.255.0', gateway: '192.168.1.1', status: 'up' },
        { id: 'sw_broken', name: 'Branch-Switch', type: 'switch', x: 300, y: 190, status: 'up' },
        { id: 'gw_rtr', name: 'Gateway-Router', type: 'router', x: 520, y: 190, ip: '192.168.1.1', subnetMask: '255.255.255.0', status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'user1', targetDeviceId: 'sw_broken', type: 'ethernet', status: 'up' },
        { id: 'c2', sourceDeviceId: 'user2', targetDeviceId: 'sw_broken', type: 'ethernet', status: 'up' },
        { id: 'c3', sourceDeviceId: 'sw_broken', targetDeviceId: 'gw_rtr', type: 'ethernet', status: 'down' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Run automated diagnostics to detect all 3 failure causes.', hint: 'Click the DIAGNOSE button in the Topology Builder toolbar.', validationKey: 'diagnostics_executed' },
      { id: 't2', instruction: 'Resolve the duplicate IP on User-PC-2 (set to 192.168.1.11).', hint: 'Edit User-PC-2 IP to 192.168.1.11.', validationKey: 'dup_ip_fixed' },
      { id: 't3', instruction: 'Fix User-PC-1 gateway to 192.168.1.1 and restore switch link.', hint: 'Fix gateway on User-PC-1 and enable the link connection to Gateway-Router.', validationKey: 'all_bugs_cleared' }
    ],
    expectedResult: 'System reports: 0 issues remaining. All diagnostic tests PASS.',
    explanation: 'Systematic troubleshooting verifies physical connectivity, Layer 2 isolation, Layer 3 addressing, and gateway routing in order.',
    passingScore: 100
  },
  {
    id: 'lab-14',
    labNumber: 14,
    title: 'Enterprise Architecture: 5-Floor Hotel Network Design',
    category: 'Design',
    difficulty: 'Advanced',
    estimatedMinutes: 35,
    objective: 'Design an end-to-end network topology for a 5-floor hotel with Guest WiFi, Staff VLAN, CCTV, and POS systems.',
    scenario: 'Grand Hotel requires an enterprise network separating untrusted guests from payment processing and security cameras.',
    requiredKnowledge: ['Hierarchical Network Design', 'VLAN Segmentation', 'Firewall Security', 'DHCP Server'],
    starterTopology: {
      devices: [
        { id: 'hotel_rtr', name: 'Hotel-Gateway-Router', type: 'router', x: 380, y: 60, ip: '172.16.0.1', subnetMask: '255.255.0.0', status: 'up' },
        { id: 'hotel_fw', name: 'Hotel-Firewall', type: 'firewall', x: 380, y: 150, ip: '172.16.0.2', subnetMask: '255.255.0.0', status: 'up' },
        { id: 'core_sw', name: 'Core-Distribution-Switch', type: 'switch', x: 380, y: 240, status: 'up' },
        { id: 'guest_ap', name: 'Floor-Guest-AP', type: 'access_point', x: 140, y: 340, ip: '172.16.10.10', subnetMask: '255.255.255.0', vlan: 10, status: 'up' },
        { id: 'pos_terminal', name: 'FrontDesk-POS', type: 'pc', x: 380, y: 340, ip: '172.16.20.5', subnetMask: '255.255.255.0', vlan: 20, status: 'up' },
        { id: 'cctv_srv', name: 'CCTV-Storage-Server', type: 'server', x: 620, y: 340, ip: '172.16.30.50', subnetMask: '255.255.255.0', vlan: 30, status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'hotel_rtr', targetDeviceId: 'hotel_fw', type: 'fiber', status: 'up' },
        { id: 'c2', sourceDeviceId: 'hotel_fw', targetDeviceId: 'core_sw', type: 'fiber', status: 'up' },
        { id: 'c3', sourceDeviceId: 'core_sw', targetDeviceId: 'guest_ap', type: 'ethernet', status: 'up' },
        { id: 'c4', sourceDeviceId: 'core_sw', targetDeviceId: 'pos_terminal', type: 'ethernet', status: 'up' },
        { id: 'c5', sourceDeviceId: 'core_sw', targetDeviceId: 'cctv_srv', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Run NET-LAB Design Evaluation on the hotel topology.', hint: 'Click the "Design Evaluation" button to see category scores and recommendations.', validationKey: 'hotel_evaluated' }
    ],
    expectedResult: 'Topology receives Design Evaluation score >= 85/100.',
    explanation: 'Segmenting Guests (VLAN 10), PCI-DSS POS terminals (VLAN 20), and CCTV (VLAN 30) behind a firewall meets enterprise compliance standards.',
    passingScore: 100
  },
  {
    id: 'lab-15',
    labNumber: 15,
    title: 'University Campus Backbone & Redundancy Design',
    category: 'Design',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    objective: 'Design a multi-building campus network with redundant distribution switches, dual routers, and DMZ servers.',
    scenario: 'University campus connects Science, Library, and Dormitory buildings with high availability and redundant uplinks.',
    requiredKnowledge: ['High Availability', 'Spanning Tree Protocol', 'Redundant Gateways', 'DMZ Architecture'],
    starterTopology: {
      devices: [
        { id: 'inet', name: 'ISP-Internet', type: 'internet', x: 380, y: 30, ip: '8.8.8.8', status: 'up' },
        { id: 'r_edge1', name: 'Edge-Router-1', type: 'router', x: 260, y: 110, ip: '203.0.113.1', status: 'up' },
        { id: 'r_edge2', name: 'Edge-Router-2', type: 'router', x: 500, y: 110, ip: '203.0.113.2', status: 'up' },
        { id: 'dist_sw1', name: 'Dist-Switch-1', type: 'switch', x: 260, y: 200, status: 'up' },
        { id: 'dist_sw2', name: 'Dist-Switch-2', type: 'switch', x: 500, y: 200, status: 'up' },
        { id: 'sci_sw', name: 'Science-Building-SW', type: 'switch', x: 140, y: 310, status: 'up' },
        { id: 'lib_sw', name: 'Library-Building-SW', type: 'switch', x: 380, y: 310, status: 'up' },
        { id: 'dorm_sw', name: 'Dorm-Building-SW', type: 'switch', x: 620, y: 310, status: 'up' }
      ],
      connections: [
        { id: 'c1', sourceDeviceId: 'inet', targetDeviceId: 'r_edge1', type: 'fiber', status: 'up' },
        { id: 'c2', sourceDeviceId: 'inet', targetDeviceId: 'r_edge2', type: 'fiber', status: 'up' },
        { id: 'c3', sourceDeviceId: 'r_edge1', targetDeviceId: 'dist_sw1', type: 'fiber', status: 'up' },
        { id: 'c4', sourceDeviceId: 'r_edge2', targetDeviceId: 'dist_sw2', type: 'fiber', status: 'up' },
        { id: 'c5', sourceDeviceId: 'dist_sw1', targetDeviceId: 'dist_sw2', type: 'fiber', status: 'up' },
        { id: 'c6', sourceDeviceId: 'dist_sw1', targetDeviceId: 'sci_sw', type: 'ethernet', status: 'up' },
        { id: 'c7', sourceDeviceId: 'dist_sw1', targetDeviceId: 'lib_sw', type: 'ethernet', status: 'up' },
        { id: 'c8', sourceDeviceId: 'dist_sw2', targetDeviceId: 'dorm_sw', type: 'ethernet', status: 'up' }
      ]
    },
    tasks: [
      { id: 't1', instruction: 'Perform full Design Evaluation and review Redundancy & Scalability ratings.', hint: 'Click Design Evaluation to verify grade A rating.', validationKey: 'campus_evaluated' }
    ],
    expectedResult: 'Campus backbone demonstrates zero single points of failure across core distribution tier.',
    explanation: 'Hierarchical 3-tier design (Access, Distribution, Core) simplifies management, streamlines VLAN aggregation, and maintains uptime.',
    passingScore: 100
  }
];
