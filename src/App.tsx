import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { NetworkBackground } from './components/NetworkBackground';
import { CommandPalette } from './components/CommandPalette';
import { CloudSyncStatusModal } from './components/CloudSyncStatusModal';
import { AuthModal } from './components/AuthModal';

import { LandingPage } from './pages/LandingPage';
import { TopologyLabPage } from './pages/TopologyLabPage';
import { PacketTracePage } from './pages/PacketTracePage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { ToolsPage } from './pages/ToolsPage';
import { LabsPage } from './pages/LabsPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { OsiModelPage } from './pages/OsiModelPage';
import { ProtocolsPage } from './pages/ProtocolsPage';
import { TerminalPage } from './pages/TerminalPage';
import { SecurityPage } from './pages/SecurityPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AboutPage } from './pages/AboutPage';

import { NetworkTopology } from './types';
import { PRESET_TOPOLOGIES } from './data/topologiesData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [currentTopology, setCurrentTopology] = useState<NetworkTopology>(PRESET_TOPOLOGIES[0]);
  const [navigationMeta, setNavigationMeta] = useState<any>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: string, meta?: any) => {
    setCurrentPage(page);
    setNavigationMeta(meta || null);
    if (meta?.topology) {
      setCurrentTopology(meta.topology);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-slate-950">
      <NetworkBackground />

      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 z-10">
        {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === 'topology' && <TopologyLabPage initialTopology={navigationMeta?.topology || currentTopology} onNavigate={handleNavigate} />}
        {currentPage === 'packet-trace' && <PacketTracePage topology={navigationMeta?.topology || currentTopology} onNavigate={handleNavigate} />}
        {currentPage === 'diagnostics' && <DiagnosticsPage topology={navigationMeta?.topology || currentTopology} onNavigate={handleNavigate} />}
        {currentPage === 'tools' && <ToolsPage initialTab={navigationMeta?.tab || 'subnet'} onNavigate={handleNavigate} />}
        {currentPage === 'labs' && <LabsPage initialLabId={navigationMeta?.selectedLabId} onNavigate={handleNavigate} />}
        {currentPage === 'quizzes' && <QuizzesPage onNavigate={handleNavigate} />}
        {currentPage === 'osi' && <OsiModelPage onNavigate={handleNavigate} />}
        {currentPage === 'protocols' && <ProtocolsPage initialProtocolId={navigationMeta?.protocolId} onNavigate={handleNavigate} />}
        {currentPage === 'terminal' && <TerminalPage topology={navigationMeta?.topology || currentTopology} selectedDeviceId={navigationMeta?.deviceId} onNavigate={handleNavigate} />}
        {currentPage === 'security' && <SecurityPage onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'workspace' && <WorkspacePage onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={handleNavigate} />
      <CloudSyncStatusModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => {}} />
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
