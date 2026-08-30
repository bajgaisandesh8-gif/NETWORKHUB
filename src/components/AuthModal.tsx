import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, LogOut } from 'lucide-react';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

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
        const user = await authService.signup(email, password, name, 'student');
        onSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signOut();
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 font-sans relative">
        <button aria-label="Close authentication dialog" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition">
          <X size={18} />
        </button>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center font-mono font-bold">NL</div>
            <h2 className="text-lg font-bold text-white">{tab === 'login' ? 'Sign In to NET-LAB' : 'Create NET-LAB Account'}</h2>
          </div>
          <p className="text-xs text-slate-400">
            {isSupabaseConfigured
              ? 'Secure account access powered by Supabase Auth.'
              : 'Local demo mode is active. Configure Supabase for real accounts and cloud sessions.'}
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 font-mono text-xs">
          <button onClick={() => { setTab('login'); setError(null); }} className={`flex-1 py-1.5 rounded-lg transition font-semibold ${tab === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
          <button onClick={() => { setTab('signup'); setError(null); }} className={`flex-1 py-1.5 rounded-lg transition font-semibold ${tab === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Create Account</button>
        </div>

        {error && <div role="alert" className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2"><AlertCircle size={14} className="shrink-0" /><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          {tab === 'signup' && <div>
            <label htmlFor="auth-name" className="text-[10px] text-slate-400 uppercase">Full Name</label>
            <div className="relative mt-1">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="auth-name" type="text" required minLength={2} placeholder="Alex Rivera" value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
          </div>}

          <div>
            <label htmlFor="auth-email" className="text-[10px] text-slate-400 uppercase">Email Address</label>
            <div className="relative mt-1">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="auth-email" type="email" required autoComplete="email" placeholder="student@university.edu" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="text-[10px] text-slate-400 uppercase">Password</label>
            <div className="relative mt-1">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="auth-password" type="password" required minLength={8} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
          </div>

          {tab === 'signup' && <p className="text-[10px] text-slate-500">New accounts are created as Student. Instructor/Admin access must be granted separately.</p>}

          <button type="submit" disabled={loading} className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-40">
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {!isSupabaseConfigured && <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase font-mono text-center">Local Demo Profiles</div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <button onClick={async () => { setLoading(true); setError(null); try { const user = await authService.login('student@netlab.local'); onSuccess(user); onClose(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Demo login failed'); } finally { setLoading(false); } }} className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white">Student Demo</button>
            <button onClick={async () => { setLoading(true); setError(null); try { const user = await authService.login('instructor@netlab.local', undefined); onSuccess(user); onClose(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Demo login failed'); } finally { setLoading(false); } }} className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white">Instructor Demo</button>
          </div>
        </div>}

        <button type="button" onClick={handleSignOut} disabled={loading} className="w-full flex items-center justify-center gap-2 text-[11px] text-slate-500 hover:text-red-300 transition disabled:opacity-40">
          <LogOut size={13} /> Sign out current session
        </button>
      </div>
    </div>
  );
};
