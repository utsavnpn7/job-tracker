import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import yaml from 'js-yaml';
import { extractJdSkills, classifySkillGaps } from './jd-skill-gap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const APPLIED_FILE = path.join(__dirname, 'data', 'applied.md');
const EVALUATED_FILE = path.join(__dirname, 'data', 'applications.md');
const PIPELINE_FILE = path.join(__dirname, 'data', 'pipeline.md');
const CV_FILE = path.join(__dirname, 'cv.md');
const PORTALS_FILE = path.join(__dirname, 'portals.yml');
const PORTAL_HEALTH_FILE = path.join(__dirname, 'data', 'portal-health.tsv');
const OUTPUT_DIR = path.join(__dirname, 'output');
const REPORTS_DIR = path.join(__dirname, 'reports');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Authentication Setup ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TOKEN = Buffer.from(`career_ops_${ADMIN_PASSWORD}`).toString('base64');

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function isAuthenticated(req) {
  if (!process.env.ADMIN_PASSWORD) return true; // Auth optional if ADMIN_PASSWORD is not set
  const cookies = parseCookies(req);
  return cookies.career_ops_session === SESSION_TOKEN;
}

// Public Auth API endpoints
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', `career_ops_session=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`); // 30 days
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid password' });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', `career_ops_session=; Path=/; HttpOnly; Max-Age=0`);
  res.json({ success: true });
});

app.get('/api/auth-status', (req, res) => {
  res.json({ authenticated: isAuthenticated(req), passwordProtected: Boolean(process.env.ADMIN_PASSWORD) });
});

// Protect all /api/* routes except login & auth-status
app.use((req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/auth-status' || !req.path.startsWith('/api')) {
    return next();
  }
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Please login.' });
  }
  next();
});

// Serve public static assets & handle login redirect
app.use(express.static(PUBLIC_DIR, { index: false }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/output')) return next();
  if (!isAuthenticated(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
  }
  next();
});

app.get('/', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// --- SSE Real-time Broadcaster ---
const sseClients = new Set();

function sendEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// --- Helper Functions ---
function parseMarkdownTable(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  const tableLines = lines.filter(l => l.startsWith('|') && !l.includes('---|---'));
  if (tableLines.length < 2) return [];

  const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = [];

  for (let i = 1; i < tableLines.length; i++) {
    const cells = tableLines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length === headers.length) {
      const rowObj = {};
      headers.forEach((h, idx) => {
        const key = h.toLowerCase().replace(/[^a-z0-9]/g, '_');
        rowObj[key] = cells[idx];
      });
      rows.push(rowObj);
    }
  }
  return rows;
}

function writeAppliedMarkdownTable(rows) {
  let content = '# Real Applied Jobs Tracker\n\n';
  content += 'Track real-world job submissions, interview stages, and offers.\n\n';
  content += '| # | Date Applied | Company | Role | Platform | Status | CV Used | Salary Range | Notes |\n';
  content += '|---|--------------|---------|------|----------|--------|---------|--------------|-------|\n';

  rows.forEach(r => {
    content += `| ${r._ || r.id || '000'} | ${r.date_applied || r.date || ''} | ${r.company || ''} | ${r.role || ''} | ${r.platform || 'Direct ATS'} | ${r.status || 'Submitted'} | ${r.cv_used || 'output/cv-001.pdf'} | ${r.salary_range || 'N/A'} | ${r.notes || ''} |\n`;
  });

  fs.writeFileSync(APPLIED_FILE, content, 'utf-8');
}

function parsePortalHealth() {
  if (!fs.existsSync(PORTAL_HEALTH_FILE)) return [];
  const content = fs.readFileSync(PORTAL_HEALTH_FILE, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const records = [];
  lines.forEach(line => {
    const [portal, status, lastChecked, notes] = line.split('\t');
    if (portal && !portal.startsWith('portal')) {
      records.push({ portal, status, lastChecked, notes });
    }
  });
  return records;
}

// --- API Endpoints ---

// 1. Dashboard Overview Stats
app.get('/api/dashboard', (req, res) => {
  try {
    const applied = parseMarkdownTable(APPLIED_FILE);
    const evaluated = parseMarkdownTable(EVALUATED_FILE);
    const portalHealth = parsePortalHealth();
    let portalsConfig = {};
    if (fs.existsSync(PORTALS_FILE)) {
      portalsConfig = yaml.load(fs.readFileSync(PORTALS_FILE, 'utf-8')) || {};
    }

    const totalApplied = applied.length;
    const interviewing = applied.filter(a => (a.status || '').toLowerCase().includes('interview')).length;
    const offers = applied.filter(a => (a.status || '').toLowerCase().includes('offer')).length;
    const totalEvaluated = evaluated.length;
    let pendingPipelineCount = 0;
    if (fs.existsSync(PIPELINE_FILE)) {
      const pContent = fs.readFileSync(PIPELINE_FILE, 'utf-8');
      const lines = pContent.split('\n');
      let inPending = true;
      lines.forEach(l => {
        if (l.includes('## Processed')) inPending = false;
        if (inPending && l.trim().startsWith('- [ ]')) pendingPipelineCount++;
      });
    }

    res.json({
      success: true,
      stats: {
        totalApplied,
        interviewing,
        offers,
        totalEvaluated,
        pendingPipelineCount,
        activePortalsCount: (portalsConfig.search_queries || []).filter(q => q.enabled).length +
                           (portalsConfig.tracked_companies || []).filter(c => c.enabled).length,
      },
      recentApplied: applied.slice(-5).reverse(),
      recentEvaluated: evaluated.slice(-5).reverse(),
      portalHealth: portalHealth.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Applied Jobs Endpoints
app.get('/api/applied', (req, res) => {
  const data = parseMarkdownTable(APPLIED_FILE);
  res.json({ success: true, data });
});

app.post('/api/applied', (req, res) => {
  try {
    const { company, role, platform, status, cv_used, salary_range, notes, date } = req.body;
    const rows = parseMarkdownTable(APPLIED_FILE);
    const nextIdNum = rows.length + 1;
    const nextId = String(nextIdNum).padStart(3, '0');
    const appliedDate = date || new Date().toISOString().split('T')[0];

    const newRow = {
      _: nextId,
      date_applied: appliedDate,
      company: company || 'Unknown',
      role: role || 'Software Engineer',
      platform: platform || 'Direct ATS',
      status: status || 'Submitted',
      cv_used: cv_used || 'output/cv-001.pdf',
      salary_range: salary_range || 'N/A',
      notes: notes || ''
    };

    rows.push(newRow);
    writeAppliedMarkdownTable(rows);
    sendEvent('applied_updated', { action: 'create', row: newRow });

    res.json({ success: true, message: 'Application recorded!', id: nextId, data: newRow });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/applied/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const rows = parseMarkdownTable(APPLIED_FILE);
    const targetIdx = rows.findIndex(r => r._ === id || r.id === id);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const updatedRow = {
      ...rows[targetIdx],
      company: updates.company !== undefined ? updates.company : rows[targetIdx].company,
      role: updates.role !== undefined ? updates.role : rows[targetIdx].role,
      platform: updates.platform !== undefined ? updates.platform : rows[targetIdx].platform,
      status: updates.status !== undefined ? updates.status : rows[targetIdx].status,
      cv_used: updates.cv_used !== undefined ? updates.cv_used : rows[targetIdx].cv_used,
      salary_range: updates.salary_range !== undefined ? updates.salary_range : rows[targetIdx].salary_range,
      notes: updates.notes !== undefined ? updates.notes : rows[targetIdx].notes,
      date_applied: updates.date_applied || updates.date || rows[targetIdx].date_applied
    };

    rows[targetIdx] = updatedRow;
    writeAppliedMarkdownTable(rows);
    sendEvent('applied_updated', { action: 'update', row: updatedRow });

    res.json({ success: true, message: 'Application updated!', data: updatedRow });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/applied/:id', (req, res) => {
  try {
    const { id } = req.params;
    let rows = parseMarkdownTable(APPLIED_FILE);
    const initialLen = rows.length;
    rows = rows.filter(r => r._ !== id && r.id !== id);

    if (rows.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    writeAppliedMarkdownTable(rows);
    sendEvent('applied_updated', { action: 'delete', id });

    res.json({ success: true, message: 'Application deleted!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Pipeline & Evaluated Applications
app.get('/api/evaluations', (req, res) => {
  const data = parseMarkdownTable(EVALUATED_FILE);
  res.json({ success: true, data });
});

function parsePipelineItem(rawLine) {
  const line = rawLine.trim();
  const isChecked = line.startsWith('- [x]');
  
  const urlMatch = line.match(/https?:\/\/[^\s|]+/);
  const url = urlMatch ? urlMatch[0] : '';
  
  let body = line.replace(/^- \[[ x]\]\s*/, '');
  const parts = body.split('|').map(p => p.trim()).filter(Boolean);
  
  let company = '';
  let role = '';
  let location = '';
  let posted = '';
  let score = '';

  parts.forEach(part => {
    if (part.startsWith('http')) return;
    if (part.toLowerCase().includes('posted:')) {
      posted = part.replace(/posted:\s*/i, '').trim();
    } else if (/\d+(\.\d+)?\/5/.test(part)) {
      score = part;
    } else if (/^\#\d+$/.test(part)) {
      // ID marker
    } else if (!company) {
      company = part;
    } else if (!role) {
      role = part;
    } else if (!location) {
      location = part;
    }
  });

  return {
    raw: line,
    url,
    company: company || 'Employer',
    role: role || 'Software Role',
    location,
    posted,
    score,
    checked: isChecked,
  };
}

app.get('/api/pipeline', (req, res) => {
  if (!fs.existsSync(PIPELINE_FILE)) {
    return res.json({ success: true, pending: [], processed: [] });
  }
  const content = fs.readFileSync(PIPELINE_FILE, 'utf-8');
  const lines = content.split('\n');
  const pending = [];
  const processed = [];
  let section = 'pending';

  lines.forEach(line => {
    if (line.includes('## Processed')) section = 'processed';
    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      const parsed = parsePipelineItem(line);
      if (section === 'pending' && !parsed.checked) pending.push(parsed);
      else processed.push(parsed);
    }
  });

  res.json({ success: true, pending, processed });
});

app.post('/api/pipeline/add', (req, res) => {
  try {
    const { url, company, role, location } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let content = fs.existsSync(PIPELINE_FILE) ? fs.readFileSync(PIPELINE_FILE, 'utf-8') : '# Pipeline — Pending URLs\n\n## Pending\n\n## Processed\n';

    const newEntry = `- [ ] ${url}${company ? ` | ${company}` : ''}${role ? ` | ${role}` : ''}${location ? ` | ${location}` : ''}`;

    if (content.includes('## Pending')) {
      content = content.replace('## Pending', `## Pending\n\n${newEntry}`);
    } else {
      content += `\n\n- [ ] ${url}`;
    }

    fs.writeFileSync(PIPELINE_FILE, content, 'utf-8');
    sendEvent('pipeline_updated', { action: 'add', url });

    res.json({ success: true, message: 'Added job listing to pipeline!', entry: newEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pipeline/process-item', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  res.write(`>>> Starting Antigravity Agent pipeline processing for job URL: ${url}\n\n`);
  sendEvent('agent_start', { command: 'pipeline:item', url });

  const proc = spawn('node', ['openrouter-runner.mjs', 'evaluate', url], {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  let procFailed = false;

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    res.write(text);
    sendEvent('agent_log', { text });
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    res.write(text);
    sendEvent('agent_log', { text });
  });

  proc.on('close', (code) => {
    // Post-process pipeline file if needed to mark item checked
    if (fs.existsSync(PIPELINE_FILE)) {
      let content = fs.readFileSync(PIPELINE_FILE, 'utf-8');
      if (content.includes(url) && !content.includes(`- [x] ${url}`)) {
        content = content.replace(`- [ ] ${url}`, `- [x] ${url}`);
        fs.writeFileSync(PIPELINE_FILE, content, 'utf-8');
      }
    }

    sendEvent('pipeline_updated', { action: 'processed', url, code });
    res.write(`\n>>> Pipeline processing completed for: ${url} (exit code: ${code})\n`);
    res.end();
  });

  proc.on('error', (err) => {
    res.write(`\n>>> Processing error: ${err.message}\n`);
    res.end();
  });
});

// 4. Base CV & Profile Editor
app.get('/api/cv', (req, res) => {
  if (!fs.existsSync(CV_FILE)) {
    return res.status(404).json({ success: false, error: 'cv.md not found' });
  }
  const content = fs.readFileSync(CV_FILE, 'utf-8');
  res.json({ success: true, content });
});

app.put('/api/cv', (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Content must be a string' });
    }
    fs.writeFileSync(CV_FILE, content, 'utf-8');
    sendEvent('cv_updated', { time: new Date().toISOString() });
    res.json({ success: true, message: 'cv.md updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/cv/skill-gap', (req, res) => {
  try {
    const { jdText } = req.body;
    if (!jdText) {
      return res.status(400).json({ success: false, error: 'Job description text is required' });
    }
    const cvText = fs.existsSync(CV_FILE) ? fs.readFileSync(CV_FILE, 'utf-8') : '';
    const jdSkills = extractJdSkills(jdText);
    const classification = classifySkillGaps(jdSkills, cvText);
    
    const total = jdSkills.length;
    let score = 0;
    if (total > 0) {
      score = Math.round(((classification.existing.length + classification.supportedByResume.length * 0.7) / total) * 100);
    } else {
      score = 85;
    }

    res.json({
      success: true,
      matchScore: Math.min(100, score),
      totalSkillsFound: total,
      existing: classification.existing,
      supportedByResume: classification.supportedByResume,
      gap: classification.gap,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/cover-letter/generate', (req, res) => {
  try {
    const { company = 'Target Employer', role = 'Software Engineer' } = req.body;
    
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const coverLetter = `Utsav Neupane
Sydney, Australia | +61 0450 181 410 | utsavnpn7@gmail.com
LinkedIn: linkedin.com/in/utsav-neupane | GitHub: github.com/utsavnpn

${today}

Hiring Manager
${company}
Sydney, Australia

RE: Application for ${role} position

Dear Hiring Manager,

I am writing to express my strong enthusiasm for the ${role} role at ${company}. As a Junior Full-Stack & Cloud Developer with hands-on experience building production-ready MERN and React Native applications, alongside AWS Certified Developer (DVA-C02) and Microsoft Azure Developer Associate (AZ-204) certifications, I am eager to contribute to your engineering team in Sydney.

In my recent project WorkHive (a cross-platform workforce management system built with React Native, Node.js, Express, and PostgreSQL), I engineered real-time chat, GPS-based attendance tracking, and role-based access control. Furthermore, through my intensive training in LLM engineering, RAG, and AI agent architectures, I have built autonomous systems and developer tools tailored for modern enterprise workflows.

${company}'s reputation for technical excellence aligns perfectly with my commitment to building scalable, cloud-native software. I am confident that my strong foundations in React, TypeScript, Node.js, AWS, and Azure will allow me to deliver immediate value to your team.

Thank you for your time and consideration. I welcome the opportunity to discuss how my background and technical skills align with the goals of ${company}.

Sincerely,

Utsav Neupane`;

    const filename = `cover-letter-${company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, coverLetter, 'utf-8');

    sendEvent('cv_updated', { type: 'cover_letter', company });

    res.json({
      success: true,
      coverLetter,
      filename,
      downloadPath: `/output/${filename}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Generated CVs & Files
app.get('/api/cv/generated', (req, res) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.json({ success: true, files: [] });
    }
    const files = fs.readdirSync(OUTPUT_DIR).map(filename => {
      const fullPath = path.join(OUTPUT_DIR, filename);
      const stat = fs.statSync(fullPath);
      return {
        name: filename,
        path: `/output/${filename}`,
        sizeBytes: stat.size,
        mtime: stat.mtime,
        ext: path.extname(filename).toLowerCase()
      };
    }).sort((a, b) => b.mtime - a.mtime);

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/output/:filename', (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// 6. Portals Configuration API
app.get('/api/portals', (req, res) => {
  try {
    if (!fs.existsSync(PORTALS_FILE)) {
      return res.status(404).json({ success: false, error: 'portals.yml not found' });
    }
    const rawYaml = fs.readFileSync(PORTALS_FILE, 'utf-8');
    const parsed = yaml.load(rawYaml);
    const health = parsePortalHealth();

    res.json({
      success: true,
      portals: parsed,
      health,
      rawYaml
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/portals', (req, res) => {
  try {
    const { portals, rawYaml } = req.body;
    let newYamlStr = '';
    if (rawYaml) {
      newYamlStr = rawYaml;
    } else if (portals) {
      newYamlStr = yaml.dump(portals);
    } else {
      return res.status(400).json({ success: false, error: 'No portals data provided' });
    }

    fs.writeFileSync(PORTALS_FILE, newYamlStr, 'utf-8');
    sendEvent('portals_updated', { time: new Date().toISOString() });
    res.json({ success: true, message: 'portals.yml updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/portals/toggle', (req, res) => {
  try {
    const { type, name, enabled } = req.body; // type: 'query' | 'company'
    if (!fs.existsSync(PORTALS_FILE)) {
      return res.status(404).json({ success: false, error: 'portals.yml not found' });
    }
    const parsed = yaml.load(fs.readFileSync(PORTALS_FILE, 'utf-8'));

    if (type === 'query' && Array.isArray(parsed.search_queries)) {
      const q = parsed.search_queries.find(item => item.name === name);
      if (q) q.enabled = enabled;
    } else if (type === 'company' && Array.isArray(parsed.tracked_companies)) {
      const c = parsed.tracked_companies.find(item => item.name === name);
      if (c) c.enabled = enabled;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type or missing array' });
    }

    fs.writeFileSync(PORTALS_FILE, yaml.dump(parsed), 'utf-8');
    sendEvent('portals_updated', { type, name, enabled });
    res.json({ success: true, message: `Updated ${name} to ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/portals/company', (req, res) => {
  try {
    const { name, careers_url, notes, scan_method } = req.body;
    if (!name || !careers_url) {
      return res.status(400).json({ success: false, error: 'Name and Careers URL are required' });
    }

    const parsed = yaml.load(fs.readFileSync(PORTALS_FILE, 'utf-8'));
    if (!parsed.tracked_companies) parsed.tracked_companies = [];

    const existingIdx = parsed.tracked_companies.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    const companyEntry = {
      name,
      careers_url,
      notes: notes || '',
      enabled: true
    };
    if (scan_method) companyEntry.scan_method = scan_method;

    if (existingIdx >= 0) {
      parsed.tracked_companies[existingIdx] = { ...parsed.tracked_companies[existingIdx], ...companyEntry };
    } else {
      parsed.tracked_companies.push(companyEntry);
    }

    fs.writeFileSync(PORTALS_FILE, yaml.dump(parsed), 'utf-8');
    sendEvent('portals_updated', { action: 'add_company', company: companyEntry });
    res.json({ success: true, message: `Company ${name} saved successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Antigravity Agent & Script Runner Endpoint (Real-Time Terminal Streaming)
app.post('/api/agent/run', (req, res) => {
  const { command, args = [] } = req.body;

  const validCommands = {
    'scan': ['scan.mjs'],
    'scan:full': ['scan-ats-full.mjs'],
    'scan:seeds': ['scan-ats-full.mjs', '--seeds', 'yc,a16z'],
    'doctor': ['doctor.mjs'],
    'normalize': ['normalize-statuses.mjs'],
    'verify': ['verify-pipeline.mjs'],
    'dedup': ['dedup-tracker.mjs'],
    'liveness': ['check-liveness.mjs'],
    'pdf': ['generate-pdf.mjs'],
    'validate-portals': ['validate-portals.mjs'],
  };

  const scriptArgs = validCommands[command] || args;
  if (!scriptArgs || scriptArgs.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid command or script' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  res.write(`>>> Initiating Antigravity Agent task: node ${scriptArgs.join(' ')}\n\n`);

  sendEvent('agent_start', { command, script: scriptArgs.join(' ') });

  const proc = spawn('node', scriptArgs, {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    res.write(text);
    sendEvent('agent_log', { text });
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    res.write(text);
    sendEvent('agent_log', { text });
  });

  proc.on('close', (code) => {
    const message = `\n>>> Agent process finished with exit code: ${code}\n`;
    res.write(message);
    sendEvent('agent_finish', { command, code });
    res.end();
  });

  proc.on('error', (err) => {
    const message = `\n>>> Agent process error: ${err.message}\n`;
    res.write(message);
    sendEvent('agent_error', { command, error: err.message });
    res.end();
  });
});

// Serve client production static files if available
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/output')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 Career-Ops Express Backend & Antigravity Agent Hub running at: http://localhost:${PORT}\n`);
});
