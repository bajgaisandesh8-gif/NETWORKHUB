import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, Network, Shield, HelpCircle, CornerDownLeft } from 'lucide-react';
import { NetworkTopology } from '../types';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';
import { executeSimulatedCommand } from '../utils/terminalSimulator';

interface TerminalPageProps {
  topology?: NetworkTopology;
  selectedDeviceId?: string;
  onNavigate: (page: string, meta?: any) => void;
}

export const TerminalPage: React.FC<TerminalPageProps> = ({ 
  topology: propTopology, 
  selectedDeviceId: propDeviceId,
  onNavigate 
}) => {
  const [topology] = useState<NetworkTopology>(propTopology || PRESET_TOPOLOGIES[0]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(propDeviceId || topology.devices[0]?.id || '');
  const [inputCommand, setInputCommand] = useState<string>('');
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([
    {
      command: 'sysinfo',
      output: 'NET-LAB Simulated Command Engine v1.0\nType "help" to view supported networking commands (ping, traceroute, ipconfig, arp -a, route print, etc.).'
    }
  ]);
  const [commandHistoryList, setCommandHistoryList] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecute = (cmdToRun?: string) => {
    const cmd = cmdToRun || inputCommand.trim();
    if (!cmd) return;

    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setHistory([]);
      setInputCommand('');
      return;
    }

    const output = executeSimulatedCommand(cmd, selectedDeviceId, topology);
    setHistory(prev => [...prev, { command: cmd, output }]);
    setCommandHistoryList(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      if (commandHistoryList.length > 0) {
        const nextIdx = Math.min(commandHistoryList.length - 1, historyIndex + 1);
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistoryList[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistoryList[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const selectedDevice = topology.devices.find(d => d.id === selectedDeviceId) || topology.devices[0];

  const quickCommands = [
    'ipconfig /all',
    'ping 8.8.8.8',
    'traceroute 8.8.8.8',
    'arp -a',
    'route print',
    'diagnose',
    'help'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <TerminalIcon size={22} className="text-cyan-400" />
            <span>Simulated Network CLI Terminal Console</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute safe interactive networking commands on any node in your topology.
          </p>
        </div>

        {/* Device Switcher & Actions */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <label className="text-slate-400">Node Console:</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
          >
            {topology.devices.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.ip || 'No IP'})</option>
            ))}
          </select>

          <button
            onClick={() => onNavigate('topology')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            Topology Canvas
          </button>
        </div>
      </div>

      {/* Quick Command Bar */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-500 text-[10px] uppercase">Quick Snippets:</span>
        {quickCommands.map(cmd => (
          <button
            key={cmd}
            onClick={() => handleExecute(cmd)}
            className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition"
          >
            {cmd}
          </button>
        ))}
        <button
          onClick={() => setHistory([])}
          className="ml-auto text-slate-500 hover:text-red-400 p-1"
          title="Clear Console"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Terminal Viewport Container */}
      <div className="w-full h-[520px] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 font-mono text-xs flex flex-col justify-between overflow-hidden">
        
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900 text-slate-500 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-slate-400 font-semibold">{selectedDevice?.name || 'terminal'}@netlab:~$</span>
          </div>
          <div>NET-LAB Terminal Engine</div>
        </div>

        {/* Scrollable Logs Output */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          {history.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <span className="text-slate-600">$</span>
                <span>{item.command}</span>
              </div>
              <pre className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed pl-4 border-l border-slate-900">
                {item.output}
              </pre>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-900 flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">{selectedDevice?.name || 'node'}&gt;</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command (e.g. ping 8.8.8.8, traceroute 192.168.1.1, ipconfig)..."
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs"
          />
          <button
            onClick={() => handleExecute()}
            className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
          >
            <CornerDownLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
