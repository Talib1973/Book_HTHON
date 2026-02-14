---
id: "0003"
title: Fix HF Space README Sync Workflow
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: TalibHussain
command: "check chatbot + fix HF Space CONFIG_ERROR caused by workflow README overwrite"
labels: ["deployment", "github-actions", "huggingface-spaces", "bugfix", "ci-cd"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .github/workflows/sync-hf-space.yml
tests:
  - "HF Space stage: RUNNING (no error)"
  - "curl POST /chat — verified chatbot response after fix"
---

## Prompt

check the chatbot is still working on the site, I need to check.

(Follow-up): create a PHR for this.

## Response snapshot

- Chatbot returned: "Your space is in error, check its status on hf.co"
- HF Space API confirmed: `Stage: CONFIG_ERROR`, `Error: Missing configuration in README`
- Root cause: `rsync --delete` in the GitHub Actions workflow had overwritten the HF Space `README.md` with the full GitHub repo README (255 lines), removing the required HF metadata block (`sdk: docker`, `emoji`, etc.)
- Fix 1: Restored correct HF Space README directly via git push to HF Space repo
- Fix 2: Added `--exclude='README.md'` to rsync in `.github/workflows/sync-hf-space.yml`
- Pushed fix to GitHub master (`20c1b94`) — workflow ran, Space rebuilt
- HF Space stage returned to `RUNNING`, chatbot tested successfully

## Outcome

- ✅ Impact: Chatbot restored and working on https://book-hthon.vercel.app/; workflow now safe from README overwrite
- 🧪 Tests: HF Space API stage: RUNNING — PASS; curl POST /chat — PASS
- 📁 Files: `.github/workflows/sync-hf-space.yml` (added --exclude='README.md')
- 🔁 Next prompts: Consider adding more --exclude rules for other HF-only files if needed
- 🧠 Reflection: rsync --delete is destructive — always exclude platform-specific config files (README.md for HF, vercel.json for Vercel, etc.) when syncing subdirectories to external platforms

## Evaluation notes (flywheel)

- Failure modes observed: rsync --delete wiped HF Space README.md containing required sdk/emoji metadata
- Graders run and results (PASS/FAIL): HF Space status check — PASS; chatbot curl test — PASS
- Prompt variant (if applicable): null
- Next experiment: Add a workflow validation step that checks HF Space status after deploy
