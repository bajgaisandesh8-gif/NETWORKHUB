import React, { useState } from 'react';
import { 
  Calculator, 
  Binary, 
  Layers, 
  Wifi, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  FileCode,
  Radar,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { calculateSubnet, calculateVLSM, analyzeIP } from '../utils/subnetCalculator';

interface ToolsPageProps {
  initialTab?: string;
  onNavigate: (page: string, meta?: any) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ initialTab = 'subnet', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Subnet State ---
  const [subnetIp, setSubnetIp] = useState<string>('192.168.10.65');
  const [subnetCidr, setSubnetCidr] = useState<number>(26);

  // --- VLSM State ---
  const [vlsmBaseIp, setVlsmBaseIp] = useState<string>('192.168.1.0');
  const [vlsmBaseCidr, setVlsmBaseCidr] = useState<number>(24);
  const [vlsmRequirements, setVlsmRequirements] = useState<Array<{ name: string; hostsNeeded: number }>>([
    { name: 'Engineering Dept', hostsNeeded: 60 },
    { name: 'Marketing & Sales', hostsNeeded: 25 },
    { name: 'Server Farm', hostsNeeded: 12 },
    { name: 'WAN Link to HQ', hostsNeeded: 2 }
  ]);

  // --- Bit Flipper State (32 bits array) ---
  const [bits, setBits] = useState<number[]>(() => {
    const str = (192).toString(2).padStart(8,'0') + 
                (168).toString(2).padStart(8,'0') + 
                (1).toString(2).padStart(8,'0') + 
                (10).toString(2).padStart(8,'0');
    return str.split('').map(Number);
  });

  // --- Bandwidth Calc State ---
  const [fileSize, setFileSize] = useState<number>(10);
  const [fileUnit, setFileUnit] = useState<'MB' | 'GB' | 'TB'>('GB');
  const [bandwidthSpeed, setBandwidthSpeed] = useState<number>(100);
  const [bandwidthUnit, setBandwidthUnit] = useState<'Mbps' | 'Gbps'>('Mbps');

  // --- WiFi Capacity State ---
  const [roomArea, setRoomArea] = useState<number>(3500);
  const [expectedClients, setExpectedClients] = useState<number>(120);

  // --- Port Reference Search State ---
  const [portQuery, setPortQuery] = useState<string>('');

  // --- Cisco Config Generator State ---
  const [cfgDeviceType, setCfgDeviceType] = useState<'router' | 'switch' | 'firewall'>('router');
  const [cfgHostname, setCfgHostname] = useState<string>('R1-CORE-GW');
  const [cfgDomain, setCfgDomain] = useState<string>('corp.netlab.local');
  const [cfgIp, setCfgIp] = useState<string>('192.168.1.1');
  const [cfgSubnet, setCfgSubnet] = useState<string>('255.255.255.0');
  const [cfgVlan, setCfgVlan] = useState<number>(10);
  const [cfgDefaultRoute, setCfgDefaultRoute] = useState<string>('10.0.0.1');
  const [cfgEnableOspf, setCfgEnableOspf] = useState<boolean>(true);
  const [cfgSshUser, setCfgSshUser] = useState<string>('admin');

  // --- Cisco Config Validator State ---
  const [pastedConfig, setPastedConfig] = useState<string>(
`hostname R1-EDGE
!
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/1
 ip address 10.0.0.2 255.255.255.252
 shutdown
!
ip route 0.0.0.0 0.0.0.0 10.0.0.1
`
  );

  // --- Simulated Scanner State ---
  const [scanSubnetInput, setScanSubnetInput] = useState<string>('192.168.1.0/24');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedHosts, setScannedHosts] = useState<Array<{ ip: string; mac: string; latency: string; hostname: string; openPorts: number[]; os: string }>>([
    { ip: '192.168.1.1', mac: '00:1B:44:11:3A:B7', latency: '0.4ms', hostname: 'gateway.local', openPorts: [22, 53, 80, 443], os: 'Cisco IOS-XE 17.3' },
    { ip: '192.168.1.10', mac: '52:54:00:12:34:56', latency: '1.2ms', hostname: 'ubuntu-srv-01', openPorts: [22, 80, 3306], os: 'Ubuntu Linux 22.04 LTS' },
    { ip: '192.168.1.15', mac: 'B8:27:EB:44:98:AA', latency: '2.1ms', hostname: 'cctv-cam-lobby', openPorts: [80, 554], os: 'Hikvision Embedded RTSP' },
    { ip: '192.168.1.20', mac: 'F0:18:98:23:44:01', latency: '0.8ms', hostname: 'ap-floor1-east', openPorts: [22, 8080], os: 'UniFi AP Wi-Fi 6' },
  ]);

  // --- PoE Budget State ---
  const [poeSwitchBudget, setPoeSwitchBudget] = useState<number>(370); // Watts (e.g. Catalyst 2960-X 24 port PoE+)
  const [poeIpPhones, setPoeIpPhones] = useState<number>(12); // ~7W each
  const [poeWifiAps, setPoeWifiAps] = useState<number>(6); // ~15W each (802.3at)
  const [poeCctvCams, setPoeCctvCams] = useState<number>(4); // ~12W each
  const [poeAccessPanels, setPoeAccessPanels] = useState<number>(2); // ~25W each (802.3bt)

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const subnetResult = calculateSubnet(subnetIp, subnetCidr);
  const vlsmResults = calculateVLSM(vlsmBaseIp, vlsmBaseCidr, vlsmRequirements);
  const ipAnalysis = analyzeIP(subnetIp);

  // Bit flipper calculations
  const octet1 = parseInt(bits.slice(0, 8).join(''), 2);
  const octet2 = parseInt(bits.slice(8, 16).join(''), 2);
  const octet3 = parseInt(bits.slice(16, 24).join(''), 2);
  const octet4 = parseInt(bits.slice(24, 32).join(''), 2);
  const decimalIpFromBits = `${octet1}.${octet2}.${octet3}.${octet4}`;
  const hexIpFromBits = `0x${octet1.toString(16).padStart(2,'0')}${octet2.toString(16).padStart(2,'0')}${octet3.toString(16).padStart(2,'0')}${octet4.toString(16).padStart(2,'0')}`.toUpperCase();

  // Bandwidth calculation
  const getSizeBytes = (size: number, unit: string) => {
    if (unit === 'TB') return size * 1024 * 1024 * 1024 * 1024;
    if (unit === 'GB') return size * 1024 * 1024 * 1024;
    return size * 1024 * 1024;
  };
  const getSpeedBps = (speed: number, unit: string) => {
    if (unit === 'Gbps') return speed * 1000 * 1000 * 1000;
    return speed * 1000 * 1000;
  };
  const totalBits = getSizeBytes(fileSize, fileUnit) * 8;
  const speedBps = getSpeedBps(bandwidthSpeed, bandwidthUnit);
  const idealSeconds = totalBits / speedBps;
  const tcpOverheadSeconds = idealSeconds / 0.85;

  const formatSeconds = (sec: number) => {
    if (sec < 60) return `${sec.toFixed(1)} seconds`;
    if (sec < 3600) return `${(sec / 60).toFixed(1)} minutes`;
    return `${(sec / 3600).toFixed(2)} hours`;
  };

  const portsData = [
    { port: 20, protocol: 'FTP Data', transport: 'TCP', desc: 'File Transfer Protocol data stream' },
    { port: 21, protocol: 'FTP Control', transport: 'TCP', desc: 'File Transfer Protocol command channel' },
    { port: 22, protocol: 'SSH / SFTP', transport: 'TCP', desc: 'Secure Shell encrypted remote login' },
    { port: 23, protocol: 'Telnet', transport: 'TCP', desc: 'Unencrypted plaintext remote terminal' },
    { port: 25, protocol: 'SMTP', transport: 'TCP', desc: 'Simple Mail Transfer Protocol mail relay' },
    { port: 53, protocol: 'DNS', transport: 'UDP / TCP', desc: 'Domain Name System name resolution' },
    { port: 67, protocol: 'DHCP Server', transport: 'UDP', desc: 'Dynamic Host Configuration Protocol server' },
    { port: 68, protocol: 'DHCP Client', transport: 'UDP', desc: 'Dynamic Host Configuration Protocol client' },
    { port: 80, protocol: 'HTTP', transport: 'TCP', desc: 'Hypertext Transfer Protocol unencrypted web' },
    { port: 110, protocol: 'POP3', transport: 'TCP', desc: 'Post Office Protocol email retrieval' },
    { port: 123, protocol: 'NTP', transport: 'UDP', desc: 'Network Time Protocol clock synchronization' },
    { port: 143, protocol: 'IMAP', transport: 'TCP', desc: 'Internet Message Access Protocol' },
    { port: 161, protocol: 'SNMP', transport: 'UDP', desc: 'Simple Network Management Protocol telemetry' },
    { port: 179, protocol: 'BGP', transport: 'TCP', desc: 'Border Gateway Protocol inter-AS routing' },
    { port: 443, protocol: 'HTTPS / TLS', transport: 'TCP', desc: 'HTTP over TLS 1.3 encrypted web' },
    { port: 514, protocol: 'Syslog', transport: 'UDP', desc: 'System event logging protocol' },
    { port: 587, protocol: 'SMTP Submission', transport: 'TCP', desc: 'Authenticated email submission with TLS' },
    { port: 3389, protocol: 'RDP', transport: 'TCP', desc: 'Microsoft Remote Desktop Protocol' },
    { port: 8080, protocol: 'HTTP-Alt / Proxy', transport: 'TCP', desc: 'Alternative web server / development port' }
  ];

  const filteredPorts = portsData.filter(p => 
    p.port.toString().includes(portQuery) ||
    p.protocol.toLowerCase().includes(portQuery.toLowerCase()) ||
    p.desc.toLowerCase().includes(portQuery.toLowerCase())
  );

  // Generate Cisco Config Script
  const generateCiscoConfig = () => {
    let lines = [
      `! =======================================================`,
      `! NET-LAB Generated Configuration for ${cfgHostname}`,
      `! Device Type: ${cfgDeviceType.toUpperCase()} | Domain: ${cfgDomain}`,
      `! =======================================================`,
      `service password-encryption`,
      `hostname ${cfgHostname}`,
      `ip domain-name ${cfgDomain}`,
      `crypto key generate rsa modulus 2048`,
      `username ${cfgSshUser} privilege 15 secret Cisco123!`,
      `!`,
      `line vty 0 4`,
      ` transport input ssh`,
      ` login local`,
      ` exec-timeout 15 0`,
      `!`,
    ];

    if (cfgDeviceType === 'router') {
      lines.push(
        `interface GigabitEthernet0/0/0`,
        ` description LAN Gateway for Subnet`,
        ` ip address ${cfgIp} ${cfgSubnet}`,
        ` no shutdown`,
        `!`,
        `interface GigabitEthernet0/0/1`,
        ` description Uplink WAN Link to ISP`,
        ` ip address 10.0.0.2 255.255.255.252`,
        ` no shutdown`,
        `!`,
        `ip route 0.0.0.0 0.0.0.0 ${cfgDefaultRoute}`
      );
      if (cfgEnableOspf) {
        lines.push(
          `!`,
          `router ospf 1`,
          ` router-id 1.1.1.1`,
          ` network ${cfgIp.split('.').slice(0,3).join('.')}.0 0.0.0.255 area 0`
        );
      }
    } else if (cfgDeviceType === 'switch') {
      lines.push(
        `vlan ${cfgVlan}`,
        ` name DATA_VLAN_${cfgVlan}`,
        `!`,
        `interface Vlan${cfgVlan}`,
        ` description Switch Management SVI`,
        ` ip address ${cfgIp} ${cfgSubnet}`,
        ` no shutdown`,
        `!`,
        `interface range GigabitEthernet0/1 - 12`,
        ` description User Access Ports`,
        ` switchport mode access`,
        ` switchport access vlan ${cfgVlan}`,
        ` spanning-tree portfast`,
        `!`,
        `interface GigabitEthernet0/24`,
        ` description 802.1Q Core Trunk Uplink`,
        ` switchport mode trunk`,
        ` switchport trunk allowed vlan all`,
        `!`,
        `ip default-gateway ${cfgDefaultRoute}`
      );
    } else {
      lines.push(
        `interface GigabitEthernet1/1`,
        ` nameif inside`,
        ` security-level 100`,
        ` ip address ${cfgIp} ${cfgSubnet}`,
        ` no shutdown`,
        `!`,
        `interface GigabitEthernet1/2`,
        ` nameif outside`,
        ` security-level 0`,
        ` ip address 203.0.113.2 255.255.255.248`,
        ` no shutdown`,
        `!`,
        `route outside 0.0.0.0 0.0.0.0 ${cfgDefaultRoute} 1`
      );
    }

    lines.push(`end`, `write memory`);
    return lines.join('\n');
  };

  // Validate Pasted Cisco Config
  const validateCiscoConfig = () => {
    const findings: Array<{ line: number; type: 'error' | 'warning' | 'info'; msg: string }> = [];
    const rawLines = pastedConfig.split('\n');

    let hasHostname = false;
    let hasShutdown = false;
    let hasIp = false;
    let hasDefaultRoute = false;

    rawLines.forEach((l, idx) => {
      const trimmed = l.trim().toLowerCase();
      if (trimmed.startsWith('hostname')) hasHostname = true;
      if (trimmed === 'shutdown') {
        hasShutdown = true;
        findings.push({ line: idx + 1, type: 'warning', msg: 'Interface is in "shutdown" state (Administratively disabled).' });
      }
      if (trimmed.startsWith('ip address')) {
        hasIp = true;
        const parts = trimmed.split(/\s+/);
        if (parts.length < 4) {
          findings.push({ line: idx + 1, type: 'error', msg: 'Incomplete "ip address" syntax: missing subnet mask.' });
        }
      }
      if (trimmed.startsWith('ip route 0.0.0.0 0.0.0.0')) hasDefaultRoute = true;
      if (trimmed.startsWith('transport input telnet')) {
        findings.push({ line: idx + 1, type: 'error', msg: 'Security Flaw: Telnet sends credentials in plaintext. Use "transport input ssh".' });
      }
    });

    if (!hasHostname) findings.push({ line: 1, type: 'warning', msg: 'No "hostname" defined. Device will use default "Switch" or "Router".' });
    if (!hasIp) findings.push({ line: 1, type: 'error', msg: 'No IPv4 addresses configured on any interface.' });
    if (!hasDefaultRoute) findings.push({ line: 1, type: 'info', msg: 'No default static route (0.0.0.0 0.0.0.0) found for egress WAN forwarding.' });

    return findings;
  };

  const validationResults = validateCiscoConfig();

  // Run Simulated Scan
  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // PoE Calculation
  const totalPoeWatts = (poeIpPhones * 7.5) + (poeWifiAps * 15.4) + (poeCctvCams * 12.0) + (poeAccessPanels * 25.5);
  const poeRemaining = poeSwitchBudget - totalPoeWatts;
  const poeUsagePercent = Math.min(100, Math.round((totalPoeWatts / poeSwitchBudget) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Calculator size={22} className="text-cyan-400" />
            <span>Network Engineering Tools & Calculators</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Precision utilities for IPv4/VLSM subnetting, 32-bit binary arithmetic, Cisco IOS config generation, and PoE capacity planning.
          </p>
        </div>

        <button
          onClick={() => onNavigate('topology')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
        >
          <span>Open Topology Lab</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
        {[
          { id: 'subnet', label: 'IPv4 Subnet Calculator', icon: Calculator },
          { id: 'vlsm', label: 'VLSM Multi-Subnet Planner', icon: Layers },
          { id: 'flipper', label: '32-Bit Binary Flipper', icon: Binary },
          { id: 'config', label: 'Cisco IOS Config Generator', icon: FileCode },
          { id: 'scanner', label: 'Simulated Network Scanner', icon: Radar },
          { id: 'poe', label: 'PoE & Power Budget Planner', icon: Zap },
          { id: 'bandwidth', label: 'Bandwidth & Transfer Time', icon: Clock },
          { id: 'wifi', label: 'WiFi Capacity Planner', icon: Wifi },
          { id: 'ports', label: 'Port Reference Catalog', icon: Search }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition font-medium ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUBNET CALCULATOR */}
      {activeTab === 'subnet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
          {/* Left Inputs */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Subnet Input Parameters</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase">IPv4 Address</label>
              <input
                type="text"
                value={subnetIp}
                onChange={(e) => setSubnetIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                <span>CIDR Prefix Length</span>
                <span className="text-cyan-400 font-bold">/{subnetCidr}</span>
              </div>
              <input
                type="range"
                min={8}
                max={30}
                value={subnetCidr}
                onChange={(e) => setSubnetCidr(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>/8 (Class A)</span>
                <span>/16 (Class B)</span>
                <span>/24 (Class C)</span>
                <span>/30 (P2P WAN)</span>
              </div>
            </div>

            {/* Quick Class Analysis */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase">Address Class & Scope</div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60">Class {ipAnalysis.class}</span>
                <span className={`px-2 py-0.5 rounded font-bold border ${ipAnalysis.isPrivate ? 'bg-purple-950 text-purple-400 border-purple-800/60' : 'bg-emerald-950 text-emerald-400 border-emerald-800/60'}`}>
                  {ipAnalysis.scope}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans pt-1">
                {ipAnalysis.isPrivate ? 'RFC 1918 Private range. Non-routable on public internet without NAT.' : 'Public globally routable IPv4 address.'}
              </p>
            </div>
          </div>

          {/* Right Results Breakdown */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Calculated Subnet Architecture</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Network ID</div>
                  <div className="text-sm font-bold text-cyan-400">{subnetResult.networkAddress}</div>
                </div>
                <button onClick={() => copyToClipboard('net', subnetResult.networkAddress)} className="text-slate-500 hover:text-white">
                  {copiedKey === 'net' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Broadcast Address</div>
                  <div className="text-sm font-bold text-slate-200">{subnetResult.broadcastAddress}</div>
                </div>
                <button onClick={() => copyToClipboard('bc', subnetResult.broadcastAddress)} className="text-slate-500 hover:text-white">
                  {copiedKey === 'bc' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Usable Host Range</div>
                  <div className="text-sm font-bold text-emerald-400">{subnetResult.firstUsableIp} – {subnetResult.lastUsableIp}</div>
                </div>
                <button onClick={() => copyToClipboard('range', `${subnetResult.firstUsableIp} - ${subnetResult.lastUsableIp}`)} className="text-slate-500 hover:text-white">
                  {copiedKey === 'range' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Usable Host Capacity</div>
                  <div className="text-sm font-bold text-indigo-400">{subnetResult.usableHosts.toLocaleString()} hosts</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Subnet Mask (DDN)</div>
                  <div className="text-sm font-bold text-slate-200">{subnetResult.subnetMask}</div>
                </div>
                <button onClick={() => copyToClipboard('mask', subnetResult.subnetMask)} className="text-slate-500 hover:text-white">
                  {copiedKey === 'mask' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Wildcard Mask (ACLs / OSPF)</div>
                  <div className="text-sm font-bold text-amber-400">{subnetResult.wildcardMask}</div>
                </div>
                <button onClick={() => copyToClipboard('wild', subnetResult.wildcardMask)} className="text-slate-500 hover:text-white">
                  {copiedKey === 'wild' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Binary Visualization */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase">32-Bit Binary Mask Representation</div>
              <div className="text-xs font-mono text-cyan-300 tracking-wider break-all">
                {subnetResult.binaryMask}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VLSM PLANNER */}
      {activeTab === 'vlsm' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Variable-Length Subnet Masking (VLSM) Planner</h3>
              <p className="text-slate-400 text-xs mt-1">
                Optimally segments IP address space by host requirement without wasting unallocated addresses.
              </p>
            </div>
            <button
              onClick={() => setVlsmRequirements([...vlsmRequirements, { name: `Subnet ${vlsmRequirements.length + 1}`, hostsNeeded: 10 }])}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold self-start"
            >
              <Plus size={14} />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase">Major Base Network</label>
              <input
                type="text"
                value={vlsmBaseIp}
                onChange={(e) => setVlsmBaseIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase">Major Prefix Length</label>
              <input
                type="number"
                value={vlsmBaseCidr}
                onChange={(e) => setVlsmBaseCidr(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                  <th className="py-2">Department / Subnet</th>
                  <th>Required Hosts</th>
                  <th>Allocated CIDR</th>
                  <th>Network ID</th>
                  <th>Subnet Mask</th>
                  <th>Usable Range</th>
                  <th>Broadcast</th>
                  <th>Wasted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vlsmResults.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-950/50 transition">
                    <td className="py-2.5 font-bold text-white">{r.name}</td>
                    <td>{r.hostsNeeded}</td>
                    <td className="text-emerald-400 font-bold">/{r.cidr}</td>
                    <td className="text-cyan-400">{r.networkAddress}</td>
                    <td className="text-slate-400">{r.subnetMask}</td>
                    <td className="text-cyan-300">{r.firstUsableIp} – {r.lastUsableIp}</td>
                    <td className="text-slate-300">{r.broadcastAddress}</td>
                    <td className="text-slate-500">{r.wastedHosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CISCO IOS CONFIG GENERATOR & VALIDATOR */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          
          {/* Generator Column */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <FileCode size={16} className="text-cyan-400" />
              <span>Cisco IOS Config Generator</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Device Role</label>
                <select
                  value={cfgDeviceType}
                  onChange={(e) => setCfgDeviceType(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 capitalize"
                >
                  <option value="router">Core Router (IOS-XE)</option>
                  <option value="switch">L2/L3 Catalyst Switch</option>
                  <option value="firewall">ASA / FTD Firewall</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Hostname</label>
                <input
                  type="text"
                  value={cfgHostname}
                  onChange={(e) => setCfgHostname(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Primary Interface IP</label>
                <input
                  type="text"
                  value={cfgIp}
                  onChange={(e) => setCfgIp(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Subnet Mask</label>
                <input
                  type="text"
                  value={cfgSubnet}
                  onChange={(e) => setCfgSubnet(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">Default Route Gateway</label>
                <input
                  type="text"
                  value={cfgDefaultRoute}
                  onChange={(e) => setCfgDefaultRoute(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase">VLAN ID (If Switch)</label>
                <input
                  type="number"
                  value={cfgVlan}
                  onChange={(e) => setCfgVlan(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-purple-300"
                />
              </div>
            </div>

            {/* Generated Output */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase">
                <span>Generated Cisco Running-Config</span>
                <button
                  onClick={() => copyToClipboard('cisco', generateCiscoConfig())}
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  {copiedKey === 'cisco' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === 'cisco' ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                {generateCiscoConfig()}
              </pre>
            </div>
          </div>

          {/* Validator Column */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Cisco Config Syntax & Security Validator</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase">Paste Running Configuration</label>
              <textarea
                rows={7}
                value={pastedConfig}
                onChange={(e) => setPastedConfig(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Audit Feedback & Rule Violations</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {validationResults.map((v, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-[11px] flex items-start space-x-2 ${
                    v.type === 'error' ? 'bg-red-950/30 border-red-800/50 text-red-300' :
                    v.type === 'warning' ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                    'bg-cyan-950/30 border-cyan-800/50 text-cyan-300'
                  }`}>
                    <span className="font-bold uppercase shrink-0">Line {v.line}:</span>
                    <span>{v.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATED NETWORK SCANNER */}
      {activeTab === 'scanner' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Radar size={16} className="text-cyan-400" />
                <span>Simulated Network & Port Scanner (Lab Only)</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Safely probes the educational simulated subnet to identify active hosts, MAC addresses, operating systems, and open TCP/UDP services.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={scanSubnetInput}
                onChange={(e) => setScanSubnetInput(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-cyan-300 font-bold w-40"
              />
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold transition flex items-center space-x-1"
              >
                <Radar size={14} className={isScanning ? 'animate-spin' : ''} />
                <span>{isScanning ? 'Scanning...' : 'Scan Subnet'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                  <th className="py-2">IP Address</th>
                  <th>Hostname</th>
                  <th>MAC Address</th>
                  <th>RTT Latency</th>
                  <th>Discovered OS</th>
                  <th>Open Port Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scannedHosts.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-950/50 transition">
                    <td className="py-3 font-bold text-cyan-400">{h.ip}</td>
                    <td className="text-white font-semibold">{h.hostname}</td>
                    <td className="text-slate-400">{h.mac}</td>
                    <td className="text-emerald-400">{h.latency}</td>
                    <td className="text-slate-300">{h.os}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {h.openPorts.map(p => (
                          <span key={p} className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px]">
                            :{p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: POE POWER & SWITCH BUDGET PLANNER */}
      {activeTab === 'poe' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Zap size={16} className="text-amber-400" />
                <span>Power over Ethernet (PoE / PoE+ / PoE++) Budget Planner</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Calculates power supply wattage allocation for IP phones (802.3af), Wi-Fi 6 APs (802.3at), PTZ cameras, and IoT door controllers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[10px] text-slate-500 uppercase">Switch PoE Budget</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={poeSwitchBudget}
                  onChange={(e) => setPoeSwitchBudget(parseInt(e.target.value, 10) || 370)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white font-bold"
                />
                <span className="text-slate-400">Watts</span>
              </div>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[10px] text-slate-500 uppercase">VoIP Phones (802.3af ~7.5W)</label>
              <input
                type="number"
                value={poeIpPhones}
                onChange={(e) => setPoeIpPhones(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-cyan-300 font-bold"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[10px] text-slate-500 uppercase">Wi-Fi 6 APs (802.3at ~15.4W)</label>
              <input
                type="number"
                value={poeWifiAps}
                onChange={(e) => setPoeWifiAps(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-cyan-300 font-bold"
              />
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[10px] text-slate-500 uppercase">CCTV Cameras (~12W)</label>
              <input
                type="number"
                value={poeCctvCams}
                onChange={(e) => setPoeCctvCams(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-cyan-300 font-bold"
              />
            </div>
          </div>

          {/* Budget Health Bar */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">Allocated PoE Power: {totalPoeWatts.toFixed(1)}W / {poeSwitchBudget}W</span>
              <span className={`font-bold ${poeUsagePercent > 90 ? 'text-red-400' : 'text-emerald-400'}`}>{poeUsagePercent}% Used</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${poeUsagePercent > 90 ? 'bg-red-500' : poeUsagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${poeUsagePercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="text-slate-300">
                • <strong>Remaining Headroom:</strong> {poeRemaining > 0 ? `${poeRemaining.toFixed(1)} Watts` : 'OVER BUDGET (Switch will shutdown ports)'}
              </div>
              <div className="text-slate-400">
                • <strong>Power Standard:</strong> 802.3af (15.4W max), 802.3at PoE+ (30W max), 802.3bt 4PPoE (60W-90W max)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BIT FLIPPER */}
      {activeTab === 'flipper' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div>
            <h3 className="font-bold text-white text-sm">32-Bit IPv4 Interactive Bit Flipper</h3>
            <p className="text-slate-400 text-xs mt-1">
              Click any bit (0/1) to watch real-time binary to decimal octet and hexadecimal translation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(octetIdx => {
              const octetBits = bits.slice(octetIdx * 8, (octetIdx + 1) * 8);
              const decimalVal = parseInt(octetBits.join(''), 2);

              return (
                <div key={octetIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-center">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase">
                    <span>Octet {octetIdx + 1}</span>
                    <span className="text-cyan-400 font-bold text-sm">{decimalVal}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {octetBits.map((bit, bitIdx) => {
                      const absoluteIdx = octetIdx * 8 + bitIdx;
                      return (
                        <button
                          key={bitIdx}
                          onClick={() => {
                            const copy = [...bits];
                            copy[absoluteIdx] = copy[absoluteIdx] === 1 ? 0 : 1;
                            setBits(copy);
                          }}
                          className={`py-2 rounded-lg font-mono font-bold transition text-sm ${
                            bit === 1 
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                              : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {bit}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Dotted Decimal Format</div>
              <div className="text-lg font-bold text-white">{decimalIpFromBits}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Hexadecimal Integer</div>
              <div className="text-lg font-bold text-emerald-400">{hexIpFromBits}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Active 1-Bits Count</div>
              <div className="text-lg font-bold text-cyan-400">{bits.filter(b => b === 1).length} / 32 bits</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: BANDWIDTH & TRANSFER TIME */}
      {activeTab === 'bandwidth' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-white text-sm">Bandwidth & Data Transfer Time Calculator</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase">File / Dataset Size</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min={1}
                  value={fileSize}
                  onChange={(e) => setFileSize(parseFloat(e.target.value) || 1)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
                <select
                  value={fileUnit}
                  onChange={(e) => setFileUnit(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300"
                >
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                  <option value="TB">TB</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase">Network Throughput Speed</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min={1}
                  value={bandwidthSpeed}
                  onChange={(e) => setBandwidthSpeed(parseFloat(e.target.value) || 1)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                />
                <select
                  value={bandwidthUnit}
                  onChange={(e) => setBandwidthUnit(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300"
                >
                  <option value="Mbps">Mbps</option>
                  <option value="Gbps">Gbps</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Theoretical (100% Wire Rate)</div>
              <div className="text-xl font-extrabold text-cyan-400">{formatSeconds(idealSeconds)}</div>
            </div>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Real-World (TCP Overhead ~85%)</div>
              <div className="text-xl font-extrabold text-emerald-400">{formatSeconds(tcpOverheadSeconds)}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: WIFI ESTIMATOR */}
      {activeTab === 'wifi' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-white text-sm">Enterprise WiFi Capacity & AP Density Estimator</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase">Floor Area (Sq Feet)</label>
              <input
                type="number"
                value={roomArea}
                onChange={(e) => setRoomArea(parseInt(e.target.value, 10) || 1000)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase">Concurrent Active Client Devices</label>
              <input
                type="number"
                value={expectedClients}
                onChange={(e) => setExpectedClients(parseInt(e.target.value, 10) || 10)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Recommended Access Points</div>
              <div className="text-2xl font-bold text-white">{Math.max(1, Math.ceil(Math.max(roomArea / 2500, expectedClients / 35)))} APs</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Recommended Standard</div>
              <div className="text-sm font-bold text-cyan-400">Wi-Fi 6 / 6E (802.11ax)</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Channel Bandwidth</div>
              <div className="text-sm font-bold text-emerald-400">20/40 MHz (Avoid Co-Channel)</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: PORT REFERENCE TABLE */}
      {activeTab === 'ports' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-white text-sm">Common Network Ports Reference</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search port number, protocol, or use case..."
                value={portQuery}
                onChange={(e) => setPortQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                  <th className="py-2">Port</th>
                  <th>Protocol</th>
                  <th>Transport</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPorts.map(p => (
                  <tr key={p.port} className="hover:bg-slate-950/50 transition">
                    <td className="py-2 font-bold text-cyan-400">{p.port}</td>
                    <td className="font-semibold text-white">{p.protocol}</td>
                    <td className="text-slate-400">{p.transport}</td>
                    <td className="text-slate-300 font-sans text-xs">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
