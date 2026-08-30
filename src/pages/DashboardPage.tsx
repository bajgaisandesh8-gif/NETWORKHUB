import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Flame, 
  Brain, 
  ArrowRight, 
  Cpu, 
  Network, 
  ShieldAlert, 
  Activity, 
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';
import { LABS_DATA } from '../data/labsData';

interface DashboardPageProps {
  onNavigate: (page: string, meta?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const progress = databaseService.getProgress();

  const completedLabsCount = progress.completedLabs.length;
  const progressPercent = Math.round((completedLabsCount / 15) * 100);

  const nextLab = LABS_DATA.find(l => !progress.completedLabs.includes(l.id)) || LABS_DATA[0];

  const skillTree = [
    { id: 'sk-1', title: 'Network Fundamentals', desc: 'OSI 7 Layers, TCP/IP, PDU Encapsulation', unlocked: true, level: 1 },
    { id: 'sk-2', title: 'IP Addressing & Subnetting', desc: 'CIDR, VLSM, Binary Octets, RFC 1918', unlocked: true, level: 2 },
    { id: 'sk-3', title: 'Ethernet Switching & VLANs', desc: 'CAM Tables, 802.1Q Trunks, Broadcast Isolation', unlocked: completedLabsCount >= 3, level: 3 },
    { id: 'sk-4', title: 'Dynamic IP Routing', desc: 'Default Gateways, OSPF Area 0, BGP, TTL Decrement', unlocked: completedLabsCount >= 7, level: 4 },
    { id: 'sk-5', title: 'Firewalls & Network Security', desc: 'ACLs, Port Filtering, NAT/PAT, ARP Spoof Defense', unlocked: completedLabsCount >= 10, level: 5 },
    { id: 'sk-6', title: 'Enterprise Network Architect', desc: 'Hierarchical Core/Dist/Access, High Availability', unlocked: completedLabsCount >= 14, level: 6 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Award size={22} className="text-cyan-400" />
            <span>Student Learning Dashboard & Mastery Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your practical laboratory completions, skill tree milestones, and unlocked certifications.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('labs', { selectedLabId: nextLab.id })}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition"
          >
            <span>Resume Lab #{nextLab.labNumber}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Metric 1: Labs */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="uppercase text-[10px]">Practical Labs Completed</span>
            <Cpu size={18} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {completedLabsCount} <span className="text-slate-500 text-sm font-normal">/ 15 Labs</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Streak */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="uppercase text-[10px]">Active Study Streak</span>
            <Flame size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {progress.learningStreakDays} <span className="text-slate-500 text-sm font-normal">Days Active</span>
          </div>
          <div className="text-[11px] text-slate-400">Streak multiplier active</div>
        </div>

        {/* Metric 3: Quizzes */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="uppercase text-[10px]">Assessment Quizzes</span>
            <Brain size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-300">
            {Object.keys(progress.quizScores).length} <span className="text-slate-500 text-sm font-normal">Topics Tested</span>
          </div>
          <div className="text-[11px] text-slate-400">Adaptive engine enabled</div>
        </div>

        {/* Metric 4: Badges */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="uppercase text-[10px]">Earned Badges</span>
            <Award size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {progress.earnedAchievements.length} <span className="text-slate-500 text-sm font-normal">/ {ACHIEVEMENTS_DATA.length} Badges</span>
          </div>
          <div className="text-[11px] text-slate-400">Mastery level progressing</div>
        </div>
      </div>

      {/* Weak Topics Alert if any */}
      {progress.weakTopics.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-3">
            <ShieldAlert size={20} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Recommended Review Areas: </span>
              <span className="text-slate-300">{progress.weakTopics.join(', ')}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('tools')}
            className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
          >
            Practice Tools
          </button>
        </div>
      )}

      {/* Visual Networking Skill Tree */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h3 className="font-bold text-white text-sm font-mono flex items-center space-x-2">
            <Layers size={18} className="text-cyan-400" />
            <span>Networking Engineering Skill Progression Tree</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete practical laboratories to unlock advanced routing, security, and architectural tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {skillTree.map((skill) => (
            <div
              key={skill.id}
              className={`p-4 rounded-xl border transition-all ${
                skill.unlocked
                  ? 'bg-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                <span className="text-[10px] text-slate-500 uppercase">Tier {skill.level}</span>
                {skill.unlocked ? (
                  <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold">
                    <Check size={12} />
                    <span>UNLOCKED</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-slate-500 text-[10px]">
                    <Lock size={12} />
                    <span>LOCKED</span>
                  </span>
                )}
              </div>

              <h4 className={`font-bold text-sm ${skill.unlocked ? 'text-white' : 'text-slate-400'}`}>
                {skill.title}
              </h4>
              <p className="text-slate-400 text-xs font-sans mt-1">
                {skill.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Earned Badges & Achievements Gallery */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="font-bold text-white text-sm">Achievements & Certification Badges</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_DATA.map((ach) => {
            const isEarned = progress.earnedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition ${
                  isEarned
                    ? 'bg-slate-950 border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${isEarned ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{ach.title}</h4>
                    <span className="text-[10px] text-slate-500 uppercase">{ach.category}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-snug">
                  {ach.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
