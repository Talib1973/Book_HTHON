# Implementation Plan: FastAPI-Docusaurus Integration for RAG Chatbot

**Branch**: `004-fastapi-frontend-integration` | **Date**: 2026-01-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-fastapi-frontend-integration/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a local development integration connecting a Docusaurus frontend (https://book-hthon.vercel.app/) to a FastAPI backend serving the RAG agent from Spec 003. The backend exposes a `/chat` POST endpoint at `http://localhost:8000` that accepts user queries and returns agent responses with source citations. CORS is configured to allow requests from both the local Docusaurus dev server (`http://localhost:3000`) and production Vercel site. A minimal React-based chat widget is embedded globally in Docusaurus to demonstrate end-to-end functionality without disrupting existing content layout.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript/React 19 (frontend)
**Primary Dependencies**:
  - Backend: FastAPI 0.115+, uvicorn, python-dotenv, plus existing Spec 003 deps (OpenAI Agents SDK, cohere, qdrant-client)
  - Frontend: Docusaurus 3.9.2, React 19, @docusaurus/core
**Storage**: N/A (uses existing Qdrant Cloud from Spec 001)
**Testing**: Manual end-to-end testing (automated testing out of scope per spec)
**Target Platform**:
  - Backend: Local development (Linux/macOS/WSL), Python 3.11+
  - Frontend: Browser (Chrome/Firefox/Safari), Node.js 20+ for build
**Project Type**: Web application (backend + frontend)
**Performance Goals**: <15 seconds per chat query (including RAG agent processing), instant CORS preflight responses
**Constraints**:
  - Local development only (no production FastAPI deployment)
  - Backend must be startable with `uv run api.py` or `uvicorn backend.api:app`
  - CORS must allow both localhost:3000 (dev) and https://book-hthon.vercel.app (prod)
  - Chat UI must not disrupt existing Docusaurus layout or styling
**Scale/Scope**:
  - Single `/chat` endpoint
  - Global chat widget component in Docusaurus
  - ~100-200 lines backend code (api.py wrapper around agent.py)
  - ~100-150 lines frontend code (React component + styling)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Technical Accuracy & Industry Alignment
- **Status**: PASS
- **Assessment**: FastAPI is industry-standard for Python APIs; CORS configuration follows standard browser security; integration with existing RAG agent maintains accuracy
- **Evidence**: Uses established FastAPI patterns, no custom/experimental protocols

### ✅ Principle II: Modular, Extensible Content Architecture
- **Status**: PASS
- **Assessment**: Backend API is independent module (backend/api.py); frontend widget is self-contained React component; can be developed and tested independently
- **Evidence**: Clear separation: api.py (backend) ← agent.py (existing) | ChatWidget.tsx (frontend)

### ✅ Principle III: Accessibility & Inclusive Design
- **Status**: PASS
- **Assessment**: Chat widget will use semantic HTML and respect Docusaurus accessibility features; no barriers introduced for diverse learners
- **Evidence**: React component will use `<button>`, `<dialog>` or `<div role="dialog">` with ARIA labels

### ✅ Principle IV: Deployment-First Development
- **Status**: PASS
- **Assessment**: Frontend changes deploy via existing Vercel CI/CD; backend is local-only per spec (production deployment out of scope)
- **Evidence**: No changes to deployment pipeline; Vercel site remains functional

### ✅ Principle V: Privacy-Respecting Personalization
- **Status**: PASS
- **Assessment**: No user data collection beyond query text sent to local API; no tracking or persistent storage
- **Evidence**: Chat queries sent to localhost:8000 only; no logging infrastructure

### ✅ Principle VI: Semantic Content for RAG Intelligence
- **Status**: PASS
- **Assessment**: Uses existing RAG agent (agent.py) which already implements semantic retrieval; no changes to content structure
- **Evidence**: Integration layer only; retrieval logic unchanged from Spec 003

### ✅ Principle VII: Iterative, Testable Delivery
- **Status**: PASS
- **Assessment**: Feature can be tested incrementally (backend endpoint → CORS → frontend widget); vertical slice approach
- **Evidence**: Three-phase delivery: (1) API endpoint, (2) CORS config, (3) Frontend integration

**Overall Result**: ✅ ALL GATES PASSED - No constitution violations, proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/004-fastapi-frontend-integration/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── chat-api.yaml   # OpenAPI 3.0 spec for /chat endpoint
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Backend (Python FastAPI)
backend/
├── api.py               # NEW: FastAPI app with /chat endpoint and CORS
├── agent.py             # EXISTING: RAG agent from Spec 003 (unchanged)
├── main.py              # EXISTING: Qdrant ingestion script
├── pyproject.toml       # EXISTING: Poetry config (add fastapi, uvicorn)
├── .env                 # EXISTING: Environment variables
└── src/backend/
    └── __init__.py      # EXISTING: Package init

# Frontend (Docusaurus + React)
src/
├── components/
│   ├── ChatWidget/      # NEW: Global chat widget component
│   │   ├── index.tsx    # Main widget component (button + modal)
│   │   └── styles.module.css  # Scoped styles
│   └── ...              # EXISTING: Other Docusaurus components
├── pages/               # EXISTING: Docusaurus pages
└── css/                 # EXISTING: Global styles

# Root-level files
docusaurus.config.ts     # EXISTING: Docusaurus config (no changes needed)
package.json             # EXISTING: Node dependencies (no new deps needed)
```

**Structure Decision**: Web application (backend + frontend) with:
- **Backend**: Single new file `backend/api.py` wrapping existing `agent.py`
- **Frontend**: New React component `src/components/ChatWidget/` integrated via Docusaurus theme
- **Minimal Changes**: Leverages existing infrastructure; no new project setup required

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitution violations detected. All principles satisfied.
