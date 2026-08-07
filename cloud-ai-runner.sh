#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# cloud-ai-runner.sh — Cloud AI Automation Runner for career-ops
# ─────────────────────────────────────────────────────────────────────────────
# Automatically scans portals, evaluates pending roles with Gemini AI (Google AI Pro),
# updates applications.md, and generates tailored PDF CVs.
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== [1/3] Running Zero-Token Portal Scan ==="
node scan.mjs

echo "=== [2/3] Evaluating Pending Pipeline URLs with Gemini AI ==="
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

if [ -z "${GEMINI_API_KEY:-}" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
  echo "⚠️ Warning: GEMINI_API_KEY is not set in .env or environment variables."
  echo "Set your key in .env or export GEMINI_API_KEY to enable AI evaluation."
  exit 1
fi

# Extract pending URLs from data/pipeline.md
PENDING_URLS=$(grep -E '^- \[ \]' data/pipeline.md | awk -F '|' '{print $1}' | sed 's/^- \[ \] //' | xargs)

if [ -z "$PENDING_URLS" ]; then
  echo "No pending URLs found in data/pipeline.md."
else
  for URL in $PENDING_URLS; do
    echo "Processing URL with Gemini AI: $URL"
    node gemini-eval.mjs "$URL" || echo "Failed to evaluate $URL, skipping..."
  done
fi

echo "=== [3/3] Generating Tailored PDF CVs ==="
node generate-pdf.mjs || echo "PDF generation skipped or failed."

echo "=== Cloud AI Daily Job Complete ==="
