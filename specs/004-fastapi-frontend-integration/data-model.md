# Data Model: FastAPI-Docusaurus Integration

**Feature**: 004-fastapi-frontend-integration
**Created**: 2026-01-19
**Status**: Design Phase

## Overview

This document defines the data structures exchanged between the Docusaurus frontend and FastAPI backend for the RAG chatbot integration. All models follow REST API best practices with typed request/response schemas validated by Pydantic (backend) and TypeScript (frontend).

---

## Backend Data Models (Python/Pydantic)

### ChatRequest

**Purpose**: Incoming POST request body for `/chat` endpoint

**Fields**:
- `message` (str, required): User's question or query
  - Validation: 1-2000 characters, non-empty after strip
  - Example: `"What is ROS 2?"`
- `context` (str | None, optional): Selected text from textbook page for context-aware answers
  - Validation: 0-5000 characters if provided
  - Example: `"ROS 2 is the second generation of the Robot Operating System..."`
  - Default: `None`

**Pydantic Model**:
```python
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's question"
    )
    context: str | None = Field(
        None,
        max_length=5000,
        description="Optional selected text for context"
    )
```

**JSON Example**:
```json
{
  "message": "Explain VLA architecture",
  "context": "Vision-Language-Action models combine visual perception with language understanding..."
}
```

---

### Citation

**Purpose**: Source reference for textbook content used in agent response

**Fields**:
- `title` (str, required): Page title from textbook metadata
  - Example: `"ROS 2 Architecture"`
- `url` (str, required): Full HTTPS URL to textbook page
  - Example: `"https://book-hthon.vercel.app/docs/module1/week2"`

**Pydantic Model**:
```python
class Citation(BaseModel):
    title: str = Field(..., description="Textbook page title")
    url: str = Field(..., description="Full URL to source page")
```

**JSON Example**:
```json
{
  "title": "ROS 2 Publisher-Subscriber Pattern",
  "url": "https://book-hthon.vercel.app/docs/module1/week2"
}
```

---

### ChatResponse

**Purpose**: Outgoing response from `/chat` endpoint with agent answer and citations

**Fields**:
- `response` (str, required): Agent's generated answer grounded in retrieved textbook content
  - Validation: 1-10000 characters
  - Format: Plain text with Markdown links for citations
  - Example: `"ROS 2 uses DDS for communication [ROS 2 Architecture](https://...)"`
- `sources` (list[Citation], required): Array of citations for content used in response
  - Validation: 0-10 citations
  - Empty array if no relevant content found or agent uses no sources

**Pydantic Model**:
```python
class ChatResponse(BaseModel):
    response: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Agent's answer with citations"
    )
    sources: list[Citation] = Field(
        default_factory=list,
        max_length=10,
        description="Citations for content used"
    )
```

**JSON Example (Successful Response)**:
```json
{
  "response": "ROS 2 (Robot Operating System 2) is the second generation of ROS, designed for production robotics with improved security, real-time capabilities, and multi-platform support. It uses DDS for communication.\n\nKey improvements over ROS 1:\n- Real-time performance\n- Better security model\n- Multi-robot coordination\n\nSource: [ROS 2 Overview](https://book-hthon.vercel.app/docs/module1/week1)",
  "sources": [
    {
      "title": "ROS 2 Overview",
      "url": "https://book-hthon.vercel.app/docs/module1/week1"
    },
    {
      "title": "ROS 2 Architecture",
      "url": "https://book-hthon.vercel.app/docs/module1/week2"
    }
  ]
}
```

**JSON Example (No Relevant Content)**:
```json
{
  "response": "I couldn't find information about quantum entanglement in robotics in the textbook. This topic might not be covered. Try asking about ROS 2, Digital Twins, NVIDIA Isaac, or VLA models instead.",
  "sources": []
}
```

---

### ErrorResponse

**Purpose**: HTTP error response body for 400/500/503 status codes

**Fields**:
- `error` (str, required): Error category/type for client-side handling
  - Values: `"validation_error"`, `"server_error"`, `"service_unavailable"`
- `message` (str, required): Human-readable error description
  - Example: `"Message field cannot be empty"`
- `retryable` (bool, required): Whether client should retry the request
  - `true` for 503 errors (temporary failures)
  - `false` for 400/500 errors (permanent failures)
- `error_id` (str | None, optional): Unique identifier for support lookup
  - Format: UUID v4
  - Example: `"a3f8c12d-4b2e-4d1c-9a7f-3c5e8b9d2f1a"`

**Pydantic Model**:
```python
from pydantic import BaseModel, Field
from typing import Literal

class ErrorResponse(BaseModel):
    error: Literal["validation_error", "server_error", "service_unavailable"]
    message: str
    retryable: bool
    error_id: str | None = None
```

**JSON Example (400 Bad Request)**:
```json
{
  "error": "validation_error",
  "message": "Message field cannot be empty or whitespace only",
  "retryable": false,
  "error_id": null
}
```

**JSON Example (503 Service Unavailable)**:
```json
{
  "error": "service_unavailable",
  "message": "Unable to connect to Qdrant vector database. Please try again in a moment.",
  "retryable": true,
  "error_id": "f7d3c12a-8b1e-4f2c-9d6e-2a5b7c8e1d3f"
}
```

---

## Frontend Data Models (TypeScript)

### TypeScript Interfaces

**Purpose**: Type-safe API contract for Docusaurus React components

```typescript
// src/types/chat.ts

export interface ChatRequest {
  message: string;         // 1-2000 chars
  context?: string | null; // Optional selected text
}

export interface Citation {
  title: string;          // Page title
  url: string;            // Full HTTPS URL
}

export interface ChatResponse {
  response: string;       // Agent's answer (1-10000 chars)
  sources: Citation[];    // 0-10 citations
}

export interface ErrorResponse {
  error: "validation_error" | "server_error" | "service_unavailable";
  message: string;
  retryable: boolean;
  error_id?: string | null;
}
```

**Usage Example**:
```typescript
async function sendChatMessage(request: ChatRequest): Promise<ChatResponse | ErrorResponse> {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return await response.json() as ErrorResponse;
  }

  return await response.json() as ChatResponse;
}
```

---

## State Transitions

### Chat Request Flow

```
User Input → ChatRequest → FastAPI Validation → Agent Processing → ChatResponse → UI Display
     ↓                            ↓                     ↓
  Empty?                    Invalid?            Qdrant down?
     ↓                            ↓                     ↓
400 Error                   422 Error            503 Error
```

**State Diagram**:
1. **Idle**: User viewing textbook, chat widget closed
2. **Composing**: User types message in input field
3. **Sending**: POST request in flight to backend
4. **Processing**: Backend running agent retrieval + generation
5. **Success**: Response displayed with sources
6. **Error**: Error message displayed (retryable or permanent)
7. **Retrying** (if retryable=true): Automatic retry after 2s delay

---

## Validation Rules

### Backend Validation (Pydantic)

| Field | Rule | HTTP Status on Violation |
|-------|------|-------------------------|
| `message` | 1-2000 chars, non-empty | 422 Unprocessable Entity |
| `context` | 0-5000 chars if provided | 422 Unprocessable Entity |
| Request Content-Type | Must be `application/json` | 415 Unsupported Media Type |
| Request body size | Max 10KB | 413 Payload Too Large |

### Frontend Validation (TypeScript)

| Field | Rule | UI Feedback |
|-------|------|-------------|
| `message` | 1-2000 chars, non-empty | Disable send button + error text |
| `context` | 0-5000 chars | Truncate with warning |
| Response timeout | 30 seconds max | Show timeout error + retry button |

---

## Relationships

### Entity Relationship

```
ChatRequest (1) ──sends──> (1) ChatResponse
                                    │
                                    │ contains
                                    ↓
                                Citation (0..10)
```

**Dependencies**:
- `ChatResponse.sources`: Array of 0-10 `Citation` objects
- Each `Citation` references a textbook page in Docusaurus (external entity)
- `ChatRequest.context`: Optional reference to textbook content (string copy, not entity reference)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Docusaurus Frontend                       │
│                                                                 │
│  User Input (text area) ──> ChatRequest                        │
│                                │                                │
│                                ↓                                │
│                         POST /chat (JSON)                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP (CORS enabled)
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                         │
│                                                                 │
│  CORSMiddleware ──> Pydantic Validation ──> /chat Endpoint     │
│                              │                                  │
│                              ↓                                  │
│                    create_agent() + Runner.run_sync()          │
│                              │                                  │
│                              ↓                                  │
│                 retrieve_textbook_content() tool               │
│                 (Cohere embedding + Qdrant search)             │
│                              │                                  │
│                              ↓                                  │
│                    ChatResponse (JSON) ──> Client              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Docusaurus Frontend                       │
│                                                                 │
│  Parse ChatResponse ──> Display response + citations           │
│                                                                 │
│  Citations rendered as clickable links to textbook pages       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notes

### Design Decisions

1. **Pydantic over dataclasses**: Automatic validation, JSON schema generation for OpenAPI docs
2. **Flat structure**: No nested objects beyond `sources` array (simplifies serialization)
3. **Nullable context**: Optional field allows simple queries without selected text
4. **Citation array**: Separates sources from response text for flexible UI rendering (inline links, footer, sidebar)
5. **Error structure**: Consistent across all error types (400/500/503) for unified client handling

### Future Extensions (Out of Scope)

- **Session IDs**: Not included (stateless API per spec requirement)
- **Message history**: Frontend-only state (not persisted to backend)
- **Rate limiting**: Not implemented (local dev only)
- **Streaming responses**: Not supported (simple request/response for MVP)

---

**Last Updated**: 2026-01-19
**Related Files**:
- Backend implementation: `backend/api.py`
- Frontend types: `src/types/chat.ts`
- API contract: `specs/004-fastapi-frontend-integration/contracts/chat-api.yaml`
