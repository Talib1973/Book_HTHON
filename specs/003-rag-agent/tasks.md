---
description: "Task list for RAG-Powered Agent implementation"
---

# Tasks: RAG-Powered Agent

**Input**: Design documents from `/specs/003-rag-agent/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agent-functions.md

**Tests**: Manual CLI testing (no automated test framework per spec FR-009)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-file implementation in `backend/agent.py` (reuses existing backend/ infrastructure from Spec 001/002)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment

- [X] T001 Install openai-agents package via `uv add openai-agents` in backend/
- [X] T002 Add OPENAI_API_KEY to backend/.env.example with documentation
- [X] T003 Verify backend/.env contains OPENAI_API_KEY (user adds manually)

**Checkpoint**: Dependencies installed, environment configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create backend/agent.py with imports and module docstring
- [X] T005 Add global client variables (cohere_client, qdrant_client) in backend/agent.py
- [X] T006 Update validate_environment() in backend/agent.py to include OPENAI_API_KEY check
- [X] T007 Define INSTRUCTIONS constant in backend/agent.py with grounding and citation rules per research.md Decision 4

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Agent with Retrieval Tool (Priority: P1) 🎯 MVP

**Goal**: Implement basic agent with working retrieval that generates grounded responses

**Independent Test**: Run `uv run python backend/agent.py`, ask "What is ROS 2?", verify response includes accurate information grounded in textbook

### Implementation for User Story 1

- [X] T008 [US1] Implement retrieve_textbook_content() tool function in backend/agent.py per contracts/agent-functions.md
- [X] T009 [US1] Implement create_agent() helper function in backend/agent.py
- [X] T010 [US1] Implement run_conversation_loop() CLI function in backend/agent.py
- [X] T011 [US1] Implement main() entry point in backend/agent.py with all 5 phases (validate, initialize, create agent, create session, run loop)
- [X] T012 [US1] Add `if __name__ == "__main__": sys.exit(main())` block in backend/agent.py
- [X] T013 [US1] Test US1: Run agent, ask "What is ROS 2?", verify grounded response without fabrication

**Checkpoint**: Basic agent with retrieval works - can answer questions using textbook content

---

## Phase 4: User Story 2 - Source Attribution and Citation (Priority: P2)

**Goal**: Ensure agent includes [Page Title](URL) citations in all textbook-based responses

**Independent Test**: Ask any question, verify response includes citation with clickable URL that navigates to correct textbook page

### Implementation for User Story 2

- [X] T014 [US2] Enhance INSTRUCTIONS constant in backend/agent.py with explicit citation format examples
- [X] T015 [US2] Update INSTRUCTIONS to include "When retrieval tool returns results, cite each source used"
- [X] T016 [US2] Test US2: Ask "What is digital twin?", verify response includes [Page Title](URL) citation
- [X] T017 [US2] Test US2: Click citation URL, verify it navigates to correct textbook page
- [X] T018 [US2] Test US2: Ask question using multiple chunks, verify each source cited

**Checkpoint**: Agent consistently cites sources with correct format and working URLs

---

## Phase 5: User Story 3 - Multi-Turn Conversation with Memory (Priority: P3)

**Goal**: Enable follow-up questions that maintain conversation context

**Independent Test**: Ask "What is ROS 2?" then "How do I install it?", verify agent understands "it" refers to ROS 2

### Implementation for User Story 3

- [X] T019 [US3] Verify SQLiteSession initialization in main() creates persistent session file
- [X] T020 [US3] Enhance INSTRUCTIONS to include "For follow-up questions, maintain context from previous conversation turns"
- [X] T021 [US3] Test US3: Multi-turn conversation (Q1: "What is ROS 2?", Q2: "How do I install it?"), verify pronoun resolution
- [X] T022 [US3] Test US3: Ask "Can you explain that in simpler terms?", verify agent references previous response
- [X] T023 [US3] Test US3: Run 5+ conversation turns, verify context maintained throughout

**Checkpoint**: All user stories complete - agent supports retrieval, citations, and multi-turn memory

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, error handling, and production readiness

- [X] T024 Add error handling for empty retrieval results in retrieve_textbook_content()
- [X] T025 Add error handling for Cohere/Qdrant failures in retrieve_textbook_content()
- [X] T026 Update backend/README.md with agent.py usage section linking to specs/003-rag-agent/quickstart.md
- [X] T027 Test edge case: Off-topic question ("What's the weather?"), verify agent acknowledges out-of-scope
- [X] T028 Test edge case: Empty query, verify graceful handling
- [X] T029 Test edge case: Ctrl+C interrupt, verify graceful exit
- [X] T030 Validate all acceptance criteria from quickstart.md testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - install packages and configure environment
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 can start after Foundational
  - US2 depends on US1 (enhances citation behavior)
  - US3 depends on US1 (adds memory to existing agent)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2)
- **User Story 2 (P2)**: Depends on US1 completion (enhances existing agent instructions)
- **User Story 3 (P3)**: Depends on US1 completion (adds session memory to existing agent)

### Within Each User Story

- US1: Create tool → Create agent → Create CLI loop → Implement main → Test
- US2: Enhance instructions → Test citations → Verify URLs
- US3: Verify session → Enhance instructions → Test multi-turn

### Parallel Opportunities

**Limited parallelization** due to single-file implementation:
- T001, T002, T003 can run in parallel (setup tasks, different files)
- T004-T007 are sequential dependencies in same file
- User stories are sequential (US2 builds on US1, US3 builds on US1)
- Most tasks within user stories are sequential edits to same file

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007) - CRITICAL
3. Complete Phase 3: User Story 1 (T008-T013)
4. **STOP and VALIDATE**: Test with "What is ROS 2?" query
5. Can demo basic retrieval-grounded agent at this point

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T007)
2. Add User Story 1 → Test independently → Basic agent works (T008-T013)
3. Add User Story 2 → Test independently → Citations added (T014-T018)
4. Add User Story 3 → Test independently → Multi-turn memory works (T019-T023)
5. Polish → Production-ready agent (T024-T030)

### Single Developer Strategy

Given single-file constraint:

1. Complete Setup (install package, configure .env)
2. Complete Foundational (create file, add constants and global vars)
3. Implement US1 (tool function + agent creation + CLI loop)
4. Test US1 independently with sample query
5. Implement US2 (enhance instructions for citations)
6. Test US2 independently
7. Implement US3 (verify session memory working)
8. Test US3 independently
9. Polish (error handling, documentation)

---

## Notes

- Single-file implementation limits parallelization opportunities
- All functions defined in same file: backend/agent.py
- Reuses 4 functions from backend/test_retrieval.py (via import or copy)
- Manual CLI testing per spec FR-009 (no automated tests)
- Each user story builds on previous (sequential implementation recommended)
- Stop at any checkpoint to validate story independently
- Estimated ~200-300 lines of new code (excluding reused functions)
- Commit after each user story completion for rollback safety
