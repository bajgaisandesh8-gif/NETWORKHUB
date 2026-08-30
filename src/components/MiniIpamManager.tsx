import React, { useState } from 'react';
import { 
  Network, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Server, 
  User, 
  Cpu, 
  Lock,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { IpamNetwork, IpamAllocation, UserProject, SecurityZone, DeviceType } from '../types';
import { 
  calculateSubnet, 
  suggestNextAvailableIp, 
  validateIpAssignment, 
  cidrToMask 
} from '../utils/subnetCalculator';
import { databaseService } from '../services/databaseService';

interface MiniIpamManagerProps {
  project: UserProject;
  onUpdateProject: (fields: Partial<UserProject>) => void;
  onShowToast: (msg: string) => void;
}

export const MiniIpamManager: React.FC<MiniIpamManagerProps> = ({
  project,
  onUpdateProject,
  onShowToast
}) => {
  const ipamNetworks = project.ipamNetworks || [];
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(ipamNetworks[0]?.id || '');
  const [isAddSubnetModalOpen, setIsAddSubnetModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);

  // New Subnet Form
  const [newSubnetName, setNewSubnetName] = useState('VOIP-PHONES');
  const [newVlanId, setNewVlanId] = useState<number>(40);
  const [newNetworkIp, setNewNetworkIp] = useState('10.10.40.0');
  const [newCidr, setNewCidr] = useState<number>(24);
  const [newGateway, setNewGateway] = useState('10.10.40.1');
  const [newSecurityZone, setNewSecurityZone] = useState<SecurityZone>('Internal');
  const [newDescription, setNewDescription] = useState('VoIP phones and PBX voice traffic');

  // Allocation Form
  const [allocHostname, setAllocHostname] = useState('staff-ws02');
  const [allocDeviceType, setAllocDeviceType] = useState<DeviceType>('pc');
  const [allocPurpose, setAllocPurpose] = useState('Marketing dept workstation');
  const [manualIp, setManualIp] = useState('');
  const [useAutoSuggest, setUseAutoSuggest] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeNetwork = ipamNetworks.find(n => n.id === selectedNetworkId) || ipamNetworks[0];

  const handleAddSubnet = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subInfo = calculateSubnet(newNetworkIp, newCidr);
      const newNet: IpamNetwork = {
        id: `ipam-${Date.now()}`,
        name: newSubnetName,
        vlanId: newVlanId,
        networkAddress: subInfo.networkAddress,
        cidr: newCidr,
        subnetMask: subInfo.subnetMask,
        gateway: newGateway || subInfo.firstUsableIp,
        broadcastAddress: subInfo.broadcastAddress,
        usableStart: subInfo.firstUsableIp,
        usableEnd: subInfo.lastUsableIp,
        totalHosts: subInfo.totalHosts,
        usableHosts: subInfo.usableHosts,
        usedHosts: 1,
        dhcpStart: newGateway.replace(/\.1$/, '.20'),
        dhcpEnd: newGateway.replace(/\.1$/, '.240'),
        securityZone: newSecurityZone,
        allocations: [
          {
            id: `alloc-${Date.now()}-gw`,
            ip: newGateway || subInfo.firstUsableIp,
            hostname: `${newSubnetName.toLowerCase()}-gw`,
            status: 'reserved',
            purpose: 'Default Gateway L3 Interface',
            vlanId: newVlanId,
            assignedAt: new Date().toISOString()
          }
        ],
        description: newDescription
      };

      const updated = [...ipamNetworks, newNet];
      onUpdateProject({ ipamNetworks: updated });
      setSelectedNetworkId(newNet.id);
      setIsAddSubnetModalOpen(false);
      onShowToast(`Created subnet ${newNet.name} (${newNet.networkAddress}/${newNet.cidr})`);
    } catch (err: any) {
      alert(`Subnet creation error: ${err.message}`);
    }
  };

  const handleOpenAllocateModal = () => {
    if (!activeNetwork) return;
    setValidationError(null);
    setAllocHostname(`node-${Math.floor(Math.random() * 899 + 100)}`);
    setAllocPurpose('Department endpoint assignment');

    // Calculate auto suggested IP
    const usedIps = (activeNetwork.allocations || []).map(a => a.ip);
    const suggestion = suggestNextAvailableIp(activeNetwork.networkAddress, activeNetwork.cidr, usedIps);
    setManualIp(suggestion.suggestedIp || activeNetwork.usableStart);
    setUseAutoSuggest(true);
    setIsAllocateModalOpen(true);
  };

  const handleExecuteAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNetwork) return;

    const targetIp = manualIp.trim();
    const existingList = (activeNetwork.allocations || []).map(a => ({ ip: a.ip, deviceName: a.hostname || a.ip }));
    
    // Validate IP assignment
    const validation = validateIpAssignment(targetIp, activeNetwork.networkAddress, activeNetwork.cidr, existingList);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    const newAlloc: IpamAllocation = {
      id: `alloc-${Date.now()}`,
      ip: targetIp,
      hostname: allocHostname,
      deviceType: allocDeviceType,
      status: 'used',
      purpose: allocPurpose,
      vlanId: activeNetwork.vlanId,
      assignedAt: new Date().toISOString()
    };

    const updatedAllocations = [...(activeNetwork.allocations || []), newAlloc];
    const updatedNetworks = ipamNetworks.map(net => net.id === activeNetwork.id ? {
      ...net,
      allocations: updatedAllocations,
      usedHosts: updatedAllocations.length
    } : net);

    onUpdateProject({ ipamNetworks: updatedNetworks });
    setIsAllocateModalOpen(false);
    onShowToast(`Allocated IP ${targetIp} to ${allocHostname}`);
  };

  const handleDeleteAllocation = (allocId: string) => {
    if (!activeNetwork) return;
    const updatedAllocations = (activeNetwork.allocations || []).filter(a => a.id !== allocId);
    const updatedNetworks = ipamNetworks.map(net => net.id === activeNetwork.id ? {
      ...net,
      allocations: updatedAllocations,
      usedHosts: updatedAllocations.length
    } : net);

    onUpdateProject({ ipamNetworks: updatedNetworks });
    onShowToast('Deallocated IP address');
  };

  const handleExportCsv = () => {
    const csv = databaseService.exportIpamCsv(project.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_IPAM_Subnets.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported IPAM schema to CSV');
  };

  // Generate 256 matrix cells for visualization (e.g. for /24)
  const matrixCells = React.useMemo(() => {
    if (!activeNetwork) return [];
    const allocMap = new Map<string, IpamAllocation>();
    (activeNetwork.allocations || []).forEach(a => allocMap.set(a.ip, a));

    const cells = [];
    const prefixParts = activeNetwork.networkAddress.split('.').slice(0, 3).join('.');
    const totalSlots = Math.min(256, activeNetwork.totalHosts);

    for (let i = 0; i < totalSlots; i++) {
      const ipStr = `${prefixParts}.${i}`;
      const isNetId = i === 0;
      const isBcast = i === totalSlots - 1;
      const alloc = allocMap.get(ipStr);

      let status: 'network_id' | 'broadcast' | 'reserved' | 'used' | 'available' = 'available';
      if (isNetId) status = 'network_id';
      else if (isBcast) status = 'broadcast';
      else if (alloc?.status === 'reserved' || ipStr === activeNetwork.gateway) status = 'reserved';
      else if (alloc?.status === 'used') status = 'used';

      cells.push({
        ip: ipStr,
        lastOctet: i,
        status,
        allocation: alloc
      });
    }
    return cells;
  }, [activeNetwork]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Network size={16} className="text-cyan-400" />
            <span>IP Address Management (Mini IPAM) & Allocation Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time IPv4 address allocation tracking, subnet exhaustion monitoring, and conflict prevention.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 transition"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddSubnetModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus size={14} />
            <span>New Subnet</span>
          </button>
        </div>
      </div>

      {/* Subnet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ipamNetworks.map(net => {
          const isSelected = activeNetwork?.id === net.id;
          const usagePercent = Math.round((net.usedHosts / Math.max(1, net.usableHosts)) * 100);

          return (
            <div
              key={net.id}
              onClick={() => setSelectedNetworkId(net.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                    VLAN {net.vlanId || 1}
                  </span>
                  <h3 className="text-xs font-bold text-white font-mono">{net.name}</h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  net.securityZone === 'Management' ? 'bg-purple-950 text-purple-400' :
                  net.securityZone === 'Guest' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'
                }`}>
                  {net.securityZone}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs font-mono">
                <div className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Network:</span>
                  <span className="text-cyan-300">{net.networkAddress}/{net.cidr}</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between text-[11px]">
                  <span>Gateway:</span>
                  <span>{net.gateway}</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between text-[11px]">
                  <span>Usable Range:</span>
                  <span>{net.usableStart} - {net.usableEnd}</span>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Allocation Utilization</span>
                  <span className="text-cyan-400 font-bold">{usagePercent}% ({net.usedHosts}/{net.usableHosts})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      usagePercent > 85 ? 'bg-red-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, usagePercent))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Subnet Detail & Visual Matrix */}
      {activeNetwork && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  Subnet Visual Map: {activeNetwork.name} ({activeNetwork.networkAddress}/{activeNetwork.cidr})
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Subnet Mask: {activeNetwork.subnetMask}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeNetwork.description || 'Enterprise segmented subnet partition.'}
              </p>
            </div>

            <button
              onClick={handleOpenAllocateModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono transition shadow-lg shadow-cyan-500/20"
            >
              <Zap size={13} className="text-cyan-200" />
              <span>Auto-Allocate Next IP</span>
            </button>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300">Matrix Legend:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500" />
              <span>Used Host</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span>Gateway / Reserved</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-800" />
              <span>Network ID / Broadcast</span>
            </div>
          </div>

          {/* 256 Interactive Matrix Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>IPv4 Address Space Grid (First 256 addresses)</span>
              <span>Hover cell to inspect allocation details</span>
            </div>

            <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-3 bg-slate-950 rounded-xl border border-slate-800/80 max-h-60 overflow-y-auto">
              {matrixCells.map((cell) => {
                let bgClass = 'bg-slate-800 hover:bg-slate-700 text-slate-400';
                if (cell.status === 'network_id' || cell.status === 'broadcast') bgClass = 'bg-red-950 text-red-400 border border-red-800/40 cursor-not-allowed';
                else if (cell.status === 'reserved') bgClass = 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20';
                else if (cell.status === 'used') bgClass = 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20';

                const titleText = `${cell.ip} [${cell.status.toUpperCase()}] ${cell.allocation ? `- ${cell.allocation.hostname} (${cell.allocation.purpose})` : ''}`;

                return (
                  <div
                    key={cell.ip}
                    title={titleText}
                    className={`h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all select-none ${bgClass}`}
                  >
                    {cell.lastOctet}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allocations Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-white font-mono flex items-center space-x-1.5">
              <Layers size={14} className="text-cyan-400" />
              <span>Active IP Allocations in this Subnet ({activeNetwork.allocations?.length || 0})</span>
            </h4>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-2 px-3">IP Address</th>
                    <th className="py-2 px-3">Hostname / Node</th>
                    <th className="py-2 px-3">Role / Type</th>
                    <th className="py-2 px-3">Allocation Purpose</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(!activeNetwork.allocations || activeNetwork.allocations.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500 font-sans">
                        No active host allocations. Click "Auto-Allocate Next IP" above.
                      </td>
                    </tr>
                  ) : (
                    activeNetwork.allocations.map(alloc => (
                      <tr key={alloc.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-cyan-300">{alloc.ip}</td>
                        <td className="py-2 px-3 text-white">{alloc.hostname || 'Unassigned'}</td>
                        <td className="py-2 px-3 capitalize text-slate-400">{alloc.deviceType || 'endpoint'}</td>
                        <td className="py-2 px-3 text-slate-400">{alloc.purpose || 'Static allocation'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            alloc.status === 'reserved' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                          }`}>
                            {alloc.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {alloc.status !== 'reserved' && (
                            <button
                              onClick={() => handleDeleteAllocation(alloc.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition"
                              title="Release IP address back to pool"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Subnet Creation Modal */}
      {isAddSubnetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Network size={18} className="text-cyan-400" />
                <span>Create New IPAM Subnet Partition</span>
              </h3>
              <button
                onClick={() => setIsAddSubnetModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubnet} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Subnet Name / Label</label>
                  <input
                    type="text"
                    required
                    value={newSubnetName}
                    onChange={(e) => setNewSubnetName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. CCTV-SURVEILLANCE"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">VLAN ID (1-4094)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={4094}
                    value={newVlanId}
                    onChange={(e) => setNewVlanId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Network Base IPv4</label>
                  <input
                    type="text"
                    required
                    value={newNetworkIp}
                    onChange={(e) => setNewNetworkIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.40.0"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">CIDR Prefix Length (/{newCidr})</label>
                  <select
                    value={newCidr}
                    onChange={(e) => setNewCidr(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={24}>/24 (254 Usable Hosts - 255.255.255.0)</option>
                    <option value={23}>/23 (510 Usable Hosts - 255.255.254.0)</option>
                    <option value={25}>/25 (126 Usable Hosts - 255.255.255.128)</option>
                    <option value={26}>/26 (62 Usable Hosts - 255.255.255.192)</option>
                    <option value={27}>/27 (30 Usable Hosts - 255.255.255.224)</option>
                    <option value={28}>/28 (14 Usable Hosts - 255.255.255.240)</option>
                    <option value={29}>/29 (6 Usable Hosts - 255.255.255.248)</option>
                    <option value={30}>/30 (2 Usable Hosts Pt-to-Pt - 255.255.255.252)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Default Gateway IPv4</label>
                  <input
                    type="text"
                    required
                    value={newGateway}
                    onChange={(e) => setNewGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.40.1"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Security Zone</label>
                  <select
                    value={newSecurityZone}
                    onChange={(e) => setNewSecurityZone(e.target.value as SecurityZone)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Internal">Internal (Trusted LAN)</option>
                    <option value="DMZ">DMZ (Public Services)</option>
                    <option value="Guest">Guest (Untrusted Wi-Fi)</option>
                    <option value="Management">Management (Infrastructure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Purpose / Engineering Notes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSubnetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/20"
                >
                  Create Subnet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Allocate IP Modal */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap size={18} className="text-cyan-400" />
                <span>Allocate IP Address in {activeNetwork?.name}</span>
              </h3>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs font-mono flex items-start space-x-2">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAllocation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Target IPv4 Address</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.30.55"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const usedIps = (activeNetwork?.allocations || []).map(a => a.ip);
                      const sug = suggestNextAvailableIp(activeNetwork!.networkAddress, activeNetwork!.cidr, usedIps);
                      if (sug.suggestedIp) setManualIp(sug.suggestedIp);
                      setValidationError(null);
                    }}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-mono border border-slate-700"
                    title="Find next contiguous free IP"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Hostname / Label</label>
                <input
                  type="text"
                  required
                  value={allocHostname}
                  onChange={(e) => setAllocHostname(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. faculty-laptop-04"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Device Role</label>
                <select
                  value={allocDeviceType}
                  onChange={(e) => setAllocDeviceType(e.target.value as DeviceType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="pc">PC / Workstation</option>
                  <option value="laptop">Laptop</option>
                  <option value="server">Server</option>
                  <option value="printer">Printer</option>
                  <option value="camera">CCTV Camera</option>
                  <option value="access_point">Access Point</option>
                  <option value="switch">Switch SVI</option>
                  <option value="router">Router Interface</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Allocation Purpose / Notes</label>
                <input
                  type="text"
                  value={allocPurpose}
                  onChange={(e) => setAllocPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Finance department workstation"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/20"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
