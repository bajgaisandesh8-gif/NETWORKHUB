import React, { useState, useEffect } from 'react';
import { Search, X, Network, Activity, Calculator, ShieldAlert, BookOpen, Layers, Terminal, Award, FolderKanban, Cpu, CheckCircle } from 'lucide-react';
import { LABS_DATA } from '../data/labsData';
import { PROTOCOLS_DATA } from '../data/protocolsData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, meta?: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const coreActions = [
    { id: 'topologies', title: 'Network Topology Builder', category: 'Laboratory', icon: Network, page: 'topology' },
    { id: 'packet-trace', title: 'Packet Journey Simulator', category: 'Simulation', icon: Activity, page: 'packet-trace' },
    { id: 'diagnostics', title: 'Why Did This Packet Fail? (Diagnostics)', category: 'Troubleshooting', icon: ShieldAlert, page: 'diagnostics' },
    { id: 'tools-subnet', title: 'IPv4 Subnet & CIDR Calculator', category: 'Tools', icon: Calculator, page: 'tools', meta: { tab: 'subnet' } },
    { id: 'tools-vlsm', title: 'VLSM Calculator (Variable Length Subnet)', category: 'Tools', icon: Calculator, page: 'tools', meta: { tab: 'vlsm' } },
    { id: 'osi-model', title: 'Interactive 3D OSI & TCP/IP Model', category: 'Learning', icon: Layers, page: 'osi' },
    { id: 'protocols', title: 'Protocol Knowledge Explorer', category: 'Learning', icon: BookOpen, page: 'protocols' },
    { id: 'terminal', title: 'Simulated Network CLI Terminal', category: 'Tools', icon: Terminal, page: 'terminal' },
    { id: 'labs', title: '15 Practical Networking Labs', category: 'Curriculum', icon: Cpu, page: 'labs' },
    { id: 'quizzes', title: 'Adaptive Quiz & Assessments', category: 'Assessments', icon: CheckCircle, page: 'quizzes' },
    { id: 'workspace', title: 'My Projects & Portfolio', category: 'Workspace', icon: FolderKanban, page: 'workspace' },
    { id: 'dashboard', title: 'Student Learning Dashboard & Skill Tree', category: 'Dashboard', icon: Award, page: 'dashboard' },
  ];

  const filteredActions = coreActions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLabs = LABS_DATA.filter(l => 
    l.title.toLowerCase().includes(query.toLowerCase()) || 
    l.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredProtocols = PROTOCOLS_DATA.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.acronym.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search size={20} className="text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search tools, labs, protocols, calculators, or press ESC..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-mono"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 font-sans text-sm">
          {/* Core Tools */}
          <div>
            <div className="px-3 py-1 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Quick Navigation & Tools
            </div>
            <div className="mt-1 space-y-1">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      onNavigate(action.page, action.meta);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-md bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300">
                        <Icon size={16} />
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400">
                      {action.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Labs Matching */}
          {filteredLabs.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                Practical Labs
              </div>
              <div className="mt-1 space-y-1">
                {filteredLabs.map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => {
                      onNavigate('labs', { selectedLabId: lab.id });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">Lab {lab.labNumber}</span>
                      <span className="truncate">{lab.title}</span>
                    </div>
                    <span className="text-xs text-slate-500">{lab.difficulty}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protocols Matching */}
          {filteredProtocols.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                Protocols
              </div>
              <div className="mt-1 space-y-1">
                {filteredProtocols.map((proto) => (
                  <button
                    key={proto.id}
                    onClick={() => {
                      onNavigate('protocols', { selectedProtocolId: proto.id });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">{proto.acronym}</span>
                      <span className="text-slate-300">{proto.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{proto.layer}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <div>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">ESC</kbd> to close</div>
          <div>NET-LAB Global Search</div>
        </div>
      </div>
    </div>
  );
};
