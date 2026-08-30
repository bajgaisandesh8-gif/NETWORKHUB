export interface NetworkDesignChallenge {
  id: string;
  title: string;
  difficulty: 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Enterprise' | 'Campus' | 'Healthcare' | 'ISP' | 'DataCenter' | 'SmallBusiness';
  scenario: string;
  requirements: {
    clientCapacity: string;
    segmentation: string[];
    redundancy: string;
    security: string[];
    services: string[];
  };
  evaluationCriteria: {
    minDevices: number;
    requiredTypes: string[];
    minVlans: number;
    requiresFirewall: boolean;
    requiresRedundantLinks: boolean;
  };
  sampleSolutionDescription: string;
}

export const CHALLENGES_DATA: NetworkDesignChallenge[] = [
  {
    id: 'ch-hotel-01',
    title: '5-Floor Boutique Hotel & Hospitality Network',
    difficulty: 'Advanced',
    category: 'Enterprise',
    scenario: 'Design a resilient network architecture for a 5-floor hotel with 120 guest rooms, reception POS terminals, guest WiFi, VoIP telephony, CCTV security cameras, and administration workstations.',
    requirements: {
      clientCapacity: '150+ concurrent wireless & wired devices',
      segmentation: ['VLAN 10: Guest WiFi (Captive Portal / Isolated)', 'VLAN 20: Front Desk POS (PCI-DSS Strict)', 'VLAN 30: Admin Staff', 'VLAN 40: CCTV Surveillance', 'VLAN 50: Voice VoIP'],
      redundancy: 'Dual distribution switches with STP loop-prevention',
      security: ['Stateful Perimeter Firewall', 'PCI-DSS isolated POS subnet', 'Guest client isolation'],
      services: ['High-availability DHCP server', 'Internal DNS resolver', 'PoE Access Points per floor']
    },
    evaluationCriteria: {
      minDevices: 6,
      requiredTypes: ['router', 'switch', 'firewall', 'access_point', 'server', 'pc'],
      minVlans: 3,
      requiresFirewall: true,
      requiresRedundantLinks: true
    },
    sampleSolutionDescription: 'Core router connecting to Next-Gen Firewall, dual distribution switches with 802.1Q trunks to Access floor switches, isolated VLANs, and redundant PoE APs.'
  },
  {
    id: 'ch-campus-02',
    title: 'Regional College Multi-Building Campus Network',
    difficulty: 'Advanced',
    category: 'Campus',
    scenario: 'Architect a high-speed fiber-optic campus backbone linking Administration, Library, Engineering Labs, and Student Dormitories with 10Gbps uplinks and redundant core routing.',
    requirements: {
      clientCapacity: '1,500+ active student and faculty endpoints',
      segmentation: ['Faculty LAN (VLAN 100)', 'Student WiFi (VLAN 200)', 'Research Labs (VLAN 300)', 'Server Farm / LMS (VLAN 400)'],
      redundancy: 'Triangular Core Mesh with OSPF Area 0 dynamic routing and redundant default gateways (HSRP/VRRP)',
      security: ['802.1X Network Access Control', 'DMZ for public web portal', 'Layer 3/4 Access Control Lists'],
      services: ['Redundant Active Directory / DNS / DHCP', 'Centralized Wireless LAN Controller (WLC)']
    },
    evaluationCriteria: {
      minDevices: 7,
      requiredTypes: ['router', 'switch', 'server', 'access_point', 'internet'],
      minVlans: 3,
      requiresFirewall: true,
      requiresRedundantLinks: true
    },
    sampleSolutionDescription: 'Hierarchical 3-tier model (Core, Distribution, Access) with 10G fiber uplinks, dual core routers running OSPF, and server farm DMZ.'
  },
  {
    id: 'ch-hospital-03',
    title: 'Critical Care Hospital & Medical IoT Infrastructure',
    difficulty: 'Expert',
    category: 'Healthcare',
    scenario: 'Design a zero-downtime medical network separating life-support patient monitors, Electronic Health Record (EHR) database servers, radiology MRI imaging, and public guest WiFi.',
    requirements: {
      clientCapacity: '500+ biomedical telemetry devices and workstations',
      segmentation: ['Biomedical Life Support (VLAN 11)', 'Radiology PACS DICOM (VLAN 22)', 'Hospital Staff EHR (VLAN 33)', 'Guest WiFi (VLAN 99)'],
      redundancy: '100% active-active dual power and dual link redundancy across all tiers',
      security: ['HIPAA Compliance isolation', 'Strict MAC authentication on medical devices', 'Encrypted TLS 1.3 across all subnets'],
      services: ['Local NTP clock synchronization', 'Real-time syslog audit logging']
    },
    evaluationCriteria: {
      minDevices: 6,
      requiredTypes: ['router', 'switch', 'firewall', 'server'],
      minVlans: 4,
      requiresFirewall: true,
      requiresRedundantLinks: true
    },
    sampleSolutionDescription: 'High-availability firewall pair, micro-segmented biomedical VLANs, strict ingress/egress ACLs, and isolated radiological imaging database servers.'
  },
  {
    id: 'ch-smb-04',
    title: 'Modern Tech Startup Small Office Network (Branch)',
    difficulty: 'Intermediate',
    category: 'SmallBusiness',
    scenario: 'Design a clean, cost-effective network for a 35-person technology startup with gigabit desktop links, cloud SaaS access, dev server sandbox, and guest access.',
    requirements: {
      clientCapacity: '35-50 laptops and smart devices',
      segmentation: ['Employee LAN (VLAN 10)', 'Dev Sandbox (VLAN 20)', 'Guest WiFi (VLAN 30)'],
      redundancy: 'Single edge router with dual WAN failover link',
      security: ['Stateful Firewall with NAT / PAT', 'Isolated Dev staging servers'],
      services: ['Cloud DNS (1.1.1.1, 8.8.8.8)', 'Gigabit PoE switch for ceiling APs']
    },
    evaluationCriteria: {
      minDevices: 4,
      requiredTypes: ['router', 'switch', 'access_point', 'pc', 'laptop'],
      minVlans: 2,
      requiresFirewall: false,
      requiresRedundantLinks: false
    },
    sampleSolutionDescription: 'Compact router/firewall gateway, 48-port PoE Gigabit switch, Dual-band WiFi 6 Access Points, and isolated VLAN pools.'
  }
];
