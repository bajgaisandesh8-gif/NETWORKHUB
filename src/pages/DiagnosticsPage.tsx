import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight, 
  Network, 
  Zap, 
  Cpu, 
  Sparkles,
  Info,
  Bug
} from 'lucide-react';
import { NetworkTopology, DiagnosticReport, DiagnosticIssue } from '../types';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';
import { runDiagnostics } from '../utils/diagnosticEngine';

interface DiagnosticsPageProps {
  topology?: NetworkTopology;
  onNavigate: (page: string, meta?: any) => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({ topology: propTopology, onNavigate }) => {
  const [topology, setTopology] = useState<NetworkTopology>(propTopology || PRESET_TOPOLOGIES[2]); // Default to broken preset
  const [report, setReport] = useState<DiagnosticReport | null>(() => runDiagnostics(topology));
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Run or re-evaluate diagnostics
  const handleEvaluate = () => {
    const res = runDiagnostics(topology);
    setReport(res);
    if (res.issues.length > 0) {
      setSelectedIssueId(res.issues[0].id);
    } else {
      setSelectedIssueId(null);
    }
  };

  // Fault Injector Presets
  const injectFault = (faultType: 'duplicate_ip' | 'wrong_gw' | 'cable_cut' | 'vlan_split' | 'interface_down') => {
    let updated = { ...topology };

    if (faultType === 'duplicate_ip') {
      if (updated.devices.length >= 2) {
        updated.devices = updated.devices.map((d, i) => i === 1 ? { ...d, ip: updated.devices[0].ip } : d);
        showToast('Injected: Duplicate IP Address Conflict');
      }
    } else if (faultType === 'wrong_gw') {
      if (updated.devices.length >= 1) {
        updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, gateway: '10.99.99.1' } : d);
        showToast('Injected: Invalid Default Gateway (Wrong Subnet)');
      }
    } else if (faultType === 'cable_cut') {
      if (updated.connections.length >= 1) {
        updated.connections = updated.connections.map((c, i) => i === 0 ? { ...c, status: 'down' } : c);
        showToast('Injected: Physical Cable Cut (Link Down)');
      }
    } else if (faultType === 'vlan_split') {
      if (updated.devices.length >= 2) {
        updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, vlan: 10 } : i === 1 ? { ...d, vlan: 20 } : d);
        showToast('Injected: VLAN Broadcast Isolation mismatch');
      }
    } else if (faultType === 'interface_down') {
      if (updated.devices.length >= 1) {
        updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, status: 'down' } : d);
        showToast('Injected: Interface Administratively Shutdown');
      }
    }

    setTopology(updated);
    const newReport = runDiagnostics(updated);
    setReport(newReport);
    if (newReport.issues.length > 0) setSelectedIssueId(newReport.issues[0].id);
  };

  // Auto Repair Engine
  const handleAutoRepair = () => {
    const repaired: NetworkTopology = {
      ...topology,
      devices: topology.devices.map((d, idx) => ({
        ...d,
        status: 'up',
        ip: `192.168.1.${10 + idx * 5}`,
        subnetMask: '255.255.255.0',
        gateway: (d.type === 'pc' || d.type === 'laptop' || d.type === 'server') ? '192.168.1.1' : undefined,
        vlan: undefined
      })),
      connections: topology.connections.map(c => ({
        ...c,
        status: 'up'
      }))
    };

    setTopology(repaired);
    const newReport = runDiagnostics(repaired);
    setReport(newReport);
    setSelectedIssueId(null);
    showToast('Applied automated topology remediation — all faults resolved');
  };

  const selectedIssue: DiagnosticIssue | undefined = report?.issues.find(i => i.id === selectedIssueId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-300 shadow-2xl text-xs font-mono flex items-center space-x-2">
          <Zap size={14} className="text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert size={22} className="text-amber-400" />
            <span>"Why Did This Packet Fail?" Diagnostic Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated multi-layer troubleshooting assistant detecting physical, addressing, gateway, VLAN, and routing faults.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAutoRepair}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition text-xs font-mono"
          >
            <Wrench size={14} className="text-emerald-400" />
            <span>Auto-Remediate Faults</span>
          </button>

          <button
            onClick={() => onNavigate('topology', { topology })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
          >
            <Network size={14} className="text-cyan-400" />
            <span>Open in Canvas</span>
          </button>
        </div>
      </div>

      {/* Fault Injection Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
          <Bug size={16} className="text-red-400" />
          <span>Inject Test Faults (Simulate Real-World Breakage):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => injectFault('duplicate_ip')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-white"
          >
            + Duplicate IP Conflict
          </button>
          <button
            onClick={() => injectFault('wrong_gw')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white"
          >
            + Wrong Subnet Gateway
          </button>
          <button
            onClick={() => injectFault('cable_cut')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-white"
          >
            + Sever Switch Cable
          </button>
          <button
            onClick={() => injectFault('vlan_split')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white"
          >
            + VLAN Isolation Mismatch
          </button>
          <button
            onClick={() => injectFault('interface_down')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-white"
          >
            + Shutdown Interface
          </button>
          <button
            onClick={handleEvaluate}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold ml-auto"
          >
            Re-Analyze Network
          </button>
        </div>
      </div>

      {/* Main Diagnostic Output */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Issues List (1 col) */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
              <span>Detected Faults ({report.issues.length})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                report.overallHealthy ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
              }`}>
                {report.overallHealthy ? 'HEALTHY' : 'ANOMALIES FOUND'}
              </span>
            </div>

            {report.issues.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                <div className="font-bold text-white text-sm">Clean Network Health</div>
                <p className="text-slate-300 text-xs font-sans">
                  No IP conflicts, severed links, gateway mismatches, or VLAN isolation drops detected.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      selectedIssueId === issue.id
                        ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} />
                        <span className="font-semibold text-slate-200">{issue.title}</span>
                      </div>
                      <span className="text-[10px] uppercase text-slate-500">{issue.layer}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 truncate">
                      {issue.likelyCause}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Middle / Right: Diagnostic Deep Dive Card (2 cols) */}
          <div className="lg:col-span-2 space-y-4 font-mono text-xs">
            {selectedIssue ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                
                {/* Title & Severity Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{selectedIssue.layer}</span>
                    <h2 className="text-base font-bold text-white mt-0.5">{selectedIssue.title}</h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                    selectedIssue.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}>
                    {selectedIssue.severity} Fault
                  </span>
                </div>

                {/* Likely Cause */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">1. Probable Root Cause</div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed">
                    {selectedIssue.likelyCause}
                  </div>
                </div>

                {/* Technical Evidence */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">2. Technical Diagnostic Evidence</div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-mono leading-relaxed">
                    {selectedIssue.technicalEvidence}
                  </div>
                </div>

                {/* Remediation Action Plan */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">3. Step-by-Step Remediation</div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs font-sans leading-relaxed">
                    {selectedIssue.fixRecommendation}
                  </div>
                </div>

                {/* Educational Takeaway */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">4. Networking Concept & RFC Standard</div>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    {selectedIssue.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 space-y-2">
                <Info size={32} className="mx-auto text-slate-600" />
                <p>Select any diagnostic issue on the left to inspect technical evidence and remediation steps.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
