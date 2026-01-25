# Data Model: RAG-Powered Agent

**Feature**: 003-rag-agent
**Date**: 2026-01-16
**Phase**: Phase 1 - Design

## Overview

This document defines the core entities and data structures for the RAG-powered agent system. The agent uses OpenAI Agents SDK to orchestrate retrieval from Qdrant and generation with GPT-4, maintaining conversation memory across multiple turns.

---

## Entity: Agent

**Description**: The autonomous AI entity powered by OpenAI Agents SDK, capable of using tools (retrieval) and generating responses grounded in textbook content.

**Implementation**: `agents.Agent` instance

**Attributes**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| name | str | Agent display name | "Robotics Tutor" |
| instructions | str | System prompt defining behavior, citation format, grounding rules | See research.md Decision 4 |
| tools | List[Callable] | Registered tools (retrieval function) | [retrieve_textbook_content] |
| model | str | OpenAI model identifier | "gpt-4" or "gpt-3.5-turbo" |

**Relationships**:
- **Uses** → RetrievalTool (one-to-one)
- **Generates** → ConversationTurn (one-to-many)

**State Transitions**: None (stateless, state managed by Session)

**Validation Rules**:
- instructions MUST include citation format and grounding rules
- tools list MUST contain at least retrieve_textbook_content
- model MUST be valid OpenAI model ID (gpt-4, gpt-3.5-turbo, gpt-4o, etc.)

**Code Example**:
```python
from agents import Agent

agent = Agent(
    name="Robotics Tutor",
    instructions="""You are an expert tutor for Physical AI & Humanoid Robotics.
    Answer using ONLY textbook content. ALWAYS cite sources with [Title](URL).""",
    tools=[retrieve_textbook_content],
    model="gpt-4"
)
```

---

## Entity: RetrievalTool

**Description**: A custom tool registered with the agent that queries Qdrant, generates embeddings via Cohere, and returns relevant chunks with metadata.

**Implementation**: Python function decorated with `@function_tool`

**Attributes (Function Signature)**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| query | str | User's question or search query | Required |
| k | int | Number of top results to retrieve | 3 |

**Return Type**: `Dict[str, Any]`

**Return Structure**:
```python
{
    "results": [
        {
            "rank": 1,
            "score": 0.73,
            "url": "https://textbook.../module1/week1",
            "title": "ROS 2 Setup",
            "heading": "Installation on Ubuntu 22.04",
            "text": "To install ROS 2 Humble on Ubuntu..."
        },
        # ... more results
    ],
    "error": None  # or error message string if failure
}
```

**Relationships**:
- **Used By** → Agent (many-to-one)
- **Queries** → Qdrant Collection "robotics_textbook" (external)
- **Uses** → Cohere embed-multilingual-v3.0 (external)

**Processing Steps**:
1. Generate query embedding via Cohere (input_type="search_query")
2. Search Qdrant collection with cosine similarity
3. Extract top-k results with metadata
4. Format as structured dict with rank, score, URL, title, heading, text
5. Return results + error status

**Validation Rules**:
- query MUST be non-empty string
- k MUST be integer >= 1 and <= 10
- Return MUST include "results" and "error" keys
- Each result MUST have url, title, text fields

**Error Handling**:
- Cohere API failure → Return {"results": [], "error": "Embedding generation failed"}
- Qdrant unavailable → Return {"results": [], "error": "Textbook search unavailable"}
- Empty results → Return {"results": [], "error": None} (not an error, just no matches)

**Code Example**:
```python
from agents import function_tool

@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    """
    Retrieve relevant content from Physical AI & Humanoid Robotics textbook.

    Args:
        query: User's question or search query
        k: Number of top results (default: 3)

    Returns:
        Dict with "results" (list of chunks) and "error" (None or error message)
    """
    try:
        embedding = generate_query_embedding(query, cohere_client)
        results = search_qdrant(embedding, qdrant_client, k)
        return {"results": results, "error": None}
    except Exception as e:
        return {"results": [], "error": f"Retrieval failed: {str(e)}"}
```

---

## Entity: ConversationTurn

**Description**: Represents a single exchange (user query + agent response) within a conversation, including retrieved chunks and citations used.

**Implementation**: Managed by `agents.SQLiteSession`, stored in SQLite database

**Attributes**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| turn_number | int | Sequential turn ID in conversation | 1, 2, 3, ... |
| user_input | str | User's query or message | "What is ROS 2?" |
| tool_calls | List[Dict] | Retrieval tool invocations | [{"tool": "retrieve_textbook_content", "args": {"query": "ROS 2", "k": 3}}] |
| retrieved_chunks | List[Dict] | Results from retrieval tool | [{rank: 1, score: 0.73, url: "...", ...}] |
| agent_response | str | Generated response with citations | "ROS 2 is the Robot Operating System [ROS 2 Setup](https://...)..." |
| timestamp | datetime | When turn occurred | 2026-01-16T10:30:00Z |

**Relationships**:
- **Part Of** → Conversation (many-to-one, managed by Session)
- **Includes** → Citation (one-to-many, embedded in agent_response)

**State Transitions**: None (immutable once stored)

**Storage**:
- Persisted in SQLite file by `SQLiteSession("robotics_chatbot")`
- Automatically managed by OpenAI Agents SDK Runner
- Retrieved before each new turn to provide conversation context

**Validation Rules**:
- user_input MUST be non-empty string
- tool_calls MAY be empty list (if agent doesn't invoke retrieval)
- agent_response MUST be non-empty string
- timestamp auto-generated by Session

**Example Flow**:
```python
# Turn 1
User: "What is ROS 2?"
Tool Call: retrieve_textbook_content(query="What is ROS 2?", k=3)
Retrieved: [3 chunks about ROS 2]
Agent: "ROS 2 is the Robot Operating System... [ROS 2 Setup](https://...)"

# Turn 2 (uses context from Turn 1)
User: "How do I install it?"
Tool Call: retrieve_textbook_content(query="How to install ROS 2?", k=3)
Retrieved: [3 chunks about ROS 2 installation]
Agent: "To install ROS 2 on Ubuntu... [Installation Guide](https://...)"
```

---

## Entity: Citation

**Description**: Represents a source reference included in the agent's response, containing page title, URL, and optionally heading context.

**Implementation**: Markdown link embedded in agent response string

**Format**: `[Page Title](URL)` or `[Page Title - Heading](URL)`

**Attributes**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| page_title | str | Human-readable page title | "ROS 2 Setup" |
| heading | str (optional) | Specific heading/section | "Installation on Ubuntu 22.04" |
| url | str | Full URL to textbook page | "https://textbook.../module1/week1" |

**Relationships**:
- **Part Of** → ConversationTurn.agent_response (many-to-one)
- **References** → Textbook Page (external, in Docusaurus site)

**Extraction Logic**:
When agent generates response using retrieved chunks:
1. For each chunk used in response:
   - Extract `title` field → page_title
   - Extract `heading` field → heading (optional)
   - Extract `url` field → url
2. Format as Markdown link: `[{title}]({url})` or `[{title} - {heading}]({url})`
3. Insert citation after factual claim in response

**Validation Rules**:
- page_title MUST be non-empty string
- url MUST be valid HTTPS URL
- heading MAY be empty string or None
- Citation MUST be clickable Markdown link

**Examples**:

1. **Simple Citation**:
   ```markdown
   ROS 2 uses DDS for communication [ROS 2 Architecture](https://textbook.../module1/week2)
   ```

2. **Citation with Heading**:
   ```markdown
   Install ROS 2 using apt: `sudo apt install ros-humble-desktop` [ROS 2 Setup - Installation on Ubuntu](https://textbook.../module1/week1)
   ```

3. **Multiple Citations**:
   ```markdown
   ROS 2 supports services [ROS 2 Services](https://textbook.../module1/week3) and actions [ROS 2 Actions](https://textbook.../module1/week3) for synchronous communication.
   ```

**Non-Examples** (Invalid):
- ❌ No URL: `ROS 2 uses DDS for communication [Source]`
- ❌ Plain text: `ROS 2 uses DDS (see ROS 2 Architecture page)`
- ❌ HTML link: `<a href="...">ROS 2 Architecture</a>`

---

## Data Flow

```
User Query
    ↓
Agent (receives query + conversation history from Session)
    ↓
RetrievalTool invoked
    ↓ (Cohere embedding)
    ↓ (Qdrant search)
    ↓
Retrieved Chunks returned to Agent
    ↓
Agent generates response using chunks
    ↓ (Includes Citations in response)
    ↓
ConversationTurn stored in Session
    ↓
Response displayed to user
```

**Session Memory Flow**:
```
Session (SQLite)
    ↓ (Before run: Load history)
Runner prepends history to current query
    ↓
Agent processes with full context
    ↓ (After run: Store new turn)
Session persists user input + agent response + tool calls
```

---

## External Dependencies

### Qdrant Collection: `robotics_textbook`

**Created By**: Spec 001 (RAG ingestion pipeline)

**Schema**:
```python
{
    "id": "uuid",
    "vector": [1024 floats],  # Cohere embed-multilingual-v3.0
    "payload": {
        "url": "https://textbook.../...",
        "title": "Page title",
        "heading": "H2 heading",
        "text": "Chunk content (512 tokens max)",
        "chunk_index": 0
    }
}
```

**Query Method**: Cosine similarity search on vector field

### Cohere API: `embed-multilingual-v3.0`

**Endpoint**: `client.embed()`

**Input Type**: `search_query` (different from `search_document`)

**Output**: 1024-dimensional embedding vector

### OpenAI API: GPT-4 / GPT-3.5-turbo

**Endpoint**: Chat Completions (via Agents SDK)

**Input**: System instructions + conversation history + tool results

**Output**: Text response with citations

---

## Configuration

### Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| OPENAI_API_KEY | string | Yes | OpenAI API key for GPT-4 access |
| COHERE_API_KEY | string | Yes | Cohere API key for embeddings |
| QDRANT_URL | string | Yes | Qdrant Cloud cluster URL |
| QDRANT_API_KEY | string | Yes | Qdrant API key |
| OPENAI_MODEL | string | No | Model to use (default: "gpt-4") |

### Session Storage

| Parameter | Value | Description |
|-----------|-------|-------------|
| Session Type | SQLiteSession | File-based conversation memory |
| Database File | robotics_chatbot.db | Stored in backend/ directory |
| Session ID | "robotics_chatbot" | Single session for CLI tool |
| Persistence | Yes | Survives script restarts |

---

## Performance Characteristics

### Query Latency Breakdown

| Step | Time | Notes |
|------|------|-------|
| Cohere embedding | 0.5-1s | API call with retry |
| Qdrant search | 0.1-0.3s | Cloud latency + similarity search |
| GPT-4 generation | 2-4s | Depends on response length |
| Session write | <0.1s | Local SQLite write |
| **Total** | **3-6s** | Well under <10s requirement (SC-001) |

### Memory Usage

| Component | Memory | Notes |
|-----------|--------|-------|
| Cohere client | ~50MB | Loaded once |
| Qdrant client | ~20MB | Loaded once |
| OpenAI Agents SDK | ~100MB | Includes model config |
| Session history (5 turns) | ~10KB | Text only, minimal |
| **Total** | **~200MB** | Acceptable for CLI tool |

### Conversation Limits

| Metric | Limit | Rationale |
|--------|-------|-----------|
| Max conversation turns | Unlimited | SQLite can handle thousands |
| Recommended turns per session | 5-20 | Maintain context without token overflow |
| Context window (GPT-4) | 8K tokens | ~10-15 turns with 500 token responses |
| Context window (GPT-3.5) | 4K tokens | ~5-10 turns |

---

## Summary

**Core Entities**: Agent, RetrievalTool, ConversationTurn, Citation
**Storage**: SQLite (conversation history), Qdrant (textbook vectors)
**External APIs**: OpenAI (GPT-4), Cohere (embeddings), Qdrant (search)
**Performance**: <10s per query, supports ≥5 conversation turns
**Validation**: All entities have clear validation rules and error handling

Ready for Phase 1: Function Contracts.
