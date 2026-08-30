import React, { useState } from 'react';
import { Layers, Shield, Cpu, Activity, AlertTriangle, ArrowRight, BookOpen, Terminal } from 'lucide-react';

interface OsiModelPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const OsiModelPage: React.FC<OsiModelPageProps> = ({ onNavigate }) => {
  const [selectedLayer, setSelectedLayer] = useState<number>(3); // Layer 3 by default

  const osiLayers = [
    {
      number: 7,
      name: 'Application Layer',
      tcpEquivalent: 'Application',
      pdu: 'Data / Messages',
      color: 'from-pink-600 to-rose-600',
      border: 'border-pink-500/40',
      bg: 'bg-pink-950/30',
      protocols: ['HTTP / HTTPS', 'DNS', 'DHCP', 'SSH', 'FTP', 'SMTP', 'BGP', 'SNMP'],
      hardware: ['Host Workstations', 'Web Servers', 'Application Proxies', 'WAF (Layer 7 Firewall)'],
      functionSummary: 'Provides network services directly to user applications and processes. Standardizes API protocols for data exchange.',
      symptoms: ['HTTP 404/500 errors', 'SSL certificate expired/mismatch', 'DNS NXDOMAIN lookup failures', 'Application timeout'],
      troubleshootingTools: ['curl -v', 'dig / nslookup', 'openssl s_client', 'Wireshark HTTP stream follow']
    },
    {
      number: 6,
      name: 'Presentation Layer',
      tcpEquivalent: 'Application',
      pdu: 'Formatted Data',
      color: 'from-purple-600 to-indigo-600',
      border: 'border-purple-500/40',
      bg: 'bg-purple-950/30',
      protocols: ['TLS 1.3 / SSL', 'JPEG / PNG', 'ASCII / UTF-8', 'GZIP Compression'],
      hardware: ['TLS Offloader / Load Balancers', 'Operating System Cryptographic Subsystems'],
      functionSummary: 'Data translation, encryption, compression, and character syntax formatting (e.g. JSON/ASCII to binary).',
      symptoms: ['Cipher suite mismatch', 'TLS Handshake Failure', 'Corrupted unreadable binary streams'],
      troubleshootingTools: ['openssl ciphers', 'Wireshark TLS Client Hello inspection']
    },
    {
      number: 5,
      name: 'Session Layer',
      tcpEquivalent: 'Application',
      pdu: 'Session Messages',
      color: 'from-indigo-600 to-blue-600',
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-950/30',
      protocols: ['RPC (Remote Procedure Call)', 'NetBIOS', 'PPTP', 'SOCKS5 Proxy'],
      hardware: ['Session Border Controllers', 'Stateful Gateways'],
      functionSummary: 'Establishes, manages, checkpoints, and terminates long-lived conversational communication sessions between endpoints.',
      symptoms: ['Premature session disconnects', 'Keep-alive timeout teardowns', 'RPC server unavailable'],
      troubleshootingTools: ['netstat -an', 'ss -s', 'Keep-alive telemetry inspection']
    },
    {
      number: 4,
      name: 'Transport Layer',
      tcpEquivalent: 'Transport (Host-to-Host)',
      pdu: 'Segments (TCP) / Datagrams (UDP)',
      color: 'from-blue-600 to-cyan-600',
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/30',
      protocols: ['TCP (Transmission Control Protocol)', 'UDP (User Datagram Protocol)', 'QUIC', 'SCTP'],
      hardware: ['Stateful Firewalls (Layer 4)', 'L4 Load Balancers (HAProxy, F5)', 'Operating System TCP Stacks'],
      functionSummary: 'Provides end-to-end process-to-process communication, port multiplexing (0-65535), reliability, flow control (windowing), and congestion handling.',
      symptoms: ['TCP SYN flood exhaustion', 'Connection Refused (RST packet received)', 'High retransmission rates', 'Port closed'],
      troubleshootingTools: ['nc -zv (netcat)', 'telnet <host> <port>', 'nmap -sS', 'Wireshark TCP stream analysis']
    },
    {
      number: 3,
      name: 'Network Layer',
      tcpEquivalent: 'Internet (IP)',
      pdu: 'Packets',
      color: 'from-cyan-600 to-teal-600',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/30',
      protocols: ['IPv4', 'IPv6', 'ICMP (Ping)', 'OSPF', 'BGP', 'EIGRP', 'IPsec'],
      hardware: ['Routers', 'Layer 3 Switches', 'Next-Gen Perimeter Firewalls'],
      functionSummary: 'Logical addressing, routing across disparate networks, path determination, and TTL hop-count loop prevention.',
      symptoms: ['Destination Host Unreachable', 'TTL Expired in Transit (Routing loop)', 'Subnet mask mismatch', 'Wrong Default Gateway'],
      troubleshootingTools: ['ping', 'traceroute / tracert', 'ip route show / route print', 'ipconfig / ifconfig']
    },
    {
      number: 2,
      name: 'Data Link Layer',
      tcpEquivalent: 'Network Access / Link',
      pdu: 'Frames',
      color: 'from-teal-600 to-emerald-600',
      border: 'border-teal-500/40',
      bg: 'bg-teal-950/30',
      protocols: ['Ethernet (IEEE 802.3)', 'Wi-Fi (IEEE 802.11)', 'ARP', '802.1Q VLAN Tagging', 'STP / RSTP', 'PPP', 'LACP'],
      hardware: ['Layer 2 Switches', 'Wireless Access Points (APs)', 'Network Interface Cards (NICs)', 'Bridges'],
      functionSummary: 'Physical MAC addressing (48-bit), media access control, collision avoidance, frame error checking (FCS/CRC), and VLAN broadcast domain segmentation.',
      symptoms: ['ARP resolution failure', 'VLAN mismatch / blackholing', 'Switching loop / Broadcast storm', 'CRC Frame check errors'],
      troubleshootingTools: ['arp -a', 'show mac address-table', 'show interfaces (CRC/errors)', 'Wireshark broadcast capture']
    },
    {
      number: 1,
      name: 'Physical Layer',
      tcpEquivalent: 'Network Access / Link',
      pdu: 'Bits (Signals)',
      color: 'from-emerald-600 to-green-600',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/30',
      protocols: ['1000BASE-T (Cat6 RJ-45)', '10GBASE-SR (Fiber LC)', '802.11 Radio RF (2.4/5/6 GHz)', 'EIA/TIA-232', 'DOCSIS'],
      hardware: ['Cat6/Cat6a Copper Cables', 'Fiber Optic Transceivers (SFP+)', 'Patch Panels', 'Repeaters / Hubs'],
      functionSummary: 'Transmission of raw unformatted bit streams across physical mediums using electrical voltage pulses, optical light pulses, or RF radio waves.',
      symptoms: ['Link light off (No carrier)', 'Flapping link', 'Severe electromagnetic interference (EMI)', 'Damaged fiber strand'],
      troubleshootingTools: ['Cable tester / TDR', 'Optical power meter', 'show interfaces status (Duplex/Speed mismatch)', 'Physical inspection']
    }
  ];

  const activeLayer = osiLayers.find(l => l.number === selectedLayer) || osiLayers[4];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers size={22} className="text-cyan-400" />
            <span>Interactive OSI & TCP/IP Model Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare 7-Layer OSI vs 4-Layer TCP/IP with PDUs, real-world protocols, hardware boundaries, and troubleshooting symptoms.
          </p>
        </div>

        <button
          onClick={() => onNavigate('packet-trace')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition"
        >
          <Activity size={14} />
          <span>Simulate Packet Flow</span>
        </button>
      </div>

      {/* Model Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 7-Layer OSI Interactive Stack (5 cols) */}
        <div className="lg:col-span-5 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
            <span>OSI 7-Layer Architecture</span>
            <span>PDU Type</span>
          </div>

          {osiLayers.map((layer) => {
            const isSelected = selectedLayer === layer.number;
            return (
              <div
                key={layer.number}
                onClick={() => setSelectedLayer(layer.number)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? `${layer.border} ${layer.bg} shadow-lg ring-1 ring-cyan-500/50 scale-[1.02]`
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {layer.number}
                  </span>
                  <div>
                    <div className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {layer.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      TCP/IP: {layer.tcpEquivalent}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-cyan-400 font-semibold">
                  {layer.pdu}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Layer Deep Dive Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            
            {/* Layer Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-cyan-400 font-bold">Layer {activeLayer.number} Deep Dive</span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">{activeLayer.name}</h2>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold">
                PDU: <strong className="text-cyan-300">{activeLayer.pdu}</strong>
              </span>
            </div>

            {/* Function summary */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Core Layer Purpose:</div>
              <p className="text-slate-200 text-xs font-sans leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {activeLayer.functionSummary}
              </p>
            </div>

            {/* Protocols */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Protocols Operating at Layer {activeLayer.number}:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeLayer.protocols.map((proto, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 text-[11px]">
                    {proto}
                  </span>
                ))}
              </div>
            </div>

            {/* Hardware & Equipment */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Hardware & Infrastructure Equipment:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeLayer.hardware.map((hw, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-indigo-300 text-[11px]">
                    {hw}
                  </span>
                ))}
              </div>
            </div>

            {/* Failure Symptoms & Troubleshooting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
              <div className="space-y-2">
                <div className="text-[10px] uppercase text-amber-400 font-bold flex items-center space-x-1">
                  <AlertTriangle size={13} />
                  <span>Common Failure Symptoms</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-400 font-sans">
                  {activeLayer.symptoms.map((sym, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase text-emerald-400 font-bold flex items-center space-x-1">
                  <Terminal size={13} />
                  <span>Troubleshooting Commands</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  {activeLayer.troubleshootingTools.map((tool, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-emerald-300 font-mono">
                      $ {tool}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
