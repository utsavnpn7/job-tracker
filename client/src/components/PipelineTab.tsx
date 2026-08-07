import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, Plus, ExternalLink, Search, Terminal, Sparkles, AlertCircle } from 'lucide-react';

interface PipelineItem {
  raw: string;
  url: string;
  company: string;
  role: string;
  location?: string;
  posted?: string;
  score?: string;
  checked: boolean;
}

interface PipelineTabProps {
  pendingItems: PipelineItem[];
  processedItems: PipelineItem[];
  onProcessItem: (url: string) => Promise<void>;
  onRunBatchPipeline: () => void;
  onAddPipelineUrl: (data: any) => Promise<void>;
  terminalLogs: string;
  isProcessing: boolean;
  activeProcessingUrl: string | null;
}

export const PipelineTab: React.FC<PipelineTabProps> = ({
  pendingItems,
  processedItems,
  onProcessItem,
  onRunBatchPipeline,
  onAddPipelineUrl,
  terminalLogs,
  isProcessing,
  activeProcessingUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'unprocessed' | 'processed'>('unprocessed');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newUrl, setNewUrl] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const currentList = activeTab === 'unprocessed' ? pendingItems : processedItems;

  const filteredItems = currentList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.company || '').toLowerCase().includes(term) ||
      (item.role || '').toLowerCase().includes(term) ||
      (item.location || '').toLowerCase().includes(term) ||
      (item.url || '').toLowerCase().includes(term)
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    await onAddPipelineUrl({
      url: newUrl,
      company: newCompany,
      role: newRole,
      location: newLocation,
    });
    setShowAddModal(false);
    setNewUrl('');
    setNewCompany('');
    setNewRole('');
    setNewLocation('');
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Job Pipeline Hub</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Real-time stage queue reading from `data/pipeline.md`
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onRunBatchPipeline} disabled={isProcessing}>
            <Sparkles size={16} /> Batch Process Pending
          </button>

          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Job Listing URL
          </button>
        </div>
      </div>

      {/* Prominent 2-Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('unprocessed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.35rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'unprocessed' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'unprocessed' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'unprocessed' ? 'var(--shadow-glow)' : 'none',
          }}
        >
          <Clock size={18} />
          Unprocessed Jobs
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: activeTab === 'unprocessed' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {pendingItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('processed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.35rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'processed' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'processed' ? '#fff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'processed' ? '0 4px 15px -3px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        >
          <CheckCircle2 size={18} />
          Processed Jobs
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: activeTab === 'processed' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {processedItems.length}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrap" style={{ flex: 1, maxWidth: '480px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Filter ${activeTab === 'unprocessed' ? 'unprocessed' : 'processed'} listings by company, role, or URL...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing {filteredItems.length} of {currentList.length} {activeTab} listing(s)
        </span>
      </div>

      {/* Listings Grid */}
      {filteredItems.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
          {activeTab === 'unprocessed' ? (
            <AlertCircle size={44} style={{ color: 'var(--accent-amber)', marginBottom: '1rem' }} />
          ) : (
            <CheckCircle2 size={44} style={{ color: 'var(--accent-emerald)', marginBottom: '1rem' }} />
          )}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No {activeTab} job listings found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {activeTab === 'unprocessed'
              ? 'All caught up! Queue new job URLs above or run a portal scan to surface new opportunities.'
              : 'Evaluated job listings will appear here once processed by the Antigravity agent.'}
          </p>
        </div>
      ) : (
        <div className="cards-grid" style={{ marginBottom: '2rem' }}>
          {filteredItems.map((item, idx) => {
            const isCurrentlyProcessing = activeProcessingUrl === item.url;
            return (
              <div
                key={idx}
                className="item-card"
                style={{
                  borderColor: isCurrentlyProcessing ? 'var(--accent-cyan)' : undefined,
                  boxShadow: isCurrentlyProcessing ? '0 0 25px rgba(6, 182, 212, 0.35)' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
                      {item.company}
                    </span>
                    {item.score ? (
                      <span className="badge badge-bookmarked" style={{ fontWeight: 800 }}>
                        Score: {item.score}
                      </span>
                    ) : (
                      <span className="badge badge-submitted" style={{ fontSize: '0.72rem' }}>
                        Unprocessed
                      </span>
                    )}
                  </div>

                  <div className="item-card-title" style={{ fontSize: '1.05rem', lineHeight: 1.35 }}>
                    {item.role}
                  </div>

                  <div className="item-card-sub" style={{ marginTop: '0.45rem', marginBottom: '0.85rem' }}>
                    {item.location && <span>{item.location} • </span>}
                    {item.posted && <span style={{ color: 'var(--accent-amber)' }}>Posted {item.posted}</span>}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                    >
                      Job Listing <ExternalLink size={13} />
                    </a>

                    {activeTab === 'unprocessed' ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                        onClick={() => onProcessItem(item.url)}
                        disabled={isProcessing}
                      >
                        <Play size={14} className={isCurrentlyProcessing ? 'spin' : ''} />
                        {isCurrentlyProcessing ? 'Evaluating...' : 'Process Job'}
                      </button>
                    ) : (
                      <span className="badge badge-submitted" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> Evaluated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Terminal Real-Time Output Stream */}
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-title">
            <Terminal size={16} />
            ANTIGRAVITY PIPELINE PROCESSOR OUTPUT
          </div>
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>
        <pre className="terminal-body">
          {terminalLogs || 'Select any unprocessed job listing above and click "Process Job" to trigger real-time AI evaluation, scoring, report generation, and status updates.'}
        </pre>
      </div>

      {/* Add Job URL Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Job Listing to Pipeline</h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Job Listing URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://seek.com.au/job/... or https://jobs.lever.co/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Canva, Airwallex, SafetyCulture"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Role Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Graduate Software Engineer, Full Stack Developer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sydney, Australia"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Queue into Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
