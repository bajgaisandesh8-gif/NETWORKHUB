import React from 'react';
import { 
  Network, 
  User, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Layers, 
  CheckCircle2, 
  Code2, 
  Award, 
  Heart, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface AboutPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="text-center space-y-3 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Platform Specifications & Creator Profile</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          About NET-LAB Platform
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          An engineering-grade full-stack networking laboratory, simulation engine, and assessment platform designed for students, educators, and infrastructure engineers.
        </p>
      </div>

      {/* Creator Spotlight Box */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/5 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-cyan-500/20 shrink-0 font-mono">
            SB
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-white">Sandesh Bajgai</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                Creator & Lead Architect
              </span>
            </div>
            <p className="text-sm text-slate-300 font-mono mt-1">
              Full-Stack Software Engineer • Network Infrastructure • Cybersecurity Specialist
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="font-bold text-white font-mono uppercase text-[11px] text-cyan-400">Architectural Philosophy:</div>
          <p className="italic text-slate-200">
            "Build It Once. Make It Production-Ready. No Rebuilding Later. Networking education should not rely on static diagrams or broken simulators with non-functional buttons. NET-LAB was crafted to give every learner a responsive, mathematically sound laboratory environment with genuine packet simulation and deep diagnostic reasoning."
          </p>
        </div>
      </div>

      {/* Technology Stack & Architecture Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
          <Code2 size={18} className="text-cyan-400" />
          <span>Full-Stack Architecture & Engineering Standards</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Frontend */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold text-sm">Frontend Engine</div>
            <ul className="space-y-1.5 text-slate-300 font-sans text-xs">
              <li>• React 18 & TypeScript</li>
              <li>• Vite Lightning Build Pipeline</li>
              <li>• Tailwind CSS Design System</li>
              <li>• Three.js 3D Mesh Topologies</li>
              <li>• Lucide High-Contrast Icons</li>
            </ul>
          </div>

          {/* Backend & Simulation */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-indigo-400 font-bold text-sm">Core Logic & Server</div>
            <ul className="space-y-1.5 text-slate-300 font-sans text-xs">
              <li>• Node.js & Express API Routes</li>
              <li>• BFS Dijkstra Pathfinding Engine</li>
              <li>• OSI Layer Encapsulation Machine</li>
              <li>• Subnetting & VLSM Bit Matrix</li>
              <li>• Multi-Layer Diagnostic Engine</li>
            </ul>
          </div>

          {/* Persistence */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-bold text-sm">Data Persistence</div>
            <ul className="space-y-1.5 text-slate-300 font-sans text-xs">
              <li>• Supabase Cloud PostgreSQL</li>
              <li>• Row Level Security (RLS) Policies</li>
              <li>• High-Performance Local-First Fallback</li>
              <li>• Real-Time Schema Synchronization</li>
              <li>• JSON Export & Project Import</li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Health & Status */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <span className="font-bold text-white text-sm">System Runtime Status</span>
          <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONAL</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Database Driver</div>
            <div className="font-bold text-slate-200">{isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Storage Engine'}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Interactive Labs</div>
            <div className="font-bold text-cyan-400">15 Production Labs</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">OSI Protocol Matrix</div>
            <div className="font-bold text-indigo-400">14 Verified Protocols</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Simulation Precision</div>
            <div className="font-bold text-emerald-400">Bit-Level Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
};
