import React from 'react';
import { Network, Heart, Shield, Terminal, BookOpen, Github, Cpu, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-20 text-slate-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Network size={18} />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">NET<span className="text-cyan-400">-LAB</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-Stack Interactive Networking Laboratory, Simulation Engine, and Troubleshooting Platform for networking and cybersecurity engineers.
            </p>
            <div className="pt-1 flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
              <span>Built by <strong className="text-cyan-300">Sandesh Bajgai</strong></span>
            </div>
          </div>

          {/* Laboratory Features */}
          <div>
            <h4 className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Interactive Lab
            </h4>
            <ul className="space-y-2 font-mono text-[11px]">
              <li>
                <button onClick={() => onNavigate('topology')} className="hover:text-cyan-400 transition">
                  Visual Topology Canvas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('packet-trace')} className="hover:text-cyan-400 transition">
                  Multi-Hop Packet Journey
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('diagnostics')} className="hover:text-cyan-400 transition">
                  Why Did This Packet Fail?
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terminal')} className="hover:text-cyan-400 transition">
                  Simulated CLI Command Terminal
                </button>
              </li>
            </ul>
          </div>

          {/* Knowledge & Tools */}
          <div>
            <h4 className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Learning & Tools
            </h4>
            <ul className="space-y-2 font-mono text-[11px]">
              <li>
                <button onClick={() => onNavigate('tools')} className="hover:text-cyan-400 transition">
                  IPv4 Subnet & VLSM Calculators
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('labs')} className="hover:text-cyan-400 transition">
                  15 Practical Networking Labs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('osi')} className="hover:text-cyan-400 transition">
                  OSI 7-Layer Interactive Model
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('protocols')} className="hover:text-cyan-400 transition">
                  Protocol Knowledge Base
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quizzes')} className="hover:text-cyan-400 transition">
                  Adaptive Assessments
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Telemetry */}
          <div>
            <h4 className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Platform Architecture
            </h4>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Core Runtime:</span>
                <span className="text-slate-300">Node.js / Express</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client Engine:</span>
                <span className="text-slate-300">React 19 / TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database Ready:</span>
                <span className="text-emerald-400">PostgreSQL / Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License:</span>
                <span className="text-slate-300">Open Educational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} NET-LAB. Designed & Engineered by <strong className="text-slate-400">Sandesh Bajgai</strong>.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <button onClick={() => onNavigate('about')} className="hover:text-slate-300 transition">
              About Platform
            </button>
            <button onClick={() => onNavigate('workspace')} className="hover:text-slate-300 transition">
              Student Portfolio
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
