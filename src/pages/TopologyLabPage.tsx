import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Network, 
  Plus, 
  Trash2, 
  Activity, 
  ShieldAlert, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  RotateCw,
  Award, 
  Terminal, 
  Sliders, 
  Check, 
  Layers, 
  Share2, 
  Sparkles,
  RefreshCw,
  Box,
  Eye,
  FileCode,
  Copy,
  Zap,
  Info,
  Bug,
  HelpCircle,
  Play,
  Pause,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Radio
} from 'lucide-react';
import { NetworkTopology, NetworkDevice, NetworkConnection, DeviceType, PacketTraceResult } from '../types';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';
import { DeviceIcon } from '../components/DeviceIcon';
import { Network3DView } from '../components/Network3DView';
import { evaluateTopologyDesign } from '../utils/designScorer';
import { databaseService } from '../services/databaseService';
import { simulatePacketTrace } from '../utils/networkSimulator';
import { runDiagnostics, performNetworkAudit, AuditResult } from '../utils/diagnosticEngine';
import { isSameSubnet } from '../utils/subnetCalculator';

interface TopologyLabPageProps {
  initialTopology?: NetworkTopology;
  onNavigate: (page: string, meta?: any) => void;
}

interface NetworkEventItem {
  id: string;
  time: string;
  source: string;
  target?: string;
  protocol: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export const TopologyLabPage: React.FC<TopologyLabPageProps> = ({ initialTopology, onNavigate }) => {
  const [topology, setTopology] = useState<NetworkTopology>(initialTopology || PRESET_TOPOLOGIES[0]);
  
  // Undo/Redo History Stack
  const [history, setHistory] = useState<NetworkTopology[]>([initialTopology || PRESET_TOPOLOGIES[0]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Autosave State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'draft'>('saved');

  // Active Selections
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'ethernet' | 'fiber' | 'wireless'>('ethernet');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Modals & Drawers
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showWhatIfModal, setShowWhatIfModal] = useState<boolean>(false);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [explainMode, setExplainMode] = useState<'beginner' | 'student' | 'advanced'>('student');
  const [notification, setNotification] = useState<string | null>(null);

  // In-Canvas Packet Trace Simulation
  const [traceSourceId, setTraceSourceId] = useState<string>('');
  const [traceDestId, setTraceDestId] = useState<string>('');
  const [activeTraceResult, setActiveTraceResult] = useState<PacketTraceResult | null>(null);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  // Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedDeviceId, setDraggedDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Live Simulation Events Console
  const [events, setEvents] = useState<NetworkEventItem[]>([
    { id: 'ev-1', time: '10:21:00', source: 'SYSTEM', protocol: 'NET-LAB', description: 'Network Engine initialized & carrier links established.', status: 'info' },
    { id: 'ev-2', time: '10:21:01', source: 'TOPOLOGY', protocol: 'FIB', description: 'ARP cache & Layer 3 route tables converged.', status: 'success' },
  ]);
  const [isEventsPaused, setIsEventsPaused] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const selectedDevice = topology.devices.find(d => d.id === selectedDeviceId) || null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addEvent = (source: string, protocol: string, description: string, status: 'info' | 'success' | 'warning' | 'error' = 'info', target?: string) => {
    if (isEventsPaused) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newEv: NetworkEventItem = {
      id: `ev-${Date.now()}-${Math.random()}`,
      time: timeStr,
      source,
      target,
      protocol,
      description,
      status
    };
    setEvents(prev => [newEv, ...prev.slice(0, 49)]); // Keep last 50 events
  };

  // State updater that records undo/redo history and triggers debounced autosave
  const updateTopologyState = useCallback((newTop: NetworkTopology | ((prev: NetworkTopology) => NetworkTopology)) => {
    setTopology(prev => {
      const nextTop = typeof newTop === 'function' ? newTop(prev) : newTop;
      setHistory(h => {
        const sliced = h.slice(0, historyIndex + 1);
        return [...sliced, nextTop];
      });
      setHistoryIndex(prevIdx => prevIdx + 1);
      setSaveStatus('saving');
      return nextTop;
    });
  }, [historyIndex]);

  // Debounced Auto-save to Local Storage / Database
  useEffect(() => {
    if (saveStatus === 'saving') {
      const timer = setTimeout(() => {
        databaseService.saveTopology(topology);
        setSaveStatus('saved');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [topology, saveStatus]);

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setTopology(history[prevIdx]);
      showToast('Undo');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setTopology(history[nextIdx]);
      showToast('Redo');
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // IPAM Helper: Suggest next available IP in subnet
  const getSuggestedIp = (type: DeviceType): string => {
    const usedIps = new Set(topology.devices.map(d => d.ip).filter(Boolean));
    if (type === 'router') {
      if (!usedIps.has('192.168.1.1')) return '192.168.1.1';
      for (let i = 2; i < 254; i++) {
        const ip = `192.168.${i}.1`;
        if (!usedIps.has(ip)) return ip;
      }
    }
    if (type === 'server') {
      for (let i = 100; i < 200; i++) {
        const ip = `192.168.1.${i}`;
        if (!usedIps.has(ip)) return ip;
      }
    }
    for (let i = 10; i < 254; i++) {
      const ip = `192.168.1.${i}`;
      if (!usedIps.has(ip)) return ip;
    }
    return '192.168.1.50';
  };

  // Add Device
  const handleAddDevice = (type: DeviceType) => {
    const id = `dev-${type}-${Date.now()}`;
    const count = topology.devices.filter(d => d.type === type).length + 1;
    const name = `${type.toUpperCase()}-${count}`;
    const suggestedIp = type === 'switch' ? '' : getSuggestedIp(type);

    const newDev: NetworkDevice = {
      id,
      name,
      type,
      x: 120 + Math.random() * 380,
      y: 120 + Math.random() * 220,
      ip: suggestedIp,
      subnetMask: suggestedIp ? '255.255.255.0' : undefined,
      gateway: (type === 'pc' || type === 'laptop' || type === 'server') ? '192.168.1.1' : undefined,
      mac: `00:50:56:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
      status: 'up'
    };

    updateTopologyState(prev => ({
      ...prev,
      devices: [...prev.devices, newDev]
    }));
    setSelectedDeviceId(id);
    addEvent(name, 'ARP', `Host joined layer-2 segment with MAC ${newDev.mac} and IP ${suggestedIp || 'Unassigned'}`, 'info');
    showToast(`Added ${name} (${suggestedIp || 'Layer 2'})`);
  };

  // Connect Nodes
  const handleDeviceClick = (dev: NetworkDevice) => {
    if (connectingSourceId) {
      if (connectingSourceId === dev.id) {
        setConnectingSourceId(null);
        return;
      }
      const exists = topology.connections.some(c => 
        (c.sourceDeviceId === connectingSourceId && c.targetDeviceId === dev.id) ||
        (c.sourceDeviceId === dev.id && c.targetDeviceId === connectingSourceId)
      );

      if (exists) {
        showToast('Link already exists between these devices');
        setConnectingSourceId(null);
        return;
      }

      const srcDev = topology.devices.find(d => d.id === connectingSourceId);
      const newConn: NetworkConnection = {
        id: `conn-${Date.now()}`,
        sourceDeviceId: connectingSourceId,
        targetDeviceId: dev.id,
        type: connectionType,
        status: 'up'
      };

      updateTopologyState(prev => ({
        ...prev,
        connections: [...prev.connections, newConn]
      }));
      addEvent(srcDev?.name || 'LINK', 'PHY', `Physical link established with ${dev.name} via ${connectionType.toUpperCase()}`, 'success');
      showToast(`Linked ${srcDev?.name} ↔ ${dev.name} (${connectionType})`);
      setConnectingSourceId(null);
    } else {
      setSelectedDeviceId(dev.id);
    }
  };

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent, dev: NetworkDevice) => {
    if (connectingSourceId) return;
    setIsDragging(true);
    setDraggedDeviceId(dev.id);
    setSelectedDeviceId(dev.id);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) - dev.x,
        y: (e.clientY - rect.top) - dev.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedDeviceId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = Math.max(40, Math.min(rect.width - 40, (e.clientX - rect.left) - dragOffset.x));
    const newY = Math.max(40, Math.min(rect.height - 40, (e.clientY - rect.top) - dragOffset.y));

    setTopology(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === draggedDeviceId ? { ...d, x: newX, y: newY } : d)
    }));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedDeviceId(null);
      // Save position into history
      updateTopologyState(topology);
    }
  };

  // Update Device Props
  const handleUpdateSelectedDevice = (fields: Partial<NetworkDevice>) => {
    if (!selectedDeviceId) return;
    updateTopologyState(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === selectedDeviceId ? { ...d, ...fields } : d)
    }));
  };

  // Delete Node
  const handleDeleteSelected = () => {
    if (!selectedDeviceId) return;
    const dev = topology.devices.find(d => d.id === selectedDeviceId);
    updateTopologyState(prev => ({
      ...prev,
      devices: prev.devices.filter(d => d.id !== selectedDeviceId),
      connections: prev.connections.filter(c => c.sourceDeviceId !== selectedDeviceId && c.targetDeviceId !== selectedDeviceId)
    }));
    addEvent(dev?.name || 'NODE', 'TOPOLOGY', `Removed device & disconnected physical carrier links`, 'warning');
    setSelectedDeviceId(null);
    showToast('Deleted node & links');
  };

  // Run Packet Trace directly from topology
  const handleRunInCanvasTrace = () => {
    if (!traceSourceId || !traceDestId) {
      showToast('Select both Source and Destination nodes');
      return;
    }
    const result = simulatePacketTrace(topology, traceSourceId, traceDestId, 'ICMP');
    setActiveTraceResult(result);
    setIsTracing(true);
    setActiveHopIndex(0);

    const src = topology.devices.find(d => d.id === traceSourceId);
    const dst = topology.devices.find(d => d.id === traceDestId);
    addEvent(src?.name || 'SRC', 'ICMP', `Initiated echo request (ping) to ${dst?.name || 'DST'}`, 'info', dst?.name);

    if (!result.success) {
      addEvent(src?.name || 'SRC', 'DROP', `Packet dropped: ${result.failureReason || result.summary}`, 'error');
    } else {
      addEvent(dst?.name || 'DST', 'ICMP-REPLY', `Echo reply received (${result.totalHops} hops, RTT ~${result.totalHops * 4}ms)`, 'success');
    }
  };

  // Step-through Trace animation
  useEffect(() => {
    if (isTracing && activeTraceResult && activeHopIndex >= 0) {
      if (activeHopIndex < activeTraceResult.hops.length - 1) {
        const timer = setTimeout(() => {
          setActiveHopIndex(prev => prev + 1);
          const currentHop = activeTraceResult.hops[activeHopIndex + 1];
          addEvent(currentHop.deviceName, currentHop.layer, currentHop.action + ': ' + currentHop.explanation, currentHop.status === 'dropped' ? 'error' : 'info');
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setIsTracing(false);
      }
    }
  }, [isTracing, activeTraceResult, activeHopIndex]);

  // Break the Network: Inject Hidden Fault
  const handleBreakNetwork = (fault: 'duplicate_ip' | 'wrong_gw' | 'cable_cut' | 'vlan_split' | 'interface_down') => {
    let updated = { ...topology };
    if (fault === 'duplicate_ip' && updated.devices.length >= 2) {
      updated.devices = updated.devices.map((d, i) => i === 1 ? { ...d, ip: updated.devices[0].ip } : d);
      addEvent('FAULT_INJECTOR', 'ARP_CONFLICT', 'Duplicate IP address injected into segment', 'error');
      showToast('⚠️ Problem Injected: Network anomaly simulated! Diagnose the fault.');
    } else if (fault === 'wrong_gw' && updated.devices.length >= 1) {
      updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, gateway: '10.99.99.1' } : d);
      addEvent('FAULT_INJECTOR', 'ROUTING', 'Invalid gateway subnet configured on workstation', 'error');
      showToast('⚠️ Problem Injected: Gateway mismatch injected!');
    } else if (fault === 'cable_cut' && updated.connections.length >= 1) {
      updated.connections = updated.connections.map((c, i) => i === 0 ? { ...c, status: 'down' } : c);
      addEvent('FAULT_INJECTOR', 'PHYSICAL', 'Cable severed (Carrier Loss)', 'error');
      showToast('⚠️ Problem Injected: Physical link cut!');
    } else if (fault === 'vlan_split' && updated.devices.length >= 2) {
      updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, vlan: 10 } : i === 1 ? { ...d, vlan: 20 } : d);
      addEvent('FAULT_INJECTOR', 'VLAN', 'VLAN 802.1Q broadcast isolation mismatch injected', 'error');
      showToast('⚠️ Problem Injected: VLAN isolation mismatch!');
    } else if (fault === 'interface_down' && updated.devices.length >= 1) {
      updated.devices = updated.devices.map((d, i) => i === 0 ? { ...d, status: 'down' } : d);
      addEvent('FAULT_INJECTOR', 'INTERFACE', 'Interface administratively shutdown', 'error');
      showToast('⚠️ Problem Injected: Interface disabled!');
    }
    updateTopologyState(updated);
  };

  // What-If Impact Calculation
  const calculateWhatIfImpact = (failedNodeId: string) => {
    const failedDev = topology.devices.find(d => d.id === failedNodeId);
    if (!failedDev) return { affectedDevices: [], affectedVlans: [], isolatedCount: 0 };

    const connectedConn = topology.connections.filter(c => c.sourceDeviceId === failedNodeId || c.targetDeviceId === failedNodeId);
    const directNeighborIds = connectedConn.map(c => c.sourceDeviceId === failedNodeId ? c.targetDeviceId : c.sourceDeviceId);
    const affectedDevices = topology.devices.filter(d => directNeighborIds.includes(d.id));
    const affectedVlans = Array.from(new Set(affectedDevices.map(d => d.vlan).filter(Boolean)));

    return {
      failedDevice: failedDev,
      affectedDevices,
      affectedVlans,
      isolatedCount: affectedDevices.length
    };
  };

  // IP Validation for Inspector
  const getIpValidation = (dev: NetworkDevice) => {
    if (!dev.ip) return null;
    const duplicates = topology.devices.filter(d => d.id !== dev.id && d.ip === dev.ip);
    if (duplicates.length > 0) {
      return { status: 'error', text: `Duplicate IP! Already assigned to ${duplicates[0].name}.` };
    }
    if (dev.ip.endsWith('.0') && dev.subnetMask === '255.255.255.0') {
      return { status: 'error', text: 'Invalid IP: Reserved Network ID address.' };
    }
    if (dev.ip.endsWith('.255') && dev.subnetMask === '255.255.255.0') {
      return { status: 'error', text: 'Invalid IP: Reserved Broadcast address.' };
    }
    if (dev.gateway && dev.subnetMask) {
      const inSame = isSameSubnet(dev.ip, dev.gateway, dev.subnetMask);
      if (!inSame) {
        return { status: 'warning', text: `Default gateway ${dev.gateway} is on a different subnet than ${dev.ip}!` };
      }
    }
    return { status: 'success', text: 'Valid unique host IP in subnet.' };
  };

  const ipValidation = selectedDevice ? getIpValidation(selectedDevice) : null;
  const designScore = evaluateTopologyDesign(topology);
  const auditReport: AuditResult = performNetworkAudit(topology);

  // Active Hop node highlight during trace
  const currentHopDeviceId = activeTraceResult && activeHopIndex >= 0 && activeHopIndex < activeTraceResult.hops.length
    ? activeTraceResult.hops[activeHopIndex].deviceId
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 shadow-2xl text-xs font-mono flex items-center space-x-2 animate-bounce">
          <Zap size={14} className="text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & NOC Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Network size={22} className="text-cyan-400" />
              <span>Network Topology Operations Center</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
              {topology.devices.length} Nodes • {topology.connections.length} Links
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold flex items-center space-x-1 ${
              saveStatus === 'saved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
              saveStatus === 'saving' ? 'bg-amber-950 text-amber-400 border border-amber-800/50 animate-pulse' :
              'bg-slate-800 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{saveStatus === 'saved' ? 'Auto-Saved' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build topologies, configure IPv4/VLANs, inject realistic faults, trace packets, and audit design resilience.
          </p>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Preset Selector */}
          <select
            onChange={(e) => {
              const found = PRESET_TOPOLOGIES.find(p => p.id === e.target.value);
              if (found) {
                updateTopologyState(found);
                setSelectedDeviceId(null);
                showToast(`Loaded "${found.name}"`);
              }
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">Load Preset Scenario...</option>
            {PRESET_TOPOLOGIES.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Undo / Redo */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <RotateCw size={14} />
            </button>
          </div>

          {/* 2D / 3D Mode Toggle */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 rounded text-xs font-mono ${viewMode === '2d' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === '3d' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Box size={12} />
              <span>3D</span>
            </button>
          </div>

          {/* Explain Network */}
          <button
            onClick={() => setShowExplainModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition font-mono"
          >
            <HelpCircle size={13} className="text-cyan-400" />
            <span>Explain</span>
          </button>

          {/* Design Score Badge Button */}
          <button
            onClick={() => setShowScoreModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 transition font-mono"
          >
            <Award size={14} className="text-indigo-400" />
            <span>Score: <strong className="text-white">{designScore.score}/100</strong></span>
          </button>
        </div>
      </div>

      {/* Main Workspace 3-Column Layout: Left Palette, Center Canvas, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Center & Left (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Device Toolbox Palette with Categories */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-1.5 font-mono text-slate-400">
              <Plus size={14} className="text-cyan-400" />
              <span>Add Node:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['pc', 'laptop', 'server', 'switch', 'router', 'access_point', 'firewall', 'internet'] as DeviceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddDevice(type)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-200 transition font-mono capitalize"
                >
                  <DeviceIcon type={type} size={14} className="text-cyan-400" />
                  <span>{type.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Link Connection Mode Bar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-300"
              >
                <option value="ethernet">Ethernet (Cat6)</option>
                <option value="fiber">Fiber (10G SFP+)</option>
                <option value="wireless">Wireless 802.11ax</option>
              </select>

              <button
                onClick={() => {
                  if (connectingSourceId) {
                    setConnectingSourceId(null);
                  } else if (selectedDeviceId) {
                    setConnectingSourceId(selectedDeviceId);
                    showToast('Click target node to connect link');
                  } else {
                    showToast('Select a source node first');
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                  connectingSourceId 
                    ? 'bg-amber-500 text-slate-950 font-bold animate-pulse' 
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {connectingSourceId ? 'Click Target...' : 'Link Node'}
              </button>
            </div>
          </div>

          {/* Interactive Topology Viewport */}
          {viewMode === '3d' ? (
            <Network3DView 
              topology={topology} 
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(dev) => setSelectedDeviceId(dev.id)}
            />
          ) : (
            <div className="relative w-full h-[520px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
              {/* Grid dots background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

              {/* Floating in-canvas Trace Bar */}
              <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800/90 backdrop-blur text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Activity size={14} className="text-cyan-400" />
                  <span className="text-slate-300 font-bold">Trace Packet:</span>
                  <select
                    value={traceSourceId}
                    onChange={(e) => setTraceSourceId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                  >
                    <option value="">Source Node...</option>
                    {topology.devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.ip || 'No IP'})</option>
                    ))}
                  </select>
                  <span className="text-slate-500">→</span>
                  <select
                    value={traceDestId}
                    onChange={(e) => setTraceDestId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                  >
                    <option value="">Destination Node...</option>
                    {topology.devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.ip || 'No IP'})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleRunInCanvasTrace}
                    disabled={!traceSourceId || !traceDestId}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold transition flex items-center space-x-1"
                  >
                    <Play size={11} />
                    <span>Run Trace</span>
                  </button>
                </div>

                {/* Quick Diagnostics / Break Dropdown */}
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition text-[11px]">
                      <Bug size={12} />
                      <span>Break Network</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1 z-30 space-y-1">
                      <button onClick={() => handleBreakNetwork('duplicate_ip')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white">Duplicate IP</button>
                      <button onClick={() => handleBreakNetwork('wrong_gw')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white">Wrong Subnet Gateway</button>
                      <button onClick={() => handleBreakNetwork('cable_cut')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white">Physical Cable Cut</button>
                      <button onClick={() => handleBreakNetwork('vlan_split')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white">VLAN Mismatch</button>
                      <button onClick={() => handleBreakNetwork('interface_down')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white">Interface Shutdown</button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowWhatIfModal(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 transition text-[11px]"
                  >
                    <ShieldAlert size={12} />
                    <span>What-If?</span>
                  </button>

                  <button
                    onClick={() => setShowAuditModal(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 transition text-[11px]"
                  >
                    <FileText size={12} />
                    <span>Audit</span>
                  </button>
                </div>
              </div>

              {/* SVG Canvas for links and nodes */}
              <svg
                ref={svgRef}
                className="w-full h-full cursor-crosshair select-none pt-12"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* Connections Lines */}
                {topology.connections.map((conn) => {
                  const src = topology.devices.find(d => d.id === conn.sourceDeviceId);
                  const tgt = topology.devices.find(d => d.id === conn.targetDeviceId);
                  if (!src || !tgt) return null;

                  const isDown = conn.status === 'down' || src.status === 'down' || tgt.status === 'down';
                  const strokeColor = isDown ? '#ef4444' : conn.type === 'fiber' ? '#06b6d4' : conn.type === 'wireless' ? '#a855f7' : '#10b981';

                  return (
                    <g key={conn.id} className="transition-all">
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={conn.type === 'fiber' ? 3 : 2}
                        strokeDasharray={conn.type === 'wireless' ? '4 4' : undefined}
                        strokeOpacity={0.75}
                      />
                      {/* Connection mid-point status toggle */}
                      <circle
                        cx={(src.x + tgt.x) / 2}
                        cy={(src.y + tgt.y) / 2}
                        r={5}
                        fill={isDown ? '#ef4444' : strokeColor}
                        className="cursor-pointer hover:r-7 transition-all"
                        onClick={() => {
                          const newStatus = conn.status === 'up' ? 'down' : 'up';
                          updateTopologyState(prev => ({
                            ...prev,
                            connections: prev.connections.map(c => c.id === conn.id ? { ...c, status: newStatus } : c)
                          }));
                          addEvent('LINK', 'PHY', `Link ${src.name} ↔ ${tgt.name} changed status to ${newStatus.toUpperCase()}`, newStatus === 'up' ? 'success' : 'error');
                          showToast(`Link toggled ${newStatus.toUpperCase()}`);
                        }}
                      />
                    </g>
                  );
                })}

                {/* Nodes / Devices */}
                {topology.devices.map((dev) => {
                  const isSelected = dev.id === selectedDeviceId;
                  const isConnecting = dev.id === connectingSourceId;
                  const isDown = dev.status === 'down';
                  const isCurrentHop = dev.id === currentHopDeviceId;

                  return (
                    <g
                      key={dev.id}
                      transform={`translate(${dev.x}, ${dev.y})`}
                      className="cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => handleMouseDown(e, dev)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceClick(dev);
                      }}
                    >
                      {/* Active Packet Hop Highlight Animation */}
                      {isCurrentHop && (
                        <circle
                          r={34}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          className="animate-ping opacity-75"
                        />
                      )}

                      {/* Selection Aura */}
                      {isSelected && (
                        <circle
                          r={28}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Device Circle Body */}
                      <circle
                        r={20}
                        fill={isDown ? '#450a0a' : isCurrentHop ? '#0284c7' : isSelected ? '#0369a1' : '#0f172a'}
                        stroke={isDown ? '#ef4444' : isCurrentHop ? '#38bdf8' : isSelected ? '#38bdf8' : '#334155'}
                        strokeWidth={2}
                        className="transition-colors hover:stroke-cyan-400"
                      />

                      {/* Icon */}
                      <foreignObject x={-10} y={-10} width={20} height={20} className="pointer-events-none">
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <DeviceIcon type={dev.type} size={16} className={isDown ? 'text-red-400' : isCurrentHop ? 'text-white' : isSelected ? 'text-cyan-300' : 'text-slate-300'} />
                        </div>
                      </foreignObject>

                      {/* Hostname & IP */}
                      <text
                        y={32}
                        textAnchor="middle"
                        className="text-[11px] font-mono fill-slate-200 font-semibold pointer-events-none"
                      >
                        {dev.name}
                      </text>
                      {dev.ip && (
                        <text
                          y={44}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-cyan-400 pointer-events-none"
                        >
                          {dev.ip}
                        </text>
                      )}
                      {dev.vlan && (
                        <text
                          y={-24}
                          textAnchor="middle"
                          className="text-[8px] font-mono fill-purple-400 pointer-events-none bg-purple-950"
                        >
                          VLAN {dev.vlan}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Bottom Canvas Quick Status Bar */}
              <div className="absolute bottom-3 left-3 flex items-center space-x-2 text-[11px] font-mono bg-slate-900/90 border border-slate-800/90 px-3 py-1.5 rounded-xl backdrop-blur text-slate-400">
                <span>Tip: Drag nodes to position • Click midpoint to cut/restore link • Click node to configure</span>
              </div>
            </div>
          )}

          {/* Bottom Live Simulation & Event Console */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase tracking-wider">Live Network Events Console</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEventsPaused(!isEventsPaused)}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                >
                  {isEventsPaused ? <Play size={12} className="inline mr-1 text-emerald-400" /> : <Pause size={12} className="inline mr-1 text-amber-400" />}
                  <span>{isEventsPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={() => setEvents([])}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="h-32 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px]">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start space-x-2">
                  <span className="text-slate-500 shrink-0">{ev.time}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                    ev.status === 'error' ? 'bg-red-950 text-red-400 border border-red-800/60' :
                    ev.status === 'warning' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                    ev.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                    'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                  }`}>
                    {ev.protocol}
                  </span>
                  <span className="font-semibold text-slate-300 shrink-0">{ev.source}{ev.target ? ` → ${ev.target}` : ''}:</span>
                  <span className="text-slate-400 truncate">{ev.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Selected Device Inspector & Configuration (1 Column) */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders size={16} className="text-cyan-400" />
                <span className="font-bold text-white">Device Inspector</span>
              </div>
              {selectedDevice && (
                <button
                  onClick={handleDeleteSelected}
                  className="p-1 rounded text-red-400 hover:bg-red-950/50 transition"
                  title="Delete Device"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {selectedDevice ? (
              <div className="space-y-3">
                {/* Hostname */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Device Hostname</label>
                  <input
                    type="text"
                    value={selectedDevice.name}
                    onChange={(e) => handleUpdateSelectedDevice({ name: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Interface State:</span>
                  <button
                    onClick={() => {
                      const newStatus = selectedDevice.status === 'up' ? 'down' : 'up';
                      handleUpdateSelectedDevice({ status: newStatus });
                      addEvent(selectedDevice.name, 'IFACE', `Interface state set to ${newStatus.toUpperCase()}`, newStatus === 'up' ? 'success' : 'error');
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                      selectedDevice.status === 'up' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-red-950 text-red-400 border border-red-800/60'
                    }`}
                  >
                    {selectedDevice.status === 'up' ? 'UP (Active)' : 'DOWN (Failed)'}
                  </button>
                </div>

                {/* IP Address + Validation Feedback */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase">
                    <span>IPv4 Address</span>
                    <button
                      onClick={() => handleUpdateSelectedDevice({ ip: getSuggestedIp(selectedDevice.type) })}
                      className="text-cyan-400 hover:underline capitalize"
                    >
                      Suggest IP
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.10"
                    value={selectedDevice.ip || ''}
                    onChange={(e) => handleUpdateSelectedDevice({ ip: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                  {ipValidation && (
                    <div className={`mt-1 text-[10px] flex items-center space-x-1 ${
                      ipValidation.status === 'error' ? 'text-red-400' : ipValidation.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {ipValidation.status === 'error' ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                      <span>{ipValidation.text}</span>
                    </div>
                  )}
                </div>

                {/* Subnet Mask */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Subnet Mask</label>
                  <input
                    type="text"
                    placeholder="255.255.255.0"
                    value={selectedDevice.subnetMask || ''}
                    onChange={(e) => handleUpdateSelectedDevice({ subnetMask: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                {/* Default Gateway */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Default Gateway</label>
                  <input
                    type="text"
                    placeholder="192.168.1.1"
                    value={selectedDevice.gateway || ''}
                    onChange={(e) => handleUpdateSelectedDevice({ gateway: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                {/* VLAN Tag */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">802.1Q VLAN ID</label>
                  <input
                    type="number"
                    placeholder="e.g. 10 (Optional)"
                    value={selectedDevice.vlan || ''}
                    onChange={(e) => handleUpdateSelectedDevice({ vlan: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-purple-300 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                {/* MAC Address */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Hardware MAC (L2)</label>
                  <div className="mt-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[11px] truncate">
                    {selectedDevice.mac || 'Auto-generated'}
                  </div>
                </div>

                {/* Quick Actions for Selected Node */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNavigate('terminal', { topology, deviceId: selectedDevice.id })}
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 text-[11px]"
                  >
                    <Terminal size={12} />
                    <span>CLI Console</span>
                  </button>
                  <button
                    onClick={() => {
                      setTraceSourceId(selectedDevice.id);
                      showToast(`Set ${selectedDevice.name} as Trace Source`);
                    }}
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 text-[11px]"
                  >
                    <Activity size={12} />
                    <span>Set Source</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Info size={28} className="mx-auto text-slate-600" />
                <p>Click any device node on canvas to configure IP, Subnet Mask, Gateway, and VLAN parameters.</p>
              </div>
            )}
          </div>

          {/* Quick Design Evaluation Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-bold text-white">Topology Health</span>
              <span className="text-cyan-400 font-bold">{designScore.score}/100</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${designScore.score > 80 ? 'bg-emerald-500' : designScore.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${designScore.score}%` }}
              />
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              {designScore.recommendations.slice(0, 2).map((f, i) => (
                <div key={i} className="flex items-start space-x-1.5">
                  <span className="text-cyan-400">•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: EXPLAIN THIS NETWORK (Beginner / Student / Advanced) */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <HelpCircle size={18} className="text-cyan-400" />
                <span>Explain This Network Architecture</span>
              </h3>
              <button onClick={() => setShowExplainModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
              {(['beginner', 'student', 'advanced'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setExplainMode(m)}
                  className={`flex-1 py-1.5 rounded text-xs capitalize ${
                    explainMode === m ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m} Mode
                </button>
              ))}
            </div>

            {/* Explanation Body generated from real topology data */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-sans text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
              {explainMode === 'beginner' && (
                <div className="space-y-2">
                  <p><strong>Overview:</strong> This network contains <strong>{topology.devices.length} computers/devices</strong> connected by <strong>{topology.connections.length} cables</strong>.</p>
                  <p><strong>Traffic Path:</strong> End devices like PCs talk to Switches to share files locally. If they need to reach outside servers or the internet, they forward traffic to the Router (Gateway).</p>
                  <p><strong>Active Nodes:</strong> {topology.devices.map(d => d.name).join(', ')}.</p>
                </div>
              )}

              {explainMode === 'student' && (
                <div className="space-y-2">
                  <p><strong>Layer 2 Architecture:</strong> Ethernet frames are switched via CAM tables and MAC addresses. Broadcast domains are segmented with 802.1Q tags (VLANs present: {Array.from(new Set(topology.devices.map(d => d.vlan).filter(Boolean))).join(', ') || 'Default VLAN 1'}).</p>
                  <p><strong>Layer 3 Addressing:</strong> Subnets are routed via default gateways. Host IP ranges are verified against subnet masks (e.g. 255.255.255.0 /24).</p>
                  <p><strong>Routing Boundaries:</strong> Routers decrement IPv4 TTL fields and perform Longest Prefix Match (LPM) lookups in the FIB.</p>
                </div>
              )}

              {explainMode === 'advanced' && (
                <div className="space-y-2 font-mono text-[11px]">
                  <div>• <strong>Topology Density:</strong> {topology.devices.length} nodes, {topology.connections.length} edges (Biconnected: {topology.connections.length >= topology.devices.length ? 'YES' : 'NO - Single Points of Failure Exist'}).</div>
                  <div>• <strong>CIDR & IPAM Allocations:</strong> {Array.from(new Set(topology.devices.map(d => d.ip?.split('.').slice(0, 3).join('.') + '.0/24').filter(Boolean))).join(', ')}</div>
                  <div>• <strong>Security Boundaries:</strong> {topology.devices.some(d => d.type === 'firewall') ? 'Firewall stateful boundary present' : 'Unsegmented flat edge (No inline firewall)'}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Close Explainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WHAT-IF BLAST RADIUS ANALYSIS */}
      {showWhatIfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <span>What-If? Failure & Blast Radius Simulator</span>
              </h3>
              <button onClick={() => setShowWhatIfModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-400 text-xs font-sans">
              Select any infrastructure device to simulate catastrophic failure and calculate affected hosts, broken paths, and lost VLANs.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase">Select Target Device to Fail</label>
              <select
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                value={selectedDeviceId || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              >
                <option value="">Choose Device...</option>
                {topology.devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {selectedDeviceId && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                {(() => {
                  const impact = calculateWhatIfImpact(selectedDeviceId);
                  return (
                    <div className="space-y-2">
                      <div className="text-amber-400 font-bold">Simulated Failure: {impact.failedDevice?.name}</div>
                      <div className="text-slate-300">
                        • <strong>Directly Affected Nodes ({impact.isolatedCount}):</strong> {impact.affectedDevices.map(d => d.name).join(', ') || 'None'}
                      </div>
                      <div className="text-slate-300">
                        • <strong>Impacted VLAN Broadcast Domains:</strong> {impact.affectedVlans.join(', ') || 'VLAN 1 (Default)'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Redundancy Recommendation: Introduce redundant uplink trunk or secondary VRRP/HSRP gateway.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWhatIfModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Close Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NETWORK AUDIT REPORT */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText size={18} className="text-indigo-400" />
                <span>Automated Network Architecture Audit</span>
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60">
                <div className="text-xl font-bold text-red-400">{auditReport.criticalCount}</div>
                <div className="text-[10px] text-slate-400 uppercase">Critical</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
                <div className="text-xl font-bold text-amber-400">{auditReport.warningCount}</div>
                <div className="text-[10px] text-slate-400 uppercase">Warnings</div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
                <div className="text-xl font-bold text-cyan-400">{auditReport.infoCount}</div>
                <div className="text-[10px] text-slate-400 uppercase">Informational</div>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {auditReport.findings.map(f => (
                <div key={f.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{f.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      f.severity === 'critical' ? 'bg-red-950 text-red-400' :
                      f.severity === 'warning' ? 'bg-amber-950 text-amber-400' : 'bg-cyan-950 text-cyan-400'
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-sans">{f.description}</p>
                  <div className="text-emerald-400 text-[11px]">Fix: {f.recommendation}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DESIGN QUALITY SCORE */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award size={18} className="text-indigo-400" />
                <span>NET-LAB Architecture Evaluation</span>
              </h3>
              <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-3xl font-extrabold text-indigo-400">{designScore.score}/100</div>
              <div className="text-xs text-slate-400 mt-1">Design Quality & Best Practices Index (Grade {designScore.grade})</div>
            </div>

            <div className="space-y-2">
              {Object.entries(designScore.categoryScores).map(([category, catObj]) => (
                <div key={category} className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="capitalize text-slate-300">{category}</span>
                  <span className="font-bold text-cyan-400">{catObj.score} / {catObj.max} pts</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-slate-400 pt-2 border-t border-slate-800">
              <div className="font-semibold text-slate-200">Recommendations:</div>
              {designScore.recommendations.map((item, idx) => (
                <div key={idx} className="text-[11px] flex items-start space-x-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
