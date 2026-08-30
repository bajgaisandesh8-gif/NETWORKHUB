import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const user = await authService.login(email, password);
        onSuccess(user);
        onClose();
      } else {
        const user = await authService.signup(email, password, name, role);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'student' | 'instructor' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      const demoEmail = `${demoRole}@netlab.edu`;
      const user = await authService.login(demoEmail, 'password123');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 font-sans relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center font-mono font-bold">
              NL
            </div>
            <h2 className="text-lg font-bold text-white">
              {tab === 'login' ? 'Sign In to NET-LAB' : 'Create NET-LAB Account'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {tab === 'login' 
              ? 'Access your laboratory progress, custom topologies, and skill badges.'
              : 'Start your hands-on networking journey with full lab persistence.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition font-semibold ${
              tab === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition font-semibold ${
              tab === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          {tab === 'signup' && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Full Name</label>
              <div className="relative mt-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase">Email Address</label>
            <div className="relative mt-1">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase">Password</label>
            <div className="relative mt-1">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Primary Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="student">Networking Student / Learner</option>
                <option value="instructor">Professor / Network Instructor</option>
                <option value="admin">Systems & Network Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-40"
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase font-mono text-center">
            Instant 1-Click Demo Profiles:
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <button
              onClick={() => handleDemoLogin('student')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-center"
            >
              Student
            </button>
            <button
              onClick={() => handleDemoLogin('instructor')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-center"
            >
              Instructor
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-center"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
