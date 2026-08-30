import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Activity, 
  ShieldAlert, 
  Calculator, 
  Layers, 
  Cpu, 
  Terminal, 
  FolderKanban, 
  Award, 
  Menu, 
  X, 
  Search, 
  Database,
  User,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { authService, UserProfile, UserRole } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, meta?: any) => void;
  onOpenSearch: () => void;
  onOpenSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenSyncModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    return authService.subscribe(profile => {
      setUserProfile(profile);
    });
  }, []);

  const handleRoleChange = (role: UserRole) => {
    authService.updateRole(role);
    setRoleDropdownOpen(false);
  };

  const navItems = [
    { id: 'topology', label: 'Topology Builder', icon: Network },
    { id: 'packet-trace', label: 'Packet Journey', icon: Activity },
    { id: 'diagnostics', label: 'Diagnostics', icon: ShieldAlert },
    { id: 'tools', label: 'Calculators & Tools', icon: Calculator },
    { id: 'labs', label: 'Practical Labs', icon: Cpu, badge: '15' },
    { id: 'osi', label: 'OSI & TCP/IP', icon: Layers },
    { id: 'protocols', label: 'Protocols', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: CheckCircle2 },
    { id: 'terminal', label: 'CLI Terminal', icon: Terminal },
    { id: 'workspace', label: 'Projects', icon: FolderKanban },
    { id: 'dashboard', label: 'Dashboard', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white">
              <Network size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">NET<span className="text-cyan-400">-LAB</span></span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase font-semibold">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
                Interactive Networking Laboratory
              </div>
            </div>
          </div>

          {/* Desktop Nav Links (Primary) */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Search shortcut button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-mono transition"
            >
              <Search size={14} />
              <span className="hidden md:inline">Quick Search</span>
              <kbd className="hidden md:inline text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+K</kbd>
            </button>

            {/* Storage / Supabase Sync Indicator */}
            <button
              onClick={onOpenSyncModal}
              title={isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Operating in High-Performance Local-First Mode'}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs transition"
            >
              <Database size={13} className={isSupabaseConfigured ? 'text-emerald-400' : 'text-cyan-400'} />
              <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
                {isSupabaseConfigured ? 'Cloud Sync' : 'Local-First'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
            </button>

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {userProfile?.fullName ? userProfile.fullName[0] : 'S'}
                </div>
                <span className="capitalize hidden sm:inline text-[11px] text-slate-300 font-mono">
                  {userProfile?.role || 'Student'}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-semibold text-slate-200">{userProfile?.fullName || 'Student'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{userProfile?.email || 'student@netlab.local'}</div>
                  </div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    Switch Active Role
                  </div>
                  {(['student', 'instructor', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-800 transition ${
                        userProfile?.role === r ? 'text-cyan-400 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {userProfile?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onNavigate('workspace');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      My Projects & Portfolio
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('about');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Platform & Creator Info
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-1 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
