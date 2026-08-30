export type DeviceType = 
  | 'pc' 
  | 'laptop' 
  | 'server' 
  | 'router' 
  | 'switch' 
  | 'access_point' 
  | 'firewall' 
  | 'printer' 
  | 'camera' 
  | 'iot' 
  | 'internet' 
  | 'cloud';

export type InterfaceStatus = 'up' | 'down';
export type LinkMedium = 'ethernet' | 'fiber' | 'wireless' | 'serial';
export type SecurityZone = 'Internal' | 'DMZ' | 'Guest' | 'Management' | 'Untrusted';
export type ProtocolType = 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | 'DHCP' | 'ARP' | 'FTP' | 'TELNET';

export interface NetworkInterface {
  id: string;
  name: string; // e.g. GigabitEthernet0/0, FastEthernet0/1, eth0, wlan0, s0/0
  ip?: string;
  subnetMask?: string;
  mac?: string;
  status: InterfaceStatus;
  vlan?: number;
  description?: string;
  speedMbps?: number;
  duplex?: 'full' | 'half' | 'auto';
  connectedTo?: string; // Connection ID
}

export interface RoutingTableEntry {
  destination: string;
  subnetMask: string;
  cidr?: number;
  nextHop: string;
  interface: string;
  metric?: number;
  adminDistance?: number;
  type: 'connected' | 'static' | 'ospf' | 'default';
}

export interface ArpTableEntry {
  ip: string;
  mac: string;
  interface: string;
  type: 'dynamic' | 'static';
  ageSeconds?: number;
}

export interface DnsRecord {
  id: string;
  domain: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'PTR';
  value: string;
  ttl: number;
}

export interface DhcpScope {
  id: string;
  name: string;
  network: string;
  subnetMask: string;
  cidr: number;
  gateway: string;
  dnsServer: string;
  startIp: string;
  endIp: string;
  leaseDurationHours: number;
  reservedIps?: string[];
  activeLeases?: {
    ip: string;
    mac: string;
    hostname: string;
    leaseExpires: string;
  }[];
}

export interface FirewallRule {
  id: string;
  priority: number;
  name: string;
  sourceSubnet: string; // e.g. 192.168.10.0/24 or ANY
  destSubnet: string;   // e.g. 192.168.20.0/24 or ANY
  protocol: 'ANY' | 'TCP' | 'UDP' | 'ICMP';
  portRange?: string;   // e.g. 80, 443, 22 or ANY
  action: 'ALLOW' | 'DENY';
  description?: string;
  enabled: boolean;
}

export interface NetworkDevice {
  id: string;
  name: string;
  hostname?: string;
  type: DeviceType;
  x: number;
  y: number;
  ip?: string;
  subnetMask?: string;
  gateway?: string;
  dns?: string;
  mac?: string;
  vlan?: number;
  status: 'up' | 'down' | 'warning';
  manufacturer?: string;
  model?: string;
  location?: string;
  notes?: string;
  interfaces?: NetworkInterface[];
  services?: {
    dhcpServer?: boolean;
    dhcpScope?: DhcpScope;
    dnsServer?: boolean;
    dnsRecords?: DnsRecord[];
    webServer?: boolean;
    firewallEnabled?: boolean;
    firewallRules?: FirewallRule[];
    blockedPorts?: number[];
    ospfEnabled?: boolean;
    ospfArea?: number;
    ospfProcessId?: number;
  };
  routingTable?: RoutingTableEntry[];
  arpTable?: ArpTableEntry[];
}

export interface NetworkConnection {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceInterface?: string;
  targetInterface?: string;
  type: LinkMedium;
  status: 'up' | 'down' | 'degraded';
  bandwidthMbps?: number;
  packetLossPercent?: number;
  latencyMs?: number;
}

export interface VlanDefinition {
  id: string;
  vlanId: number;
  name: string;
  purpose: string;
  subnet: string;
  cidr: number;
  gateway: string;
  dhcpRange: string;
  securityZone: SecurityZone;
  taggedPorts?: string[];
  untaggedPorts?: string[];
  description?: string;
}

export interface IpamAllocation {
  id: string;
  ip: string;
  deviceId?: string;
  hostname?: string;
  deviceType?: DeviceType;
  mac?: string;
  status: 'used' | 'available' | 'reserved';
  purpose?: string;
  vlanId?: number;
  assignedAt?: string;
  notes?: string;
}

export interface IpamNetwork {
  id: string;
  name: string;
  vlanId?: number;
  networkAddress: string;
  cidr: number;
  subnetMask: string;
  gateway: string;
  broadcastAddress: string;
  usableStart: string;
  usableEnd: string;
  totalHosts: number;
  usableHosts: number;
  usedHosts: number;
  dhcpStart: string;
  dhcpEnd: string;
  securityZone: SecurityZone;
  allocations: IpamAllocation[];
  description?: string;
}

export interface DeviceInventoryItem {
  id: string;
  name: string;
  hostname: string;
  deviceType: DeviceType;
  manufacturer: string;
  model: string;
  managementIp: string;
  macAddress: string;
  location: string;
  vlan?: number;
  status: 'up' | 'down' | 'warning';
  serialNumber?: string;
  rackUnit?: string;
  purchaseDate?: string;
  notes?: string;
}

export interface NetworkTopology {
  id: string;
  name: string;
  description?: string;
  category?: string;
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  vlans?: VlanDefinition[];
  createdAt: string;
  updatedAt: string;
  version?: number;
  userId?: string;
}

export interface PacketHop {
  hopNumber: number;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  action: string;
  explanation: string;
  details?: string;
  whyExplanation?: string;
  layer: 'Application' | 'Transport' | 'Network' | 'Data Link' | 'Physical';
  sourceIp: string;
  destIp: string;
  sourceMac?: string;
  destMac?: string;
  protocol: string;
  ttl: number;
  port?: number;
  status: 'success' | 'dropped' | 'forwarded';
  dropReason?: string;
  layerData?: {
    l2?: { srcMac: string; destMac: string; vlanId?: number; frameType?: string };
    l3?: { srcIp: string; destIp: string; ttl: number; protocol: string };
    l4?: { srcPort: number; destPort: number; tcpFlags?: string };
    l7?: { protocol: string; messageType: string };
  };
}

export interface PacketTraceResult {
  success: boolean;
  sourceDevice: string;
  destinationDevice: string;
  totalHops: number;
  hops: PacketHop[];
  summary: string;
  failureReason?: string;
  troubleshootingTip?: string;
  arpSequence?: {
    step: number;
    description: string;
    source: string;
    target: string;
    type: 'request' | 'reply';
  }[];
}

export interface DiagnosticIssue {
  id: string;
  title?: string;
  layer?: 'Physical' | 'Data Link' | 'Network' | 'Transport' | 'Application' | string;
  type: 'physical' | 'ip_config' | 'gateway' | 'arp' | 'vlan' | 'routing' | 'firewall' | 'dns' | 'duplicate_ip';
  severity: 'critical' | 'warning' | 'info';
  affectedDevices: string[];
  likelyCause: string;
  evidence: string;
  technicalEvidence?: string;
  howToFix: string;
  fixRecommendation?: string;
  whyThisHappens: string;
  explanation?: string;
  remediationAction?: () => void;
}

export interface DiagnosticReport {
  healthy: boolean;
  overallHealthy?: boolean;
  issues: DiagnosticIssue[];
  checksPerformed: string[];
  evaluatedAt: string;
  timeline?: {
    layerNumber: number;
    layerName: string;
    status: 'pass' | 'fail' | 'warn';
    summary: string;
  }[];
}

export interface SubnetCalculationResult {
  ip: string;
  cidr: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  usableHosts: number;
  totalHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'Classless';
  isPrivate: boolean;
  ipBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
  hexMask: string;
  ipv6Equivalent?: string;
  binary?: {
    ip: string;
    mask: string;
  };
}

export interface VLSMSubnetRequest {
  name: string;
  hostsNeeded: number;
}

export interface VLSMSubnetResult {
  name: string;
  hostsNeeded: number;
  allocatedHosts: number;
  cidr: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  usableRange: string;
  firstUsableIp?: string;
  lastUsableIp?: string;
  wastedHosts?: number;
}

export interface ProtocolInfo {
  id: string;
  name: string;
  acronym?: string;
  fullName: string;
  rfc?: string | number;
  layer: 'Application' | 'Presentation' | 'Session' | 'Transport' | 'Network' | 'Data Link' | 'Physical' | string;
  transport?: string;
  transportProtocol?: 'TCP' | 'UDP' | 'IP' | 'N/A' | string;
  port?: number | string;
  description: string;
  function?: string;
  headerFields: { name?: string; field?: string; sizeBits?: number; description: string }[];
  realWorldUse: string;
  securityConsiderations: string[] | string;
  troubleshootingTips: string[];
  packetConcept: string;
  wiresharkExample?: string;
}

export interface PracticalLab {
  id: string;
  labNumber: number;
  title: string;
  category: 'Fundamentals' | 'Addressing' | 'Services' | 'Switching' | 'Routing' | 'Security' | 'Design' | string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  objective: string;
  scenario: string;
  requiredKnowledge: string[];
  starterTopology: Partial<NetworkTopology>;
  tasks: {
    id: string;
    instruction?: string;
    description?: string;
    hint?: string;
    cliHint?: string;
    validationKey: string;
  }[];
  expectedResult: string;
  explanation: string;
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  topic: 'Subnetting' | 'OSI Model' | 'Routing' | 'Switching' | 'Troubleshooting' | 'Security' | 'Protocols' | string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionType: 'multiple_choice' | 'true_false' | 'scenario' | 'subnet_calc';
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface UserProgress {
  userId: string;
  completedLabs: string[];
  labScores: Record<string, number>;
  quizScores: Record<string, { score: number; total: number; date: string }>;
  weakTopics: string[];
  learningStreakDays: number;
  lastActive: string;
  unlockedSkills: string[];
  earnedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'lab' | 'quiz' | 'topology' | 'tools';
}

export interface ProjectPlanningRequirements {
  organizationName: string;
  campusFloors: number;
  totalUsers: number;
  departments: string[];
  internetBandwidthMbps: number;
  ispRedundancy: boolean;
  serversNeeded: number;
  wifiAccessPoints: number;
  cctvCameras: number;
  voipPhones: number;
  guestNetwork: boolean;
  iotDevices: number;
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  name: string;
  timestamp: string;
  description: string;
  topology: NetworkTopology;
  ipamNetworks?: IpamNetwork[];
  vlans?: VlanDefinition[];
  inventory?: DeviceInventoryItem[];
}

export interface UserProject {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Building' | 'Testing' | 'Completed';
  topology: NetworkTopology;
  planning?: ProjectPlanningRequirements;
  ipamNetworks?: IpamNetwork[];
  vlans?: VlanDefinition[];
  inventory?: DeviceInventoryItem[];
  versions?: ProjectVersion[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignEvaluationResult {
  score: number;
  totalScore?: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback?: string[];
  strengths: string[];
  weaknesses: string[];
  categoryScores?: Record<string, { score: number; max: number }>;
  breakdown?: {
    connectivity: number;
    redundancy: number;
    addressing: number;
    scalability: number;
    security: number;
  };
  recommendations: string[];
}

export interface NetworkScoreAudit {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  categories: {
    name: string;
    score: number;
    maxScore: number;
    weight: number;
    findings: string[];
  }[];
  criticalFindings: string[];
  warnings: string[];
  passedChecks: string[];
  executiveSummary: string;
}

export interface CapacityCalculationResult {
  totalBandwidthNeededMbps: number;
  cctvBandwidthMbps: number;
  voipBandwidthMbps: number;
  userAccessBandwidthMbps: number;
  recommendedInternetPlan: string;
  poePowerWatts: number;
  wifiApCount: number;
  switchPortCount: number;
  fileTransferTimes: {
    size: string;
    timeFastEthernet: string;
    timeGigabit: string;
    time10Gigabit: string;
  }[];
}
