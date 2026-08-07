import React, { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';

interface AppliedTrackerTabProps {
  appliedJobs: any[];
  onAddApplication: (data: any) => Promise<void>;
  onUpdateStatus: (id: string, updates: any) => Promise<void>;
  onDeleteApplication: (id: string) => Promise<void>;
}

export const AppliedTrackerTab: React.FC<AppliedTrackerTabProps> = ({
  appliedJobs,
  onAddApplication,
  onUpdateStatus,
  onDeleteApplication,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [platform, setPlatform] = useState('Direct ATS');
  const [status, setStatus] = useState('Submitted');
  const [cvUsed, setCvUsed] = useState('output/cv-001.pdf');
  const [salaryRange, setSalaryRange] = useState('$100k–$130k');
  const [notes, setNotes] = useState('');

  const filteredJobs = appliedJobs.filter((job) => {
    const matchesSearch =
      (job.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || (job.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddApplication({
      company,
      role,
      platform,
      status,
      cv_used: cvUsed,
      salary_range: salaryRange,
      notes,
    });
    setShowAddModal(false);
    // Reset form
    setCompany('');
    setRole('');
    setNotes('');
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search company, role, skills, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {['All', 'Submitted', 'Interview', 'Offer', 'Rejected'].map((st) => (
            <button
              key={st}
              className={`chip-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Record Application
        </button>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Company</th>
              <th>Role</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Salary Range</th>
              <th>CV Artifact</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No applied jobs match your filter.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job, idx) => {
                const idVal = job._ || job.id || String(idx + 1).padStart(3, '0');
                const st = (job.status || 'submitted').toLowerCase();
                let badgeClass = 'badge-submitted';
                if (st.includes('interview')) badgeClass = 'badge-interview';
                else if (st.includes('offer')) badgeClass = 'badge-offer';
                else if (st.includes('reject')) badgeClass = 'badge-rejected';

                return (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      #{idVal}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {job.date_applied || job.date}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{job.company}</td>
                    <td style={{ fontWeight: 600 }}>{job.role}</td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{job.platform || 'Direct ATS'}</td>
                    <td>
                      <select
                        className={`badge ${badgeClass}`}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
                        value={job.status || 'Submitted'}
                        onChange={(e) => onUpdateStatus(idVal, { status: e.target.value })}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Technical Assessment">Technical Assessment</option>
                        <option value="Final Round">Final Round</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-emerald)' }}>
                      {job.salary_range || 'N/A'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)' }}>
                        {job.cv_used || 'cv-001.pdf'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {job.notes}
                    </td>
                    <td>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete application record"
                        onClick={() => onDeleteApplication(idVal)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Job Application</h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Canva, Airwallex, SafetyCulture"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title / Role</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Graduate Software Engineer, Full Stack Developer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Platform / ATS</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SmartRecruiters, Greenhouse, Seek"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Submitted">Submitted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Offer Received">Offer Received</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">CV Used</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="output/cv-001.pdf"
                    value={cvUsed}
                    onChange={(e) => setCvUsed(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salary Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="$90k–$120k"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Keywords</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Details about application, referrer, or tailored skills..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
