import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Terminal, 
  Shield, 
  Layers, 
  HardDrive, 
  Network,
  Zap,
  Building2,
  BookOpen
} from 'lucide-react';
import { UserProject } from '../types';
import { calculateCapacityAndBandwidth, generateCiscoIosConfiguration } from '../utils/networkDesigner';

interface NetworkDocGeneratorProps {
  project: UserProject;
  onShowToast: (msg: string) => void;
}

export const NetworkDocGenerator: React.FC<NetworkDocGeneratorProps> = ({
  project,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedDeviceConfig, setSelectedDeviceConfig] = useState<string>(project.topology?.devices[0]?.id || '');

  const capacity = project.planning ? calculateCapacityAndBandwidth(project.planning) : null;
  const devices = project.topology?.devices || [];
  const vlans = project.vlans || [];
  const inventory = project.inventory || [];
  const ipam = project.ipamNetworks || [];

  // Generate full markdown dossier
  const fullMarkdown = React.useMemo(() => {
    const lines: string[] = [];
    lines.push(`# NET-LAB 2.0 Enterprise Network Engineering Dossier`);
    lines.push(`**Project Title:** ${project.name}`);
    lines.push(`**Author:** Built by Sandesh Bajgai for NET-LAB Platform`);
    lines.push(`**Date of Generation:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    lines.push(`**Status:** ${project.status}\n`);

    lines.push(`## 1. Executive Summary & Design Rationale`);
    lines.push(`${project.description || 'Enterprise hierarchical campus network layout built with redundant core routing, multi-VLAN segmentation, perimeter security, and stateful access control.'}\n`);

    if (project.planning) {
      lines.push(`## 2. Client Requirements & Capacity Sizing`);
      lines.push(`- **Organization Name:** ${project.planning.organizationName}`);
      lines.push(`- **Total Users / Endpoints:** ${project.planning.totalUsers} users across ${project.planning.campusFloors} floor(s)`);
      lines.push(`- **Total Provisioned Switch Ports:** ${capacity?.switchPortCount || 48} ports (+25% growth capacity)`);
      lines.push(`- **Recommended Internet Uplink:** ${capacity?.recommendedInternetPlan || '500 Mbps Business Fiber'}`);
      lines.push(`- **Estimated PoE Power Budget:** ${capacity?.poePowerWatts || 240} Watts (for APs, CCTV, VoIP phones)`);
      lines.push(`- **Total Aggregated Bandwidth Requirement:** ${capacity?.totalBandwidthNeededMbps || 150} Mbps\n`);
    }

    lines.push(`## 3. IEEE 802.1Q VLAN Segmentation Architecture`);
    lines.push(`| VLAN ID | VLAN Name | Purpose | Subnet / CIDR | Default Gateway | Security Zone |`);
    lines.push(`|---------|-----------|---------|---------------|-----------------|---------------|`);
    vlans.forEach(v => {
      lines.push(`| ${v.vlanId} | ${v.name} | ${v.purpose} | ${v.subnet}/${v.cidr} | ${v.gateway} | ${v.securityZone} |`);
    });
    lines.push(`\n`);

    lines.push(`## 4. Hardware Inventory & Infrastructure Schedule`);
    lines.push(`| Hostname | Role | Manufacturer / Model | Management IP | MAC Address | Physical Location |`);
    lines.push(`|----------|------|----------------------|---------------|-------------|-------------------|`);
    inventory.forEach(i => {
      lines.push(`| ${i.hostname} | ${i.deviceType.toUpperCase()} | ${i.manufacturer} ${i.model} | ${i.managementIp} | ${i.macAddress} | ${i.location} |`);
    });
    lines.push(`\n`);

    lines.push(`## 5. IP Address Management (IPAM) Plan`);
    lines.push(`| Subnet Name | VLAN | Network Address | Mask | Usable Range | Total Hosts | Used |`);
    lines.push(`|-------------|------|-----------------|------|--------------|-------------|------|`);
    ipam.forEach(net => {
      lines.push(`| ${net.name} | ${net.vlanId || 1} | ${net.networkAddress}/${net.cidr} | ${net.subnetMask} | ${net.usableStart} - ${net.usableEnd} | ${net.totalHosts} | ${net.usedHosts} |`);
    });
    lines.push(`\n`);

    lines.push(`## 6. Cisco IOS Ready-to-Deploy Configurations\n`);
    devices.forEach(dev => {
      if (dev.type === 'router' || dev.type === 'switch' || dev.type === 'firewall') {
        lines.push(`### Device: ${dev.name} (${dev.hostname || dev.name})\n\`\`\`cisco`);
        lines.push(generateCiscoIosConfiguration(dev, project.topology));
        lines.push(`\`\`\`\n`);
      }
    });

    lines.push(`\n---\n*Generated automatically by NET-LAB 2.0 — Real-World Enterprise Networking Platform*`);
    return lines.join('\n');
  }, [project, capacity, devices, vlans, inventory, ipam]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied full documentation dossier to clipboard');
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_Engineering_Dossier.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Downloaded engineering documentation markdown');
  };

  const activeDevice = devices.find(d => d.id === selectedDeviceConfig) || devices[0];
  const activeDeviceConfig = activeDevice ? generateCiscoIosConfiguration(activeDevice, project.topology) : '';

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText size={18} className="text-cyan-400" />
            <span>Automated Network Documentation & Cisco IOS Configuration Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export a complete, professional engineering project dossier with capacity sizing, VLAN matrices, and ready-to-paste CLI scripts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 transition"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-cyan-500/20 transition"
          >
            <Download size={13} />
            <span>Download .MD Dossier</span>
          </button>
        </div>
      </div>

      {/* Grid: Overview & Capacity Summary */}
      {capacity && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Total Bandwidth</div>
            <div className="text-lg font-bold text-white font-mono mt-1">{capacity.totalBandwidthNeededMbps} Mbps</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-1">Recommended: {capacity.recommendedInternetPlan}</div>
          </div>

          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">PoE Power Budget</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-1">{capacity.poePowerWatts} Watts</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">For APs, CCTV & IP Phones</div>
          </div>

          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Switch Ports Sized</div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-1">{capacity.switchPortCount} Ports</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Includes +25% expansion headroom</div>
          </div>

          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Segmented VLANs</div>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-1">{vlans.length} VLANs</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">{inventory.length} Hardware Assets</div>
          </div>
        </div>
      )}

      {/* Cisco IOS Config Explorer */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Individual Device Cisco IOS Startup Configuration
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Select Target Node:</span>
            <select
              value={selectedDeviceConfig}
              onChange={(e) => setSelectedDeviceConfig(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type.toUpperCase()}) - {d.hostname || d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
          {activeDeviceConfig}
        </pre>
      </div>

      {/* Document Preview Box */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BookOpen size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Engineering Dossier Preview (Markdown)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {fullMarkdown.split('\n').length} lines generated
          </span>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {fullMarkdown}
        </div>
      </div>

    </div>
  );
};
