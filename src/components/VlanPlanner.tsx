import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Terminal, 
  Copy, 
  Check, 
  Shield, 
  Cpu, 
  Server, 
  Wifi, 
  Video, 
  PhoneCall, 
  Users,
  Info
} from 'lucide-react';
import { VlanDefinition, UserProject, SecurityZone } from '../types';
import { cidrToMask } from '../utils/subnetCalculator';

interface VlanPlannerProps {
  project: UserProject;
  onUpdateProject: (fields: Partial<UserProject>) => void;
  onShowToast: (msg: string) => void;
}

export const VlanPlanner: React.FC<VlanPlannerProps> = ({
  project,
  onUpdateProject,
  onShowToast
}) => {
  const vlans = project.vlans || [];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVlan, setEditingVlan] = useState<VlanDefinition | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  // Form State
  const [vlanId, setVlanId] = useState<number>(60);
  const [name, setName] = useState('GUEST-PORTAL');
  const [purpose, setPurpose] = useState('Visitor wireless internet access');
  const [subnet, setSubnet] = useState('172.16.60.0');
  const [cidr, setCidr] = useState<number>(24);
  const [gateway, setGateway] = useState('172.16.60.1');
  const [dhcpRange, setDhcpRange] = useState('172.16.60.20 - 172.16.60.250');
  const [securityZone, setSecurityZone] = useState<SecurityZone>('Guest');
  const [description, setDescription] = useState('Isolated guest network with bandwidth throttling.');

  const handleOpenAddModal = (v?: VlanDefinition) => {
    if (v) {
      setEditingVlan(v);
      setVlanId(v.vlanId);
      setName(v.name);
      setPurpose(v.purpose);
      setSubnet(v.subnet);
      setCidr(v.cidr);
      setGateway(v.gateway);
      setDhcpRange(v.dhcpRange || '');
      setSecurityZone(v.securityZone);
      setDescription(v.description || '');
    } else {
      setEditingVlan(null);
      const nextId = (vlans.length + 1) * 10;
      setVlanId(nextId);
      setName(`VLAN_${nextId}_DATA`);
      setPurpose('Department workstations');
      setSubnet(`10.10.${nextId}.0`);
      setCidr(24);
      setGateway(`10.10.${nextId}.1`);
      setDhcpRange(`10.10.${nextId}.20 - 10.10.${nextId}.250`);
      setSecurityZone('Internal');
      setDescription('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveVlan = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: VlanDefinition[];

    if (editingVlan) {
      updated = vlans.map(v => v.id === editingVlan.id ? {
        ...v,
        vlanId,
        name,
        purpose,
        subnet,
        cidr,
        gateway,
        dhcpRange,
        securityZone,
        description
      } : v);
      onShowToast(`Updated VLAN ${vlanId} (${name})`);
    } else {
      const newVlan: VlanDefinition = {
        id: `vlan-${vlanId}-${Date.now()}`,
        vlanId,
        name,
        purpose,
        subnet,
        cidr,
        gateway,
        dhcpRange,
        securityZone,
        description
      };
      updated = [...vlans, newVlan];
      onShowToast(`Created VLAN ${vlanId} (${name})`);
    }

    onUpdateProject({ vlans: updated });
    setIsAddModalOpen(false);
  };

  const handleDeleteVlan = (id: string) => {
    const updated = vlans.filter(v => v.id !== id);
    onUpdateProject({ vlans: updated });
    onShowToast('Removed VLAN definition');
  };

  // Generate Cisco CLI commands for switch and router
  const generatedCiscoCli = React.useMemo(() => {
    const lines: string[] = [];
    lines.push(`! =================================================`);
    lines.push(`! CISCO IOS 802.1Q VLAN & SUBINTERFACE PROVISIONING`);
    lines.push(`! Project: ${project.name}`);
    lines.push(`! =================================================\n`);
    lines.push(`! [1] SWITCH-LEVEL VLAN CREATION`);
    lines.push(`configure terminal`);
    vlans.forEach(v => {
      lines.push(`vlan ${v.vlanId}`);
      lines.push(` name ${v.name}`);
    });
    lines.push(`exit\n`);

    lines.push(`! [2] ROUTER-ON-A-STICK SUBINTERFACE CONFIGURATION`);
    lines.push(`interface GigabitEthernet0/0`);
    lines.push(` no shutdown`);
    vlans.forEach(v => {
      lines.push(`interface GigabitEthernet0/0.${v.vlanId}`);
      lines.push(` description SVI for ${v.name} (${v.purpose})`);
      lines.push(` encapsulation dot1Q ${v.vlanId}`);
      lines.push(` ip address ${v.gateway} ${cidrToMask(v.cidr)}`);
      lines.push(` no shutdown`);
    });
    lines.push(`end\nwrite memory`);

    return lines.join('\n');
  }, [vlans, project.name]);

  const handleCopyCli = () => {
    navigator.clipboard.writeText(generatedCiscoCli);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
    onShowToast('Copied Cisco IOS VLAN commands to clipboard');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers size={16} className="text-cyan-400" />
            <span>IEEE 802.1Q VLAN Segmentation & Broadcast Domain Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logical network isolation, security perimeter zoning, and inter-VLAN routing mapping.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus size={14} />
          <span>Add VLAN</span>
        </button>
      </div>

      {/* VLAN Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
              <th className="py-2.5 px-3">VLAN ID</th>
              <th className="py-2.5 px-3">VLAN Name</th>
              <th className="py-2.5 px-3">Functional Purpose</th>
              <th className="py-2.5 px-3">Subnet / CIDR</th>
              <th className="py-2.5 px-3">Default Gateway</th>
              <th className="py-2.5 px-3">DHCP Pool Range</th>
              <th className="py-2.5 px-3">Security Zone</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {vlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500 font-sans">
                  No VLANs configured. Click <strong>"Add VLAN"</strong> to create a broadcast segment.
                </td>
              </tr>
            ) : (
              vlans.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                      VLAN {v.vlanId}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {v.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">
                    {v.purpose}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300">
                    {v.subnet}/{v.cidr}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {v.gateway}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {v.dhcpRange || 'Static only'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      v.securityZone === 'Management' ? 'bg-purple-950 text-purple-400 border border-purple-800/60' :
                      v.securityZone === 'Guest' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                      v.securityZone === 'DMZ' ? 'bg-red-950 text-red-400 border border-red-800/60' : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                    }`}>
                      {v.securityZone}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenAddModal(v)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                        title="Edit VLAN properties"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteVlan(v.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                        title="Delete VLAN"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cisco IOS CLI Output Box */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono">
              Auto-Generated Cisco IOS Configuration (802.1Q Trunks & Subinterfaces)
            </h3>
          </div>
          <button
            onClick={handleCopyCli}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-mono border border-slate-700 transition"
          >
            {copiedCli ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedCli ? 'Copied' : 'Copy CLI Script'}</span>
          </button>
        </div>

        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
          {generatedCiscoCli}
        </pre>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers size={18} className="text-cyan-400" />
                <span>{editingVlan ? `Edit VLAN ${vlanId}` : 'Create New 802.1Q VLAN'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVlan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">VLAN ID (1-4094)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={4094}
                    value={vlanId}
                    onChange={(e) => setVlanId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">VLAN Name (Uppercase)</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. STAFF-USERS"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Subnet Base IPv4</label>
                  <input
                    type="text"
                    required
                    value={subnet}
                    onChange={(e) => setSubnet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.30.0"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">CIDR Mask (/{cidr})</label>
                  <select
                    value={cidr}
                    onChange={(e) => setCidr(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={24}>/24 (254 Usable Hosts)</option>
                    <option value={23}>/23 (510 Usable Hosts)</option>
                    <option value={25}>/25 (126 Usable Hosts)</option>
                    <option value={26}>/26 (62 Usable Hosts)</option>
                    <option value={27}>/27 (30 Usable Hosts)</option>
                    <option value={28}>/28 (14 Usable Hosts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Gateway IPv4</label>
                  <input
                    type="text"
                    required
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.30.1"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Security Zone</label>
                  <select
                    value={securityZone}
                    onChange={(e) => setSecurityZone(e.target.value as SecurityZone)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Internal">Internal LAN</option>
                    <option value="DMZ">DMZ Server Farm</option>
                    <option value="Guest">Guest Wi-Fi Portal</option>
                    <option value="Management">Out-of-Band Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Purpose / Department</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Academic faculty & computer science lab workstations"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">DHCP Pool Allocation Range</label>
                <input
                  type="text"
                  value={dhcpRange}
                  onChange={(e) => setDhcpRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. 10.10.30.50 - 10.10.30.250"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/20"
                >
                  {editingVlan ? 'Save VLAN' : 'Create VLAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
