---
id: "0001"
title: spec-urdu-translation-feature
stage: spec
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: 006-urdu-translation
user: talib1973
command: /sp.specify
labels: ["urdu","translation","i18n","rtl","auth-gated","toggle","rag","personalization"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-urdu-translation/spec.md
  - specs/006-urdu-translation/checklists/requirements.md
tests:
  - Specification quality checklist (all 16 items passed)
---

## Prompt

/sp.specify — Introduce Urdu translations of all book content that can be enabled via a chapter-level toggle button, available only to authenticated users. Scope includes: content translation (9 chapters, code blocks untouched), auth-gated "اردو / English" toggle, Docusaurus RTL + Noto Nastaliq font, language preference persisted to Neon Postgres (localStorage fallback), RAG chatbot responds in Urdu at the response layer (no re-embedding), lazy-loading of Urdu content, SEO + accessibility compliance. Non-goals: no runtime machine translation, no languages beyond Urdu, no auth-provider changes, no content regeneration.

## Response snapshot

Generated specs/006-urdu-translation/spec.md containing:
- 7 documented assumptions (pre-translated static content, server-side preference with local fallback, scoped RTL, no vector re-index, code-block exemption, 9-chapter scope, auth-gate enforcement).
- 5 prioritised user stories (P1 toggle, P2 auth-gate, P3 cross-session persistence, P4 chatbot Urdu, P5 lazy-load performance), each with Given/When/Then acceptance scenarios.
- 5 edge cases (missing translation, network failure, preference conflict, mobile code-block scroll, chatbot input-language mismatch).
- 10 functional requirements (FR-001–FR-010).
- 2 key entities (UserLanguagePreference, UrduChapterContent).
- 8 measurable success criteria (SC-001–SC-008).
Quality checklist created at checklists/requirements.md — all 16 items passed on first pass, zero [NEEDS CLARIFICATION] markers.

## Outcome

- ✅ Impact: Specification fully defines the Urdu translation feature scope, requirements, and acceptance criteria. Ready for planning phase.
- 🧪 Tests: Specification quality checklist — 16/16 items passed. No clarification rounds needed.
- 📁 Files: specs/006-urdu-translation/spec.md (created), specs/006-urdu-translation/checklists/requirements.md (created).
- 🔁 Next prompts: /sp.clarify (optional, spec is clean) or /sp.plan to produce the implementation plan.
- 🧠 Reflection: The user's input was comprehensive and well-scoped. All 7 assumptions were derivable from the constitution and the stated non-goals — no guesswork on critical decisions. Zero clarification markers needed.

## Evaluation notes (flywheel)

- Failure modes observed: None. Input was detailed enough to avoid ambiguity.
- Graders run and results (PASS/FAIL): Specification quality checklist — PASS (16/16).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.plan next to validate that the spec translates cleanly into an implementation plan without gaps.
