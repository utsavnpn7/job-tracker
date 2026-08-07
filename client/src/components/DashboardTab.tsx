import React from 'react';
import { Briefcase, Award, CheckCircle2, Search, Globe, Terminal, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface DashboardTabProps {
  stats: any;
  recentApplied: any[];
  recentEvaluated: any[];
  portalHealth: any[];
  terminalLogs: string;
  onRunAgent: (command: string) => void;
  isAgentRunning: boolean;
  onNavigateTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  recentApplied,
  recentEvaluated: _recentEvaluated,
  portalHealth: _portalHealth,
  terminalLogs,
  onRunAgent,
  isAgentRunning,
  onNavigateTab,
}) => {
  return (
    <div className="dashboard-view">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Applied</div>
            <div className="stat-value">{stats?.totalApplied ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)' }}>
            <Briefcase size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Interviewing</div>
            <div className="stat-value">{stats?.interviewing ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Offers</div>
            <div className="stat-value">{stats?.offers ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}>
            <Award size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Evaluated Roles</div>
            <div className="stat-value">{stats?.totalEvaluated ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}>
            <Search size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active Portals</div>
            <div className="stat-value">{stats?.activePortalsCount ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Globe size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Applications Table */}
        <div className="table-container">
          <div className="section-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', margin: 0 }}>
            <div className="section-title">
              <Briefcase size={20} style={{ color: 'var(--accent-blue)' }} />
              Recent Applied Jobs
            </div>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onNavigateTab('applied')}>
              View All Tracker
            </button>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentApplied.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No applications recorded yet. Add your first application!
                  </td>
                </tr>
              ) : (
                recentApplied.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{item.company}</td>
                    <td>{item.role}</td>
                    <td>{item.platform || 'Direct ATS'}</td>
                    <td>
                      <span className={`badge badge-${(item.status || 'submitted').toLowerCase()}`}>
                        {item.status || 'Submitted'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.date_applied || item.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Agent Actions Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} />
            Antigravity Agent Controls
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Execute background portal scanners, ATS scrapers, and data normalization scripts directly from your dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onRunAgent('scan')} disabled={isAgentRunning}>
              <Play size={16} style={{ color: 'var(--accent-cyan)' }} />
              Run Fast Portal Scan
            </button>

            <button className="btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onRunAgent('scan:full')} disabled={isAgentRunning}>
              <Play size={16} style={{ color: 'var(--accent-indigo)' }} />
              Run Full ATS Deep Scan
            </button>

            <button className="btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onRunAgent('liveness')} disabled={isAgentRunning}>
              <ShieldAlert size={16} style={{ color: 'var(--accent-amber)' }} />
              Check Job Liveness Sweep
            </button>

            <button className="btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onRunAgent('normalize')} disabled={isAgentRunning}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
              Normalize Statuses & Deduplicate
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Live Output Log */}
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-title">
            <Terminal size={16} />
            ANTIGRAVITY AGENT STDOUT / REAL-TIME PROCESS LOGS
          </div>
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>
        <pre className="terminal-body">
          {terminalLogs || 'System ready. Click "Run Scan" or "Doctor" to initiate real-time Antigravity agent process logs...'}
        </pre>
      </div>
    </div>
  );
};
