---
id: "0006"
title: migrate-backend-to-huggingface-spaces
stage: green
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: master
user: talib1973
command: manual (resume — Railway free trial ended, migrate to free alternative)
labels: ["huggingface","spaces","docker","deploy","migrate","railway","chatbot","backend"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: https://github.com/Talib1973/Book_HTHON/pull/1 (merged)
files:
  - backend/Dockerfile (created — HF Spaces Docker image, port 7860)
  - src/components/ChatWidget/index.tsx (production URL updated from Railway to HF Spaces)
tests:
  - HF Space health check: GET / → {"status":"ok","service":"RAG Chatbot API","version":"1.0.0"}
  - Vercel redeploy: build SUCCESS, aliased to book-hthon.vercel.app
  - End-to-end: user confirmed chatbot working with Urdu toggle
---

## Prompt

Railway free trial ended. User needed a free alternative with no credit card requirement.

## Response snapshot

1. Evaluated alternatives: Render (requires credit card), Fly.io (Docker setup heavy), Vercel serverless (10s timeout too short for LLM calls). Selected Hugging Face Spaces — free, no credit card, Docker-based, CPU tier sufficient.
2. Created `backend/Dockerfile` — Python 3.12-slim, non-root user, port 7860 (HF requirement), uvicorn start command matching existing Procfile.
3. Guided user through HF Space creation: Docker SDK, file uploads (Dockerfile, requirements.txt, api.py, agent.py, database.py, dependencies.py, main.py), secrets configuration (all env vars under Secrets, not Variables).
4. Updated `src/components/ChatWidget/index.tsx` line 39: production URL from `victorious-presence-production.up.railway.app` to `talibhussain-book-hthon-backend.hf.space`.
5. Redeployed Vercel (`npx vercel --prod`) — build succeeded, aliased to book-hthon.vercel.app.
6. User confirmed end-to-end working: Urdu toggle + chatbot responding in Urdu.

## Outcome

- Feature fully live: frontend (Vercel) + backend (HF Spaces) + DB (Neon) + vector store (Qdrant) all connected.
- Chatbot responds in Urdu when language toggle is active.
- Zero cost: Vercel free tier + HF Spaces free CPU tier + Neon free tier.
- All 9 Urdu docs serving correctly. LanguageToggle, persistence, RTL, font loading all operational.
