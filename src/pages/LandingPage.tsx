import React from 'react';
import { 
  Network, 
  Activity, 
  ShieldAlert, 
  Calculator, 
  Layers, 
  Cpu, 
  Terminal, 
  FolderKanban, 
  Award, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Lock,
  Code2,
  BookOpen,
  FileText,
  Sliders,
  Bug,
  Save,
  Radio,
  FileCode
} from 'lucide-react';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';

interface LandingPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const workflowSteps = [
    { num: '01', label: 'Create Project', page: 'workspace', desc: 'Define site requirements & user capacity' },
    { num: '02', label: 'Build Network', page: 'topology', desc: 'Drag-and-drop routers, switches & hosts' },
    { num: '03', label: 'Configure', page: 'topology', desc: 'Assign IPv4, subnets, gateways & VLANs' },
    { num: '04', label: 'Test', page: 'terminal', desc: 'Execute ping, traceroute & show CLI' },
    { num: '05', label: 'Trace', page: 'packet-trace', desc: 'Dissect packet headers L1 through L7' },
    { num: '06', label: 'Break', page: 'diagnostics', desc: 'Inject IP conflicts, severed links & drops' },
    { num: '07', label: 'Troubleshoot', page: 'diagnostics', desc: 'Analyze root causes & auto-remediate' },
    { num: '08', label: 'Audit', page: 'topology', desc: 'Run NIST/Cisco compliance design audit' },
    { num: '09', label: 'Document', page: 'workspace', desc: 'Export auto-generated engineering specs' },
    { num: '10', label: 'Save', page: 'workspace', desc: 'Snapshot version history & sync to cloud' }
  ];

  const highlights = [
    {
      id: 'topology',
      icon: Network,
      title: 'Interactive 2D/3D Topology Canvas',
      desc: 'Drag and drop Routers, L2/L3 Switches, PCs, Servers, Firewalls, and Cloud Gateways with real-time link validation, auto-save, and 3D projection.',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400'
    },
    {
      id: 'packet-trace',
      icon: Activity,
      title: 'Real-Time Packet Flow & OSI Inspector',
      desc: 'Step through frame encapsulation, ARP resolutions, routing table lookups, TTL decrements, and firewall drops layer-by-layer.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400'
    },
    {
      id: 'diagnostics',
      icon: ShieldAlert,
      title: '"Why Did This Packet Fail?" Engine',
      desc: 'Multi-layer automated diagnostic troubleshooter pinpointing IP conflicts, wrong gateways, link cuts, and VLAN broadcast leaks with 1-click remediation.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400'
    },
    {
      id: 'labs',
      icon: Cpu,
      title: '15 Guided Practical Laboratories',
      desc: 'Comprehensive step-by-step scenarios covering LAN fundamentals, Subnetting, VLAN trunking, OSPF routing, and ACL security with instant score verification.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
    },
    {
      id: 'tools',
      icon: Calculator,
      title: 'Subnetting & Cisco Config Generator Hub',
      desc: 'High-precision IPv4 calculators, VLSM generators, Cisco IOS running-config generators, syntax validators, 32-bit bit flippers, and PoE planners.',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
    },
    {
      id: 'security',
      icon: Lock,
      title: 'Cybersecurity Attack & Defense Lab',
      desc: 'Interactive visual simulations of ARP Poisoning, TCP SYN Floods, DHCP Starvation, DNS Cache Poisoning, and DAI/DNSSEC cryptographic defense.',
      color: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400'
    }
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans animate-fadeIn">
      
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-6 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Full-Stack Interactive Networking Laboratory Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Build Topologies. Simulate Packets. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
            Master Real-World Networking.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          NET-LAB provides a complete, production-grade simulation environment to design networks, trace Layer 1-7 protocol journeys, troubleshoot packet drops, and complete hands-on labs.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('topology')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all font-mono scale-[1.02] hover:scale-[1.05]"
          >
            <Play size={16} />
            <span>Launch Topology Studio</span>
          </button>

          <button
            onClick={() => onNavigate('labs')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all font-mono"
          >
            <Cpu size={16} className="text-cyan-400" />
            <span>Browse 15 Practical Labs</span>
          </button>

          <button
            onClick={() => onNavigate('tools')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all font-mono"
          >
            <Calculator size={16} className="text-purple-400" />
            <span>Engineering Calculators & Cisco Generator</span>
          </button>
        </div>

        {/* Creator Attribution Badge */}
        <div className="pt-2">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
            <span>Architected & Engineered with Pride by</span>
            <strong className="text-cyan-300 font-bold">Sandesh Bajgai</strong>
          </div>
        </div>
      </section>

      {/* CORE WORKFLOW RIBBON: 10 STEPS TO NETWORK MASTERY */}
      <section className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Radio size={16} className="text-cyan-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-sm">Core Engineering Lifecycle Workflow</span>
          </div>
          <span className="text-slate-400 text-[11px]">Click any stage to jump directly into the workspace</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {workflowSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(step.page)}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900 transition text-left group flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400">{step.num}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-400" />
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-cyan-300 text-[11px] leading-tight">
                  {step.label}
                </div>
                <div className="text-[9px] text-slate-500 mt-1 font-sans line-clamp-2 leading-tight">
                  {step.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Core Feature Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Integrated Network Simulation Ecosystem
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto font-mono">
            Every feature is fully implemented with mathematical accuracy and real-time state machines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`p-6 rounded-2xl bg-slate-900 border transition-all cursor-pointer group hover:scale-[1.02] flex flex-col justify-between space-y-4 ${item.color}`}
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 w-fit border border-slate-800 group-hover:border-cyan-500/50 transition">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-400 group-hover:text-cyan-400 transition pt-2">
                  <span>Open Module</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Preset Topologies Quick-Launch Banner */}
      <section className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Instant Lab Starters</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">Load pre-configured production topologies directly into the simulator.</p>
          </div>
          <button
            onClick={() => onNavigate('topology')}
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>View All Topologies</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {PRESET_TOPOLOGIES.map((top) => (
            <div
              key={top.id}
              onClick={() => onNavigate('topology', { topology: top })}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 transition cursor-pointer space-y-2 group"
            >
              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                <span>{top.category}</span>
                <span>{top.devices.length} Devices</span>
              </div>
              <h4 className="font-bold text-white group-hover:text-cyan-300 transition text-sm">{top.name}</h4>
              <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-snug">{top.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
