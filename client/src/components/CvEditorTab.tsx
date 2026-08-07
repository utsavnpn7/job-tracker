import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, FileCode, Eye, Check, RefreshCw, Target, FileText, Download } from 'lucide-react';

interface CvEditorTabProps {
  cvContent: string;
  onSaveCv: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const CvEditorTab: React.FC<CvEditorTabProps> = ({
  cvContent,
  onSaveCv,
  isLoading,
}) => {
  const [content, setContent] = useState(cvContent);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Skill Gap Modal State
  const [showSkillGapModal, setShowSkillGapModal] = useState(false);
  const [jdText, setJdText] = useState('');
  const [skillGapResult, setSkillGapResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Cover Letter Modal State
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [clCompany, setClCompany] = useState('');
  const [clRole, setClRole] = useState('');
  const [clResult, setClResult] = useState<any>(null);
  const [isGeneratingCl, setIsGeneratingCl] = useState(false);

  useEffect(() => {
    setContent(cvContent);
  }, [cvContent]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveCv(content);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const insertSection = (heading: string) => {
    setContent((prev) => prev + `\n\n## ${heading}\n- `);
  };

  const handleAnalyzeSkillGap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/cv/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText }),
      });
      const json = await res.json();
      if (json.success) {
        setSkillGapResult(json);
      }
    } catch (err) {
      console.error('Skill gap analysis failed', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clCompany.trim() || !clRole.trim()) return;
    setIsGeneratingCl(true);
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: clCompany, role: clRole }),
      });
      const json = await res.json();
      if (json.success) {
        setClResult(json);
      }
    } catch (err) {
      console.error('Cover letter generation failed', err);
    } finally {
      setIsGeneratingCl(false);
    }
  };

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Base Profile & CV Editor (`cv.md`)</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authoritative source for Antigravity AI tailoring scripts
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="chip-btn" onClick={() => setShowSkillGapModal(true)}>
            <Target size={15} style={{ marginRight: 5 }} /> JD Skill Gap Matcher
          </button>

          <button className="chip-btn" onClick={() => setShowCoverModal(true)}>
            <FileText size={15} style={{ marginRight: 5 }} /> Cover Letter Generator
          </button>

          <button className="chip-btn" onClick={() => insertSection('Technical Skills')}>
            + Skills
          </button>

          <button className="chip-btn" onClick={() => insertSection('Key Projects')}>
            + Projects
          </button>

          <button className="btn-primary" onClick={handleSave} disabled={isSaving || isLoading}>
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : isSaving ? (
              <>
                <RefreshCw size={16} className="spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Base CV (`cv.md`)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="cv-split-editor">
        {/* Markdown Source Code Editor */}
        <div className="editor-pane">
          <div className="pane-header">
            <div className="pane-title">
              <FileCode size={16} style={{ color: 'var(--accent-cyan)' }} />
              Markdown Editor (`cv.md`)
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {content.split('\n').length} Lines | {content.length} Chars
            </span>
          </div>

          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Loading base CV markdown..."
          />
        </div>

        {/* Live Rendered Markdown Preview */}
        <div className="preview-pane">
          <div className="pane-header">
            <div className="pane-title">
              <Eye size={16} style={{ color: 'var(--accent-indigo)' }} />
              Live CV Preview
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              ATS Compliant
            </span>
          </div>

          <div className="markdown-preview">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* JD Skill Gap Analyzer Modal */}
      {showSkillGapModal && (
        <div className="modal-overlay" onClick={() => setShowSkillGapModal(false)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: 'var(--accent-cyan)' }} /> JD Skill Gap & Fit Analyzer
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowSkillGapModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAnalyzeSkillGap}>
              <div className="form-group">
                <label className="form-label">Paste Job Description Text</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Paste requirements, responsibilities, or key skills from job posting..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button type="submit" className="btn-primary" disabled={isAnalyzing}>
                  {isAnalyzing ? <RefreshCw size={16} className="spin" /> : <Target size={16} />}
                  {isAnalyzing ? 'Analyzing Skills...' : 'Analyze Match & Skill Gaps'}
                </button>
              </div>
            </form>

            {skillGapResult && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall ATS Fit Score</span>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: skillGapResult.matchScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {skillGapResult.matchScore}%
                    </div>
                  </div>
                  <span className="badge badge-submitted">
                    {skillGapResult.totalSkillsFound} Skill Keywords Analyzed
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.84rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem', fontWeight: 700 }}>
                      ✅ Exact Skills ({skillGapResult.existing?.length || 0})
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {skillGapResult.existing?.map((s: string, i: number) => (
                        <span key={i} className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.84rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontWeight: 700 }}>
                      ⚡ In Resume Prose ({skillGapResult.supportedByResume?.length || 0})
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {skillGapResult.supportedByResume?.map((s: string, i: number) => (
                        <span key={i} className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.84rem', color: 'var(--accent-rose)', marginBottom: '0.5rem', fontWeight: 700 }}>
                      ⚠️ Missing Gaps ({skillGapResult.gap?.length || 0})
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {skillGapResult.gap?.map((s: string, i: number) => (
                        <span key={i} className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cover Letter Generator Modal */}
      {showCoverModal && (
        <div className="modal-overlay" onClick={() => setShowCoverModal(false)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--accent-indigo)' }} /> Cover Letter Generator
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowCoverModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateCoverLetter}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Canva, Optiver, SafetyCulture"
                    value={clCompany}
                    onChange={(e) => setClCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Title / Role</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Graduate Software Engineer"
                    value={clRole}
                    onChange={(e) => setClRole(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button type="submit" className="btn-primary" disabled={isGeneratingCl}>
                  {isGeneratingCl ? <RefreshCw size={16} className="spin" /> : <FileText size={16} />}
                  {isGeneratingCl ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
                </button>
              </div>
            </form>

            {clResult && (
              <div style={{ background: '#0b0e14', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    Generated artifact: {clResult.filename}
                  </span>
                  <a href={clResult.downloadPath} download className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    <Download size={14} /> Download File
                  </a>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e6edf3', maxHeight: '300px', overflowY: 'auto' }}>
                  {clResult.coverLetter}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
