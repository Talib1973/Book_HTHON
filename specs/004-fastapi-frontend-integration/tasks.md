# Tasks: FastAPI-Docusaurus Integration for RAG Chatbot

**Input**: Design documents from `/specs/004-fastapi-frontend-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.yaml

**Tests**: Manual end-to-end testing only (no automated tests per spec requirement)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All file paths are absolute from repository root

## Path Conventions

- **Backend**: `backend/api.py` (new), `backend/agent.py` (existing)
- **Frontend**: `src/components/ChatWidget/`, `src/theme/Root.tsx`
- **Config**: `backend/pyproject.toml`, `backend/.env`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency configuration

- [x] T001 Add fastapi and uvicorn dependencies to backend/pyproject.toml
- [x] T002 Verify environment variables in backend/.env (OPENAI_API_KEY, COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY)
- [x] T003 [P] Create src/components/ChatWidget/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Pydantic models (ChatRequest, ChatResponse, Citation, ErrorResponse) in backend/api.py
- [x] T005 Create TypeScript interfaces matching backend models in src/types/chat.ts
- [x] T006 Initialize global agent instance in backend/api.py startup event

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Local FastAPI Chat Endpoint (Priority: P1) 🎯 MVP

**Goal**: FastAPI server with `/chat` POST endpoint accepting queries and returning agent responses with citations

**Independent Test**: Start FastAPI server (`uv run python backend/api.py`), send POST to `http://localhost:8000/chat` with `{"message": "What is ROS 2?"}`, verify JSON response with `response` and `sources` fields

### Implementation for User Story 1

- [x] T007 [US1] Create FastAPI app instance with metadata in backend/api.py
- [x] T008 [US1] Implement POST /chat endpoint with Pydantic request validation in backend/api.py
- [x] T009 [US1] Integrate agent.create_agent() and Runner.run_sync() in /chat endpoint handler
- [x] T010 [US1] Parse agent response to extract citations from textbook chunks in backend/api.py
- [x] T011 [US1] Implement error handling for empty messages (400), agent failures (500), Qdrant unavailable (503)
- [x] T012 [US1] Add startup event to initialize cohere_client and qdrant_client globals
- [x] T013 [US1] Configure uvicorn server to run on port 8000 in backend/api.py __main__ block
- [x] T014 [US1] Test endpoint with curl: POST valid query, verify response structure
- [x] T015 [US1] Test error scenarios: empty message, malformed JSON, backend agent error

**Checkpoint**: FastAPI endpoint fully functional - can answer queries via HTTP

---

## Phase 4: User Story 2 - CORS Configuration for Local Development (Priority: P2)

**Goal**: CORS middleware allows requests from localhost:3000 (dev) and https://book-hthon.vercel.app (prod)

**Independent Test**: Start both servers, open browser DevTools, make fetch from `http://localhost:3000` console, verify no CORS errors

### Implementation for User Story 2

- [x] T016 [US2] Add CORSMiddleware to FastAPI app in backend/api.py
- [x] T017 [US2] Configure allow_origins=["http://localhost:3000", "https://book-hthon.vercel.app"]
- [x] T018 [US2] Set allow_methods=["POST", "OPTIONS"] and allow_headers=["Content-Type"]
- [x] T019 [US2] Test preflight OPTIONS request returns 200 with correct headers
- [x] T020 [US2] Test POST request from localhost:3000 succeeds without CORS errors
- [x] T021 [US2] Test POST request from Vercel URL (if deployed) succeeds without CORS errors

**Checkpoint**: CORS configured - frontend can call backend API from both dev and prod

---

## Phase 5: User Story 3 - Frontend Fetch Example in Docusaurus (Priority: P3)

**Goal**: Minimal React chat widget in Docusaurus that calls `/chat` endpoint and displays responses with citations

**Independent Test**: Click "Ask Question" button on any Docusaurus page, verify fetch request in Network tab, confirm response logged to console with response and sources

### Implementation for User Story 3

- [x] T022 [P] [US3] Create ChatWidget component in src/components/ChatWidget/index.tsx
- [x] T023 [P] [US3] Create CSS module for widget styling in src/components/ChatWidget/styles.module.css
- [x] T024 [US3] Implement floating button UI (fixed bottom-right, chat icon)
- [x] T025 [US3] Implement modal dialog (overlay, input field, messages area, close button)
- [x] T026 [US3] Add useState for messages[], loading, error, isOpen
- [x] T027 [US3] Implement sendMessage() function with fetch to http://localhost:8000/chat
- [x] T028 [US3] Parse ChatResponse and render response text with clickable citation links
- [x] T029 [US3] Implement error handling (network errors, empty message validation)
- [x] T030 [US3] Add loading state ("Thinking...") while request is in flight
- [x] T031 [US3] Swizzle Docusaurus Root component: `npm run swizzle @docusaurus/theme-classic Root -- --wrap`
- [x] T032 [US3] Import and render ChatWidget in src/theme/Root.tsx
- [x] T033 [US3] Test chat widget appears on all Docusaurus pages
- [x] T034 [US3] Test sending question displays agent response with clickable sources
- [x] T035 [US3] Test error scenarios: backend offline, empty message, CORS failure

**Checkpoint**: Full end-to-end integration working - can ask questions via UI and see responses

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinements across all user stories

- [x] T036 [P] Add ARIA labels to ChatWidget for accessibility (button, dialog, input)
- [x] T037 [P] Ensure widget respects Docusaurus dark mode (CSS variables)
- [x] T038 [P] Add keyboard shortcuts (Escape to close, Enter to send)
- [x] T039 Verify quickstart.md steps match actual implementation
- [x] T040 Test Vercel deployment still works (no frontend build errors)
- [x] T041 Document backend startup command in README or quickstart
- [x] T042 Final verification: run through all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Phase 2 - No dependencies on other stories
  - US2 (P2): Can start after Phase 2 - Independent of US1 (but both needed for frontend)
  - US3 (P3): Depends on US1 (needs /chat endpoint) and US2 (needs CORS) - must run last
- **Polish (Phase 6)**: Depends on US1, US2, US3 completion

### User Story Dependencies

- **User Story 1 (P1)**: Independent - backend-only work
- **User Story 2 (P2)**: Independent - CORS config-only work
- **User Story 3 (P3)**: Requires US1 (/chat endpoint) + US2 (CORS) to test end-to-end

### Within Each User Story

- US1: Models → Endpoint → Integration → Error handling → Testing
- US2: CORS config → Testing
- US3: Component structure → UI → Fetch logic → Root integration → Testing

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can run in parallel (different files)
- **Phase 3 (US1)**: T014-T015 (testing) can run in parallel
- **Phase 5 (US3)**: T022-T023 (component files) can run in parallel
- **Phase 6**: T036, T037, T038, T041 can run in parallel (different files)
- **Cross-Story**: US1 and US2 can be developed in parallel (no overlap)

---

## Parallel Example: User Story 1

```bash
# Launch setup tasks together:
Task: "Add fastapi and uvicorn dependencies to backend/pyproject.toml"
Task: "Verify environment variables in backend/.env"
Task: "Create src/components/ChatWidget/ directory structure"

# Launch User Story 3 component creation together:
Task: "Create ChatWidget component in src/components/ChatWidget/index.tsx"
Task: "Create CSS module in src/components/ChatWidget/styles.module.css"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (backend endpoint)
4. Complete Phase 4: User Story 2 (CORS)
5. **STOP and VALIDATE**: Test with curl and browser console
6. MVP ready - backend accessible from frontend

### Full Integration (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test with curl → Backend working
3. Add User Story 2 → Test CORS → Frontend can call backend
4. Add User Story 3 → Test chat widget → Full UI integration
5. Each story adds value incrementally

### Parallel Team Strategy

With 2 developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + 2 (backend + CORS)
   - Developer B: User Story 3 (frontend - can start when A completes)
3. Stories integrate seamlessly

---

## Task Summary

**Total Tasks**: 42
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (US1 - Backend Endpoint): 9 tasks
- Phase 4 (US2 - CORS): 6 tasks
- Phase 5 (US3 - Frontend Widget): 14 tasks
- Phase 6 (Polish): 7 tasks

**Parallel Opportunities**: 8 tasks marked [P]

**MVP Scope**: Phases 1-4 (21 tasks) → Backend API with CORS

**Full Feature**: All 42 tasks → End-to-end chat integration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently testable per spec requirements
- Manual testing only (no automated test suite per spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US3 requires US1+US2 complete but US1 and US2 are independent
