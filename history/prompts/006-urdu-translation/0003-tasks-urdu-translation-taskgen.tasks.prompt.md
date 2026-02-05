---
id: "0003"
title: tasks-urdu-translation-taskgen
stage: tasks
date: 2026-02-04
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-urdu-translation
branch: 006-urdu-translation
user: talib1973
command: /sp.tasks
labels: ["urdu","translation","i18n","tasks","dependency-graph","mvp","parallel","react-markdown","rtl","persistence","rag"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-urdu-translation/tasks.md
tests:
  - Prerequisite check: plan.md, spec.md, research.md, data-model.md, contracts/ all present
  - Dependency graph: 9 phases, critical path B→C→D→F→G→H→I validated
  - Parallel groups: 5 groups identified, no circular dependencies
  - MVP slice: Phases 1+2+3 (T001–T013) confirmed independently testable
---

## Prompt

/sp.tasks — Generate dependency-ordered task list for 006-urdu-translation from design documents (plan.md, spec.md, research.md, data-model.md, contracts/).

## Response snapshot

37 tasks generated across 9 phases, organised as vertical slices per user story:

- Phase 1 Setup (T001–T004): react-markdown install, docs-ur scaffold, LanguageToggle stub, shared languageState module. T002/T003/T004 are parallel after T001.
- Phase 2 Foundational (T005–T006): DB migration (language_preference column on user_profile), glossary.md. BLOCKS all user-story work.
- Phase 3 US1 MVP (T007–T013): intro.md translation, profile GET update, core LanguageToggle (slug map, fetch, react-markdown render, original-content ref), styles, RTL CSS, Noto Nastaliq lazy font loader, DocItem mount via BrowserOnly. T007/T008 parallel.
- Phase 4 US2 (T014): Auth-gate audit — three guard conditions (isPending, no session.user, path not in slug map) + BrowserOnly SSR check.
- Phase 5 US3 (T015–T018): Profile POST update, localStorage write (optimistic), localStorage read fallback, auto-apply on mount/navigation.
- Phase 6 US4 (T019–T021): ChatWidget language field via languageState, ChatRequest Pydantic model extension, Urdu system-prompt prepend. T019/T020 parallel.
- Phase 7 US5 (T022–T023): In-memory fetch cache (module-level Map), non-blocking two-phase render confirmation.
- Phase 8 Content (T024–T031): 8 remaining chapter translations, all parallel, all governed by glossary.md.
- Phase 9 Polish (T032–T037): validation script, run validation, RTL visual check, chatbot language check, Lighthouse perf audit, production deploy.

5 parallel groups identified. MVP = Phases 1+2+3. Incremental delivery and two-developer parallel strategy documented.

## Outcome

- ✅ Impact: Complete, dependency-ordered, executable task list ready for implementation. Every task has exact file paths, acceptance criteria, and checkpoint gates. Zero ambiguous or missing dependencies.
- 🧪 Tests: Prerequisite check passed (all design docs present). Dependency graph validated — no circular dependencies. 5 parallel groups confirmed safe. MVP slice (T001–T013) is independently testable end-to-end.
- 📁 Files: specs/006-urdu-translation/tasks.md (37 tasks, 250 lines)
- 🔁 Next prompts: /sp.implement to begin executing tasks. Start with Phase 1 Setup (T001–T004), then Phase 2 (T005–T006), then Phase 3 MVP (T007–T013).
- 🧠 Reflection: The plan.md dependency graph mapped cleanly to the task phases with no gaps. The key structuring decision was keeping each user story as an independently testable vertical slice rather than layering horizontally by file. This means US1 alone (Phases 1+2+3) is a shippable MVP with one chapter, working toggle, and RTL — no need to wait for all 9 translations or chatbot work.

## Evaluation notes (flywheel)

- Failure modes observed: None. All 37 tasks have unambiguous file paths and acceptance criteria. No task required back-referencing an unresolved design question.
- Graders run and results (PASS/FAIL): Prerequisite check — PASS. Dependency graph — PASS (no cycles). Parallel-group safety — PASS (5 groups, all on disjoint files).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.implement to execute Phase 1 Setup tasks and validate that the scaffolding (react-markdown install, docs-ur directories, LanguageToggle stub, languageState module) compiles and the dev server starts cleanly.
