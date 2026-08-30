import React, { useState } from 'react';
import { BookOpen, Search, Shield, Filter, ExternalLink, Activity, Info, Lock, Unlock } from 'lucide-react';
import { PROTOCOLS_DATA } from '../data/protocolsData';
import { ProtocolInfo } from '../types';

interface ProtocolsPageProps {
  initialProtocolId?: string;
  onNavigate: (page: string, meta?: any) => void;
}

export const ProtocolsPage: React.FC<ProtocolsPageProps> = ({ initialProtocolId, onNavigate }) => {
  const [selectedId, setSelectedId] = useState<string>(initialProtocolId || PROTOCOLS_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');

  const filteredProtocols = PROTOCOLS_DATA.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.function.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayer = selectedLayer === 'all' || p.layer.toLowerCase().includes(selectedLayer.toLowerCase());
    return matchesQuery && matchesLayer;
  });

  const activeProtocol: ProtocolInfo = PROTOCOLS_DATA.find(p => p.id === selectedId) || PROTOCOLS_DATA[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BookOpen size={22} className="text-cyan-400" />
            <span>Protocol Knowledge Base & Header Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive into packet structures, RFC specifications, Wireshark traces, and cybersecurity considerations.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search protocol (e.g. DNS, ARP, OSPF)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none w-56"
            />
          </div>

          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="all">All OSI Layers</option>
            <option value="layer 7">Layer 7 (Application)</option>
            <option value="layer 4">Layer 4 (Transport)</option>
            <option value="layer 3">Layer 3 (Network)</option>
            <option value="layer 2">Layer 2 (Data Link)</option>
          </select>
        </div>
      </div>

      {/* Main Protocol Catalog & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List (4 cols) */}
        <div className="lg:col-span-4 space-y-2 font-mono text-xs max-h-[750px] overflow-y-auto pr-1">
          {filteredProtocols.map((p) => {
            const isSelected = p.id === activeProtocol.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg font-bold text-xs ${
                    isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'
                  }`}>
                    {p.acronym}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{p.name}</h3>
                    <span className="text-[10px] text-slate-500">{p.layer}</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  {p.port && <div>Port {p.port}</div>}
                  <div className="text-[10px] text-slate-500">{p.transport}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Card (8 cols) */}
        <div className="lg:col-span-8 space-y-4 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold text-base">
                  {activeProtocol.acronym}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{activeProtocol.name}</h2>
                  <span className="text-[11px] text-slate-400">{activeProtocol.layer} • RFC {activeProtocol.rfc}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {activeProtocol.port && (
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    Port: <strong className="text-cyan-300">{activeProtocol.port}</strong>
                  </span>
                )}
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  Transport: <strong className="text-emerald-300">{activeProtocol.transport}</strong>
                </span>
              </div>
            </div>

            {/* Core Function */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Protocol Function & Objective</div>
              <p className="text-slate-200 text-xs font-sans leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {activeProtocol.function}
              </p>
            </div>

            {/* Packet Header Structure Visualizer */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Standard Packet Header Fields</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeProtocol.headerFields.map((field, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-1">
                    <div className="text-cyan-400 font-bold text-[11px]">{field.name}</div>
                    <div className="text-slate-400 text-[10px] font-sans leading-snug">{field.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security & Wireshark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              {/* Security */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase text-amber-400 font-bold flex items-center space-x-1">
                  <Shield size={13} />
                  <span>Cybersecurity & Threat Considerations</span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-slate-300 text-[11px] font-sans leading-relaxed">
                  {activeProtocol.securityConsiderations}
                </div>
              </div>

              {/* Wireshark Example */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase text-emerald-400 font-bold flex items-center space-x-1">
                  <Activity size={13} />
                  <span>Wireshark Packet Analysis Example</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-slate-300 text-[11px] font-mono leading-relaxed">
                  {activeProtocol.wiresharkExample}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
