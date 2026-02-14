---
id: "0005"
title: Language Switching Mid-Session Test
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: master
user: TalibHussain
command: "test language switching mid-session on live chatbot"
labels: ["testing", "urdu", "language-switching", "session", "006-urdu-translation"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files: []
tests:
  - "Step 1: EN — 'What is a ROS 2 topic?' → English response — PASS"
  - "Step 2: UR — 'ROS 2 سروس کیا ہے؟' → Urdu response — PASS"
  - "Step 3: EN — 'What is a ROS 2 action?' → English response — PASS"
---

## Prompt

test language switching mid-session.

(Follow-up): create a PHR for the language switching test.

## Response snapshot

Three sequential requests sent with the same `session_id: lang-switch-test`:

1. **EN → English**: "What is a ROS 2 topic?" (language: en)
   - Response in English, explained topics as data exchange mechanism between nodes ✅

2. **EN → Urdu**: "ROS 2 سروس کیا ہے؟" (language: ur)
   - Response fully in Urdu, explained ROS 2 services correctly, no English bleed-over ✅

3. **UR → English**: "What is a ROS 2 action?" (language: en)
   - Response back in English, explained actions as async long-running goals with feedback ✅

No language bleed-over detected at any switch point. The `language` field per-request correctly overrides session history language.

## Outcome

- ✅ Impact: Language switching mid-session confirmed working — chatbot respects per-request `language` field regardless of prior session language
- 🧪 Tests: 3 sequential requests (EN→UR→EN) on same session — all PASS
- 📁 Files: none modified
- 🔁 Next prompts: All core chatbot features verified; consider improving error visibility in backend
- 🧠 Reflection: Per-request language signal design (not session-level) is correct — allows flexible UI toggling without session reset

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): 3 language-switch curl tests — PASS
- Prompt variant (if applicable): null
- Next experiment: Test with a very long session (10+ messages) to confirm no language drift
