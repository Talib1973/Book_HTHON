---
id: 002
title: Research FastAPI CORS and Integration Patterns
stage: misc
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-fastapi-frontend-integration
branch: 004-fastapi-frontend-integration
user: talib1973
command: research
labels: ["research", "fastapi", "cors", "docusaurus", "integration"]
links:
  spec: /mnt/c/Users/DELL/Desktop/Projects/Book_HTHON/specs/004-fastapi-frontend-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - /mnt/c/Users/DELL/Desktop/Projects/Book_HTHON/specs/004-fastapi-frontend-integration/research.md
tests:
 - null
---

## Prompt

Research FastAPI and CORS best practices for this integration. I need you to create a research.md file at specs/004-fastapi-frontend-integration/research.md with the following sections:

1. **FastAPI /chat Endpoint Design**:
   - Decision: How to structure POST /chat endpoint with Pydantic models
   - Rationale: Type safety, auto-docs, validation
   - Alternatives: Plain dict handling (rejected - no validation)

2. **CORS Configuration**:
   - Decision: Use fastapi.middleware.cors.CORSMiddleware with allow_origins=["http://localhost:3000", "https://book-hthon.vercel.app"]
   - Rationale: Standard FastAPI pattern, allows both dev and prod origins
   - Alternatives: Manual CORS headers (rejected - error-prone), allow_origins=["*"] (rejected - insecure)

3. **Agent Integration Pattern**:
   - Decision: Import agent module and call create_agent() + Runner.run_sync() in endpoint
   - Rationale: Reuses existing Spec 003 agent logic without duplication
   - Alternatives: Duplicate agent code in api.py (rejected - DRY violation), Use subprocess (rejected - overhead)

4. **Error Handling**:
   - Decision: Try/catch blocks with HTTPException for 400/500/503 status codes
   - Rationale: Proper HTTP semantics, client can distinguish error types
   - Alternatives: Generic 500 for all errors (rejected - poor UX)

5. **Docusaurus Global Component Integration**:
   - Decision: Create ChatWidget component in src/components/, swizzle Root wrapper to inject globally
   - Rationale: Docusaurus theme system standard pattern for global UI
   - Alternatives: Add to every page manually (rejected - not maintainable), Use script tag (rejected - not React-native)

Use web search and your knowledge to fill in technical details and code snippets where helpful. Format as Markdown with proper headings.

## Response snapshot

Successfully created comprehensive research.md file (29KB) at `/mnt/c/Users/DELL/Desktop/Projects/Book_HTHON/specs/004-fastapi-frontend-integration/research.md`.

The research document includes:

**1. FastAPI /chat Endpoint Design**
- Implementation pattern using Pydantic BaseModel for ChatRequest/ChatResponse
- Code examples showing Field validators (min_length, max_length, ge, le)
- Automatic 422 validation error handling
- Comparison with rejected alternatives (plain dict, TypedDict)
- References to FastAPI and Pydantic documentation

**2. CORS Configuration**
- CORSMiddleware setup with explicit origin whitelist
- Environment-aware configuration (dev + prod origins)
- Middleware order explanation (CORS must be first/outermost)
- Common CORS errors and fixes (preflight, credentials + wildcard)
- Security rationale against allow_origins=["*"]

**3. Agent Integration Pattern**
- Startup event pattern for one-time agent initialization
- Direct import and reuse of backend/agent.py components
- Session management with SQLiteSession
- Citation extraction from Markdown links in responses
- Performance comparison: in-process (<1ms) vs subprocess (200ms+)

**4. Error Handling**
- HTTP status code semantics table (200/400/422/500/503)
- Structured error responses with retryable flag and error_id
- Frontend error handling example in TypeScript
- Error monitoring best practices (logging, alerting)
- Try/catch patterns for different failure modes

**5. Docusaurus Global Component Integration**
- Full ChatWidget component implementation (React/TypeScript)
- Root component swizzling pattern (persistent state across navigation)
- CSS Modules styling with Docusaurus theme variables
- Environment-aware API URL detection
- Accessibility considerations (ARIA labels, keyboard navigation)

All patterns follow industry best practices from official documentation sources.

## Outcome

- ✅ Impact: Created comprehensive technical research document covering all 5 integration patterns with code examples, alternatives analysis, and best practices
- 🧪 Tests: None (research documentation only)
- 📁 Files: Created research.md (29KB) with 5 major sections
- 🔁 Next prompts: Implement FastAPI backend endpoint, Create Docusaurus ChatWidget component, Add integration tests
- 🧠 Reflection: Web search provided current best practices (2026) for FastAPI CORS, Pydantic models, and Docusaurus swizzling; existing agent.py analysis informed integration pattern recommendations

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (research phase)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Validate research findings by implementing minimal FastAPI /chat endpoint
