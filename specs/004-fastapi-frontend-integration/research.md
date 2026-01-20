# Research: FastAPI and CORS Best Practices for Frontend Integration

**Feature**: 004-fastapi-frontend-integration
**Created**: 2026-01-19
**Purpose**: Technical research for integrating FastAPI backend with Next.js/Docusaurus frontend

---

## 1. FastAPI /chat Endpoint Design

### Decision
Structure POST `/chat` endpoint with Pydantic models for request/response validation.

### Rationale
- **Type Safety**: Pydantic models provide automatic type checking and validation at runtime
- **Auto-Documentation**: FastAPI generates OpenAPI/Swagger docs automatically from Pydantic schemas
- **Validation**: Input validation happens before business logic, reducing error-prone manual checks
- **Developer Experience**: IDE autocomplete and type hints improve code quality and maintainability

### Implementation Pattern

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI()

class ChatRequest(BaseModel):
    """Request model for /chat endpoint."""
    message: str = Field(..., min_length=1, max_length=2000, description="User's question")
    session_id: Optional[str] = Field(None, description="Session ID for conversation memory")
    k: int = Field(3, ge=1, le=10, description="Number of chunks to retrieve")

class Citation(BaseModel):
    """Citation metadata from retrieved chunks."""
    title: str
    url: str

class ChatResponse(BaseModel):
    """Response model for /chat endpoint."""
    response: str = Field(..., description="Agent's answer")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    session_id: str = Field(..., description="Session ID for follow-up questions")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint that processes user questions using RAG agent.

    - Validates input with Pydantic
    - Returns typed response with citations
    - Automatically documented in /docs
    """
    # Business logic here
    pass
```

### Validation Benefits
- **Automatic 422 Errors**: Invalid requests return `422 Unprocessable Entity` with detailed error messages
- **Field Constraints**: `min_length`, `max_length`, `ge` (greater/equal), `le` (less/equal) enforce data integrity
- **Optional Fields**: Type hints like `Optional[str]` make API contracts explicit

### Alternatives Considered

**Option 1: Plain Dict Handling** (Rejected)
```python
@app.post("/chat")
async def chat(data: dict):
    message = data.get("message")  # No validation!
    if not message:
        raise HTTPException(400, "Missing message")
```
- **Rejected Reason**: No automatic validation, manual error checking, no auto-docs, error-prone

**Option 2: TypedDict** (Rejected)
```python
from typing import TypedDict

class ChatRequest(TypedDict):
    message: str
```
- **Rejected Reason**: Only provides type hints for static analysis, no runtime validation

### References
- [FastAPI Request Body Documentation](https://fastapi.tiangolo.com/tutorial/body/)
- [Pydantic Models in FastAPI](https://codesignal.com/learn/courses/working-with-data-models-in-fastapi/lessons/data-modeling-with-pydantic-and-fastapi)
- [Handling POST Requests with Pydantic](https://codesignal.com/learn/courses/working-with-data-models-in-fastapi/lessons/handling-post-requests-with-pydantic-models)

---

## 2. CORS Configuration

### Decision
Use `fastapi.middleware.cors.CORSMiddleware` with explicit allowed origins:
- Development: `http://localhost:3000` (Next.js dev server)
- Production: `https://book-hthon.vercel.app` (deployed Docusaurus site)

### Rationale
- **Standard FastAPI Pattern**: CORSMiddleware is the official FastAPI approach for CORS
- **Security**: Explicit origin whitelist prevents unauthorized cross-origin requests
- **Environment-Aware**: Can conditionally add origins based on deployment (dev vs prod)
- **Flexibility**: Supports credentials, custom headers, and method restrictions

### Implementation Pattern

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Determine allowed origins based on environment
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev
    "https://book-hthon.vercel.app",  # Production frontend
]

# Add dev origins in development mode
if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.extend([
        "http://127.0.0.1:3000",
        "http://localhost:8080",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Explicit whitelist
    allow_credentials=True,  # Allow cookies/auth headers
    allow_methods=["GET", "POST", "OPTIONS"],  # Restrict to needed methods
    allow_headers=["Content-Type", "Authorization"],  # Explicit headers
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

### CORS Headers Explained
- **allow_origins**: List of origins permitted to make cross-origin requests
- **allow_credentials**: Enable sending cookies and auth headers (requires explicit origins, not `*`)
- **allow_methods**: HTTP methods allowed (default: all common methods)
- **allow_headers**: Headers clients can send (default: `*`, but explicit is better)
- **max_age**: How long browsers can cache preflight OPTIONS responses (in seconds)

### Middleware Order Matters
```python
# CORS must be added BEFORE other middleware
app.add_middleware(CORSMiddleware, ...)  # First (outermost)
app.add_middleware(GZipMiddleware, ...)  # Second
app.add_middleware(HTTPSRedirectMiddleware, ...)  # Third (innermost)
```
- Last middleware added runs first on requests
- CORS preflight checks must happen before auth/rate limiting

### Alternatives Considered

**Option 1: Manual CORS Headers** (Rejected)
```python
from fastapi import Response

@app.post("/chat")
async def chat(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return {"data": "..."}
```
- **Rejected Reason**: Error-prone, must manually handle OPTIONS preflight, easy to forget headers

**Option 2: allow_origins=["*"]** (Rejected)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # INSECURE!
    allow_credentials=True,  # INVALID COMBINATION
)
```
- **Rejected Reason**:
  - Security risk: Any website can call your API
  - Invalid when `allow_credentials=True` (browsers reject this)
  - Production anti-pattern

**Option 3: Third-Party Library (e.g., starlette-cors)** (Rejected)
- **Rejected Reason**: FastAPI already includes CORSMiddleware from Starlette, no need for extra dependencies

### Common CORS Errors

**Error 1: Preflight OPTIONS not handled**
```
Access to fetch at 'http://api.example.com/chat' from origin
'http://localhost:3000' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```
**Fix**: Ensure `allow_methods` includes `"OPTIONS"` (included by default with `["*"]`)

**Error 2: Credentials + Wildcard Origin**
```
The value of the 'Access-Control-Allow-Origin' header in the
response must not be the wildcard '*' when the request's
credentials mode is 'include'
```
**Fix**: Use explicit origins instead of `["*"]` when `allow_credentials=True`

### References
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [FastAPI CORS Middleware Configuration](https://www.stackhawk.com/blog/configuring-cors-in-fastapi/)
- [CORS Best Practices](https://davidmuraya.com/blog/fastapi-cors-configuration/)

---

## 3. Agent Integration Pattern

### Decision
Import agent module and call `create_agent()` + `Runner.run_sync()` directly in the FastAPI endpoint.

### Rationale
- **Code Reuse**: Leverages existing Spec 003 agent logic (`backend/agent.py`) without duplication
- **Simplicity**: Direct function calls are easier to debug than inter-process communication
- **Performance**: In-process calls avoid subprocess overhead (no serialization/IPC)
- **Type Safety**: Shared type definitions between CLI and API ensure consistency
- **Maintainability**: Single source of truth for agent behavior reduces bugs

### Implementation Pattern

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

# Import agent components from Spec 003
from agent import (
    create_agent,
    initialize_clients,
    validate_environment
)
from agents import Runner, SQLiteSession

app = FastAPI()

# Global state (initialized at startup)
agent = None
cohere_client = None
qdrant_client = None

@app.on_event("startup")
async def startup_event():
    """Initialize agent and clients once at startup."""
    global agent, cohere_client, qdrant_client

    try:
        # Validate environment variables
        env_vars = validate_environment()

        # Initialize clients (shared across requests)
        cohere_client, qdrant_client = initialize_clients(env_vars)

        # Create agent (reused for all requests)
        agent = create_agent()

        print("✅ Agent initialized successfully")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class Citation(BaseModel):
    title: str
    url: str

class ChatResponse(BaseModel):
    response: str
    citations: List[Citation]
    session_id: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process chat request using RAG agent.

    - Reuses agent from startup (no re-initialization)
    - Uses SQLiteSession for multi-turn conversations
    - Extracts citations from agent response
    """
    if agent is None:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized. Server may be starting up."
        )

    try:
        # Use session_id from request or create new one
        session_id = request.session_id or f"web_{os.urandom(8).hex()}"
        session = SQLiteSession(session_id)

        # Run agent synchronously (OpenAI Agents SDK doesn't support async yet)
        result = Runner.run_sync(agent, request.message, session=session)

        # Extract citations from response (parse Markdown links)
        citations = extract_citations(result.final_output)

        return ChatResponse(
            response=result.final_output,
            citations=citations,
            session_id=session_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )

def extract_citations(response_text: str) -> List[Citation]:
    """
    Extract Markdown citations from agent response.

    Example: "[ROS 2 Architecture](https://example.com/page1)"
    """
    import re
    pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
    matches = re.findall(pattern, response_text)
    return [Citation(title=title, url=url) for title, url in matches]
```

### Startup Event Pattern
- **Why `@app.on_event("startup")`?**: Initialize expensive resources (API clients, agent) once, not per request
- **Global State**: Agent and clients are reused across all requests (thread-safe since agent is stateless)
- **Graceful Degradation**: If startup fails, server won't accept requests (fail-fast)

### Session Management
```python
# Option 1: Client-provided session_id (recommended)
session_id = request.session_id or generate_session_id()

# Option 2: Server-side session storage (requires Redis/DB)
# session_id = await session_store.create_session()
```

### Alternatives Considered

**Option 1: Duplicate Agent Code in api.py** (Rejected)
```python
# api.py
def my_own_agent_logic():
    # Copy-paste from agent.py
    pass
```
- **Rejected Reason**: Violates DRY principle, creates maintenance burden, drift between CLI/API behavior

**Option 2: Subprocess Execution** (Rejected)
```python
import subprocess
result = subprocess.run(["python", "agent.py"], capture_output=True)
```
- **Rejected Reason**:
  - High overhead (new Python interpreter per request)
  - Complex IPC (stdin/stdout serialization)
  - Hard to debug and test
  - Cannot reuse sessions across requests

**Option 3: Microservices (Agent as Separate Service)** (Rejected)
- **Rejected Reason**: Over-engineering for MVP, adds network latency, requires orchestration (Docker/K8s)

### Performance Considerations
- **Startup Time**: Agent initialization takes ~2-3 seconds (Qdrant connection, model loading)
- **Request Latency**: In-process calls add minimal overhead (<1ms vs subprocess ~200ms+)
- **Concurrency**: FastAPI handles concurrent requests fine; agent calls are I/O-bound (API calls to OpenAI/Qdrant)

### References
- [FastAPI Startup Events](https://fastapi.tiangolo.com/advanced/events/)
- [OpenAI Agents SDK Runner](https://github.com/openai/openai-agents-sdk)

---

## 4. Error Handling

### Decision
Use try/catch blocks with `HTTPException` for distinct error types:
- **400 Bad Request**: Invalid user input (malformed message, missing fields)
- **500 Internal Server Error**: Unexpected failures (agent crash, DB connection lost)
- **503 Service Unavailable**: Temporary failures (agent not initialized, Qdrant down)

### Rationale
- **HTTP Semantics**: Status codes communicate error type to client (retryable vs non-retryable)
- **Client UX**: Frontend can show different messages based on status code
- **Debugging**: Structured errors make logs more actionable
- **Standards Compliance**: Follows REST API best practices

### Implementation Pattern

```python
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, ValidationError
from typing import Optional

@app.post("/chat")
async def chat(request: ChatRequest):
    # 503: Agent not ready
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Agent not initialized",
                "message": "The AI agent is starting up. Please try again in a few seconds.",
                "retryable": True
            }
        )

    try:
        # Run agent
        result = Runner.run_sync(agent, request.message, session=session)
        return ChatResponse(...)

    except ValidationError as e:
        # 400: Invalid input (Pydantic validation failed)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Invalid request",
                "message": "Your message contains invalid data.",
                "validation_errors": e.errors(),
                "retryable": False
            }
        )

    except ConnectionError as e:
        # 503: Temporary failure (Qdrant/OpenAI down)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Service temporarily unavailable",
                "message": "The knowledge base is unreachable. Please try again later.",
                "retryable": True
            }
        )

    except Exception as e:
        # 500: Unexpected error (bug in code)
        import traceback
        error_id = log_error(traceback.format_exc())  # Log to monitoring

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please contact support.",
                "error_id": error_id,  # For support to look up logs
                "retryable": False
            }
        )

def log_error(traceback: str) -> str:
    """Log error and return unique error ID."""
    import uuid
    error_id = str(uuid.uuid4())
    # Send to logging service (e.g., Sentry, CloudWatch)
    print(f"ERROR {error_id}:\n{traceback}")
    return error_id
```

### HTTP Status Code Semantics

| Code | Meaning | Client Action | Example |
|------|---------|---------------|---------|
| 200 | Success | Use response | Agent returned answer |
| 400 | Bad Request | Fix input, don't retry | Message too long |
| 422 | Unprocessable Entity | Fix validation errors | Missing required field |
| 500 | Internal Server Error | Notify user, log error | Agent crashed unexpectedly |
| 503 | Service Unavailable | Retry after delay | Qdrant connection timeout |

### Frontend Error Handling Example
```typescript
// Frontend TypeScript code
async function sendMessage(message: string) {
  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          // User error - show validation messages
          showError("Please check your input: " + error.message);
          break;
        case 500:
          // Server error - show generic message
          showError("Something went wrong. Error ID: " + error.error_id);
          break;
        case 503:
          // Temporary failure - show retry option
          showError(error.message);
          if (error.retryable) {
            setTimeout(() => sendMessage(message), 5000); // Retry after 5s
          }
          break;
      }
    }

    const data = await response.json();
    displayResponse(data);

  } catch (e) {
    // Network error
    showError("Cannot connect to server. Check your internet connection.");
  }
}
```

### Structured Error Responses
```json
{
  "error": "Service temporarily unavailable",
  "message": "The knowledge base is unreachable. Please try again later.",
  "retryable": true,
  "error_id": "a7f3d2e1-8c4b-4f5a-9d6e-1b2c3d4e5f6a"
}
```

### Alternatives Considered

**Option 1: Generic 500 for All Errors** (Rejected)
```python
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # ...
    except Exception as e:
        raise HTTPException(500, str(e))  # POOR UX
```
- **Rejected Reason**: Client can't distinguish retryable vs non-retryable errors, poor UX

**Option 2: Custom Exception Classes** (Considered, Not Needed Yet)
```python
class AgentNotReadyError(Exception):
    pass

@app.exception_handler(AgentNotReadyError)
async def handle_agent_not_ready(request, exc):
    return JSONResponse(status_code=503, content={"error": "..."})
```
- **When to Use**: If you have many custom error types, but for MVP, direct HTTPException is simpler

### Error Monitoring Best Practices
- **Log All 500s**: Send to monitoring service (Sentry, Datadog, CloudWatch)
- **Include Context**: Request ID, user session, error traceback
- **Alert on Spikes**: Set up alerts for high 5xx error rates
- **Track 4xx Trends**: High 400/422 rates may indicate UX issues

### References
- [FastAPI Error Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [HTTPException Usage](https://codesignal.com/learn/courses/status-codes-and-error-handling-with-fastapi/lessons/using-httpexception-for-error-handling)
- [FastAPI Exception Handling Best Practices](https://betterstack.com/community/guides/scaling-python/error-handling-fastapi/)

---

## 5. Docusaurus Global Component Integration

### Decision
Create `ChatWidget` component in `src/components/`, then swizzle the `Root` wrapper to inject the widget globally across all pages.

### Rationale
- **Docusaurus Standard Pattern**: `Root` component is the official way to add global UI elements
- **Persistent State**: `Root` never unmounts, perfect for chat widget that maintains conversation history across page navigation
- **Non-Intrusive**: Widget is available on all pages without modifying individual page layouts
- **Theme-Aware**: Can access Docusaurus theme context (dark mode, colors)

### Implementation Pattern

#### Step 1: Create ChatWidget Component
```typescript
// src/components/ChatWidget/index.tsx
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface Citation {
  title: string;
  url: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export default function ChatWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to UI
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Determine API URL based on environment
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-api.fly.dev/chat'  // Production API
        : 'http://localhost:8000/chat';    // Local dev

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get response');
      }

      const data = await response.json();

      // Save session ID for follow-up questions
      setSessionId(data.session_id);

      // Add assistant response to UI
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        citations: data.citations
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatWidget}>
      {/* Floating button */}
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <h3>Robotics Tutor</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              <div key={idx} className={styles[msg.role]}>
                <div className={styles.messageContent}>{msg.content}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className={styles.citations}>
                    <strong>Sources:</strong>
                    {msg.citations.map((cite, i) => (
                      <a key={i} href={cite.url} target="_blank" rel="noopener">
                        {cite.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className={styles.loading}>Thinking...</div>}
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about robotics..."
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 2: Swizzle Root Component
```bash
# Create Root wrapper manually (safer than CLI swizzle)
mkdir -p src/theme
touch src/theme/Root.tsx
```

```typescript
// src/theme/Root.tsx
import React from 'react';
import ChatWidget from '@site/src/components/ChatWidget';

export default function Root({ children }): JSX.Element {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

### Why Root Component?
- **Rendered at Top of React Tree**: Above `<Layout>`, never unmounts during navigation
- **Perfect for Persistent State**: Chat history survives page navigation
- **Preferred Over DocPage**: DocPage re-renders on route changes, Root does not

### Styling (CSS Modules)
```css
/* src/components/ChatWidget/styles.module.css */
.chatWidget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.toggleButton {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--ifm-color-primary);
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.toggleButton:hover {
  transform: scale(1.1);
}

.chatWindow {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: var(--ifm-background-color);
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--ifm-color-emphasis-300);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.user {
  text-align: right;
  margin-bottom: 12px;
}

.assistant {
  text-align: left;
  margin-bottom: 12px;
}

.citations {
  margin-top: 8px;
  font-size: 0.9em;
  color: var(--ifm-color-primary);
}

.inputArea {
  display: flex;
  padding: 16px;
  border-top: 1px solid var(--ifm-color-emphasis-300);
}

.inputArea input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: 4px;
  margin-right: 8px;
}
```

### Alternatives Considered

**Option 1: Add to Every Page Manually** (Rejected)
```markdown
<!-- docs/intro.md -->
import ChatWidget from '@site/src/components/ChatWidget';

# Introduction

<ChatWidget />
```
- **Rejected Reason**: Not maintainable, must add to every MDX file, chat state resets on navigation

**Option 2: Use Script Tag in HTML Template** (Rejected)
```html
<!-- docusaurus.config.js -->
module.exports = {
  scripts: [
    { src: '/chat-widget.js' }
  ]
}
```
- **Rejected Reason**: Not React-native, can't use Docusaurus theme context, harder to integrate with state

**Option 3: Swizzle DocPage** (Rejected)
```typescript
// src/theme/DocPage/index.tsx
import ChatWidget from '@site/src/components/ChatWidget';

export default function DocPage(props) {
  return (
    <>
      <OriginalDocPage {...props} />
      <ChatWidget />
    </>
  );
}
```
- **Rejected Reason**: DocPage re-mounts on navigation, chat state would reset

### Environment-Aware API URL
```typescript
// Detect deployment environment
const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'book-hthon.vercel.app'
  ? 'https://your-api.fly.dev/chat'  // Production
  : 'http://localhost:8000/chat';    // Development
```

### Accessibility Considerations
- **Keyboard Navigation**: Ensure Enter key sends message, Escape closes chat
- **ARIA Labels**: Add `aria-label` to buttons for screen readers
- **Focus Management**: Focus input when chat opens
- **Color Contrast**: Use Docusaurus theme variables for consistent colors

### References
- [Docusaurus Swizzling Documentation](https://docusaurus.io/docs/swizzling)
- [Root Component for Global Providers](https://github.com/facebook/docusaurus/discussions/9923)
- [Custom React Components in Docusaurus](https://docusaurus.io/docs/markdown-features/react)

---

## Summary

This research document provides the technical foundation for integrating the FastAPI backend with the Next.js/Docusaurus frontend:

1. **Pydantic Models**: Type-safe request/response handling with automatic validation
2. **CORS Middleware**: Secure cross-origin requests with explicit origin whitelist
3. **Agent Integration**: Direct module imports reuse existing code without duplication
4. **Error Handling**: HTTP status codes provide clear client feedback (400/500/503)
5. **Global Chat Widget**: Root component swizzling enables persistent chat across all pages

All patterns follow industry best practices and leverage each framework's native capabilities.

---

## Sources

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [FastAPI CORS Configuration Best Practices](https://www.stackhawk.com/blog/configuring-cors-in-fastapi/)
- [Blocked by CORS in FastAPI? Here's How to Fix It](https://davidmuraya.com/blog/fastapi-cors-configuration/)
- [Pydantic Models in FastAPI](https://codesignal.com/learn/courses/working-with-data-models-in-fastapi/lessons/data-modeling-with-pydantic-and-fastapi)
- [Handling POST Requests with Pydantic](https://codesignal.com/learn/courses/working-with-data-models-in-fastapi/lessons/handling-post-requests-with-pydantic-models)
- [FastAPI Error Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [FastAPI Error Handling Best Practices](https://betterstack.com/community/guides/scaling-python/error-handling-fastapi/)
- [HTTPException Usage](https://codesignal.com/learn/courses/status-codes-and-error-handling-with-fastapi/lessons/using-httpexception-for-error-handling)
- [Docusaurus Swizzling Documentation](https://docusaurus.io/docs/swizzling)
- [Swizzle with Context Provider Discussion](https://github.com/facebook/docusaurus/discussions/9923)
