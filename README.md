# ⚡ Antigravity AI — Career-Ops Pipeline

> **Personalized AI-powered job search pipeline & automation command center**  
> Custom built for **Utsav Neupane** (Sydney, Australia) — Junior Full-Stack, Graduate Software Engineer & Azure Cloud Developer.

---

## 🌟 Overview

**Career-Ops** is an autonomous job search system powered by **Google Antigravity AI** and **Google Gemini 3.6 Flash**. It automates job portal scanning, evaluates incoming job descriptions against candidate profile data, ranks opportunities using a structured 6-block rubric, generates ATS-optimized tailored PDF CVs, and manages application status tracking.

---

## ✨ Features

- **🚀 Zero-Token Fast Portal Scanning:** Scans 20+ tech company portals (Greenhouse, Ashby, Lever, SmartRecruiters) & Australian job aggregators (Seek v5 API, Adzuna) via raw JSON endpoints.
- **🧠 Gemini AI-Powered Evaluation:** Leverages **Google AI Pro (Gemini 3.6 Flash)** to score postings (Domain Fit, Tech Stack, Compensation, Growth) and flag recruitment risks.
- **🔒 Password-Protected Web Dashboard:** Sleek glassmorphic dark-mode web portal for tracking applied roles, running real-time AI scans, and viewing pipeline metrics securely.
- **📄 ATS PDF CV Generation:** Dynamically renders tailored, high-converting HTML and Playwright PDF resumes.
- **☁️ Cloud & GitHub Actions Ready:** Includes automated bash scripts (`cloud-ai-runner.sh`) and scheduled workflow configs (`.github/workflows/career-ops-cron.yml`).

---

## 🛠️ Tech Stack & Requirements

- **Runtime:** Node.js (>= 18)
- **AI Engine:** Google AI Pro / Gemini API (`gemini-3.6-flash`) & Antigravity Agent Framework
- **Backend:** Express.js, Playwright, JS-YAML
- **Frontend:** HTML5, Modern Vanilla CSS (Glassmorphism & Micro-animations), SSE (Server-Sent Events)

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone git@github.com:YOUR_USERNAME/career-ops.git
cd career-ops
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-3.6-flash
ADMIN_PASSWORD=your_secure_dashboard_password
```

### 3. Run Web Dashboard
```bash
npm start
```
Open **`http://localhost:3000`** in your browser and log in with your `ADMIN_PASSWORD`.

---

## 💻 Slash Commands (Antigravity CLI)

When pair-programming with the **Antigravity AI Agent**, run commands directly:

| Slash Command | Action |
| :--- | :--- |
| `/career-ops scan` | Execute portal scanner and add new hits to pipeline |
| `/career-ops pipeline` | Run Gemini AI evaluations on pending URLs in `data/pipeline.md` |
| `/career-ops {JD or URL}` | Auto-Pipeline: Evaluate JD + generate tailored PDF + update tracker |
| `/career-ops tracker` | Display overall application funnel & current statuses |
| `/career-ops pdf` | Re-generate PDF CV for the latest evaluated role |
| `/career-ops interview-prep` | Draft company-specific STAR prep document |

---

## ☁️ Cloud & Daily Automation

Run the full automated daily pipeline (Scan → AI Eval → PDF Gen):

```bash
./cloud-ai-runner.sh
```

Or deploy to **Google Cloud Run**, **Google Compute Engine (GCP)**, or **GitHub Actions** using the included `.github/workflows/career-ops-cron.yml`.

---

## 📂 Repository Structure

- 📄 `cv.md` — Source-of-truth resume
- ⚙️ `config/profile.yml` — Candidate targeting, AUD salary range, and superpowers
- 🎯 `modes/_profile.md` — Core targeting rubrics and experience framing
- 🔍 `portals.yml` — Configured companies, ATS feeds, and Seek/Adzuna search queries
- 📊 `data/applications.md` — Canonical application tracker
- 📥 `data/pipeline.md` — Inbox of pending job URLs
- 🤖 `server.mjs` — Express backend & real-time SSE agent console
- 📜 `cloud-ai-runner.sh` — Automated daily scan & AI evaluation script

---

## 🛡️ License & Privacy

Private Repository — Reserved for **Utsav Neupane**. All personal data, interview prep notes, and application records are strictly protected and gitignored.