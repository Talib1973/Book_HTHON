---
description: "Task list for RAG Retrieval Validation implementation"
---

# Tasks: RAG Retrieval Validation

**Input**: Design documents from `/specs/002-rag-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/validation-functions.md

**Tests**: Manual validation approach - no automated test framework (per spec requirements)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-file implementation in `backend/test_retrieval.py` (reuses existing backend/ infrastructure from Spec 001)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and initialize script structure

- [X] T001 Verify backend/ directory exists with .env file containing required credentials (COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY)
- [X] T002 Verify Qdrant collection `robotics_textbook` exists by running `uv run python backend/verify_qdrant.py`
- [X] T003 Create `backend/test_retrieval.py` with imports and docstring header

**Checkpoint**: Environment verified, file structure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `validate_environment()` function in backend/test_retrieval.py per contracts/validation-functions.md
- [X] T005 Implement `initialize_clients(env_vars)` function in backend/test_retrieval.py per contracts/validation-functions.md
- [X] T006 Implement `generate_query_embedding(query_text, cohere_client)` function with retry logic per contracts/validation-functions.md
- [X] T007 Implement `search_qdrant(query_embedding, qdrant_client, k)` function per contracts/validation-functions.md
- [X] T008 Test foundational functions by running script with a single test query "ROS 2 setup" and verifying embedding generation and Qdrant search work

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Semantic Search Testing (Priority: P1) 🎯 MVP

**Goal**: Implement basic retrieval validation with top-3 results display and metadata verification

**Independent Test**: Run script with 3-5 basic queries, verify top-3 results displayed with correct metadata (URL, title, heading, text preview)

### Implementation for User Story 1

- [X] T009 [US1] Define 5 basic test queries in main() function covering ROS 2 and Digital Twin topics (per research.md Decision 10)
- [X] T010 [US1] Implement `display_query_results(query, category, results, rank, total)` function per contracts/validation-functions.md
- [X] T011 [US1] Implement basic `main()` function that: validates env → initializes clients → processes 5 queries → displays results
- [X] T012 [US1] Add low confidence warning (score <0.4) to display_query_results() function per research.md Decision 3
- [X] T013 [US1] Test US1 by running `uv run python backend/test_retrieval.py` and manually verifying:
  - Top-3 results displayed for each query
  - Metadata includes URL, title, heading
  - Results are from relevant textbook sections
  - Low confidence warnings show for queries with score <0.4

**Checkpoint**: At this point, User Story 1 should be fully functional - basic retrieval validation works with 5 queries

---

## Phase 4: User Story 2 - Precision@k Metrics Calculation (Priority: P2)

**Goal**: Add quantitative precision@k metrics calculation and display in summary report

**Independent Test**: Define ground-truth for 3 queries, run script, verify precision@3 and precision@5 calculated correctly

### Implementation for User Story 2

- [X] T014 [US2] Define ground-truth mappings for 5-7 test queries in main() function (per research.md Decision 7)
- [X] T015 [US2] Implement `calculate_precision_at_k(retrieved_urls, relevant_urls, k)` function per contracts/validation-functions.md
- [X] T016 [US2] Implement `display_summary_report(all_results, precision_metrics)` function per contracts/validation-functions.md including:
  - Average top-1 score calculation
  - Queries above threshold count (score ≥0.5)
  - Average precision@3 and precision@5
  - Pass/fail status (≥80% relevance, ≥70% precision@3)
- [X] T017 [US2] Update main() function to:
  - Collect all query results
  - Calculate precision metrics for queries with ground-truth
  - Call display_summary_report() at end
  - Return exit code 0 if pass, 1 if fail
- [X] T018 [US2] Test US2 by running script and manually verifying:
  - Precision@3 and precision@5 calculated correctly (manually check against ground-truth)
  - Summary statistics displayed (avg scores, pass/fail status)
  - Exit code 0 if criteria met, 1 if failed

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - retrieval validation with quantitative metrics

---

## Phase 5: User Story 3 - Student Question Test Cases (Priority: P3)

**Goal**: Expand test coverage to 12 student questions spanning all syllabus modules

**Independent Test**: Run script with 12 diverse queries, verify 80% have relevant top-1 results (score ≥0.5)

### Implementation for User Story 3

- [X] T019 [US3] Expand test queries to full 12-query list per research.md Decision 10:
  - ROS 2 Module: 3 queries
  - Digital Twin Module: 3 queries
  - NVIDIA Isaac Module: 3 queries
  - VLA Module: 2 queries
  - Capstone/General: 1 query
- [X] T020 [US3] Add category field to each test query dictionary (per data-model.md TestQuery entity)
- [X] T021 [US3] Add expected_topics field to test queries for manual validation reference (per data-model.md TestQuery entity)
- [X] T022 [US3] Update display_query_results() to show query category in output header
- [X] T023 [US3] Test US3 by running full script with 12 queries and manually verifying:
  - All 12 queries process successfully
  - Results span all syllabus topics (ROS 2, Digital Twin, Isaac, VLA, Capstone)
  - At least 80% (10/12) have top-1 score ≥0.5
  - Precision@3 ≥70% for queries with ground-truth
  - Execution time <30 seconds

**Checkpoint**: All user stories complete - full validation suite with 12 queries operational

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the complete validation script

- [X] T024 Add header output with collection name, total queries, timestamp when script starts (per research.md Decision 4)
- [X] T025 Add error handling for edge cases per research.md Decision 6:
  - Empty collection (display message, suggest running main.py)
  - No results for query (display "No results found" message)
  - Cohere API errors (already handled by retry in T006)
- [X] T026 Add script entry point: `if __name__ == "__main__": sys.exit(main())`
- [X] T027 Final validation per quickstart.md:
  - Run script and verify output matches expected format
  - Verify all 12 queries complete in <30 seconds
  - Verify pass/fail status displays correctly
  - Test error scenarios (missing env var, wrong collection name)
- [X] T028 Update backend/README.md to reference test_retrieval.py and link to quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify prerequisites
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 can start after Foundational
  - US2 depends on US1 (uses display functions from US1)
  - US3 depends on US1 and US2 (expands existing functionality)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2)
- **User Story 2 (P2)**: Depends on US1 completion (reuses display_query_results)
- **User Story 3 (P3)**: Depends on US1 and US2 completion (expands test coverage)

### Within Each User Story

- US1: T009 (define queries) → T010 (display function) → T011 (main function) → T012 (warnings) → T013 (test)
- US2: T014 (ground-truth) → T015 (calculate function) → T016 (summary function) → T017 (update main) → T018 (test)
- US3: T019 (expand queries) → T020 (add category) → T021 (add topics) → T022 (update display) → T023 (test)

### Parallel Opportunities

**Limited parallelization** due to single-file implementation:
- T001 and T002 can run in parallel (verification tasks, no code changes)
- T004, T005, T006, T007 can theoretically run in parallel by different developers implementing different functions, then integrating into one file
- Most tasks within user stories are sequential dependencies in a single file

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T013)
4. **STOP and VALIDATE**: Test with 5 queries, verify metadata display works
5. Can demo basic retrieval validation at this point

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T008)
2. Add User Story 1 → Test independently → Basic validation works (T009-T013)
3. Add User Story 2 → Test independently → Quantitative metrics added (T014-T018)
4. Add User Story 3 → Test independently → Full test coverage (T019-T023)
5. Polish → Production-ready script (T024-T028)

### Single Developer Strategy

Given single-file constraint:

1. Complete Setup (verify environment)
2. Complete Foundational (implement core functions: validate, initialize, embed, search)
3. Implement US1 (basic display + main loop for 5 queries)
4. Test US1 independently
5. Implement US2 (add precision calculation + summary report)
6. Test US2 independently
7. Implement US3 (expand to 12 queries)
8. Test US3 independently
9. Polish (error handling, documentation)

---

## Notes

- Single-file implementation limits parallelization opportunities
- All functions defined in same file: backend/test_retrieval.py
- No external modules or packages created
- Manual validation approach (no automated tests per spec)
- Reuses all dependencies from Spec 001 (no new installations needed)
- Each user story builds on previous (US2 uses US1's display, US3 expands US1+US2's functionality)
- Stop at any checkpoint to validate story independently
- Commit after each phase or user story completion
