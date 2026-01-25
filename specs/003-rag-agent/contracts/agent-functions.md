# Function Contracts: RAG-Powered Agent

**Feature**: 003-rag-agent
**Date**: 2026-01-16
**Phase**: Phase 1 - Design

## Overview

This document defines the public function contracts for `backend/agent.py`. All functions include type hints, docstrings, error handling, and test criteria.

---

## Function: `validate_environment()`

**Purpose**: Validate that all required environment variables are present before initializing agent.

**Signature**:
```python
def validate_environment() -> Dict[str, str]:
    """
    Validate required environment variables for agent operation.

    Returns:
        Dict[str, str]: Environment variables (OPENAI_API_KEY, COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY)

    Raises:
        SystemExit: If any required variable is missing (prints error message and exits with code 1)
    """
```

**Implementation Note**: **Reuse from test_retrieval.py** (already validates COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY). Extend to add OPENAI_API_KEY validation.

**Input**: None (reads from `os.environ`)

**Output**:
```python
{
    "OPENAI_API_KEY": "sk-...",
    "COHERE_API_KEY": "...",
    "QDRANT_URL": "https://...",
    "QDRANT_API_KEY": "..."
}
```

**Error Handling**:
- Missing variable → Print `"Missing required environment variables: {missing_vars}"` and `sys.exit(1)`
- Empty variable → Treated as missing

**Test Criteria**:
- ✅ **Valid env**: Returns dict with 4 keys
- ✅ **Missing OPENAI_API_KEY**: Exits with error message
- ✅ **Missing COHERE_API_KEY**: Exits with error message
- ✅ **All missing**: Exits with error listing all missing vars

**Example**:
```python
env_vars = validate_environment()
# If successful, continues. If failure, script exits.
```

---

## Function: `initialize_clients()`

**Purpose**: Initialize Cohere and Qdrant clients and verify connection to collection.

**Signature**:
```python
def initialize_clients(env_vars: Dict[str, str]) -> Tuple[cohere.Client, QdrantClient]:
    """
    Initialize API clients for Cohere and Qdrant.

    Args:
        env_vars: Dict with COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY

    Returns:
        Tuple[cohere.Client, QdrantClient]: Initialized clients

    Raises:
        SystemExit: If Qdrant collection 'robotics_textbook' doesn't exist
    """
```

**Implementation Note**: **Reuse from test_retrieval.py** (no changes needed).

**Input**:
```python
{
    "COHERE_API_KEY": "...",
    "QDRANT_URL": "https://...",
    "QDRANT_API_KEY": "..."
}
```

**Output**:
```python
(
    cohere.Client(api_key="..."),
    QdrantClient(url="...", api_key="...")
)
```

**Error Handling**:
- Qdrant collection not found → Print `"Collection 'robotics_textbook' not found. Run backend/main.py first."` and `sys.exit(1)`
- Connection failure → Raises exception (not caught, let it propagate)

**Test Criteria**:
- ✅ **Valid credentials + collection exists**: Returns (cohere_client, qdrant_client)
- ✅ **Collection doesn't exist**: Exits with error message
- ✅ **Invalid Qdrant URL**: Raises exception

**Example**:
```python
cohere_client, qdrant_client = initialize_clients(env_vars)
```

---

## Function: `generate_query_embedding()`

**Purpose**: Generate embedding vector for user query using Cohere.

**Signature**:
```python
def generate_query_embedding(query_text: str, cohere_client: cohere.Client) -> List[float]:
    """
    Generate embedding for query text using Cohere embed-multilingual-v3.0.

    Args:
        query_text: User's question or search query
        cohere_client: Initialized Cohere client

    Returns:
        List[float]: 1024-dimensional embedding vector

    Raises:
        Exception: If Cohere API fails after 3 retries
    """
```

**Implementation Note**: **Reuse from test_retrieval.py** (no changes needed).

**Input**:
- `query_text`: Non-empty string (e.g., "What is ROS 2?")
- `cohere_client`: Initialized Cohere client

**Output**:
```python
[0.023, -0.451, 0.182, ...]  # 1024 floats
```

**Error Handling**:
- Cohere API error → Retry with exponential backoff (0.5s, 1s, 2s)
- After 3 failures → Raise exception with error message

**Test Criteria**:
- ✅ **Valid query**: Returns 1024-dimensional vector
- ✅ **Empty query**: Raises ValueError (validation in Cohere API)
- ✅ **API failure (retry succeeds)**: Returns vector after retry
- ✅ **API failure (all retries fail)**: Raises exception

**Example**:
```python
embedding = generate_query_embedding("What is ROS 2?", cohere_client)
# embedding is List[float] with length 1024
```

---

## Function: `search_qdrant()`

**Purpose**: Search Qdrant collection for top-k similar vectors.

**Signature**:
```python
def search_qdrant(query_embedding: List[float], qdrant_client: QdrantClient, k: int = 3) -> List[Dict[str, Any]]:
    """
    Search Qdrant collection for top-k similar chunks.

    Args:
        query_embedding: 1024-dimensional embedding vector
        qdrant_client: Initialized Qdrant client
        k: Number of top results to retrieve (default: 3)

    Returns:
        List[Dict[str, Any]]: Results with rank, score, url, title, heading, text
    """
```

**Implementation Note**: **Reuse from test_retrieval.py** (no changes needed).

**Input**:
- `query_embedding`: List of 1024 floats
- `qdrant_client`: Initialized Qdrant client
- `k`: Integer (1-10 recommended)

**Output**:
```python
[
    {
        "rank": 1,
        "score": 0.73,
        "url": "https://textbook.../module1/week1",
        "title": "ROS 2 Setup",
        "heading": "Installation on Ubuntu 22.04",
        "text": "To install ROS 2 Humble on Ubuntu..."
    },
    # ... k-1 more results
]
```

**Error Handling**:
- Empty results → Return empty list `[]`
- Qdrant connection error → Raise exception (not caught)

**Test Criteria**:
- ✅ **Valid embedding**: Returns list of k results
- ✅ **No results found**: Returns empty list `[]`
- ✅ **k > total vectors**: Returns all available results (< k items)

**Example**:
```python
results = search_qdrant(embedding, qdrant_client, k=3)
# results has 0-3 items depending on matches
```

---

## Function: `retrieve_textbook_content()` [Tool]

**Purpose**: Custom retrieval tool for agent to query textbook content.

**Signature**:
```python
@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    """
    Retrieve relevant content from Physical AI & Humanoid Robotics textbook.

    This tool searches the textbook's vector database for chunks relevant to the query.
    Use this when the user asks about ROS 2, Digital Twins, NVIDIA Isaac, VLA models,
    or any robotics concepts covered in the course.

    Args:
        query: The user's question or search query. Be specific for better results.
        k: Number of top results to retrieve (default: 3, max: 10)

    Returns:
        Dictionary with:
            - results: List of relevant chunks with metadata (url, title, heading, text)
            - error: None if successful, error message string if failed
    """
```

**Input**:
- `query`: Non-empty string (e.g., "VLA architecture in humanoid robots")
- `k`: Integer between 1 and 10

**Output**:
```python
{
    "results": [
        {
            "rank": 1,
            "score": 0.73,
            "url": "https://...",
            "title": "...",
            "heading": "...",
            "text": "..."
        },
        # ... more results
    ],
    "error": None  # or "Retrieval failed: ..." if error
}
```

**Error Handling**:
- Cohere embedding failure → Return `{"results": [], "error": "Embedding generation failed"}`
- Qdrant search failure → Return `{"results": [], "error": "Textbook search unavailable"}`
- Invalid k (< 1) → Clamp to k=1
- Invalid k (> 10) → Clamp to k=10
- Empty query → Let Cohere API raise validation error

**Implementation**:
```python
@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    try:
        # Clamp k to valid range
        k = max(1, min(k, 10))

        # Reuse existing functions
        embedding = generate_query_embedding(query, cohere_client)
        results = search_qdrant(embedding, qdrant_client, k)

        return {"results": results, "error": None}
    except Exception as e:
        return {"results": [], "error": f"Retrieval failed: {str(e)}"}
```

**Test Criteria**:
- ✅ **Valid query**: Returns dict with results list and error=None
- ✅ **No results found**: Returns {"results": [], "error": None}
- ✅ **Cohere API error**: Returns {"results": [], "error": "Embedding..."}
- ✅ **Qdrant error**: Returns {"results": [], "error": "Textbook search..."}
- ✅ **k=0**: Clamped to k=1
- ✅ **k=20**: Clamped to k=10

**Docstring Importance**: The docstring is used by the agent to decide when to invoke this tool. Make it comprehensive and include example topics covered.

---

## Function: `create_agent()`

**Purpose**: Initialize the agent with retrieval tool and instructions.

**Signature**:
```python
def create_agent() -> Agent:
    """
    Create and configure the RAG-powered agent.

    Returns:
        Agent: Configured agent with retrieval tool and system instructions

    Raises:
        None (relies on environment variables being validated beforehand)
    """
```

**Input**: None (uses module-level INSTRUCTIONS constant and env vars)

**Output**: `agents.Agent` instance

**Implementation**:
```python
def create_agent() -> Agent:
    """Create and configure the RAG-powered agent."""
    model = os.getenv("OPENAI_MODEL", "gpt-4")

    agent = Agent(
        name="Robotics Tutor",
        instructions=INSTRUCTIONS,  # See constants section
        tools=[retrieve_textbook_content],
        model=model
    )

    return agent
```

**Constants Required**:
```python
INSTRUCTIONS = """You are an expert tutor for the Physical AI & Humanoid Robotics course.

Your role:
1. Answer student questions using ONLY information retrieved from the textbook
2. ALWAYS cite your sources with page title and URL in Markdown format: [Title](URL)
3. If the textbook doesn't cover a topic, acknowledge this rather than guessing
4. For follow-up questions, maintain context from previous conversation turns

Citation format:
- Include [Page Title](URL) after each factual claim
- If using multiple sources, cite each one
- Example: "ROS 2 uses DDS for communication [ROS 2 Architecture](https://textbook.../module1/week2)"

When the retrieval tool returns no relevant results:
- Say: "I couldn't find information about that in the textbook"
- Suggest: "This topic might not be covered, or try rephrasing your question"
- Do NOT fabricate information or use knowledge outside the textbook

When the retrieval tool returns an error:
- Acknowledge: "I'm having trouble accessing the textbook right now"
- Suggest: "Please try again in a moment"
"""
```

**Test Criteria**:
- ✅ **Default model**: Uses "gpt-4" if OPENAI_MODEL not set
- ✅ **Custom model**: Uses value from OPENAI_MODEL env var
- ✅ **Agent has retrieval tool**: agent.tools includes retrieve_textbook_content
- ✅ **Agent has instructions**: agent.instructions matches INSTRUCTIONS constant

---

## Function: `run_conversation_loop()`

**Purpose**: Interactive CLI loop for chatting with the agent.

**Signature**:
```python
def run_conversation_loop(agent: Agent, session: SQLiteSession) -> None:
    """
    Run interactive CLI conversation loop with the agent.

    Args:
        agent: Configured Agent instance
        session: SQLiteSession for conversation memory

    Returns:
        None (runs until user types 'exit' or 'quit')
    """
```

**Input**:
- `agent`: Initialized Agent instance
- `session`: SQLiteSession instance

**Output**: None (side effect: prints conversation to stdout)

**Implementation**:
```python
def run_conversation_loop(agent: Agent, session: SQLiteSession) -> None:
    """Run interactive CLI conversation loop."""
    print("=" * 60)
    print("Robotics Tutor - Physical AI & Humanoid Robotics")
    print("=" * 60)
    print("Ask questions about ROS 2, Digital Twins, NVIDIA Isaac, VLA, etc.")
    print("Type 'exit' or 'quit' to end the conversation.\n")

    while True:
        try:
            query = input("\nYou: ").strip()

            if not query:
                continue

            if query.lower() in ["exit", "quit"]:
                print("\nGoodbye! Your conversation has been saved.")
                break

            # Run agent with session memory
            result = Runner.run_sync(agent, query, session=session)

            print(f"\nTutor: {result.final_output}")

        except KeyboardInterrupt:
            print("\n\nGoodbye! Your conversation has been saved.")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again.")
```

**Error Handling**:
- Empty input → Skip and re-prompt
- KeyboardInterrupt (Ctrl+C) → Graceful exit with goodbye message
- Agent execution error → Print error, continue loop (don't crash)

**Test Criteria**:
- ✅ **Valid query**: Prints agent response with citations
- ✅ **Empty query**: Re-prompts without error
- ✅ **'exit' command**: Exits loop with goodbye message
- ✅ **'quit' command**: Exits loop with goodbye message
- ✅ **Ctrl+C**: Exits gracefully
- ✅ **Agent error**: Prints error, continues loop
- ✅ **Multi-turn**: Second query uses context from first (via session)

---

## Function: `main()`

**Purpose**: Entry point for the agent script.

**Signature**:
```python
def main() -> int:
    """
    Main entry point for RAG-powered agent.

    Returns:
        int: Exit code (0 for success, 1 for error)
    """
```

**Input**: None

**Output**: Exit code (0 or 1)

**Implementation**:
```python
def main() -> int:
    """Main entry point for RAG-powered agent."""
    global cohere_client, qdrant_client  # For use in retrieve_textbook_content

    try:
        # Phase 1: Environment validation
        env_vars = validate_environment()

        # Phase 2: Client initialization
        cohere_client, qdrant_client = initialize_clients(env_vars)

        # Phase 3: Agent creation
        agent = create_agent()

        # Phase 4: Session initialization
        session = SQLiteSession("robotics_chatbot")

        # Phase 5: Run conversation loop
        run_conversation_loop(agent, session)

        return 0

    except KeyboardInterrupt:
        print("\n\nInterrupted. Exiting...")
        return 0
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

**Error Handling**:
- Environment validation failure → Exits via sys.exit(1) in validate_environment()
- Client initialization failure → Exits via sys.exit(1) in initialize_clients()
- Agent creation failure → Caught, prints error, returns 1
- KeyboardInterrupt → Graceful exit with code 0
- Any other exception → Prints error, returns 1

**Test Criteria**:
- ✅ **Valid environment + clients**: Starts conversation loop
- ✅ **Missing env var**: Exits with code 1
- ✅ **Qdrant collection not found**: Exits with code 1
- ✅ **Successful conversation**: Returns 0 on exit
- ✅ **Ctrl+C during setup**: Returns 0
- ✅ **Unexpected error**: Returns 1

---

## Module-Level Variables

**Required Globals** (for use in tool function):
```python
# Global clients (initialized in main(), used in retrieve_textbook_content)
cohere_client: Optional[cohere.Client] = None
qdrant_client: Optional[QdrantClient] = None
```

**Rationale**: Tool function can't accept client instances as parameters (OpenAI Agents SDK limitation). Globals provide access within tool function scope.

**Alternative**: Use closures to capture clients, but globals are simpler and explicit.

---

## Import Dependencies

**Required Imports**:
```python
import os
import sys
from typing import Dict, List, Any, Tuple, Optional

import cohere
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from agents import Agent, Runner, function_tool, SQLiteSession

# Reusable functions from existing backend
# (Alternatively, can be copied inline if importing causes issues)
```

**New Dependency**: `openai-agents` (add via `uv add openai-agents`)

---

## Testing Strategy

**Manual CLI Testing** (per FR-009, no automated tests):

1. **Happy Path**:
   - Run `uv run python backend/agent.py`
   - Ask: "What is ROS 2?"
   - Verify: Response includes citation with [Title](URL)
   - Ask: "How do I install it?" (follow-up)
   - Verify: Agent understands "it" refers to ROS 2

2. **Error Handling**:
   - Missing OPENAI_API_KEY → Should exit with error
   - Invalid query (gibberish) → Should return "I couldn't find..."
   - Ctrl+C → Should exit gracefully

3. **Edge Cases**:
   - Off-topic question ("What's the weather?") → Should acknowledge out of scope
   - Very long query (>500 words) → Should still work but may truncate

4. **Performance**:
   - Time each query → Should be <10 seconds (SC-001)
   - 5+ conversation turns → Should maintain context (SC-004)

---

## Summary

**Total Functions**: 7 public functions + 1 tool function
- validate_environment() → Reuse from test_retrieval.py, add OPENAI_API_KEY
- initialize_clients() → Reuse from test_retrieval.py (no changes)
- generate_query_embedding() → Reuse from test_retrieval.py (no changes)
- search_qdrant() → Reuse from test_retrieval.py (no changes)
- **retrieve_textbook_content()** → NEW tool function
- **create_agent()** → NEW helper function
- **run_conversation_loop()** → NEW CLI loop
- **main()** → NEW entry point

**Estimated Lines of Code**:
- Imports: ~15 lines
- Constants (INSTRUCTIONS): ~25 lines
- Reused functions: 0 lines (import or reference)
- New functions: ~100 lines
- **Total**: ~140 lines (excluding reused code)

**Dependencies Added**: openai-agents

Ready for Phase 1: Quickstart Guide.
