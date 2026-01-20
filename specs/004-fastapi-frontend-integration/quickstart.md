# Quickstart Guide: FastAPI-Docusaurus Integration

**Feature**: 004-fastapi-frontend-integration
**Estimated Setup Time**: 5 minutes (after dependencies installed)
**Prerequisites**: Python 3.11+, Node.js 20+, uv package manager

---

## Overview

This guide walks you through setting up and testing the end-to-end integration between:
- **Docusaurus frontend** (http://localhost:3000) - Interactive textbook
- **FastAPI backend** (http://localhost:8000) - RAG agent API

**Goal**: Ask a question in the chat widget and see a grounded response with textbook citations.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] `uv` package manager installed ([docs](https://github.com/astral-sh/uv))
- [ ] Environment variables configured in `backend/.env`:
  - `OPENAI_API_KEY` (OpenAI API key)
  - `COHERE_API_KEY` (Cohere API key)
  - `QDRANT_URL` (Qdrant Cloud cluster URL)
  - `QDRANT_API_KEY` (Qdrant API key)
- [ ] Qdrant collection `robotics_textbook` populated (run Spec 001 ingestion if needed)

---

## Step 1: Start the FastAPI Backend

### 1.1 Navigate to Backend Directory

```bash
cd backend
```

### 1.2 Install Dependencies (if not already done)

```bash
uv pip install fastapi uvicorn python-dotenv
```

### 1.3 Start the Server

```bash
uv run python api.py
```

**Expected Output**:
```
✅ Connected to Qdrant collection 'robotics_textbook' (1234 vectors)
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Troubleshooting**:
- **Port already in use**: Stop other processes using port 8000 or change `port` in `api.py`
- **Qdrant connection error**: Verify `QDRANT_URL` and `QDRANT_API_KEY` in `.env`
- **Missing environment variables**: Check that all required vars are set in `backend/.env`

### 1.4 Test the Endpoint (Optional)

Open a new terminal and test with `curl`:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ROS 2?"}'
```

**Expected Response**:
```json
{
  "response": "ROS 2 (Robot Operating System 2) is...",
  "sources": [
    {
      "title": "ROS 2 Overview",
      "url": "https://book-hthon.vercel.app/docs/module1/week1"
    }
  ]
}
```

---

## Step 2: Start the Docusaurus Frontend

### 2.1 Navigate to Project Root

```bash
cd ..  # Back to project root (Book_HTHON/)
```

### 2.2 Install Dependencies (if not already done)

```bash
npm install
```

### 2.3 Start the Development Server

```bash
npm start
```

**Expected Output**:
```
[INFO] Starting the development server...
[SUCCESS] Docusaurus website is running at: http://localhost:3000/

✔ Client
  Compiled successfully in 2.34s
```

**Troubleshooting**:
- **Port 3000 in use**: Docusaurus will auto-select port 3001
- **Build errors**: Run `npm run clear` then `npm start` again
- **Missing ChatWidget**: Ensure `src/components/ChatWidget/index.tsx` exists

### 2.4 Open in Browser

Navigate to: **http://localhost:3000**

---

## Step 3: Test the Chat Widget

### 3.1 Locate the Chat Widget

Look for a floating chat button in the bottom-right corner of any textbook page.

- **Button**: Blue circle with chat icon
- **Position**: Fixed position, visible on all pages

### 3.2 Open the Chat Modal

Click the floating button to open the chat interface.

**Expected UI**:
- Modal overlay with semi-transparent background
- Chat input field at the bottom
- Empty messages area (first time)
- Close button (X) in top-right corner

### 3.3 Send a Test Question

Type a question in the input field:

```
What is ROS 2?
```

Press **Enter** or click **Send**.

**Expected Behavior**:
1. Input field shows "Thinking..." loading state
2. After 5-15 seconds, agent response appears in messages area
3. Response includes inline Markdown links to textbook pages
4. Citations listed below response with clickable URLs

**Example Response**:
```
ROS 2 (Robot Operating System 2) is the second generation of ROS,
designed for production robotics with improved security, real-time
capabilities, and multi-platform support.

Sources:
• ROS 2 Overview (https://book-hthon.vercel.app/docs/module1/week1)
• ROS 2 Architecture (https://book-hthon.vercel.app/docs/module1/week2)
```

### 3.4 Test Context-Aware Query (Optional)

Select some text from a textbook page, then open the chat widget. The selected text should appear in the "Context" field.

Ask a follow-up question:
```
Explain this in simpler terms
```

The agent should use the selected text as context for a more targeted answer.

---

## Step 4: Verify CORS Configuration

### 4.1 Check Browser Console (DevTools)

Open browser DevTools (F12) and go to **Console** tab.

**Expected**: No CORS errors. All fetch requests should succeed with status 200.

**If you see CORS errors**:
```
Access to fetch at 'http://localhost:8000/chat' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Fix**: Verify `backend/api.py` includes both origins in `CORSMiddleware`:
```python
allow_origins=["http://localhost:3000", "https://book-hthon.vercel.app"]
```

### 4.2 Check Network Tab (DevTools)

Go to **Network** tab in DevTools and send a chat message.

**Expected Requests**:
1. **OPTIONS /chat** (preflight) - Status: 200
2. **POST /chat** - Status: 200, Response time: 5-15s

**Response Headers** (check POST /chat response):
- `access-control-allow-origin: http://localhost:3000`
- `content-type: application/json`

---

## Step 5: Test Error Scenarios

### 5.1 Test Empty Message

Try sending an empty message (just whitespace).

**Expected**: Input validation prevents submission, or backend returns 400 error with message:
```json
{
  "error": "validation_error",
  "message": "Message field cannot be empty or whitespace only",
  "retryable": false
}
```

### 5.2 Test Backend Offline

1. Stop the FastAPI server (CTRL+C in backend terminal)
2. Try sending a chat message in the frontend

**Expected**: Fetch error caught by frontend, displays error message:
```
Unable to connect to the chatbot. Please ensure the backend server is running.
```

### 5.3 Test Qdrant Unavailable (Simulated)

Temporarily set incorrect `QDRANT_URL` in `backend/.env`, restart backend, and send a message.

**Expected**: Backend returns 503 error:
```json
{
  "error": "service_unavailable",
  "message": "Unable to connect to Qdrant vector database. Please try again in a moment.",
  "retryable": true,
  "error_id": "..."
}
```

Frontend should display retry button or auto-retry after 2 seconds.

---

## Common Issues & Solutions

### Issue: "EADDRINUSE: address already in use :::8000"

**Cause**: Another process is using port 8000

**Solution**: Find and stop the process:
```bash
# macOS/Linux
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Or change the port in `backend/api.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed to 8001
```

Then update frontend API URL in `ChatWidget/index.tsx`:
```typescript
const API_URL = "http://localhost:8001/chat";
```

---

### Issue: "Collection 'robotics_textbook' not found"

**Cause**: Qdrant collection hasn't been created yet

**Solution**: Run Spec 001 ingestion script:
```bash
cd backend
uv run python main.py
```

Wait for ingestion to complete (may take 5-10 minutes for full textbook).

---

### Issue: Chat widget not visible on frontend

**Cause**: Component not properly integrated into Docusaurus theme

**Solution**: Verify `src/theme/Root.tsx` exists and wraps children with `ChatWidget`:
```tsx
import ChatWidget from '../components/ChatWidget';

export default function Root({ children }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

If file doesn't exist, create it by swizzling:
```bash
npm run swizzle @docusaurus/theme-classic Root -- --wrap
```

Then add `<ChatWidget />` as shown above.

---

### Issue: Agent responses take >30 seconds

**Cause**: OpenAI API rate limits or slow Qdrant queries

**Solution**:
1. Check OpenAI usage limits at https://platform.openai.com/usage
2. Upgrade Qdrant cluster to paid tier for better performance
3. Reduce `k` parameter in `retrieve_textbook_content()` (default: 3 → 2)

---

## Next Steps

After completing this quickstart:

1. **Customize Chat UI**: Edit `src/components/ChatWidget/styles.module.css` to match your brand
2. **Add More Test Questions**: Try domain-specific queries (ROS 2, Isaac Sim, VLA models)
3. **Deploy Frontend**: Push changes to GitHub to trigger Vercel deployment
4. **Monitor Logs**: Check backend terminal for agent processing details
5. **Read Implementation**: Review `backend/api.py` and `src/components/ChatWidget/index.tsx` code

---

## Verification Checklist

Before moving to production tasks, verify all features work:

- [ ] FastAPI server starts without errors
- [ ] Backend responds to `/chat` POST requests with valid JSON
- [ ] CORS allows requests from both localhost:3000 and Vercel URL
- [ ] Chat widget appears on all Docusaurus pages
- [ ] Sending a question returns agent response with citations
- [ ] Citations are clickable and navigate to correct textbook pages
- [ ] Error handling works (empty message, backend offline)
- [ ] Chat history persists during navigation (single-page app behavior)
- [ ] Widget respects Docusaurus dark mode (if applicable)
- [ ] No console errors in browser DevTools

---

## Architecture Diagram (Reference)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Browser (localhost:3000)                      │
│                                                                 │
│  Docusaurus Page                                                │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Textbook Content (Markdown)                        │        │
│  │                                                     │        │
│  │  User selects text → context                       │        │
│  └────────────────────────────────────────────────────┘        │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────┐       │
│  │ ChatWidget (React Component)                        │       │
│  │ • Input: message + context                          │       │
│  │ • Output: response + sources                        │       │
│  │ • State: messages[], loading, error                 │       │
│  └────────────────────────┬────────────────────────────┘       │
│                           │ POST /chat (fetch)                  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP (CORS: localhost:3000)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│               FastAPI Backend (localhost:8000)                  │
│                                                                 │
│  CORSMiddleware → /chat Endpoint (POST)                        │
│  ┌────────────────────────────────────────────────────┐        │
│  │ Validate ChatRequest (Pydantic)                     │        │
│  │   ↓                                                 │        │
│  │ create_agent() + Runner.run_sync(message)          │        │
│  │   ↓                                                 │        │
│  │ retrieve_textbook_content() tool                   │        │
│  │   ↓                                                 │        │
│  │ Cohere embedding → Qdrant search → GPT-4 generation│        │
│  │   ↓                                                 │        │
│  │ Return ChatResponse (response + sources)           │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                 │
│  External Dependencies:                                         │
│  • Qdrant Cloud (vector DB)                                    │
│  • Cohere API (embeddings)                                     │
│  • OpenAI API (GPT-4)                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: 2026-01-19
**Related Files**:
- Backend: `backend/api.py`
- Frontend: `src/components/ChatWidget/index.tsx`
- API Contract: `specs/004-fastapi-frontend-integration/contracts/chat-api.yaml`
