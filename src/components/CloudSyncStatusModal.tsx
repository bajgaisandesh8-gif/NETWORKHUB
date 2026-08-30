import React from 'react';
import { X, Database, CheckCircle2, AlertCircle, HardDrive, Cloud, Key, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigState } from '../services/supabaseClient';

interface CloudSyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncStatusModal: React.FC<CloudSyncStatusModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const envSample = `VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${isSupabaseConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'}`}>
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Database & Storage Status</h3>
              <p className="text-xs text-slate-400 font-mono">NET-LAB Data Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Current Mode Badge */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            isSupabaseConfigured 
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' 
              : 'bg-cyan-950/30 border-cyan-800/50 text-cyan-300'
          }`}>
            {isSupabaseConfigured ? (
              <Cloud size={20} className="shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <HardDrive size={20} className="shrink-0 text-cyan-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-white">
                {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Active: High-Performance Local-First Mode'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isSupabaseConfigured
                  ? 'Your topologies, projects, and lab attempts are being synchronized to your Supabase PostgreSQL cloud database.'
                  : 'All topologies, labs, notes, and progress are saved in your browser localStorage. No data is lost between refreshes.'
                }
              </p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2.5 font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Supabase Status:</span>
              <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isSupabaseConfigured ? 'ONLINE (Connected)' : 'UNCONFIGURED (Offline Mode)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>PostgreSQL Schema:</span>
              <span className="text-slate-200">/supabase/migrations/001_initial_schema.sql</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Row-Level Security:</span>
              <span className="text-emerald-400">RLS Policies Defined</span>
            </div>
          </div>

          {/* How to Connect instructions */}
          {!isSupabaseConfigured && (
            <div className="space-y-2">
              <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <Key size={14} className="text-cyan-400" />
                <span>How to connect Supabase Cloud:</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                To connect Supabase, create a project at <strong className="text-slate-300">supabase.com</strong>, run the SQL migration in <strong className="text-slate-300">/supabase/migrations/</strong>, and add your keys in <strong className="text-slate-300">.env</strong>:
              </p>
              <div className="relative p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                <code className="text-cyan-300">{envSample}</code>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Copy snippet"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
