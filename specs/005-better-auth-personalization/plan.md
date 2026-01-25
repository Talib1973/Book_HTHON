# Implementation Plan: Better Auth User Authentication & Chapter Personalization

**Branch**: `005-better-auth-personalization` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-better-auth-personalization/spec.md`

## Summary

Implement secure user authentication using Better Auth with email/password signup, store learner background profiles (programming experience, hardware access, learning goals) in Neon PostgreSQL, and enable client-side chapter content personalization based on user context. Architecture uses Better Auth (Node.js/Express) for authentication, FastAPI for profile API, and Docusaurus (React 19) frontend with client-side DOM manipulation for personalization.

## Technical Context

**Language/Version**: Python 3.11+ (FastAPI backend), TypeScript/Node.js 20+ (Better Auth service), TypeScript/React 19 (Docusaurus frontend)
**Primary Dependencies**: Better Auth 1.x, FastAPI 0.100+, Docusaurus 3.9.2, asyncpg (PostgreSQL client), Better Auth React SDK
**Storage**: Neon Serverless PostgreSQL (shared across Better Auth and FastAPI)
**Testing**: pytest (FastAPI), Jest (Better Auth service), manual integration tests (auth flow)
**Target Platform**: Vercel (Docusaurus + Better Auth serverless functions), Railway (FastAPI backend), Neon Cloud (database)
**Project Type**: Web application (frontend + 2 backend services)
**Performance Goals**:
  - Session validation: <100ms p95
  - Profile fetch: <200ms p95
  - Personalization apply: <2 seconds client-side
  - Support 100 concurrent users
**Constraints**:
  - Client-side personalization only (no SSR)
  - No full page re-renders
  - Work with existing Docusaurus static builds
  - Session persistence across page navigation
  - CORS cross-origin auth between frontend and backends
**Scale/Scope**:
  - Expected users: 100-500 concurrent (hackathon/educational context)
  - Database tables: 5 total (4 Better Auth + 1 custom profile)
  - Frontend pages: 2 new auth pages + navbar integration + personalization button per chapter
  - API endpoints: 3 new FastAPI endpoints (/profile GET/POST/PUT)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Phase 0)

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Technical Accuracy | Use industry-standard tools | ✅ PASS | Better Auth (industry-standard), Neon PostgreSQL (production-ready), FastAPI (ASGI standard) |
| II. Modular Architecture | Independent, reusable modules | ✅ PASS | Auth service, profile API, personalization logic all independently testable |
| III. Accessibility | Responsive design, semantic HTML | ✅ PASS | Docusaurus provides accessible foundation, auth forms use semantic HTML |
| IV. Deployment-First | Deployable to production from day one | ✅ PASS | Vercel (frontend + auth), Railway (FastAPI), Neon (database) - all cloud-native |
| V. Privacy-Respecting | Minimal data collection, transparent | ✅ PASS | Only collect learning context (spec requirement), no third-party tracking, HTTP-only cookies |
| VI. Semantic Content for RAG | Content structured for retrieval | ✅ PASS | No changes to existing content structure, personalization via DOM annotations |
| VII. Iterative Delivery | Testable vertical slices | ✅ PASS | P1: Auth + signup → P2: Personalization → P3: Profile updates (spec user stories) |

**Gate Result**: ✅ **PASSED** - Proceed to Phase 0 research

### Post-Design Check (Phase 1)

| Principle | Design Decision | Status | Notes |
|-----------|-----------------|--------|-------|
| I. Technical Accuracy | Better Auth 1.x (stable), Neon Serverless PostgreSQL, FastAPI session validation | ✅ PASS | All technologies validated via research, production-ready |
| II. Modular Architecture | Separate auth service (Better Auth) + profile API (FastAPI) + personalization (client-side) | ✅ PASS | Three independent modules, contract-based integration |
| III. Accessibility | Auth forms with labels, ARIA attributes, keyboard navigation | ✅ PASS | Custom forms use semantic HTML, tested with screen readers (planned) |
| IV. Deployment-First | Vercel serverless functions (auth), Railway (FastAPI), CI/CD-ready | ✅ PASS | All deployment targets configured, environment variables documented |
| V. Privacy-Respecting | HTTP-only cookies, no localStorage tokens, profile data never shared | ✅ PASS | Session tokens server-side only, explicit user consent for profile collection |
| VI. Semantic Content for RAG | Personalization uses HTML comments (`<!-- BEGIN: advanced-tip -->`) | ✅ PASS | Markdown annotations preserve semantic structure for RAG indexing |
| VII. Iterative Delivery | User story P1 (auth) deliverable independently from P2 (personalization) | ✅ PASS | Each priority level is independently testable and deployable |

**Gate Result**: ✅ **PASSED** - Proceed to Phase 2 (tasks)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Web application: Frontend (Docusaurus) + 2 Backend Services + Shared Database

# Better Auth Service (New)
auth-service/
├── src/
│   ├── auth.ts              # Better Auth configuration
│   └── index.ts             # Express server
├── package.json
├── tsconfig.json
└── .env                      # DATABASE_URL, BETTER_AUTH_SECRET

# FastAPI Backend (Existing + Extensions)
backend/
├── api.py                    # Main FastAPI app (extend with profile routes)
├── agent.py                  # Existing RAG agent (unchanged)
├── database.py               # NEW: PostgreSQL client for session/profile queries
├── dependencies.py           # NEW: Session validation dependency
├── routers/
│   └── profile.py            # NEW: Profile endpoints (GET/POST/PUT)
├── tests/
│   ├── test_auth.py          # NEW: Session validation tests
│   └── test_profile.py       # NEW: Profile CRUD tests
└── .env                      # DATABASE_URL, CORS_ORIGINS (extend existing)

# Docusaurus Frontend (Existing + Extensions)
src/
├── components/
│   ├── NavbarItems/
│   │   └── AuthNavbarItem.tsx       # NEW: Sign In/Out in navbar
│   ├── PersonalizeButton.tsx        # NEW: "Personalize Chapter" button
│   └── PersonalizationEngine.ts     # NEW: DOM manipulation logic
├── lib/
│   └── auth-client.ts                # NEW: Better Auth React SDK client
├── pages/
│   └── auth/
│       ├── sign-in.tsx               # NEW: Login page
│       └── sign-up.tsx               # NEW: Signup page with profile form
├── theme/
│   ├── Root.tsx                      # NEW (swizzled): Auth context provider
│   ├── NavbarItem/
│   │   └── ComponentTypes.js         # NEW: Register custom navbar item
│   └── DocItem/
│       └── Layout/
│           └── index.tsx             # NEW (swizzled): Inject personalize button
└── css/
    └── custom.css                    # Extend: Personalization styles

# Database (Neon Serverless PostgreSQL - Shared)
# Tables managed by Better Auth:
#   - user (id, email, name, emailVerified, image)
#   - session (id, userId, token, expiresAt, ipAddress, userAgent)
#   - account (id, userId, accountId, providerId, password)
#   - verification (id, identifier, value, expiresAt)
# Custom table:
#   - user_profile (id, user_id, python_experience, ros_experience,
#                   has_rtx_gpu, gpu_model, has_jetson, jetson_model,
#                   robot_type, learning_goals)
```

**Structure Decision**:

**Web application with microservices architecture**:
- **Frontend**: Existing Docusaurus site extended with auth UI and personalization
- **Auth Service**: New Node.js/Express service running Better Auth (separate process)
- **API Service**: Existing FastAPI backend extended with profile endpoints
- **Database**: Shared Neon PostgreSQL (Better Auth tables + custom user_profile)

**Rationale**:
- Better Auth is TypeScript-only → requires separate Node.js service
- FastAPI handles business logic (profile API, existing RAG chatbot)
- Both backends share same Neon PostgreSQL database for session validation
- Frontend uses Better Auth React SDK + fetch API for profile management

## Complexity Tracking

**No constitution violations detected.** All design decisions align with project principles.

### Complexity Justification (Transparency)

| Design Choice | Complexity Added | Justification |
|---------------|------------------|---------------|
| Separate Better Auth service | +1 Node.js service to deploy | Better Auth is TypeScript-only; reimplementing secure auth in Python would add more complexity and security risk |
| Shared database across services | Session validation requires cross-service queries | Alternative (JWT-only) cannot immediately revoke sessions; session-based approach aligns with educational platform needs |
| Client-side personalization | DOM manipulation + caching logic | Alternative (SSR) incompatible with Docusaurus static builds; client-side maintains deployment-first principle |

**Overall Assessment**: Complexity is minimal and necessary. Each service has a single responsibility (auth, API, frontend), following microservices best practices.
