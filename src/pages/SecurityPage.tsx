import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Skull, 
  Lock, 
  Unlock, 
  Activity, 
  ArrowRight, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal,
  Zap,
  Radio
} from 'lucide-react';

interface SecurityPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  const [selectedAttackId, setSelectedAttackId] = useState<string>('arp-spoof');
  const [defenseActive, setDefenseActive] = useState<boolean>(false);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  const attacks = [
    {
      id: 'arp-spoof',
      name: 'ARP Poisoning / MitM',
      category: 'Layer 2 Data Link',
      icon: Skull,
      dangerLevel: 'Critical',
      desc: 'Attacker injects gratuitous unsolicited ARP replies, associating the Default Gateway IP with the Attacker MAC address, intercepting all outbound subnet traffic.',
      target: 'Switch CAM / Host ARP Cache',
      defenseName: 'Dynamic ARP Inspection (DAI) + DHCP Snooping',
      defenseDesc: 'Switch validates ARP packets against trusted DHCP snooping binding database before forwarding. Discards invalid ARP broadcasts.',
      simSteps: [
        '1. Attacker listens on LAN subnet 192.168.1.0/24.',
        '2. Attacker transmits forged ARP reply: "192.168.1.1 is at Attacker-MAC".',
        '3. Victim PC updates local ARP cache, believing Attacker is the Gateway.',
        '4. All victim internet traffic now flows directly through attacker proxy.'
      ],
      defenseResult: 'Switch DAI intercepts forged ARP reply, compares against Snooping Binding Table, detects MAC mismatch, and DROPS the poisoned frame.'
    },
    {
      id: 'syn-flood',
      name: 'TCP SYN Flood DDoS',
      category: 'Layer 4 Transport',
      icon: Zap,
      dangerLevel: 'High',
      desc: 'Attacker transmits millions of spoofed TCP SYN packets without completing the 3-way handshake (never sending ACK), exhausting the target server backlog queue.',
      target: 'Server TCP SYN Backlog Queue',
      defenseName: 'TCP SYN Cookies + Rate Limiting',
      defenseDesc: 'Server encodes state into Initial Sequence Number (ISN) instead of allocating memory table slots until client ACK is validated.',
      simSteps: [
        '1. Attacker floods server on TCP port 443 with rapid SYN requests.',
        '2. Target server sends SYN-ACK and allocates memory in SYN backlog queue.',
        '3. Attacker never replies with ACK; half-open connections accumulate.',
        '4. Legitimate users receive "Connection Refused" due to queue exhaustion.'
      ],
      defenseResult: 'SYN Cookies enabled: Server responds with mathematical ISN token without allocating memory. Legitimate handshake succeeds; spoofed SYNs consume 0 RAM.'
    },
    {
      id: 'dhcp-starve',
      name: 'DHCP Starvation & Rogue Server',
      category: 'Layer 7 Application',
      icon: AlertTriangle,
      dangerLevel: 'High',
      desc: 'Attacker sends thousands of DHCP Discover requests with randomized MAC addresses to exhaust the DHCP IP pool, then stands up a Rogue DHCP server handing out malicious DNS.',
      target: 'Subnet DHCP Pool & DNS Configuration',
      defenseName: 'DHCP Snooping + Trusted Port Isolation',
      defenseDesc: 'Switch classifies ports as Trusted (uplinks to legit DHCP) or Untrusted (access ports). Blocks DHCP Offer/Ack messages from untrusted access ports.',
      simSteps: [
        '1. Attacker floods DHCP Discover with thousands of randomized fake MACs.',
        '2. Legitimate DHCP server exhausts entire /24 address pool (0 free leases).',
        '3. New victim PC connects and broadcasts DHCP Discover.',
        '4. Rogue DHCP server responds first, configuring victim DNS to malicious server.'
      ],
      defenseResult: 'DHCP Snooping enabled on access switch: DHCP Offer from Rogue port is immediately BLOCKED and port is put into err-disabled state.'
    },
    {
      id: 'dns-cache-poison',
      name: 'DNS Cache Poisoning / Kaminsky',
      category: 'Layer 7 Application',
      icon: Radio,
      dangerLevel: 'Critical',
      desc: 'Attacker floods recursive resolver with forged DNS responses containing spoofed transaction IDs to hijack domain resolutions to malicious IP endpoints.',
      target: 'DNS Recursive Resolver Cache',
      defenseName: 'DNSSEC (Domain Name System Security Extensions)',
      defenseDesc: 'DNS records are cryptographically signed using public-key cryptography (RRSIG). Resolvers verify the digital chain of trust.',
      simSteps: [
        '1. Attacker queries resolver for sub.targetbank.com.',
        '2. Resolver queries authoritative nameserver.',
        '3. Attacker floods resolver with 5,000 forged responses guessing 16-bit TxID.',
        '4. If forged packet arrives first with matching TxID, poisoned cache is stored.'
      ],
      defenseResult: 'DNSSEC validation enabled: Resolver verifies RRSIG digital signature. Forged response lacks valid cryptographic private key signature and is REJECTED.'
    },
    {
      id: 'vlan-hopping',
      name: 'VLAN Hopping (Double Tagging)',
      category: 'Layer 2 Data Link',
      icon: Lock,
      dangerLevel: 'High',
      desc: 'Attacker frames packet with two 802.1Q tags. First switch strips native VLAN outer tag; second switch forwards inner tag directly into an isolated target VLAN.',
      target: '802.1Q Trunk Links & Native VLAN',
      defenseName: 'Dedicated Unused Native VLAN + Explicit Tagging',
      defenseDesc: 'Configure native VLAN as an unused dummy ID (e.g. VLAN 999) on all trunks and enable "vlan dot1q tag native".',
      simSteps: [
        '1. Attacker on native VLAN 1 sends frame with outer Tag 1 + inner Tag 20.',
        '2. First switch strips outer Tag 1 (since it is Native VLAN) and forwards over trunk.',
        '3. Next switch reads remaining Tag 20 and forwards frame into isolated HR VLAN 20.',
        '4. Attacker has bypassed Layer 3 router firewall inspection entirely.'
      ],
      defenseResult: 'Dedicated dummy Native VLAN configured: Double-tagged frame cannot match native VLAN on trunk and is safely dropped.'
    }
  ];

  const activeAttack = attacks.find(a => a.id === selectedAttackId) || attacks[0];

  const runSimulation = () => {
    setSimulationRunning(true);
    setSimStep(1);
    const interval = setInterval(() => {
      setSimStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setSimulationRunning(false);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert size={22} className="text-red-400" />
            <span>Cybersecurity Attack & Defense Simulation Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-world network layer exploits (ARP Poisoning, DDoS, DHCP Starvation, VLAN Hopping) and activate cryptographic defenses.
          </p>
        </div>

        <button
          onClick={() => onNavigate('packet-trace')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
        >
          <Activity size={14} className="text-cyan-400" />
          <span>Packet Simulator</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Attack Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-2 font-mono text-xs">
          {attacks.map((att) => {
            const isSelected = att.id === activeAttack.id;
            return (
              <div
                key={att.id}
                onClick={() => {
                  setSelectedAttackId(att.id);
                  setSimStep(0);
                  setSimulationRunning(false);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-red-500/80 shadow-lg shadow-red-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <att.icon size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{att.name}</h3>
                    <span className="text-[10px] text-slate-500">{att.category}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  att.dangerLevel === 'Critical' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {att.dangerLevel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Attack & Defense Interactive Lab (8 cols) */}
        <div className="lg:col-span-8 space-y-4 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            
            {/* Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-red-400 font-bold">{activeAttack.category} Threat</span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">{activeAttack.name}</h2>
              </div>

              {/* Defense Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-xs">Mitigation Defense:</span>
                <button
                  onClick={() => setDefenseActive(!defenseActive)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                    defenseActive
                      ? 'bg-emerald-600 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {defenseActive ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                  <span>{defenseActive ? 'Defense Active' : 'Defense Inactive'}</span>
                </button>
              </div>
            </div>

            {/* Attack Description */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Threat Mechanism & Exploit:</div>
              <p className="text-slate-200 text-xs font-sans leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {activeAttack.desc}
              </p>
            </div>

            {/* Interactive Attack Simulation Sequence */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300 font-bold">
                <span>Exploit Propagation Sequence:</span>
                <button
                  disabled={simulationRunning}
                  onClick={runSimulation}
                  className="px-3 py-1 rounded bg-red-950 border border-red-800/60 text-red-300 hover:bg-red-900/60 disabled:opacity-40 flex items-center space-x-1"
                >
                  <Activity size={13} />
                  <span>{simulationRunning ? 'Simulating...' : 'Run Attack Vector'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {activeAttack.simSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      simStep > idx
                        ? 'bg-slate-950 border-red-500/60 text-red-200'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="text-xs font-sans">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defense Outcome Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className={defenseActive ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="font-bold text-white text-xs">{activeAttack.defenseName}</span>
              </div>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                {defenseActive ? activeAttack.defenseResult : activeAttack.defenseDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
