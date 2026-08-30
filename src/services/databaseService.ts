import { 
  NetworkTopology, 
  UserProgress, 
  UserProject, 
  ProjectVersion, 
  IpamNetwork, 
  VlanDefinition, 
  DeviceInventoryItem 
} from '../types';
import { PRESET_TOPOLOGIES } from '../data/topologiesData';
import { generateEnterpriseNetworkDesign } from '../utils/networkDesigner';
import { isSupabaseConfigured, supabaseRestRequest } from './supabaseClient';

const TOPOLOGIES_STORAGE_KEY = 'netlab_topologies_db';
const PROGRESS_STORAGE_KEY = 'netlab_progress_db';
const PROJECTS_STORAGE_KEY = 'netlab_projects_db';
const NOTES_STORAGE_KEY = 'netlab_notes_db';

class DatabaseService {
  // --- TOPOLOGIES ---
  public getTopologies(): NetworkTopology[] {
    try {
      const stored = localStorage.getItem(TOPOLOGIES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading topologies from localStorage:', e);
    }
    // Seed with presets if empty
    this.saveTopologies(PRESET_TOPOLOGIES);
    return PRESET_TOPOLOGIES;
  }

  public getTopologyById(id: string): NetworkTopology | null {
    const list = this.getTopologies();
    return list.find(t => t.id === id) || null;
  }

  public saveTopology(topology: NetworkTopology): { success: boolean; topology: NetworkTopology } {
    const list = this.getTopologies();
    const existingIndex = list.findIndex(t => t.id === topology.id);

    const updatedTopology: NetworkTopology = {
      ...topology,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedTopology;
    } else {
      list.unshift(updatedTopology);
    }

    this.saveTopologies(list);

    // If Supabase is connected, optionally sync in background
    if (isSupabaseConfigured) {
      supabaseRestRequest('saved_topologies', {
        method: 'POST',
        body: updatedTopology
      }).catch(err => console.warn('Supabase background sync notice:', err));
    }

    return { success: true, topology: updatedTopology };
  }

  public deleteTopology(id: string): boolean {
    const list = this.getTopologies();
    const filtered = list.filter(t => t.id !== id);
    this.saveTopologies(filtered);
    return true;
  }

  public duplicateTopology(id: string): NetworkTopology | null {
    const orig = this.getTopologyById(id);
    if (!orig) return null;

    const copy: NetworkTopology = {
      ...orig,
      id: `topo-${Date.now()}`,
      name: `${orig.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveTopology(copy);
    return copy;
  }

  private saveTopologies(list: NetworkTopology[]) {
    try {
      localStorage.setItem(TOPOLOGIES_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving topologies to localStorage:', e);
    }
  }

  // --- USER PROGRESS & ACHIEVEMENTS ---
  public getProgress(): UserProgress {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }

    const defaultProgress: UserProgress = {
      userId: 'local-student-01',
      completedLabs: ['lab-01'],
      labScores: { 'lab-01': 100 },
      quizScores: { 'Subnetting': { score: 10, total: 10, date: new Date().toISOString() } },
      weakTopics: [],
      learningStreakDays: 3,
      lastActive: new Date().toISOString(),
      unlockedSkills: ['Fundamentals', 'OSI Model', 'IP Addressing'],
      earnedAchievements: ['ach-first-lab', 'ach-subnet-master']
    };
    this.saveProgress(defaultProgress);
    return defaultProgress;
  }

  public recordLabCompletion(labId: string, score: number): UserProgress {
    const progress = this.getProgress();
    if (!progress.completedLabs.includes(labId)) {
      progress.completedLabs.push(labId);
    }
    progress.labScores[labId] = Math.max(score, progress.labScores[labId] || 0);
    progress.lastActive = new Date().toISOString();

    if (!progress.earnedAchievements.includes('ach-first-lab')) {
      progress.earnedAchievements.push('ach-first-lab');
    }
    if (progress.completedLabs.length >= 5 && !progress.earnedAchievements.includes('ach-troubleshooter')) {
      progress.earnedAchievements.push('ach-troubleshooter');
    }

    this.saveProgress(progress);
    return progress;
  }

  public recordQuizScore(topic: string, score: number, total: number): { progress: UserProgress; recommendation?: string } {
    const progress = this.getProgress();
    progress.quizScores[topic] = { score, total, date: new Date().toISOString() };
    progress.lastActive = new Date().toISOString();

    const percentage = (score / total) * 100;
    if (percentage < 70) {
      if (!progress.weakTopics.includes(topic)) {
        progress.weakTopics.push(topic);
      }
    } else {
      progress.weakTopics = progress.weakTopics.filter(t => t !== topic);
    }

    this.saveProgress(progress);

    let recommendation: string | undefined;
    if (percentage < 70) {
      recommendation = `We noticed your ${topic} score was below 70%. Practice with the Practical Labs or review the Subnetting & Protocol references.`;
    }

    return { progress, recommendation };
  }

  private saveProgress(progress: UserProgress) {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  // --- WORKSPACE PROJECTS ---
  public getProjects(): UserProject[] {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading projects:', e);
    }

    // Seed with comprehensive Real-World Case Studies
    const defaultDesign = generateEnterpriseNetworkDesign({
      organizationName: 'Kasturi College Campus',
      campusFloors: 3,
      totalUsers: 150,
      departments: ['Computer Science', 'Management', 'Administration', 'Library'],
      internetBandwidthMbps: 500,
      ispRedundancy: true,
      serversNeeded: 4,
      wifiAccessPoints: 12,
      cctvCameras: 24,
      voipPhones: 18,
      guestNetwork: true,
      iotDevices: 10
    });

    const defaultProject: UserProject = {
      id: 'proj-kasturi-college',
      name: 'Kasturi College Campus Network Architecture',
      description: 'Comprehensive 3-tier hierarchical campus network design with segmented VLANs for Staff, Students, CCTV surveillance, VoIP, and Guest Wi-Fi.',
      status: 'Building',
      topology: defaultDesign.topology,
      planning: {
        organizationName: 'Kasturi College Campus',
        campusFloors: 3,
        totalUsers: 150,
        departments: ['Computer Science', 'Management', 'Administration', 'Library'],
        internetBandwidthMbps: 500,
        ispRedundancy: true,
        serversNeeded: 4,
        wifiAccessPoints: 12,
        cctvCameras: 24,
        voipPhones: 18,
        guestNetwork: true,
        iotDevices: 10
      },
      vlans: defaultDesign.vlans,
      ipamNetworks: defaultDesign.ipamNetworks,
      inventory: defaultDesign.inventory,
      versions: [
        {
          id: 'ver-1',
          versionNumber: 1,
          name: 'Initial Baseline Architecture (V1)',
          timestamp: '2026-02-15T09:00:00.000Z',
          description: 'Baseline hierarchical 3-tier campus layout with 5 VLANs and perimeter firewall.',
          topology: defaultDesign.topology,
          vlans: defaultDesign.vlans,
          ipamNetworks: defaultDesign.ipamNetworks,
          inventory: defaultDesign.inventory
        }
      ],
      notes: 'Engineering Implementation Notes:\n- VLAN 10: Infrastructure Management (10.10.10.0/24)\n- VLAN 20: Server Farm & DNS (10.10.20.0/24)\n- VLAN 30: Academic Staff & Faculty (10.10.30.0/23)\n- VLAN 40: VoIP Telephony QoS (10.10.40.0/24)\n- VLAN 50: CCTV Surveillance NVR (10.10.50.0/24)\n- VLAN 99: Guest Portal Isolation (172.16.99.0/23)\n\nNext Steps:\n1. Configure 802.1Q subinterfaces on Core Router.\n2. Enable DHCP relay (ip helper-address 10.10.20.10).\n3. Verify Access Control Lists on Perimeter Firewall.',
      createdAt: '2026-02-15T09:00:00.000Z',
      updatedAt: '2026-02-15T11:30:00.000Z'
    };

    this.saveProjects([defaultProject]);
    return [defaultProject];
  }

  public getProjectById(id: string): UserProject | null {
    const list = this.getProjects();
    return list.find(p => p.id === id) || null;
  }

  public saveProject(project: UserProject): UserProject {
    const list = this.getProjects();
    const idx = list.findIndex(p => p.id === project.id);
    const updated = { ...project, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveProjects(list);
    return updated;
  }

  public deleteProject(id: string): boolean {
    const list = this.getProjects().filter(p => p.id !== id);
    this.saveProjects(list);
    return true;
  }

  public saveProjectVersion(projectId: string, versionName: string, description: string): ProjectVersion | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const versions = project.versions || [];
    const nextVerNum = versions.length + 1;
    const newVersion: ProjectVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: nextVerNum,
      name: versionName || `Version ${nextVerNum}`,
      timestamp: new Date().toISOString(),
      description: description || `Snapshot captured on ${new Date().toLocaleDateString()}`,
      topology: JSON.parse(JSON.stringify(project.topology)),
      vlans: project.vlans ? JSON.parse(JSON.stringify(project.vlans)) : undefined,
      ipamNetworks: project.ipamNetworks ? JSON.parse(JSON.stringify(project.ipamNetworks)) : undefined,
      inventory: project.inventory ? JSON.parse(JSON.stringify(project.inventory)) : undefined
    };

    project.versions = [...versions, newVersion];
    this.saveProject(project);
    return newVersion;
  }

  public restoreProjectVersion(projectId: string, versionId: string): UserProject | null {
    const project = this.getProjectById(projectId);
    if (!project || !project.versions) return null;

    const targetVer = project.versions.find(v => v.id === versionId);
    if (!targetVer) return null;

    project.topology = JSON.parse(JSON.stringify(targetVer.topology));
    if (targetVer.vlans) project.vlans = JSON.parse(JSON.stringify(targetVer.vlans));
    if (targetVer.ipamNetworks) project.ipamNetworks = JSON.parse(JSON.stringify(targetVer.ipamNetworks));
    if (targetVer.inventory) project.inventory = JSON.parse(JSON.stringify(targetVer.inventory));

    return this.saveProject(project);
  }

  public exportProjectJson(projectId: string): string {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');
    return JSON.stringify(project, null, 2);
  }

  public importProjectJson(jsonString: string): UserProject {
    const parsed = JSON.parse(jsonString);
    if (!parsed.name || !parsed.topology) {
      throw new Error('Invalid project JSON structure: missing name or topology fields.');
    }
    const imported: UserProject = {
      ...parsed,
      id: `proj-imp-${Date.now()}`,
      name: `${parsed.name} (Imported)`,
      updatedAt: new Date().toISOString()
    };
    return this.saveProject(imported);
  }

  public exportDevicesCsv(projectId: string): string {
    const project = this.getProjectById(projectId);
    const devices = project?.inventory || [];
    const headers = ['ID', 'Name', 'Hostname', 'Device Type', 'Manufacturer', 'Model', 'Management IP', 'MAC Address', 'Location', 'VLAN', 'Status', 'Notes'];
    const rows = devices.map(d => [
      d.id,
      `"${d.name}"`,
      `"${d.hostname}"`,
      d.deviceType,
      `"${d.manufacturer}"`,
      `"${d.model}"`,
      d.managementIp,
      d.macAddress,
      `"${d.location}"`,
      d.vlan || '',
      d.status,
      `"${(d.notes || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public exportIpamCsv(projectId: string): string {
    const project = this.getProjectById(projectId);
    const ipams = project?.ipamNetworks || [];
    const headers = ['VLAN ID', 'Subnet Name', 'Network Address', 'CIDR', 'Subnet Mask', 'Gateway', 'Broadcast', 'Usable Range', 'Total Hosts', 'Used Hosts', 'Security Zone'];
    const rows = ipams.map(i => [
      i.vlanId || '',
      `"${i.name}"`,
      i.networkAddress,
      i.cidr,
      i.subnetMask,
      i.gateway,
      i.broadcastAddress,
      `"${i.usableStart} - ${i.usableEnd}"`,
      i.totalHosts,
      i.usedHosts,
      i.securityZone
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private saveProjects(list: UserProject[]) {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving projects:', e);
    }
  }

  // --- NOTES ---
  public getNotes(): Record<string, string> {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      'subnetting': 'CIDR formulas:\nBlock Size = 256 - Subnet Mask octet\nUsable Hosts = 2^(32 - CIDR) - 2\nPrivate ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16',
      'osi-layers': 'PDU Mnemonic: Please Do Not Throw Sausage Pizza Away (Physical, Data Link, Network, Transport, Session, Presentation, Application)'
    };
  }

  public saveNote(key: string, content: string) {
    const notes = this.getNotes();
    notes[key] = content;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }
}

export const databaseService = new DatabaseService();
