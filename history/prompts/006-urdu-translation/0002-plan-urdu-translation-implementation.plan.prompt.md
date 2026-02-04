---
id: "0002"
title: plan-urdu-translation-implementation
stage: plan
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: 006-urdu-translation
user: talib1973
command: /sp.plan
labels: ["urdu","translation","i18n","rtl","plan","react-markdown","lazy-load","rag","persistence"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-urdu-translation/plan.md
  - specs/006-urdu-translation/research.md
  - specs/006-urdu-translation/data-model.md
  - specs/006-urdu-translation/quickstart.md
  - specs/006-urdu-translation/contracts/profile-language-preference.yaml
  - specs/006-urdu-translation/contracts/chat-language-signal.yaml
  - CLAUDE.md
tests:
  - Constitution check: 7/7 principles pass
  - Complexity note documented (client-to-server persistence evolution)
---

## Prompt

/sp.plan — Create implementation plan for 006-urdu-translation. Scope: work breakdown, task sequencing, frontend/backend/content/DevOps responsibilities, risk identification, validation and rollout strategy. Constraints: no auth-provider changes, no vector re-embedding, no runtime machine translation, Urdu for logged-in users only, English default. Required sections: Phase Breakdown, Task Sequencing and Dependencies, Frontend Plan, Backend Plan, Content Workflow, RAG Chatbot Alignment, Testing Strategy, Risks and Mitigations, Rollout Strategy, Definition of Done.

## Response snapshot

Phase 0 Research (research.md): 5 architecture decisions fully resolved:
1. Content delivery: static/docs-ur/ + react-markdown lazy fetch (not Docusaurus i18n, not bundled).
2. RTL: scoped to content container only; sidebar layout stays LTR; Noto Nastaliq lazy-loaded.
3. Persistence: language_preference column on existing user_profile; localStorage key ba_language_pref as offline fallback.
4. RAG chatbot: language field in ChatRequest; Urdu system-prompt instruction prepended at response layer; no re-embedding.
5. Slug mapping: explicit 9-entry static map in LanguageToggle; missing entry = toggle hidden (FR-009).

Phase 1 Design:
- data-model.md: 3 entities (UserLanguagePreference as column, UrduChapterContent as static files, ChatLanguageSignal as request-only). Migration SQL. File validation rules (code-fence parity, heading-level parity, untranslated-prose heuristic).
- contracts/: Two OpenAPI 3.0.3 specs - profile extension (backward-compatible field addition) and chat language signal (optional field, defaults to en).
- quickstart.md: Full developer onboarding from cold checkout through local dev, migration, component development, testing, and deploy.

plan.md: 10-section plan. Dependency graph identifies 9 phases (A-I). Critical path: B-C-D-F-G-H-I. Phase A (translation) parallelises entirely with code work. Constitution check: 7/7 pass. Complexity note on persistence evolution documented inline. 6 risks identified with mitigations. Definition of Done has per-chapter and feature-level checklists.

## Outcome

- ✅ Impact: Full implementation plan ready. All architecture decisions resolved, contracts defined, developer guide written. Zero NEEDS CLARIFICATION items remain.
- 🧪 Tests: Constitution check 7/7 pass. No complexity violations requiring justification beyond the documented persistence evolution note.
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/profile-language-preference.yaml, contracts/chat-language-signal.yaml, CLAUDE.md (agent context updated).
- 🔁 Next prompts: /sp.tasks to generate the dependency-ordered task list from this plan.
- 🧠 Reflection: The spec was detailed enough that zero clarifications were needed in either the spec or plan stage. The key architectural insight was rejecting Docusaurus i18n (forces page reload) in favour of client-side fetch + react-markdown - this was the decision that shaped the entire frontend design.

## Evaluation notes (flywheel)

- Failure modes observed: None. All decisions had clear rationale and rejected alternatives documented.
- Graders run and results (PASS/FAIL): Constitution check - PASS (7/7).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.tasks to validate that the plan translates into a clean, dependency-ordered task list without gaps or ambiguity.
