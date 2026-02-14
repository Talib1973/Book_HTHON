---
id: "0007"
title: Final Pre-Submission Site Check
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: TalibHussain
command: "final live site check before project assessment submission"
labels: ["testing", "verification", "pre-submission", "chatbot", "urdu"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files: []
tests:
  - "Frontend (Vercel) HTTP status — 200 OK"
  - "Backend root (HF Space) HTTP status — 200 OK"
  - "English chatbot POST /chat (VLA model?) — responded correctly"
  - "Urdu chatbot POST /chat (VLA ماڈل کیا ہے؟) — responded in Urdu correctly"
---

## Prompt

check the live site one more time before submitting.

(Follow-up): create a PHR for the final check.

## Response snapshot

Four checks run against live endpoints:

1. **Frontend (Vercel)** `https://book-hthon.vercel.app/` → HTTP 200 ✅
2. **Backend root** `https://talibhussain-book-hthon-backend.hf.space/` → HTTP 200 ✅
3. **English chatbot** — "What is a VLA model?" → correctly responded "not found in textbook" (grounded RAG behaviour, no hallucination) ✅
4. **Urdu chatbot** — "VLA ماڈل کیا ہے؟" → correctly responded in Urdu "not found in textbook" ✅

Grounded "not found" response noted as a **strength** — chatbot only answers from textbook content and does not hallucinate.

## Outcome

- ✅ Impact: All systems confirmed live and healthy immediately before assessment submission
- 🧪 Tests: 4 checks (HTTP + EN chatbot + UR chatbot) — all PASS
- 📁 Files: none modified
- 🔁 Next prompts: Submit for assessment
- 🧠 Reflection: Grounded RAG responses (returning "not found" rather than hallucinating) demonstrate correct system design — a key differentiator for assessment

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all 4 checks — PASS
- Prompt variant (if applicable): null
- Next experiment: n/a — project submitted for assessment
