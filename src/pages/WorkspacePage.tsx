import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  FileText, 
  Network, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Download,
  Share2,
  Zap,
  HardDrive,
  Layers,
  Sparkles,
  GitBranch,
  Building2,
  ShieldCheck,
  Calculator,
  UploadCloud,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { UserProject, ProjectPlanningRequirements } from '../types';
import { generateEnterpriseNetworkDesign, calculateCapacityAndBandwidth } from '../utils/networkDesigner';
import { DeviceInventoryManager } from '../components/DeviceInventoryManager';
import { MiniIpamManager } from '../components/MiniIpamManager';
import { VlanPlanner } from '../components/VlanPlanner';
import { NetworkDocGenerator } from '../components/NetworkDocGenerator';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

interface WorkspacePageProps {
  onNavigate: (page: string, meta?: any) => void;
}

type WorkspaceTab = 'planning' | 'inventory' | 'ipam' | 'vlans' | 'docs' | 'notes';

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<UserProject[]>(() => databaseService.getProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('planning');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Requirements form state for Planning Tab
  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const [reqOrgName, setReqOrgName] = useState(selectedProject?.planning?.organizationName || 'Kasturi College Campus');
  const [reqFloors, setReqFloors] = useState(selectedProject?.planning?.campusFloors || 3);
  const [reqUsers, setReqUsers] = useState(selectedProject?.planning?.totalUsers || 150);
  const [reqBandwidth, setReqBandwidth] = useState(selectedProject?.planning?.internetBandwidthMbps || 500);
  const [reqServers, setReqServers] = useState(selectedProject?.planning?.serversNeeded || 4);
  const [reqAps, setReqAps] = useState(selectedProject?.planning?.wifiAccessPoints || 12);
  const [reqCctv, setReqCctv] = useState(selectedProject?.planning?.cctvCameras || 24);
  const [reqVoip, setReqVoip] = useState(selectedProject?.planning?.voipPhones || 18);
  const [reqGuest, setReqGuest] = useState(selectedProject?.planning?.guestNetwork ?? true);
  const [reqIspRedundant, setReqIspRedundant] = useState(selectedProject?.planning?.ispRedundancy ?? true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateProject = () => {
    const defaultDesign = generateEnterpriseNetworkDesign({
      organizationName: `New Enterprise Site ${projects.length + 1}`,
      campusFloors: 2,
      totalUsers: 80,
      departments: ['Engineering', 'Operations', 'Finance'],
      internetBandwidthMbps: 300,
      ispRedundancy: false,
      serversNeeded: 2,
      wifiAccessPoints: 6,
      cctvCameras: 12,
      voipPhones: 10,
      guestNetwork: true,
      iotDevices: 5
    });

    const newProj: UserProject = {
      id: `proj-${Date.now()}`,
      name: `Enterprise Site ${projects.length + 1}`,
      description: 'Custom full-stack multi-VLAN enterprise network architecture design.',
      status: 'Planning',
      topology: defaultDesign.topology,
      planning: {
        organizationName: `Enterprise Site ${projects.length + 1}`,
        campusFloors: 2,
        totalUsers: 80,
        departments: ['Engineering', 'Operations', 'Finance'],
        internetBandwidthMbps: 300,
        ispRedundancy: false,
        serversNeeded: 2,
        wifiAccessPoints: 6,
        cctvCameras: 12,
        voipPhones: 10,
        guestNetwork: true,
        iotDevices: 5
      },
      vlans: defaultDesign.vlans,
      ipamNetworks: defaultDesign.ipamNetworks,
      inventory: defaultDesign.inventory,
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: 1,
          name: 'Initial Baseline Architecture (V1)',
          timestamp: new Date().toISOString(),
          description: 'Baseline generated architecture.',
          topology: defaultDesign.topology,
          vlans: defaultDesign.vlans,
          ipamNetworks: defaultDesign.ipamNetworks,
          inventory: defaultDesign.inventory
        }
      ],
      notes: 'Initial Project Notes:\n- Verify core router subinterfaces\n- Check DHCP scopes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = databaseService.saveProject(newProj);
    const updatedList = databaseService.getProjects();
    setProjects(updatedList);
    setSelectedProjectId(saved.id);
    showToast(`Created project "${saved.name}"`);
  };

  const handleLoadTemplate = (type: 'college' | 'hotel' | 'hospital') => {
    let req: ProjectPlanningRequirements;
    if (type === 'college') {
      req = {
        organizationName: 'Kasturi College Campus',
        campusFloors: 3,
        totalUsers: 220,
        departments: ['Computer Science', 'Management', 'Faculty', 'Library', 'Exam Cell'],
        internetBandwidthMbps: 500,
        ispRedundancy: true,
        serversNeeded: 4,
        wifiAccessPoints: 16,
        cctvCameras: 32,
        voipPhones: 20,
        guestNetwork: true,
        iotDevices: 12
      };
    } else if (type === 'hotel') {
      req = {
        organizationName: 'Grand Horizon Luxury Resort',
        campusFloors: 5,
        totalUsers: 350,
        departments: ['Front Desk', 'Admin', 'Guest Wi-Fi', 'POS Terminals', 'Housekeeping'],
        internetBandwidthMbps: 1000,
        ispRedundancy: true,
        serversNeeded: 3,
        wifiAccessPoints: 40,
        cctvCameras: 48,
        voipPhones: 60,
        guestNetwork: true,
        iotDevices: 30
      };
    } else {
      req = {
        organizationName: 'Metro General Hospital Network',
        campusFloors: 4,
        totalUsers: 180,
        departments: ['ICU Telemetry', 'Radiology PACS', 'Doctors LAN', 'Admin', 'Pharmacy'],
        internetBandwidthMbps: 1000,
        ispRedundancy: true,
        serversNeeded: 6,
        wifiAccessPoints: 24,
        cctvCameras: 40,
        voipPhones: 50,
        guestNetwork: false,
        iotDevices: 45
      };
    }

    const design = generateEnterpriseNetworkDesign(req);
    const newProj: UserProject = {
      id: `proj-${Date.now()}`,
      name: `${req.organizationName} Architecture`,
      description: design.executiveSummary,
      status: 'Building',
      topology: design.topology,
      planning: req,
      vlans: design.vlans,
      ipamNetworks: design.ipamNetworks,
      inventory: design.inventory,
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: 1,
          name: 'V1 Enterprise Template Baseline',
          timestamp: new Date().toISOString(),
          description: `Generated reference architecture for ${req.organizationName}.`,
          topology: design.topology,
          vlans: design.vlans,
          ipamNetworks: design.ipamNetworks,
          inventory: design.inventory
        }
      ],
      notes: `Requirements:\n- ${req.totalUsers} users across ${req.campusFloors} floors\n- Isolated VLANs for security and QoS\n- High availability core routing`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    databaseService.saveProject(newProj);
    const list = databaseService.getProjects();
    setProjects(list);
    setSelectedProjectId(newProj.id);
    showToast(`Loaded ${req.organizationName} Case Study`);
  };

  const handleUpdateProject = (fields: Partial<UserProject>) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, ...fields };
    databaseService.saveProject(updated);
    setProjects(databaseService.getProjects());
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    databaseService.deleteProject(id);
    const updatedList = databaseService.getProjects();
    setProjects(updatedList);
    if (selectedProjectId === id && updatedList.length > 0) {
      setSelectedProjectId(updatedList[0].id);
    }
    showToast('Deleted project');
  };

  const handleRegenerateArchitectureFromPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    const req: ProjectPlanningRequirements = {
      organizationName: reqOrgName,
      campusFloors: Number(reqFloors),
      totalUsers: Number(reqUsers),
      departments: ['Engineering', 'Staff', 'Public Services'],
      internetBandwidthMbps: Number(reqBandwidth),
      ispRedundancy: reqIspRedundant,
      serversNeeded: Number(reqServers),
      wifiAccessPoints: Number(reqAps),
      cctvCameras: Number(reqCctv),
      voipPhones: Number(reqVoip),
      guestNetwork: reqGuest,
      iotDevices: 10
    };

    const design = generateEnterpriseNetworkDesign(req);

    // Save snapshot before overwrite
    databaseService.saveProjectVersion(
      selectedProject.id,
      `Pre-Regeneration Snapshot`,
      `State before regenerating design for ${reqOrgName}`
    );

    const updated = {
      ...selectedProject,
      name: `${reqOrgName} Architecture`,
      description: design.executiveSummary,
      planning: req,
      topology: design.topology,
      vlans: design.vlans,
      ipamNetworks: design.ipamNetworks,
      inventory: design.inventory
    };

    handleUpdateProject(updated);
    showToast(`Generated full enterprise architecture for ${reqOrgName}`);
  };

  const capacity = selectedProject?.planning ? calculateCapacityAndBandwidth(selectedProject.planning) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 shadow-2xl text-xs font-mono flex items-center space-x-2 animate-slideIn">
          <Zap size={14} className="text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FolderKanban size={22} className="text-cyan-400" />
            <span>Network Engineering Design & Workspace Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-world enterprise network architecture planning, device inventory, IPAM, VLAN segmentation, and auto-generated Cisco configurations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Case Study Templates */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            <span className="text-slate-400 px-2">Templates:</span>
            <button
              onClick={() => handleLoadTemplate('college')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] transition"
            >
              College Campus
            </button>
            <button
              onClick={() => handleLoadTemplate('hotel')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] transition"
            >
              Hotel & Resort
            </button>
            <button
              onClick={() => handleLoadTemplate('hospital')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] transition"
            >
              Hospital
            </button>
          </div>

          <button
            onClick={handleCreateProject}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus size={14} />
            <span>New Architecture</span>
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">Active Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-80 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono border border-slate-700 transition"
            title="Open Version History & Diff Visualizer"
          >
            <GitBranch size={13} />
            <span>Snapshots ({selectedProject?.versions?.length || 1})</span>
          </button>

          <button
            onClick={() => onNavigate('topology', { topology: selectedProject.topology })}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono transition"
          >
            <Network size={13} />
            <span>Open in Topology Lab</span>
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => handleDeleteProject(selectedProject.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Delete this project"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('planning')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'planning'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Building2 size={14} />
          <span>1. Requirements & Sizing</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'inventory'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <HardDrive size={14} />
          <span>2. Hardware Inventory ({selectedProject?.inventory?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ipam')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'ipam'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Network size={14} />
          <span>3. Mini IPAM & Subnets ({selectedProject?.ipamNetworks?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('vlans')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'vlans'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers size={14} />
          <span>4. VLAN Segmentation ({selectedProject?.vlans?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'docs'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText size={14} />
          <span>5. Engineering Dossier & Cisco IOS</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === 'notes'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BookOpen size={14} />
          <span>6. Engineering Notes</span>
        </button>
      </div>

      {/* Tab 1: Requirements & Sizing */}
      {activeTab === 'planning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Requirements Input Form (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                  <Building2 size={16} className="text-cyan-400" />
                  <span>Network Design Requirements Specification</span>
                </h3>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                  Auto-Calculated
                </span>
              </div>

              <form onSubmit={handleRegenerateArchitectureFromPlanning} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-mono mb-1">Organization / Campus Name</label>
                    <input
                      type="text"
                      required
                      value={reqOrgName}
                      onChange={(e) => setReqOrgName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                      placeholder="e.g. Kasturi College of Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Number of Building Floors</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={reqFloors}
                      onChange={(e) => setReqFloors(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Total Concurrent Users</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={5000}
                      value={reqUsers}
                      onChange={(e) => setReqUsers(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Wi-Fi 6 Access Points</label>
                    <input
                      type="number"
                      min={0}
                      value={reqAps}
                      onChange={(e) => setReqAps(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">CCTV Security Cameras (1080p)</label>
                    <input
                      type="number"
                      min={0}
                      value={reqCctv}
                      onChange={(e) => setReqCctv(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">VoIP IP Desk Phones</label>
                    <input
                      type="number"
                      min={0}
                      value={reqVoip}
                      onChange={(e) => setReqVoip(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">On-Premises Servers</label>
                    <input
                      type="number"
                      min={1}
                      value={reqServers}
                      onChange={(e) => setReqServers(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 text-slate-300 font-mono text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reqGuest}
                      onChange={(e) => setReqGuest(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Include Isolated Guest Wi-Fi Portal (VLAN 99)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300 font-mono text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reqIspRedundant}
                      onChange={(e) => setReqIspRedundant(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Dual Redundant ISP Uplinks (BGP Failover)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs font-mono transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
                >
                  <Sparkles size={15} />
                  <span>Generate Complete 3-Tier Enterprise Architecture</span>
                </button>
              </form>
            </div>

            {/* Right: Real-time Capacity Sizing Matrix (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                  <Calculator size={16} className="text-cyan-400" />
                  <span>Capacity Planning & Power Sizing</span>
                </h3>

                {capacity ? (
                  <div className="space-y-3.5 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Total Bandwidth Required:</span>
                      <span className="text-sm font-bold text-cyan-400">{capacity.totalBandwidthNeededMbps} Mbps</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Recommended Internet Plan:</span>
                      <span className="text-xs font-bold text-emerald-400">{capacity.recommendedInternetPlan}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">PoE Power Budget:</span>
                      <span className="text-xs font-bold text-amber-400">{capacity.poePowerWatts} Watts</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Provisioned Switch Ports:</span>
                      <span className="text-xs font-bold text-indigo-400">{capacity.switchPortCount} Ports</span>
                    </div>

                    {/* Transfer Times Reference */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold">LAN File Transfer Benchmark Estimates:</div>
                      <div className="space-y-1 text-[10px]">
                        {capacity.fileTransferTimes.map((ft, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
                            <span className="text-slate-300">{ft.size}</span>
                            <span className="text-cyan-400">1G: {ft.timeGigabit} | 10G: {ft.time10Gigabit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Configure requirements on the left to compute capacity.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Hardware Inventory */}
      {activeTab === 'inventory' && (
        <DeviceInventoryManager
          project={selectedProject}
          onUpdateProject={handleUpdateProject}
          onShowToast={showToast}
        />
      )}

      {/* Tab 3: Mini IPAM */}
      {activeTab === 'ipam' && (
        <MiniIpamManager
          project={selectedProject}
          onUpdateProject={handleUpdateProject}
          onShowToast={showToast}
        />
      )}

      {/* Tab 4: VLAN Planner */}
      {activeTab === 'vlans' && (
        <VlanPlanner
          project={selectedProject}
          onUpdateProject={handleUpdateProject}
          onShowToast={showToast}
        />
      )}

      {/* Tab 5: Engineering Dossier & Cisco IOS */}
      {activeTab === 'docs' && (
        <NetworkDocGenerator
          project={selectedProject}
          onShowToast={showToast}
        />
      )}

      {/* Tab 6: Engineering Notes */}
      {activeTab === 'notes' && (
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <BookOpen size={16} className="text-cyan-400" />
              <span>Project Engineering Log & Implementation Notes</span>
            </h3>
            <button
              onClick={() => showToast('Saved engineering notes')}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono"
            >
              Save Notes
            </button>
          </div>

          <textarea
            rows={14}
            value={selectedProject.notes || ''}
            onChange={(e) => handleUpdateProject({ notes: e.target.value })}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none leading-relaxed"
            placeholder="Write your network topology notes, checklist, and testing steps here..."
          />
        </div>
      )}

      {/* Version History Modal */}
      <VersionHistoryModal
        project={selectedProject}
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onUpdateProject={handleUpdateProject}
        onShowToast={showToast}
      />

    </div>
  );
};
