import React, { useState } from 'react';
import { 
  GitBranch, 
  Clock, 
  RotateCcw, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Diff, 
  FileText, 
  Layers, 
  HardDrive 
} from 'lucide-react';
import { UserProject, ProjectVersion, NetworkDevice, NetworkConnection } from '../types';
import { databaseService } from '../services/databaseService';

interface VersionHistoryModalProps {
  project: UserProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (fields: Partial<UserProject>) => void;
  onShowToast: (msg: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  onShowToast
}) => {
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVerA, setSelectedVerA] = useState<string>('current');
  const [selectedVerB, setSelectedVerB] = useState<string>(project.versions?.[0]?.id || 'current');

  if (!isOpen) return null;

  const versions = project.versions || [];

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const created = databaseService.saveProjectVersion(
      project.id,
      newVersionName || `Snapshot V${versions.length + 1}`,
      newVersionDesc || `Manual snapshot created on ${new Date().toLocaleTimeString()}`
    );

    if (created) {
      const updatedProject = databaseService.getProjectById(project.id);
      if (updatedProject) {
        onUpdateProject({ versions: updatedProject.versions });
      }
      setIsCreating(false);
      setNewVersionName('');
      setNewVersionDesc('');
      onShowToast(`Saved snapshot "${created.name}"`);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    if (!confirm('Are you sure you want to restore this snapshot? Current unsaved modifications will be replaced by the snapshot.')) {
      return;
    }

    const restored = databaseService.restoreProjectVersion(project.id, versionId);
    if (restored) {
      onUpdateProject(restored);
      onShowToast(`Restored snapshot state`);
      onClose();
    }
  };

  // Extract snapshot object by ID
  const getSnapshotData = (verId: string) => {
    if (verId === 'current') {
      return {
        name: 'Current Working State',
        topology: project.topology,
        vlans: project.vlans || [],
        inventory: project.inventory || [],
        ipam: project.ipamNetworks || []
      };
    }
    const found = versions.find(v => v.id === verId);
    return {
      name: found ? found.name : 'Unknown',
      topology: found?.topology || project.topology,
      vlans: found?.vlans || [],
      inventory: found?.inventory || [],
      ipam: found?.ipamNetworks || []
    };
  };

  const dataA = getSnapshotData(selectedVerA);
  const dataB = getSnapshotData(selectedVerB);

  // Compute Diff between A and B
  const computeDiff = () => {
    const devMapA = new Map<string, NetworkDevice>();
    (dataA.topology.devices || []).forEach(d => devMapA.set(d.id, d));

    const devMapB = new Map<string, NetworkDevice>();
    (dataB.topology.devices || []).forEach(d => devMapB.set(d.id, d));

    const addedDevices: NetworkDevice[] = [];
    const removedDevices: NetworkDevice[] = [];
    const modifiedDevices: { device: NetworkDevice; changes: string[] }[] = [];

    devMapA.forEach((devA, id) => {
      if (!devMapB.has(id)) {
        addedDevices.push(devA);
      } else {
        const devB = devMapB.get(id)!;
        const changes: string[] = [];
        if (devA.name !== devB.name) changes.push(`Name: "${devB.name}" → "${devA.name}"`);
        if (devA.ip !== devB.ip) changes.push(`IP: ${devB.ip || 'none'} → ${devA.ip || 'none'}`);
        if (devA.vlan !== devB.vlan) changes.push(`VLAN: ${devB.vlan || 1} → ${devA.vlan || 1}`);
        if (devA.status !== devB.status) changes.push(`Status: ${devB.status} → ${devA.status}`);
        if (changes.length > 0) {
          modifiedDevices.push({ device: devA, changes });
        }
      }
    });

    devMapB.forEach((devB, id) => {
      if (!devMapA.has(id)) {
        removedDevices.push(devB);
      }
    });

    const connCountA = dataA.topology.connections?.length || 0;
    const connCountB = dataB.topology.connections?.length || 0;
    const vlanCountA = dataA.vlans.length;
    const vlanCountB = dataB.vlans.length;

    return {
      addedDevices,
      removedDevices,
      modifiedDevices,
      connDiff: connCountA - connCountB,
      vlanDiff: vlanCountA - vlanCountB
    };
  };

  const diff = computeDiff();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp font-sans max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <GitBranch size={20} className="text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Project Architecture Version History & Snapshot Diff
              </h3>
              <p className="text-xs text-slate-400">
                Track changes, review rollback points, and inspect node differences across architecture iterations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Tabs / Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto flex-1 pr-1">
          
          {/* Left: Snapshots List */}
          <div className="space-y-3 md:col-span-1 border-r border-slate-800/80 pr-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center space-x-1.5">
                <Clock size={13} className="text-cyan-400" />
                <span>Snapshots ({versions.length})</span>
              </h4>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1"
              >
                <Plus size={12} />
                <span>New</span>
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateSnapshot} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Snapshot Name (e.g. V2 Core Redundancy)"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Change rationale / summary"
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Version List */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl border bg-slate-950/80 border-cyan-500/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono">Working Copy</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {project.topology?.devices.length || 0} Devices • {project.vlans?.length || 0} VLANs
                </div>
              </div>

              {versions.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No snapshots captured yet. Click <strong>"New"</strong> above.
                </div>
              ) : (
                versions.map(v => (
                  <div key={v.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{v.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{v.versionNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {v.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                      <span>{new Date(v.timestamp).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleRestoreVersion(v.id)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        title="Restore this version state"
                      >
                        <RotateCcw size={11} />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Side-by-Side Diff Inspector */}
          <div className="space-y-4 md:col-span-2">
            
            {/* Version Selectors */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Source (Compare To):</label>
                <select
                  value={selectedVerA}
                  onChange={(e) => setSelectedVerA(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="current">Current Working Copy (Live)</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (#{v.versionNumber})</option>
                  ))}
                </select>
              </div>

              <div className="text-slate-500 font-mono text-xs pt-4 sm:pt-0">VS</div>

              <div className="flex-1 w-full">
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Baseline Reference:</label>
                <select
                  value={selectedVerB}
                  onChange={(e) => setSelectedVerB(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="current">Current Working Copy (Live)</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (#{v.versionNumber})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Diff Results Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs font-mono">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
                <Diff size={15} />
                <span>Architecture Diff Breakdown</span>
              </div>

              {diff.addedDevices.length === 0 && diff.removedDevices.length === 0 && diff.modifiedDevices.length === 0 && diff.connDiff === 0 && diff.vlanDiff === 0 ? (
                <div className="text-center py-6 text-slate-500 font-sans">
                  No architectural differences between the selected versions.
                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Summary Metric Chips */}
                  <div className="flex flex-wrap gap-2">
                    {diff.addedDevices.length > 0 && (
                      <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                        +{diff.addedDevices.length} Nodes Added
                      </span>
                    )}
                    {diff.removedDevices.length > 0 && (
                      <span className="px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800/60 font-semibold">
                        -{diff.removedDevices.length} Nodes Removed
                      </span>
                    )}
                    {diff.modifiedDevices.length > 0 && (
                      <span className="px-2 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-semibold">
                        {diff.modifiedDevices.length} Nodes Modified
                      </span>
                    )}
                    {diff.vlanDiff !== 0 && (
                      <span className="px-2 py-1 rounded bg-purple-950 text-purple-400 border border-purple-800/60">
                        {diff.vlanDiff > 0 ? `+${diff.vlanDiff}` : diff.vlanDiff} VLANs
                      </span>
                    )}
                  </div>

                  {/* Added Devices */}
                  {diff.addedDevices.length > 0 && (
                    <div>
                      <div className="text-emerald-400 font-semibold mb-1">Added Devices:</div>
                      {diff.addedDevices.map(d => (
                        <div key={d.id} className="pl-3 border-l-2 border-emerald-500 text-slate-300">
                          + {d.name} ({d.type.toUpperCase()}) - IP: {d.ip || 'none'}, VLAN: {d.vlan || 1}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Removed Devices */}
                  {diff.removedDevices.length > 0 && (
                    <div>
                      <div className="text-red-400 font-semibold mb-1">Removed Devices:</div>
                      {diff.removedDevices.map(d => (
                        <div key={d.id} className="pl-3 border-l-2 border-red-500 text-slate-400 line-through">
                          - {d.name} ({d.type.toUpperCase()}) - IP: {d.ip || 'none'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Modified Devices */}
                  {diff.modifiedDevices.length > 0 && (
                    <div>
                      <div className="text-amber-400 font-semibold mb-1">Modified Configurations:</div>
                      {diff.modifiedDevices.map(({ device, changes }) => (
                        <div key={device.id} className="pl-3 border-l-2 border-amber-500 text-slate-300 space-y-0.5">
                          <div className="font-bold text-white">{device.name}:</div>
                          {changes.map((c, i) => (
                            <div key={i} className="text-slate-400 pl-2 text-[11px]">• {c}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
