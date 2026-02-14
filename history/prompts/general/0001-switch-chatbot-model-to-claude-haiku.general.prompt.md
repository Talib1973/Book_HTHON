---
id: "0001"
title: Switch Chatbot Model to Claude Haiku
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: TalibHussain
command: "fix chatbot model + deploy to HF Space"
labels: ["deployment", "chatbot", "openrouter", "huggingface-spaces", "model-switch"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/agent.py
tests:
  - "curl POST /chat — verified response with ROS 2 question"
---

## Prompt

Please note that you deployed my Book_HTHON project on "https://book-hthon.vercel.app/" with chatbot but chatbot not able to get response please change model to haiku from, I think ministral.

(Follow-up): I have balance in openrouter above 4 dollar please use some cheap model like haiku.

(Follow-up): commit and push this change.

(Follow-up): check if the chatbot is working on the site.

(Follow-up): sync the HF Space from GitHub.

(Follow-up): [Provided HF token and triggered direct push to HF Space git repo]

(Follow-up): create a PHR for this.

## Response snapshot

- Identified model in `backend/agent.py:53` as `mistralai/devstral-2512:free`
- Changed to `anthropic/claude-3-haiku` (cheapest Haiku on OpenRouter ~$0.25/M input tokens)
- Committed and pushed to GitHub (`0e8f33d`)
- Discovered HF Space (`talibhussain-book-hthon-backend`) is NOT linked to GitHub — separate git repo
- Cloned HF Space repo directly, applied model change, pushed to `main`
- Tested `/chat` endpoint — returned full ROS 2 explanation with citations ✅

## Outcome

- ✅ Impact: Chatbot on https://book-hthon.vercel.app/ is now fully functional using `anthropic/claude-3-haiku` via OpenRouter
- 🧪 Tests: curl POST /chat with "What is ROS 2?" returned detailed response with sources
- 📁 Files: backend/agent.py (1 line changed: model string)
- 🔁 Next prompts: Consider linking HF Space to GitHub for easier future deployments
- 🧠 Reflection: HF Space was not auto-synced from GitHub — required direct git push to HF Space repo using HF write token

## Evaluation notes (flywheel)

- Failure modes observed: Mistral free-tier model was failing silently; HF Space not linked to GitHub caused sync confusion
- Graders run and results (PASS/FAIL): Manual curl test — PASS
- Prompt variant (if applicable): null
- Next experiment: Link HF Space to GitHub repo to avoid manual push workflow in future
