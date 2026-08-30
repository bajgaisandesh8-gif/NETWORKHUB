import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info,
  Server,
  Network
} from 'lucide-react';
import { NetworkTopology, PacketTraceResult, PacketHop } from '../types';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';
import { simulatePacketTrace } from '../utils/networkSimulator';
import { DeviceIcon } from '../components/DeviceIcon';

interface PacketTracePageProps {
  topology?: NetworkTopology;
  onNavigate: (page: string, meta?: any) => void;
}

export const PacketTracePage: React.FC<PacketTracePageProps> = ({ topology: propTopology, onNavigate }) => {
  const [topology, setTopology] = useState<NetworkTopology>(propTopology || PRESET_TOPOLOGIES[0]);
  const [sourceName, setSourceName] = useState<string>('');
  const [destinationName, setDestinationName] = useState<string>('');
  const [protocol, setProtocol] = useState<'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH'>('ICMP');
  const [port, setPort] = useState<number>(80);

  const [traceResult, setTraceResult] = useState<PacketTraceResult | null>(null);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLayerTab, setActiveLayerTab] = useState<number>(3); // Default to Layer 3 (Network)

  // Initialize source & destination defaults
  useEffect(() => {
    if (topology.devices.length >= 2) {
      setSourceName(topology.devices[0].name);
      setDestinationName(topology.devices[topology.devices.length - 1].name);
    }
  }, [topology]);

  // Run simulation trace
  const handleRunTrace = () => {
    if (!sourceName || !destinationName) return;
    const result = simulatePacketTrace(topology, sourceName, destinationName, protocol, port);
    setTraceResult(result);
    setActiveHopIndex(0);
    setIsPlaying(true);
  };

  // Auto playback ticker
  useEffect(() => {
    let timer: any;
    if (isPlaying && traceResult && traceResult.hops.length > 0) {
      timer = setInterval(() => {
        setActiveHopIndex(prev => {
          if (prev >= traceResult.hops.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, traceResult]);

  const currentHop: PacketHop | undefined = traceResult?.hops[activeHopIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Activity size={22} className="text-cyan-400" />
            <span>Packet Journey Simulation & Protocol Inspector</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trace multi-hop packet encapsulation, ARP resolution, CAM table lookups, and TTL decrements across OSI layers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('topology')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
          >
            <Network size={14} className="text-cyan-400" />
            <span>Edit Topology</span>
          </button>
        </div>
      </div>

      {/* Simulation Configuration Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono items-end">
        {/* Source */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1">Source Device</label>
          <select
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {topology.devices.map(d => (
              <option key={d.id} value={d.name}>{d.name} ({d.ip || 'No IP'})</option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1">Destination Target</label>
          <select
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {topology.devices.map(d => (
              <option key={d.id} value={d.name}>{d.name} ({d.ip || 'No IP'})</option>
            ))}
          </select>
        </div>

        {/* Protocol */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1">Protocol (L4/L7)</label>
          <select
            value={protocol}
            onChange={(e) => {
              const proto = e.target.value as any;
              setProtocol(proto);
              if (proto === 'HTTP') setPort(80);
              if (proto === 'HTTPS') setPort(443);
              if (proto === 'DNS') setPort(53);
              if (proto === 'SSH') setPort(22);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ICMP">ICMP (Ping / Echo)</option>
            <option value="HTTP">HTTP (Web 80)</option>
            <option value="HTTPS">HTTPS (TLS 443)</option>
            <option value="DNS">DNS (Query 53)</option>
            <option value="SSH">SSH (Remote 22)</option>
          </select>
        </div>

        {/* Target Port */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1">Destination Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value, 10))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-cyan-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Run Action */}
        <div>
          <button
            onClick={handleRunTrace}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-1.5"
          >
            <Play size={14} className="fill-white" />
            <span>Trace Packet</span>
          </button>
        </div>
      </div>

      {/* Trace Results & Interactive Stepper */}
      {traceResult ? (
        <div className="space-y-6">
          
          {/* Status Ribbon & Playback Controls */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl flex items-center space-x-2 ${
                traceResult.status === 'success' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-red-950 text-red-400 border border-red-800/60'
              }`}>
                {traceResult.status === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                <span className="font-bold uppercase tracking-wider">
                  {traceResult.status === 'success' ? 'Delivery Successful' : 'Packet Dropped'}
                </span>
              </div>
              <div className="text-slate-300">
                <span>{traceResult.summary}</span>
              </div>
            </div>

            {/* Step Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveHopIndex(0);
                }}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                title="Reset to Start"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono"
              >
                {isPlaying ? <Pause size={13} className="fill-slate-950" /> : <Play size={13} className="fill-slate-950" />}
                <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
              </button>

              <button
                disabled={activeHopIndex >= traceResult.hops.length - 1}
                onClick={() => setActiveHopIndex(prev => Math.min(traceResult.hops.length - 1, prev + 1))}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                <span>Next Hop</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Multi-Hop Interactive Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <div className="flex items-center min-w-[700px] justify-between relative">
              {/* Connecting line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-800 -z-0" />

              {traceResult.hops.map((hop, idx) => {
                const isActive = activeHopIndex === idx;
                const isPast = activeHopIndex > idx;
                const isDropHop = hop.action === 'dropped';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveHopIndex(idx);
                    }}
                    className="relative z-10 flex flex-col items-center cursor-pointer group"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? `${isDropHop ? 'bg-red-950 border-red-500 shadow-red-500/30' : 'bg-cyan-950 border-cyan-400 shadow-cyan-500/30'} shadow-xl scale-110`
                        : isPast
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}>
                      <span className="font-mono font-bold text-sm">#{hop.hopNumber}</span>
                    </div>

                    <div className="mt-2 text-center font-mono">
                      <div className={`text-xs font-semibold ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {hop.deviceName}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {hop.action}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deep Hop Analysis & OSI Layer Breakdown */}
          {currentHop && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left: Hop Explanation & Hardware Action (1 col) */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                  <DeviceIcon type={currentHop.deviceType} size={18} className="text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-white">{currentHop.deviceName}</h3>
                    <span className="text-[10px] text-slate-400 capitalize">Role: {currentHop.deviceType}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] uppercase text-slate-500">Hardware & Protocol Logic:</div>
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-sans">
                    {currentHop.details}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-slate-400">
                  <span>Packet Action:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    currentHop.action === 'dropped' ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    {currentHop.action}
                  </span>
                </div>
              </div>

              {/* Middle / Right: OSI 7-Layer Encapsulation Inspector (2 cols) */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Layers size={18} className="text-indigo-400" />
                    <span className="font-bold text-white">OSI Protocol Data Unit (PDU) Header Inspector</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Hop #{currentHop.hopNumber}</span>
                </div>

                {/* Layer Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { layer: 7, label: 'L7 Application', pdu: 'Data' },
                    { layer: 4, label: 'L4 Transport', pdu: 'Segment' },
                    { layer: 3, label: 'L3 Network', pdu: 'Packet' },
                    { layer: 2, label: 'L2 Data Link', pdu: 'Frame' },
                    { layer: 1, label: 'L1 Physical', pdu: 'Bits' },
                  ].map((tab) => (
                    <button
                      key={tab.layer}
                      onClick={() => setActiveLayerTab(tab.layer)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${
                        activeLayerTab === tab.layer
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1.5 text-[10px] opacity-75">({tab.pdu})</span>
                    </button>
                  ))}
                </div>

                {/* Layer Content Viewer */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  {activeLayerTab === 7 && (
                    <div className="space-y-2">
                      <div className="text-cyan-400 font-bold">Layer 7 — Application Layer Payload</div>
                      <div className="text-slate-300">Protocol: <strong className="text-white">{protocol}</strong></div>
                      <div className="text-slate-400 text-xs font-sans">
                        {protocol === 'ICMP' && 'ICMP Echo Request payload: 32 bytes of ASCII timestamp and sequencing bytes.'}
                        {protocol === 'HTTP' && 'GET / HTTP/1.1\\r\\nHost: destination.local\\r\\nUser-Agent: NET-LAB/1.0'}
                        {protocol === 'DNS' && 'Standard Query: IN A target.domain (Opcode 0, Recursion Desired)'}
                      </div>
                    </div>
                  )}

                  {activeLayerTab === 4 && (
                    <div className="space-y-2">
                      <div className="text-cyan-400 font-bold">Layer 4 — Transport Layer (TCP / UDP)</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div>Source Port: <span className="text-white">49152 (Ephemeral)</span></div>
                        <div>Destination Port: <span className="text-cyan-300">{port} ({protocol})</span></div>
                        <div>Sequence Number: <span className="text-white">1001</span></div>
                        <div>Window Size: <span className="text-white">65535</span></div>
                      </div>
                    </div>
                  )}

                  {activeLayerTab === 3 && (
                    <div className="space-y-2">
                      <div className="text-cyan-400 font-bold">Layer 3 — Network Layer (IPv4 Header)</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div>Source IP: <span className="text-cyan-300">{currentHop.layerData?.l3?.srcIp || currentHop.sourceIp}</span></div>
                        <div>Destination IP: <span className="text-indigo-300">{currentHop.layerData?.l3?.destIp || currentHop.destIp}</span></div>
                        <div>Time to Live (TTL): <span className="text-amber-400 font-bold">{currentHop.layerData?.l3?.ttl || currentHop.ttl}</span></div>
                        <div>Protocol Field: <span className="text-white">{currentHop.layerData?.l3?.protocol || currentHop.protocol} (0x01/0x06)</span></div>
                      </div>
                    </div>
                  )}

                  {activeLayerTab === 2 && (
                    <div className="space-y-2">
                      <div className="text-cyan-400 font-bold">Layer 2 — Data Link Layer (Ethernet II Frame)</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div>Source MAC: <span className="text-slate-200">{currentHop.layerData?.l2?.srcMac || currentHop.sourceMac || '00:1A:2B:3C:4D:5E'}</span></div>
                        <div>Destination MAC: <span className="text-slate-200">{currentHop.layerData?.l2?.destMac || currentHop.destMac || 'FF:FF:FF:FF:FF:FF'}</span></div>
                        <div>Frame Type: <span className="text-white">{currentHop.layerData?.l2?.frameType || '0x0800 (IPv4)'}</span></div>
                        <div>VLAN Tag: <span className="text-purple-400">{currentHop.layerData?.l2?.vlanId ? `VLAN ${currentHop.layerData.l2.vlanId} (802.1Q)` : 'Untagged (Native)'}</span></div>
                      </div>
                    </div>
                  )}

                  {activeLayerTab === 1 && (
                    <div className="space-y-2">
                      <div className="text-cyan-400 font-bold">Layer 1 — Physical Layer (Signaling)</div>
                      <div className="text-slate-300">Media Type: <strong className="text-white">1000BASE-T Full-Duplex (8P8C Cat6)</strong></div>
                      <div className="text-slate-400 text-xs font-sans">
                        Preamble (7 bytes 0x55) + Start of Frame Delimiter (1 byte 0xD5) followed by differential voltage signaling across 4 twisted pairs.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Activity size={36} className="mx-auto text-slate-600" />
          <div className="text-sm font-semibold text-slate-300">No active packet trace running</div>
          <p className="text-xs max-w-md mx-auto">
            Select a source and destination device from your topology above and click <strong className="text-cyan-400 font-mono">"Trace Packet"</strong> to inspect step-by-step frame propagation.
          </p>
        </div>
      )}
    </div>
  );
};
