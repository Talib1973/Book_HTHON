---
id: "0002"
title: GitHub Actions HF Space Auto Sync
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: TalibHussain
command: "create GitHub Actions workflow to auto-sync backend to HF Space"
labels: ["deployment", "github-actions", "huggingface-spaces", "automation", "ci-cd"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .github/workflows/sync-hf-space.yml
  - backend/api.py
tests:
  - "GitHub Actions workflow run — completed: success"
  - "curl POST /chat after auto-deploy — verified chatbot still working"
---

## Prompt

Link HF Space to GitHub so future deploys are automatic.

(Follow-up): yes, create the GitHub Actions workflow.

(Follow-up): update my GitHub token and push the workflow — here is my updated token. Please do the rest yourself.

(Follow-up): test the workflow by pushing a small backend change.

(Follow-up): create a PHR for the GitHub Actions setup.

## Response snapshot

- Created `.github/workflows/sync-hf-space.yml` — triggers on push to `master` when `backend/**` changes
- Workflow clones HF Space repo, rsyncs `backend/` contents, commits and pushes if changes detected
- GitHub token updated with `workflow` scope and set as git remote URL
- `HF_TOKEN` secret added to GitHub repo via GitHub API (encrypted with repo public key using PyNaCl)
- Test push (`backend/api.py` comment update) triggered workflow — completed: **success** on first run
- Workflow URL: https://github.com/Talib1973/Book_HTHON/actions/runs/22012056484

## Outcome

- ✅ Impact: Future pushes to `backend/` on `master` automatically redeploy HF Space — no manual intervention needed
- 🧪 Tests: GitHub Actions run `22012056484` — PASS (status: completed, conclusion: success)
- 📁 Files: `.github/workflows/sync-hf-space.yml` (created), `backend/api.py` (1-line test change)
- 🔁 Next prompts: Monitor first real backend deploy to confirm end-to-end flow
- 🧠 Reflection: HF Space GitHub linking UI was not available; GitHub Actions with direct HF git push is a reliable alternative. PyNaCl required for encrypting secrets via GitHub API.

## Evaluation notes (flywheel)

- Failure modes observed: GitHub PAT lacked `workflow` scope initially; PyNaCl not installed system-wide (needed --break-system-packages)
- Graders run and results (PASS/FAIL): GitHub Actions run — PASS
- Prompt variant (if applicable): null
- Next experiment: Add workflow status badge to README
