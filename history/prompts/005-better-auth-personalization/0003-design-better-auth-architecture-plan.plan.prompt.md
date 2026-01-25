---
id: 0003
title: Design Better Auth architecture plan
stage: plan
date: 2026-01-22
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-better-auth-personalization
branch: 005-better-auth-personalization
user: talib1973
command: /sp.plan
labels: ["architecture", "better-auth", "fastapi", "microservices", "database-design"]
links:
  spec: ../../../specs/005-better-auth-personalization/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-better-auth-personalization/plan.md
  - specs/005-better-auth-personalization/research.md
  - specs/005-better-auth-personalization/data-model.md
  - specs/005-better-auth-personalization/quickstart.md
  - specs/005-better-auth-personalization/contracts/fastapi-endpoints.yaml
  - specs/005-better-auth-personalization/contracts/better-auth-endpoints.md
  - CLAUDE.md (agent context updated)
tests:
  - Constitution Check (Phase 0 & Phase 1) - PASSED
  - Research validation (all unknowns resolved)
---

## Prompt

Set up Better Auth in the backend/ folder alongside api.py, using Neon Serverless PostgreSQL as the database
Extend the FastAPI app (api.py) to include Better Auth routes and a protected /profile endpoint that returns user background (programming experience, hardware access, learning goals)
On signup, present a form (via frontend modal) to collect user background; store it in the user metadata via Better Auth's custom fields or linked Neon table
In the existing Docusaurus frontend, add a global auth UI (login/signup buttons in navbar) using Better Auth's React SDK
Add a "Personalize Chapter" button at the top of every documentation page (via Docusaurus layout wrapper or theme override)
When clicked and user is logged in, fetch their profile from the backend and apply lightweight personalization:
• Adjust content tone (e.g., show/hide advanced notes)
• Inject contextual tips based on hardware/software background
Ensure all logic is client-side or via minimal API calls—no full page re-renders
Test locally: auth flow → profile storage → chapter personalization on any page
Keep styling consistent with existing Docusaurus UI; no layout overhaul

## Response snapshot

Executed complete planning workflow with Phase 0 research and Phase 1 design:

**Phase 0 - Research Completed**:
- Launched 3 parallel research agents (Better Auth + FastAPI, Better Auth + Docusaurus, Content Personalization)
- Discovered Better Auth is TypeScript-only → decided on microservices architecture
- Resolved session management strategy: cookie-based validation via shared Neon PostgreSQL
- Consolidated findings in comprehensive research.md (12 sections, 400+ lines)

**Phase 1 - Design Artifacts Created**:

1. **data-model.md** (5 entities):
   - Better Auth tables: user, session, account, verification (auto-generated)
   - Custom table: user_profile (learner background context)
   - Complete SQL schemas with indexes, constraints, validation rules
   - Security considerations, backup strategy, data retention policy

2. **contracts/fastapi-endpoints.yaml** (OpenAPI 3.1):
   - 3 endpoints: GET/POST/PUT /api/profile
   - Complete request/response schemas with examples
   - Error responses with codes (validation_error, unauthorized, server_error)
   - Session cookie authentication specification

3. **contracts/better-auth-endpoints.md**:
   - Better Auth API documentation (sign-up, sign-in, sign-out, session, forgot/reset password)
   - Session management lifecycle
   - CORS configuration for cross-origin auth
   - Rate limiting, error codes, testing strategies

4. **quickstart.md** (30-45 minute setup guide):
   - Step-by-step local development setup
   - Neon PostgreSQL initialization
   - Better Auth service creation (Node.js/Express)
   - FastAPI backend integration
   - Docusaurus frontend configuration
   - End-to-end testing flow
   - Troubleshooting guide

5. **plan.md** (updated):
   - Technical context (languages, dependencies, performance goals, constraints)
   - Constitution Check (all gates passed)
   - Project structure (microservices architecture)
   - Complexity tracking (justified design choices)

**Architecture Decisions**:
- **Services**: Better Auth (Node.js) + FastAPI (Python) + Docusaurus (React)
- **Database**: Shared Neon Serverless PostgreSQL
- **Session Strategy**: Cookie-based with database validation (not JWT)
- **Personalization**: Client-side DOM manipulation (no SSR)
- **Deployment**: Vercel (frontend + auth serverless), Railway (FastAPI), Neon Cloud (DB)

**Updated Agent Context**:
- Added Better Auth 1.x, Node.js 20+, TypeScript technologies
- Added asyncpg PostgreSQL client
- Updated project type: Web application (frontend + 2 backend services)

## Outcome

- ✅ Impact: Complete architecture plan ready for implementation with all design decisions documented and validated
- 🧪 Tests: Constitution Check passed (7 principles verified pre/post design), research validation (all unknowns resolved)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, 2 API contracts, CLAUDE.md updated
- 🔁 Next prompts: `/sp.tasks` to generate actionable task breakdown, or `/sp.adr` if architectural decisions require ADR documentation
- 🧠 Reflection: Microservices architecture necessary due to Better Auth TypeScript constraint; session-based auth chosen over JWT for immediate revocation capability; all complexity justified and minimal

## Evaluation notes (flywheel)

- Failure modes observed: None - all research agents completed successfully, no conflicts with constitution
- Graders run and results (PASS/FAIL): Constitution Check (Phase 0: PASS, Phase 1: PASS), Research completeness (PASS), Contract validation (OpenAPI 3.1 valid: PASS)
- Prompt variant (if applicable): Standard /sp.plan workflow with parallel research agents (haiku model for cost savings per user note)
- Next experiment (smallest change to try): Proceed to task generation (/sp.tasks) to validate design with concrete implementation steps
