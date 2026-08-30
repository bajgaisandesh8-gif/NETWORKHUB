import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight, 
  Play, 
  CheckSquare, 
  Square, 
  HelpCircle, 
  Award, 
  Network,
  RotateCcw,
  Sparkles,
  Zap,
  Terminal
} from 'lucide-react';
import { LABS_DATA } from '../data/labsData';
import { PracticalLab } from '../types';
import { databaseService } from '../services/databaseService';

interface LabsPageProps {
  initialLabId?: string;
  onNavigate: (page: string, meta?: any) => void;
}

export const LabsPage: React.FC<LabsPageProps> = ({ initialLabId, onNavigate }) => {
  const [selectedLabId, setSelectedLabId] = useState<string>(initialLabId || LABS_DATA[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeLab: PracticalLab = LABS_DATA.find(l => l.id === selectedLabId) || LABS_DATA[0];
  const userProgress = databaseService.getProgress();

  const categories = ['all', 'Fundamentals', 'Addressing', 'Switching', 'Routing', 'Security', 'Design'];

  const filteredLabs = LABS_DATA.filter(l => 
    categoryFilter === 'all' || l.category.toLowerCase() === categoryFilter.toLowerCase()
  );

  const toggleTask = (taskId: string) => {
    setCheckedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleLabSubmit = () => {
    const totalTasks = activeLab.tasks.length;
    const completedTasksCount = activeLab.tasks.filter(t => checkedTasks[t.id]).length;
    const score = Math.round((completedTasksCount / totalTasks) * 100);

    setSubmittedScore(score);
    databaseService.recordLabCompletion(activeLab.id, score);
    setToastMsg(`Lab ${activeLab.labNumber} completed! Score: ${score}%`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 shadow-2xl text-xs font-mono flex items-center space-x-2">
          <Zap size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Cpu size={22} className="text-cyan-400" />
              <span>15 Practical Networking Laboratories</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
              {userProgress.completedLabs.length} / 15 Completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hands-on guided laboratory scenarios covering LAN switching, VLANs, OSPF routing, ACL firewalls, and troubleshooting.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                categoryFilter === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Lab Curriculum & Interactive Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Lab Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-2 font-mono text-xs max-h-[750px] overflow-y-auto pr-1">
          {filteredLabs.map((lab) => {
            const isSelected = lab.id === activeLab.id;
            const isCompleted = userProgress.completedLabs.includes(lab.id);

            return (
              <div
                key={lab.id}
                onClick={() => {
                  setSelectedLabId(lab.id);
                  setCheckedTasks({});
                  setShowHint(false);
                  setSubmittedScore(null);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCompleted 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                      : isSelected 
                      ? 'bg-cyan-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : `L${lab.labNumber}`}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 truncate w-44">{lab.title}</h3>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                      <span>{lab.category}</span>
                      <span>•</span>
                      <span>{lab.estimatedMinutes}m</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  lab.difficulty === 'Beginner' ? 'text-emerald-400' : lab.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-purple-400'
                }`}>
                  {lab.difficulty}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Active Lab Player (8 cols) */}
        <div className="lg:col-span-8 space-y-4 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            
            {/* Lab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold text-xs">
                    Lab {activeLab.labNumber}
                  </span>
                  <span className="text-slate-400 text-xs">• {activeLab.category}</span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">{activeLab.title}</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('topology', { topology: activeLab.starterTopology })}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition"
                >
                  <Network size={14} />
                  <span>Launch Canvas</span>
                </button>

                <button
                  onClick={() => onNavigate('terminal', { topology: activeLab.starterTopology })}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                  title="Open Terminal"
                >
                  <Terminal size={15} />
                </button>
              </div>
            </div>

            {/* Objective & Scenario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="text-[10px] uppercase text-cyan-400 font-bold">1. Learning Objective</div>
                <p className="text-slate-300 text-xs font-sans leading-relaxed">{activeLab.objective}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="text-[10px] uppercase text-indigo-400 font-bold">2. Scenario Context</div>
                <p className="text-slate-300 text-xs font-sans leading-relaxed">{activeLab.scenario}</p>
              </div>
            </div>

            {/* Step-by-Step Practical Tasks Checklist */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300 font-bold text-xs">
                <span>3. Required Lab Configuration Tasks</span>
                <span className="text-cyan-400">
                  {activeLab.tasks.filter(t => checkedTasks[t.id]).length} / {activeLab.tasks.length} Done
                </span>
              </div>

              <div className="space-y-2">
                {activeLab.tasks.map((task) => {
                  const isChecked = Boolean(checkedTasks[task.id]);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                        isChecked 
                          ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 text-cyan-400">
                        {isChecked ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className={`text-xs font-sans font-medium ${isChecked ? 'line-through opacity-80' : 'text-slate-200'}`}>
                          {task.description}
                        </div>
                        {task.cliHint && (
                          <div className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded inline-block">
                            $ {task.cliHint}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expected Result & Submission */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Expected Verification Result:</div>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">{activeLab.expectedResult}</p>
            </div>

            {/* Lab Submit Action Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-slate-400 hover:text-cyan-300 text-xs flex items-center space-x-1"
              >
                <HelpCircle size={14} />
                <span>{showHint ? 'Hide Concept Explanation' : 'View Concept Explanation'}</span>
              </button>

              <button
                onClick={handleLabSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2"
              >
                <Award size={16} />
                <span>Submit & Verify Lab</span>
              </button>
            </div>

            {/* Educational Explanation Box */}
            {showHint && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 space-y-1 text-slate-300 text-xs font-sans animate-fadeIn">
                <div className="font-bold text-indigo-300 font-mono text-[11px] uppercase">Underlying Networking Science:</div>
                <p className="leading-relaxed">{activeLab.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
