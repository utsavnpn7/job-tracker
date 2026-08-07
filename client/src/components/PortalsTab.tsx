import React, { useState } from 'react';
import { Plus, Search, Building2, ExternalLink, Play } from 'lucide-react';

interface PortalsTabProps {
  portalsData: any;
  onTogglePortal: (type: 'query' | 'company', name: string, enabled: boolean) => Promise<void>;
  onAddCompany: (data: any) => Promise<void>;
  onRunAgent: (command: string) => void;
  isAgentRunning: boolean;
}

export const PortalsTab: React.FC<PortalsTabProps> = ({
  portalsData,
  onTogglePortal,
  onAddCompany,
  onRunAgent,
  isAgentRunning,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queries' | 'companies'>('companies');
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  // Form State
  const [compName, setCompName] = useState('');
  const [careersUrl, setCareersUrl] = useState('');
  const [compNotes, setCompNotes] = useState('');
  const [scanMethod, setScanMethod] = useState('');

  const searchQueries = portalsData?.portals?.search_queries || [];
  const trackedCompanies = portalsData?.portals?.tracked_companies || [];

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCompany({
      name: compName,
      careers_url: careersUrl,
      notes: compNotes,
      scan_method: scanMethod || undefined,
    });
    setShowAddCompanyModal(false);
    setCompName('');
    setCareersUrl('');
    setCompNotes('');
  };

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Job Portals & ATS Scrapers</h2>
          <span className="badge badge-bookmarked">portals.yml</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`chip-btn ${activeSubTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('companies')}
          >
            <Building2 size={15} style={{ marginRight: 6 }} />
            Tracked Companies ({trackedCompanies.length})
          </button>

          <button
            className={`chip-btn ${activeSubTab === 'queries' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('queries')}
          >
            <Search size={15} style={{ marginRight: 6 }} />
            Search Queries ({searchQueries.length})
          </button>

          <button className="btn-primary" onClick={() => setShowAddCompanyModal(true)}>
            <Plus size={16} /> Add Company
          </button>
        </div>
      </div>

      {activeSubTab === 'companies' && (
        <div className="cards-grid">
          {trackedCompanies.map((comp: any, idx: number) => (
            <div key={idx} className="item-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div className="item-card-title">{comp.name}</div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={comp.enabled !== false}
                      onChange={(e) => onTogglePortal('company', comp.name, e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="item-card-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <a
                    href={comp.careers_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-cyan)', textDecoration: 'none', wordBreak: 'break-all', fontSize: '0.8rem' }}
                  >
                    {comp.careers_url} <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {comp.notes || 'Direct ATS Integration'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                  {comp.scan_method || 'Structured ATS'}
                </span>

                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={() => onRunAgent('scan:seeds')}
                  disabled={isAgentRunning}
                >
                  <Play size={13} /> Test Scrape
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'queries' && (
        <div className="cards-grid">
          {searchQueries.map((query: any, idx: number) => (
            <div key={idx} className="item-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div className="item-card-title" style={{ fontSize: '0.95rem' }}>{query.name}</div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={query.enabled !== false}
                      onChange={(e) => onTogglePortal('query', query.name, e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <pre style={{ background: '#0b0e14', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>
                  {query.query}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Tracked Employer / Portal</h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowAddCompanyModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompanySubmit}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Atlassian, Canva, Optiver"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Careers ATS URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://job-boards.greenhouse.io/company or https://jobs.ashbyhq.com/company"
                  value={careersUrl}
                  onChange={(e) => setCareersUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scan Method (Optional)</label>
                <select className="form-select" value={scanMethod} onChange={(e) => setScanMethod(e.target.value)}>
                  <option value="">Auto-Detect ATS (Greenhouse, Lever, SmartRecruiters, Ashby)</option>
                  <option value="websearch">WebSearch Scraper</option>
                  <option value="jobstreet">Seek/Jobstreet API</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Region Focus</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Sydney office, graduate program & full stack roles."
                  value={compNotes}
                  onChange={(e) => setCompNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCompanyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Company to portals.yml
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
