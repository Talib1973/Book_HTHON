# Feature Specification: FastAPI-Docusaurus Integration for RAG Chatbot

**Feature Branch**: `004-fastapi-frontend-integration`
**Created**: 2026-01-19
**Status**: Draft
**Input**: User description: "Integrate RAG chatbot backend with Vercel-hosted Docusaurus frontend via FastAPI - Target audience: Full-stack developers connecting AI backend to a live Vercel site - Focus: Enable the frontend at https://book-hthon.vercel.app/ to communicate with a local FastAPI RAG agent during development"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Local FastAPI Chat Endpoint (Priority: P1)

As a full-stack developer, I need a local FastAPI server that exposes a `/chat` endpoint so that I can test the RAG agent through HTTP requests before deploying to production.

**Why this priority**: This is the foundational capability - a working HTTP interface to the RAG agent. Without this, no frontend integration is possible. It represents the minimum viable API that demonstrates the agent's accessibility over HTTP.

**Independent Test**: Can be fully tested by running the FastAPI server locally and sending a POST request to `http://localhost:8000/chat` with JSON payload `{"message": "What is ROS 2?"}`, then verifying it returns a JSON response with `{"response": "...", "sources": [...]}` structure.

**Acceptance Scenarios**:

1. **Given** the FastAPI server is running on port 8000, **When** I send a POST request to `/chat` with `{"message": "What is ROS 2?"}`, **Then** I receive a JSON response with `response` field containing the agent's answer and `sources` array with citation data
2. **Given** the FastAPI server is running, **When** I send a POST request with `{"message": "Explain VLA", "context": "selected textbook paragraph"}`, **Then** the agent uses both the message and optional context to generate a more targeted response
3. **Given** the agent retrieves information from the textbook, **When** the response is returned, **Then** each source in the `sources` array includes `title` (page title) and `url` (textbook page URL)
4. **Given** the agent cannot find relevant information, **When** responding, **Then** the response field indicates the topic is not covered and the sources array is empty
5. **Given** the FastAPI server encounters an error, **When** processing a request, **Then** it returns an appropriate HTTP error status (400/500) with a JSON error message

---

### User Story 2 - CORS Configuration for Local Development (Priority: P2)

As a full-stack developer, I need the FastAPI server to accept requests from my local Docusaurus dev server (port 3000) so that I can test the full integration without CORS errors.

**Why this priority**: While the API endpoint (P1) provides core functionality, CORS configuration is essential for frontend integration. Without it, browser-based requests from Docusaurus will fail, blocking full-stack testing.

**Independent Test**: Can be tested by running both the FastAPI server (port 8000) and Docusaurus dev server (port 3000), then making a fetch request from the browser console to `http://localhost:8000/chat` and verifying no CORS errors appear in the browser's network inspector.

**Acceptance Scenarios**:

1. **Given** both servers are running, **When** the Docusaurus frontend makes a fetch request to `http://localhost:8000/chat`, **Then** the request succeeds without CORS errors in the browser console
2. **Given** a request originates from `http://localhost:3000`, **When** the FastAPI server processes it, **Then** it includes appropriate CORS headers (`Access-Control-Allow-Origin`) in the response
3. **Given** a preflight OPTIONS request is sent from the browser, **When** the FastAPI server receives it, **Then** it responds with allowed methods (POST, OPTIONS) and headers
4. **Given** the CORS middleware is configured, **When** I inspect the FastAPI startup logs, **Then** I can confirm CORS is enabled for `http://localhost:3000`

---

### User Story 3 - Frontend Fetch Example in Docusaurus (Priority: P3)

As a full-stack developer, I need a minimal working example of a fetch call in the Docusaurus codebase so that I can demonstrate the end-to-end integration and understand how to build the full chat UI later.

**Why this priority**: This provides proof-of-concept integration code but relies on both the API endpoint (P1) and CORS setup (P2). It's essential for demonstrating functionality but doesn't need to be production-ready - a simple button with console logging is sufficient for the demo.

**Independent Test**: Can be tested by clicking a button on the Docusaurus site, verifying the fetch request appears in the browser's network tab, and confirming the agent's response is logged to the browser console.

**Acceptance Scenarios**:

1. **Given** the Docusaurus site is running locally, **When** I click the "Ask Question" demo button, **Then** a fetch request is sent to `http://localhost:8000/chat` with a hardcoded test question
2. **Given** the fetch request succeeds, **When** the response is received, **Then** the response JSON is logged to the browser console with both `response` and `sources` fields visible
3. **Given** the fetch example code exists in the Docusaurus codebase, **When** I inspect the code, **Then** it demonstrates proper error handling with try/catch and displays errors in the console
4. **Given** the Vercel-hosted site is accessed, **When** I view the published book at https://book-hthon.vercel.app/, **Then** the book content is visible and functional (note: chat integration is local-only for this spec)

---

### Edge Cases

- What happens when the FastAPI server is not running? (Frontend should handle fetch errors gracefully with console logging, not crash the page)
- How does the system handle malformed JSON in requests? (FastAPI should validate request body and return 400 with error details)
- What happens when the RAG agent times out? (FastAPI should implement a reasonable timeout and return 504 Gateway Timeout with helpful error message)
- How does the agent handle empty or whitespace-only messages? (API should validate and return 400 error indicating message cannot be empty)
- What happens when Qdrant is unavailable during a chat request? (Agent should catch the error and FastAPI should return 503 Service Unavailable with context about the retrieval system)
- How does CORS behave if a request comes from a different origin than localhost:3000? (Request should be blocked with CORS error for security)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: FastAPI server MUST run on port 8000 and expose a `/chat` POST endpoint
- **FR-002**: `/chat` endpoint MUST accept JSON requests with structure: `{"message": "string", "context": "optional string"}`
- **FR-003**: `/chat` endpoint MUST return JSON responses with structure: `{"response": "string", "sources": [{"title": "string", "url": "string"}]}`
- **FR-004**: FastAPI server MUST integrate with the existing RAG agent from Spec 003 (backend/agent.py) without duplicating retrieval logic
- **FR-005**: FastAPI server MUST configure CORS middleware to allow requests from `http://localhost:3000` (Docusaurus dev server)
- **FR-006**: CORS configuration MUST allow POST and OPTIONS methods and appropriate headers (Content-Type, Authorization)
- **FR-007**: API MUST validate request body and return 400 Bad Request with error details if validation fails (e.g., missing message field)
- **FR-008**: API MUST handle agent errors gracefully and return appropriate HTTP status codes (500 for internal errors, 503 for service unavailability)
- **FR-009**: FastAPI implementation MUST reside in `backend/main.py` using fastapi and uvicorn dependencies
- **FR-010**: Docusaurus codebase MUST include a minimal fetch example that demonstrates calling the `/chat` endpoint and logging the response to console
- **FR-011**: Fetch example MUST include error handling (try/catch) to handle network errors and log them appropriately
- **FR-012**: API MUST use environment variables for configuration (Qdrant credentials, OpenAI/Cohere API keys) via python-dotenv or equivalent
- **FR-013**: Server MUST be runnable with a simple command (e.g., `uvicorn backend.main:app --reload --port 8000`) documented in a README or startup script

### Key Entities

- **ChatRequest**: Incoming HTTP request payload containing user message and optional selected text context
- **ChatResponse**: Outgoing HTTP response containing the agent's generated response and array of source citations
- **Source**: Citation metadata included in the response, with title (page title) and url (textbook page URL)
- **FastAPIApp**: The FastAPI application instance configured with CORS, routes, and integration with the RAG agent

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can start the FastAPI server and receive a chat response in under 15 seconds per query (including agent processing time)
- **SC-002**: 100% of successful chat requests return JSON with both `response` and `sources` fields populated correctly
- **SC-003**: CORS configuration allows requests from `http://localhost:3000` with zero browser console CORS errors during testing
- **SC-004**: Fetch example code in Docusaurus successfully calls the API and logs responses to console in 100% of test scenarios when both servers are running
- **SC-005**: FastAPI returns appropriate HTTP status codes for all error scenarios (400 for bad requests, 500 for internal errors, 503 for service unavailability)
- **SC-006**: Developer can demonstrate end-to-end local integration (Docusaurus → FastAPI → RAG agent → response) with minimal setup (under 5 minutes after dependencies are installed)
- **SC-007**: Published Vercel site at https://book-hthon.vercel.app/ displays the textbook content correctly (chat integration is local-only for this spec)

## Assumptions *(mandatory)*

- Docusaurus site structure is already established and deployed to Vercel (https://book-hthon.vercel.app/)
- RAG agent from Spec 003 (backend/agent.py) is functional and can be imported/invoked programmatically
- Qdrant vector store from Spec 001 is accessible and contains the textbook embeddings
- Developer has Python 3.11+ installed and can install dependencies via pip/poetry
- Developer has Node.js installed for running Docusaurus locally (port 3000)
- No production deployment of FastAPI is required in this spec (post-hackathon work)
- No persistent conversation history or user authentication is required for the demo
- Network latency between local Docusaurus and local FastAPI is negligible

## Dependencies *(mandatory)*

- **Spec 001 (RAG Pipeline)**: Requires Qdrant vector store with textbook embeddings to be operational
- **Spec 003 (RAG Agent)**: Requires functional RAG agent implementation in backend/agent.py that can be invoked programmatically
- **External Services**: Requires OpenAI API, Cohere API, and Qdrant Cloud to be accessible during local testing
- **Development Environment**: Requires Python 3.11+, pip/poetry, Node.js for Docusaurus
- **Python Dependencies**: fastapi, uvicorn, python-dotenv, plus all dependencies from Spec 003 (OpenAI Agents SDK, cohere, qdrant-client)
- **Vercel Deployment**: Docusaurus site must remain deployed and accessible at https://book-hthon.vercel.app/ (no changes to production required for this spec)

## Out of Scope *(mandatory)*

- Production deployment of FastAPI backend to cloud platforms (Railway, Render, Vercel Functions, etc.)
- Full-featured chat UI widget with message history, typing indicators, or markdown rendering
- WebSocket support for real-time streaming responses
- Persistent conversation history across sessions or browser refreshes
- User authentication, rate limiting, or API key management
- CORS configuration for origins other than localhost:3000 (production CORS handled post-hackathon)
- Integration testing or CI/CD pipelines for the API
- Performance optimization or caching of agent responses
- Changes to the Vercel production site (https://book-hthon.vercel.app/) during this spec - only local development integration required
- Mobile responsiveness or accessibility improvements to the fetch example
