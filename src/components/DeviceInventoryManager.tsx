import React, { useState } from 'react';
import { 
  Server, 
  Router as RouterIcon, 
  Cpu, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  RefreshCw,
  SlidersHorizontal,
  HardDrive,
  Wifi,
  Video,
  Printer,
  Laptop,
  ShieldAlert
} from 'lucide-react';
import { DeviceInventoryItem, DeviceType, UserProject, NetworkDevice } from '../types';
import { databaseService } from '../services/databaseService';

interface DeviceInventoryManagerProps {
  project: UserProject;
  onUpdateProject: (fields: Partial<UserProject>) => void;
  onShowToast: (msg: string) => void;
}

export const DeviceInventoryManager: React.FC<DeviceInventoryManagerProps> = ({
  project,
  onUpdateProject,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceInventoryItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formHostname, setFormHostname] = useState('');
  const [formType, setFormType] = useState<DeviceType>('switch');
  const [formManufacturer, setFormManufacturer] = useState('Cisco Systems');
  const [formModel, setFormModel] = useState('Catalyst 9200-24P');
  const [formManagementIp, setFormManagementIp] = useState('10.10.10.15');
  const [formMac, setFormMac] = useState('00:50:56:A1:00:15');
  const [formLocation, setFormLocation] = useState('IDF Floor 1 Telecomm Closet');
  const [formVlan, setFormVlan] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<'up' | 'down' | 'warning'>('up');
  const [formNotes, setFormNotes] = useState('');

  const inventory = project.inventory || [];

  const filteredInventory = inventory.filter(dev => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.managementIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.location && dev.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || dev.deviceType === typeFilter;
    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAddModal = (dev?: DeviceInventoryItem) => {
    if (dev) {
      setEditingDevice(dev);
      setFormName(dev.name);
      setFormHostname(dev.hostname);
      setFormType(dev.deviceType);
      setFormManufacturer(dev.manufacturer);
      setFormModel(dev.model);
      setFormManagementIp(dev.managementIp);
      setFormMac(dev.macAddress);
      setFormLocation(dev.location);
      setFormVlan(dev.vlan || 10);
      setFormStatus(dev.status);
      setFormNotes(dev.notes || '');
    } else {
      setEditingDevice(null);
      setFormName(`Access Switch ${inventory.length + 1}`);
      setFormHostname(`sw-acc-0${inventory.length + 1}`);
      setFormType('switch');
      setFormManufacturer('Cisco Systems');
      setFormModel('Catalyst 9200-24P');
      setFormManagementIp(`10.10.10.${20 + inventory.length}`);
      setFormMac(`00:50:56:A1:00:${(20 + inventory.length).toString(16).padStart(2, '0')}`);
      setFormLocation('Floor 1 Server Rack');
      setFormVlan(10);
      setFormStatus('up');
      setFormNotes('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: DeviceInventoryItem[];

    if (editingDevice) {
      updatedList = inventory.map(item => item.id === editingDevice.id ? {
        ...item,
        name: formName,
        hostname: formHostname,
        deviceType: formType,
        manufacturer: formManufacturer,
        model: formModel,
        managementIp: formManagementIp,
        macAddress: formMac,
        location: formLocation,
        vlan: formVlan,
        status: formStatus,
        notes: formNotes
      } : item);
      onShowToast(`Updated device ${formHostname}`);
    } else {
      const newItem: DeviceInventoryItem = {
        id: `inv-${Date.now()}`,
        name: formName,
        hostname: formHostname,
        deviceType: formType,
        manufacturer: formManufacturer,
        model: formModel,
        managementIp: formManagementIp,
        macAddress: formMac,
        location: formLocation,
        vlan: formVlan,
        status: formStatus,
        notes: formNotes
      };
      updatedList = [...inventory, newItem];
      onShowToast(`Added ${formHostname} to inventory`);
    }

    onUpdateProject({ inventory: updatedList });
    setIsAddModalOpen(false);
  };

  const handleDeleteDevice = (id: string) => {
    const updated = inventory.filter(i => i.id !== id);
    onUpdateProject({ inventory: updated });
    onShowToast('Removed device from inventory');
  };

  const handleSyncFromTopology = () => {
    const topoDevices = project.topology?.devices || [];
    if (topoDevices.length === 0) {
      onShowToast('Topology has no devices to sync');
      return;
    }

    const synced: DeviceInventoryItem[] = topoDevices.map((d, idx) => {
      const existing = inventory.find(i => i.id === d.id || i.hostname === (d.hostname || d.name.toLowerCase()));
      if (existing) return existing;

      return {
        id: d.id,
        name: d.name,
        hostname: d.hostname || d.name.toLowerCase().replace(/\s+/g, '-'),
        deviceType: d.type,
        manufacturer: d.type === 'router' || d.type === 'switch' ? 'Cisco Systems' : d.type === 'firewall' ? 'Fortinet' : 'Dell / Intel',
        model: d.type === 'router' ? 'ISR 4331' : d.type === 'switch' ? 'Catalyst 9300' : d.type === 'firewall' ? 'FortiGate 60F' : 'Standard Host',
        managementIp: d.ip || `10.10.10.${10 + idx}`,
        macAddress: d.mac || `00:50:56:A1:00:${(10 + idx).toString(16).padStart(2, '0')}`,
        location: 'Main Campus Facility',
        vlan: d.vlan || 10,
        status: d.status,
        notes: 'Imported from active Topology Canvas'
      };
    });

    onUpdateProject({ inventory: synced });
    onShowToast(`Synced ${synced.length} devices from topology`);
  };

  const handleExportCsv = () => {
    const csvData = databaseService.exportDevicesCsv(project.id);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_Device_Inventory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported Device Inventory to CSV');
  };

  const getDeviceBadge = (type: DeviceType) => {
    switch (type) {
      case 'router': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60"><RouterIcon size={12} className="mr-1" /> Router</span>;
      case 'switch': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800/60"><Cpu size={12} className="mr-1" /> Switch</span>;
      case 'firewall': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-400 border border-red-800/60"><ShieldAlert size={12} className="mr-1" /> Firewall</span>;
      case 'server': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-400 border border-purple-800/60"><Server size={12} className="mr-1" /> Server</span>;
      case 'access_point': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800/60"><Wifi size={12} className="mr-1" /> AP</span>;
      case 'camera': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800/60"><Video size={12} className="mr-1" /> CCTV</span>;
      case 'printer': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60"><Printer size={12} className="mr-1" /> Printer</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"><Laptop size={12} className="mr-1" /> {type.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search hostname, IP, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Types ({inventory.length})</option>
            <option value="router">Routers</option>
            <option value="switch">Switches</option>
            <option value="firewall">Firewalls</option>
            <option value="server">Servers</option>
            <option value="access_point">Access Points</option>
            <option value="camera">CCTV Cameras</option>
            <option value="printer">Printers</option>
            <option value="pc">PCs / Laptops</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="up">Status: UP</option>
            <option value="down">Status: DOWN</option>
            <option value="warning">Status: WARNING</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleSyncFromTopology}
            title="Sync inventory with active topology canvas"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-700 transition"
          >
            <RefreshCw size={13} />
            <span>Sync Canvas</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono border border-slate-700 transition"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition shadow-lg shadow-cyan-500/20"
          >
            <Plus size={14} />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
              <th className="py-2.5 px-3">Device & Hostname</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Management IP</th>
              <th className="py-2.5 px-3">MAC Address</th>
              <th className="py-2.5 px-3">Hardware Model</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">VLAN</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500 font-sans">
                  No devices match your search filter or inventory is empty. Click <strong>"Add Device"</strong> or <strong>"Sync Canvas"</strong>.
                </td>
              </tr>
            ) : (
              filteredInventory.map(dev => (
                <tr key={dev.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white font-sans">{dev.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">{dev.hostname}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    {getDeviceBadge(dev.deviceType)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {dev.managementIp}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {dev.macAddress}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <span className="text-slate-400">{dev.manufacturer}</span> {dev.model}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {dev.location}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      VLAN {dev.vlan || 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {dev.status === 'up' && (
                      <span className="inline-flex items-center text-emerald-400 text-[11px]">
                        <CheckCircle2 size={12} className="mr-1 text-emerald-400" /> UP
                      </span>
                    )}
                    {dev.status === 'down' && (
                      <span className="inline-flex items-center text-red-400 text-[11px]">
                        <XCircle size={12} className="mr-1 text-red-400" /> DOWN
                      </span>
                    )}
                    {dev.status === 'warning' && (
                      <span className="inline-flex items-center text-amber-400 text-[11px]">
                        <AlertTriangle size={12} className="mr-1 text-amber-400" /> WARN
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenAddModal(dev)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                        title="Edit hardware item"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(dev.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                        title="Delete hardware item"
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

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <HardDrive size={18} className="text-cyan-400" />
                <span>{editingDevice ? 'Edit Hardware Inventory Item' : 'Add New Network Device to Inventory'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Device Label / Title</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. Core Switch 01"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Hostname (FQDN format)</label>
                  <input
                    type="text"
                    required
                    value={formHostname}
                    onChange={(e) => setFormHostname(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. core-sw01.campus"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Device Role / Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DeviceType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="router">Router (Layer 3 Gateway)</option>
                    <option value="switch">Switch (Layer 2/3 Distribution)</option>
                    <option value="firewall">Firewall (Perimeter Security)</option>
                    <option value="server">Server (DNS / DC / File)</option>
                    <option value="access_point">Access Point (Wi-Fi 6)</option>
                    <option value="camera">CCTV Camera (Surveillance)</option>
                    <option value="printer">Network Printer</option>
                    <option value="pc">PC / Workstation</option>
                    <option value="laptop">Laptop Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formManufacturer}
                    onChange={(e) => setFormManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. Cisco Systems / Fortinet"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Model / Part Number</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. Catalyst 9300-48P"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Management IPv4 Address</label>
                  <input
                    type="text"
                    required
                    value={formManagementIp}
                    onChange={(e) => setFormManagementIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10.10.10.15"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">MAC Address (IEEE 802.3)</label>
                  <input
                    type="text"
                    value={formMac}
                    onChange={(e) => setFormMac(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 00:50:56:A1:B2:C3"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Physical Location / Rack</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. MDF Server Room Rack 1 (U36)"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">VLAN Membership</label>
                  <input
                    type="number"
                    value={formVlan}
                    onChange={(e) => setFormVlan(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 10"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Operational Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="up">Operational (UP)</option>
                    <option value="down">Offline / Disabled (DOWN)</option>
                    <option value="warning">Maintenance / Degraded (WARNING)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Engineering Notes & Serial Number</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. SN: FOC23490918, SFP+ 10G fiber uplink to Core Router"
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
                  {editingDevice ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
