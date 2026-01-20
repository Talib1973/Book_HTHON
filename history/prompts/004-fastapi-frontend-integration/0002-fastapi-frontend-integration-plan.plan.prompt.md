---
id: 0002
title: FastAPI Frontend Integration Plan
stage: plan
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-fastapi-frontend-integration
branch: 004-fastapi-frontend-integration
user: DELL
command: /sp.plan
labels: ["fastapi", "docusaurus", "architecture", "api-design", "cors"]
links:
  spec: specs/004-fastapi-frontend-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-fastapi-frontend-integration/plan.md
 - specs/004-fastapi-frontend-integration/research.md
 - specs/004-fastapi-frontend-integration/data-model.md
 - specs/004-fastapi-frontend-integration/contracts/chat-api.yaml
 - specs/004-fastapi-frontend-integration/quickstart.md
 - CLAUDE.md (updated agent context)
tests:
 - Constitution Check: All 7 principles PASSED
 - Technical Context validation: Complete
---

## Prompt

Create backend/api.py containing a FastAPI app with a /chat POST endpoint that uses the RAG agent defined in backend/agent.py to answer queries using the existing Qdrant + Cohere pipeline
Enable CORS in api.py to allow requests from Docusaurus dev server (http://localhost:3000) and production Vercel site (https://book-hthon.vercel.app)
In the existing Docusaurus frontend (already live at https://book-hthon.vercel.app/), add a global React component or client-side script that embeds a minimal, consistent chat widget (e.g., floating button + modal) on every documentation page
The frontend widget sends user input (and optional selected text) to http://localhost:8000/chat during development and displays the agent's response with source links—reusing the agent logic from agent.py via the FastAPI layer
Ensure the chat UI respects Docusaurus styling and does not disrupt content layout; no redesign needed—just functional integration
Test end-to-end locally: Docusaurus (port 3000) → backend/api.py (port 8000) → agent.py → Qdrant → response rendered in UI
Backend starts with uv run api.py; all AI logic remains encapsulated in agent.py

## Response snapshot

Successfully created comprehensive implementation plan for FastAPI-Docusaurus integration with complete architecture documentation.

**Phase 0 - Research** (29KB document):
- FastAPI endpoint design with Pydantic models (ChatRequest, ChatResponse, Citation)
- CORS configuration for localhost:3000 and Vercel production (explicit origins, no wildcards)
- Agent integration pattern (direct import, startup initialization, SQLiteSession for multi-turn)
- Error handling with HTTP semantics (400/500/503 with ErrorResponse model)
- Docusaurus global component integration (Root wrapper, CSS Modules, theme variables)

**Phase 1 - Design Artifacts**:
- **data-model.md**: Complete backend (Pydantic) and frontend (TypeScript) data models with validation rules, state transitions, ERD
- **contracts/chat-api.yaml**: OpenAPI 3.0 specification with full endpoint documentation, request/response examples, error scenarios
- **quickstart.md**: Step-by-step guide (5 min setup) covering backend startup, frontend integration, testing, troubleshooting, verification checklist

**Project Structure**:
- Backend: Single new file `backend/api.py` (100-200 lines) wrapping existing `agent.py`
- Frontend: New component `src/components/ChatWidget/` (100-150 lines) with theme integration
- Minimal changes: Leverages existing infrastructure, no new dependencies beyond fastapi/uvicorn

**Constitution Check**: All 7 principles PASSED
- Technical accuracy: Industry-standard FastAPI/CORS patterns
- Modularity: Independent backend/frontend components
- Accessibility: Semantic HTML, ARIA labels, dark mode support
- Deployment: Uses existing Vercel CI/CD, local backend only
- Privacy: No data collection beyond query text
- RAG intelligence: Reuses Spec 003 agent unchanged
- Iterative delivery: Three-phase approach (endpoint → CORS → widget)

## Outcome

- ✅ Impact: Complete architectural foundation for local FastAPI-Docusaurus integration with RAG chatbot
- 🧪 Tests: Constitution Check (7/7 PASSED), Technical Context validation (complete)
- 📁 Files: plan.md, research.md (29KB), data-model.md, contracts/chat-api.yaml, quickstart.md, CLAUDE.md (updated)
- 🔁 Next prompts: /sp.tasks (break down into implementation tasks), /sp.implement (execute tasks)
- 🧠 Reflection: Planning phase identified minimal integration approach (backend/api.py + ChatWidget component) leveraging existing Spec 003 agent; no architecture violations; ready for task breakdown

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed on first iteration with all artifacts generated
- Graders run and results (PASS/FAIL): Constitution Check PASS (7/7 principles), Technical Context PASS (all fields filled)
- Prompt variant (if applicable): Standard /sp.plan workflow with Phase 0 research + Phase 1 design
- Next experiment (smallest change to try): Proceed to /sp.tasks to generate dependency-ordered implementation tasks
