import React from 'react';
import { Briefcase, LayoutDashboard, FileText, Globe, RefreshCw, Cpu, Activity, Sparkles, GitPullRequest } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: any;
  isConnected: boolean;
  onRunAgent: (command: string) => void;
  isAgentRunning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  isConnected,
  onRunAgent,
  isAgentRunning,
}) => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo">
          <Cpu size={22} />
        </div>
        <div>
          <div className="brand-title">Career-Ops</div>
          <div className="brand-subtitle">Antigravity AI Job Engine</div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <GitPullRequest size={17} />
          Pipeline
          {stats?.pendingPipelineCount !== undefined && stats.pendingPipelineCount > 0 && (
            <span className="tab-badge" style={{ background: 'var(--accent-cyan)', color: '#000' }}>
              {stats.pendingPipelineCount}
            </span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
          onClick={() => setActiveTab('applied')}
        >
          <Briefcase size={17} />
          Applied Jobs
          {stats?.totalApplied !== undefined && (
            <span className="tab-badge">{stats.totalApplied}</span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'cv' ? 'active' : ''}`}
          onClick={() => setActiveTab('cv')}
        >
          <FileText size={17} />
          Profile & CV
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'generated-cvs' ? 'active' : ''}`}
          onClick={() => setActiveTab('generated-cvs')}
        >
          <Sparkles size={17} />
          Generated CVs
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'portals' ? 'active' : ''}`}
          onClick={() => setActiveTab('portals')}
        >
          <Globe size={17} />
          Portals & ATS
          {stats?.activePortalsCount !== undefined && (
            <span className="tab-badge">{stats.activePortalsCount}</span>
          )}
        </button>
      </nav>

      <div className="header-actions">
        <div className="status-pill" title={isConnected ? 'Real-time SSE active' : 'Disconnected'}>
          <span className="pulse-dot" style={{ backgroundColor: isConnected ? '#10b981' : '#f43f5e' }}></span>
          {isConnected ? 'Live Agent' : 'Connecting'}
        </div>

        <button
          className="btn-primary"
          onClick={() => onRunAgent('scan')}
          disabled={isAgentRunning}
        >
          <RefreshCw size={16} className={isAgentRunning ? 'spin' : ''} />
          {isAgentRunning ? 'Scanning...' : 'Run Scan'}
        </button>

        <button
          className="btn-secondary"
          onClick={() => onRunAgent('doctor')}
          disabled={isAgentRunning}
        >
          <Activity size={16} />
          Doctor
        </button>
      </div>
    </header>
  );
};
