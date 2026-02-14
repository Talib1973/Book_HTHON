---
id: "0004"
title: Urdu Chatbot Verification Test
stage: general
date: 2026-02-13
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: master
user: TalibHussain
command: "test Urdu chatbot on live HF Space"
labels: ["testing", "urdu", "chatbot", "verification", "006-urdu-translation"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files: []
tests:
  - "curl POST /chat with language=ur, message='ROS 2 کیا ہے؟' — PASS"
  - "curl POST /chat with language=ur, message='Gazebo simulation کیا ہے؟' — PASS"
---

## Prompt

test Urdu chatbot.

(Follow-up): create a PHR for the Urdu test.

## Response snapshot

Two Urdu questions tested against live endpoint `https://talibhussain-book-hthon-backend.hf.space/chat`:

1. `ROS 2 کیا ہے؟` (language: ur) — returned full Urdu explanation of ROS 2 with DDS, real-time, security features; citation included
2. `Gazebo simulation کیا ہے؟` (language: ur) — returned full Urdu explanation of Gazebo simulation with feature list; citation included

Both responses:
- Fully in Urdu prose
- Technical terms (DDS, TCP/UDP, Gazebo) correctly left in English
- Sources/citations returned in Urdu titles

## Outcome

- ✅ Impact: Urdu language feature (006-urdu-translation) confirmed working with anthropic/claude-3-haiku model
- 🧪 Tests: 2 Urdu curl tests — both PASS
- 📁 Files: none modified
- 🔁 Next prompts: Test language switching (Urdu → English → Urdu) to verify session isolation
- 🧠 Reflection: claude-3-haiku handles Urdu language generation correctly; technical English terms preserved within Urdu responses as expected per spec

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): curl POST /chat (ur) ×2 — PASS
- Prompt variant (if applicable): null
- Next experiment: Test language switching mid-session to verify no bleed-over between languages
