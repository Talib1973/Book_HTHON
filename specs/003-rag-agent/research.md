# Research Notes: RAG-Powered Agent

**Feature**: 003-rag-agent
**Date**: 2026-01-16
**Phase**: Phase 0 - Technical Research

## Purpose

Resolve all "NEEDS CLARIFICATION" items from plan.md Technical Context section and establish best practices for implementing RAG agent with OpenAI Agents SDK.

## Research Questions

1. OpenAI Agents SDK: Package name, installation, and API surface
2. Custom tool registration: How to define retrieval tool
3. Conversation memory: Multi-turn conversation handling
4. Grounded response patterns: Best practices for RAG integration

---

## Decision 1: OpenAI Agents SDK Package

**Decision**: Use `openai-agents` package (v0.6.7+) via `uv add openai-agents`

**Rationale**:
- Official OpenAI SDK for building autonomous agents with tool use
- Lightweight framework with built-in tool orchestration
- Supports custom function tools with automatic schema generation
- Native conversation memory via Sessions API
- MIT licensed, actively maintained (latest release: Jan 16, 2026)

**Installation**:
```bash
cd backend
uv add openai-agents
```

**Python Requirement**: Python >=3.9 (compatible with existing backend python=">=3.11")

**Alternatives Considered**:
- **LangChain Agents**: More heavyweight, unnecessary abstractions for single-tool agent
- **Raw OpenAI Function Calling**: No built-in conversation memory or agent orchestration
- **Anthropic Claude SDK**: Not compatible with OpenAI models specified in spec

**Sources**:
- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [PyPI: openai-agents](https://pypi.org/project/openai-agents/)

---

## Decision 2: Custom Retrieval Tool Pattern

**Decision**: Use `@function_tool` decorator to wrap retrieval logic as agent tool

**Pattern**:
```python
from agents import function_tool
from typing import List, Dict, Any

@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """
    Retrieve relevant content from the Physical AI & Humanoid Robotics textbook.

    Args:
        query: The user's question or search query
        k: Number of top results to retrieve (default: 3)

    Returns:
        List of relevant chunks with metadata (URL, title, heading, text, score)
    """
    # Implementation reuses Spec 002 logic:
    # 1. Generate query embedding via Cohere (input_type="search_query")
    # 2. Search Qdrant collection "robotics_textbook"
    # 3. Return top-k results with metadata
    pass
```

**Rationale**:
- SDK automatically generates tool schema from function signature and docstring
- Docstring becomes tool description for LLM
- Type hints (str, int) auto-validate inputs
- Async functions supported (but sync sufficient for Qdrant queries)
- Return format flexible (dict/list/string all work)

**Best Practices**:
- Include comprehensive docstring (agent uses this to decide when to call tool)
- Return structured data (dict with url, title, text) rather than plain strings
- Keep function pure (no side effects, deterministic for same inputs)
- Handle errors gracefully (empty results, API failures) and return error info in dict

**Alternatives Considered**:
- **Class-based Tool**: More complex, unnecessary for single retrieval function
- **Hosted OpenAI Tool**: Runs on OpenAI servers, can't access our Qdrant instance
- **Manual Schema Definition**: Error-prone, SDK auto-generation is robust

**Sources**:
- [Tools - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/tools/)

---

## Decision 3: Conversation Memory Implementation

**Decision**: Use `SQLiteSession` for session-based conversation memory

**Pattern**:
```python
from agents import Agent, Runner, SQLiteSession

# Create session (stores conversation history in SQLite file)
session = SQLiteSession("robotics_chatbot_session")

# Agent automatically maintains context across runs
agent = Agent(
    name="Robotics Tutor",
    instructions="You are an expert tutor for Physical AI & Humanoid Robotics...",
    tools=[retrieve_textbook_content]
)

# First turn
result1 = Runner.run_sync(agent, "What is ROS 2?", session=session)

# Follow-up turn (agent remembers "ROS 2" context)
result2 = Runner.run_sync(agent, "How do I install it?", session=session)
```

**How It Works**:
- **Before each run**: Runner retrieves conversation history from session and prepends to input
- **After each run**: All new items (user input, assistant response, tool calls) stored in session
- **Automatic**: No manual `.to_input_list()` or history management needed

**Rationale**:
- Built-in solution (no external dependencies)
- SQLite file storage simple and portable (single .db file)
- Automatically handles conversation history (≥5 turns per SC-004)
- Session-only (no cross-user state, privacy-compliant per FR-007)

**Memory Management**:
- Default: Keep all history (sufficient for CLI sessions)
- Optional: Context trimming (keep last N turns) if memory becomes issue
- Optional: Context summarization for very long conversations

**Alternatives Considered**:
- **In-Memory List**: Manual history management, error-prone
- **SQLAlchemy Session**: Requires database setup, overkill for CLI tool
- **Dapr State Store**: Cloud-native, unnecessary for local CLI
- **No Memory**: Violates FR-007 (multi-turn conversations)

**Sources**:
- [Sessions - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/sessions/)
- [Context Engineering - Short-Term Memory Management](https://cookbook.openai.com/examples/agents_sdk/session_memory)

---

## Decision 4: Agent Instructions for Grounded Responses

**Decision**: Use detailed system instructions emphasizing citation and grounding

**Template**:
```python
instructions = """You are an expert tutor for the Physical AI & Humanoid Robotics course.

Your role:
1. Answer student questions using ONLY information retrieved from the textbook
2. ALWAYS cite your sources with page title and URL
3. If the textbook doesn't cover a topic, acknowledge this rather than guessing
4. For follow-up questions, maintain context from previous conversation turns

Citation format:
- Include [Page Title](URL) after each factual claim
- If using multiple sources, cite each one
- Example: "ROS 2 uses DDS for communication [ROS 2 Setup](https://textbook.../ros2/setup)"

When the retrieval tool returns no relevant results:
- Say: "I couldn't find information about that in the textbook"
- Suggest: "This topic might not be covered, or try rephrasing your question"
- Do NOT fabricate information or use knowledge outside the textbook
"""
```

**Rationale**:
- Explicit instructions reduce hallucination (FR-005, FR-011)
- Citation format matches FR-006 requirements
- Handles edge cases (no results, off-topic) per spec
- Emphasizes grounding in retrieved content

**Best Practices**:
- **Specificity**: Detailed instructions perform better than vague prompts
- **Examples**: Include citation format examples in instructions
- **Error Handling**: Explicitly state what to do when tool returns empty results
- **Role Definition**: Clear persona ("expert tutor") guides tone and style

**Alternatives Considered**:
- **Minimal Instructions**: Underspecified, increases hallucination risk
- **RAG Prompt Template**: Passing retrieved chunks in user message works but less elegant than tool pattern
- **Post-Processing Validation**: Checking citations after generation fragile and complex

**Sources**:
- [Agents - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/agents/)
- [OpenAI Cookbook - Agents](https://cookbook.openai.com/topic/agents)

---

## Decision 5: Runner Pattern for CLI Execution

**Decision**: Use `Runner.run_sync()` for synchronous CLI interaction

**Pattern**:
```python
def main():
    """CLI-based conversation loop."""
    # Initialize clients (Cohere, Qdrant)
    validate_environment()
    cohere_client, qdrant_client = initialize_clients()

    # Create agent with retrieval tool
    agent = Agent(
        name="Robotics Tutor",
        instructions=INSTRUCTIONS,
        tools=[retrieve_textbook_content],
        model="gpt-4"  # or gpt-3.5-turbo for cost savings
    )

    # Create session for conversation memory
    session = SQLiteSession("robotics_chatbot")

    print("Robotics Tutor (type 'exit' to quit)")
    while True:
        query = input("\nYou: ").strip()
        if query.lower() in ["exit", "quit"]:
            break

        # Run agent (handles tool calls, citations, memory automatically)
        result = Runner.run_sync(agent, query, session=session)
        print(f"\nTutor: {result.final_output}")

if __name__ == "__main__":
    main()
```

**Rationale**:
- **Synchronous**: CLI doesn't need async (simpler code)
- **Session Persistence**: SQLite file survives restarts (user can continue conversation)
- **Error Handling**: Runner handles tool errors gracefully (won't crash on Qdrant failures)
- **Simplicity**: ~10 lines for full conversational agent

**Performance**:
- Typical flow: 3-5 seconds (Cohere embed + Qdrant search + GPT-4 generation)
- Well under <10s requirement (SC-001)
- Session overhead negligible (SQLite writes are fast)

**Alternatives Considered**:
- **Async Runner**: Unnecessary complexity for CLI, no concurrent requests
- **Streaming Responses**: Nice UX but adds complexity, save for future web version
- **Stateless (no session)**: Violates FR-007 (multi-turn memory)

**Sources**:
- [OpenAI Agents SDK - Main Docs](https://openai.github.io/openai-agents-python/)

---

## Decision 6: Error Handling Strategy

**Decision**: Graceful degradation with informative error messages

**Patterns**:

1. **Environment Validation** (reuse from test_retrieval.py):
```python
def validate_environment() -> Dict[str, str]:
    """Ensure all API keys present before agent initialization."""
    required = ["OPENAI_API_KEY", "COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY"]
    # Exit early with clear message if missing
```

2. **Retrieval Tool Error Handling**:
```python
@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    try:
        # Qdrant search logic
        return {"results": chunks, "error": None}
    except Exception as e:
        return {"results": [], "error": f"Retrieval failed: {str(e)}"}
```

3. **Agent Instructions Include Error Cases**:
```
When the retrieval tool returns an error:
- Acknowledge: "I'm having trouble accessing the textbook right now"
- Suggest: "Please try again in a moment or check your connection"
```

**Rationale**:
- **User-Friendly**: Non-technical error messages (per FR-010)
- **Graceful**: Agent continues running even if one tool call fails
- **Debuggable**: Errors logged but don't crash CLI loop

**Alternatives Considered**:
- **Fail Fast**: Crash on first error (poor UX for CLI tool)
- **Silent Failures**: Return empty results without error flag (confusing for users)
- **Retry Logic in Tool**: Added complexity, Qdrant failures usually persistent

---

## Decision 7: Model Selection

**Decision**: Use GPT-4 as default model, with GPT-3.5-turbo as cost-effective alternative

**Rationale**:
- **GPT-4**: Better instruction following for grounded responses and citation format
- **GPT-3.5-turbo**: 10x cheaper, acceptable for well-scoped queries
- **Configurable**: Allow users to switch via environment variable

**Pattern**:
```python
model = os.getenv("OPENAI_MODEL", "gpt-4")  # Default to GPT-4
agent = Agent(model=model, ...)
```

**Cost Considerations**:
- GPT-4: ~$0.03/query (3K input + 500 output tokens)
- GPT-3.5-turbo: ~$0.003/query (10x cheaper)
- For 100 test queries: $3 (GPT-4) vs $0.30 (GPT-3.5)

**Alternatives Considered**:
- **Claude 3.5 Sonnet**: Not compatible with OpenAI Agents SDK
- **GPT-4-turbo**: Newer but similar cost/quality to GPT-4
- **GPT-4o**: Optimized for chat, good alternative to test

---

## Decision 8: Reuse Existing Backend Logic

**Decision**: Import and reuse functions from test_retrieval.py

**Reusable Functions**:
- `validate_environment()` - Already handles all 4 API keys
- `initialize_clients()` - Returns (cohere_client, qdrant_client)
- `generate_query_embedding()` - Cohere embedding with retry logic
- `search_qdrant()` - Qdrant search with metadata extraction

**Pattern**:
```python
# In agent.py
from test_retrieval import (
    validate_environment,
    initialize_clients,
    generate_query_embedding,
    search_qdrant
)

@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    """Retrieval tool using existing backend logic."""
    # Reuse generate_query_embedding + search_qdrant
    embedding = generate_query_embedding(query, cohere_client)
    results = search_qdrant(embedding, qdrant_client, k)
    return {"results": results, "error": None}
```

**Rationale**:
- **DRY**: Don't duplicate 50+ lines of validated code
- **Tested**: These functions already validated in Spec 002
- **Consistent**: Same embedding logic ensures retrieval quality matches validation

**Alternatives Considered**:
- **Duplicate Code**: Violates DRY, creates maintenance burden
- **Refactor to Shared Module**: Overkill for 2-file backend
- **Inline Everything**: Makes agent.py 500+ lines (violates single-file simplicity)

**Note**: If importing creates issues, fallback to copying functions (but importing preferred).

---

## Implementation Checklist

Based on research, the implementation requires:

- [X] Install openai-agents via `uv add openai-agents`
- [X] Add OPENAI_API_KEY to .env.example and .env
- [ ] Define `retrieve_textbook_content()` function tool
- [ ] Write agent system instructions (grounding, citations, error handling)
- [ ] Initialize Agent with model, instructions, tools
- [ ] Create SQLiteSession for conversation memory
- [ ] Implement main() CLI loop with Runner.run_sync()
- [ ] Reuse validate_environment() and initialize_clients() from test_retrieval.py
- [ ] Test with example queries from Spec 002 (ROS 2, Digital Twin, VLA)
- [ ] Document usage in backend/README.md

---

## Summary

All "NEEDS CLARIFICATION" items resolved:

1. **OpenAI Agents SDK**: Package `openai-agents` v0.6.7+, installed via `uv add openai-agents`
2. **Custom Tool**: `@function_tool` decorator with docstring-based schema generation
3. **Conversation Memory**: `SQLiteSession` for automatic history management
4. **Grounded Responses**: Detailed agent instructions + retrieval tool pattern
5. **CLI Execution**: `Runner.run_sync()` with while-loop for interactive chat
6. **Error Handling**: Graceful degradation with user-friendly messages
7. **Model**: GPT-4 default (configurable via env var)
8. **Code Reuse**: Import functions from test_retrieval.py

**Estimated Implementation**: ~200-300 lines (agent.py)
**Dependencies Added**: openai-agents (existing: openai, cohere, qdrant-client, python-dotenv)
**New Environment Variable**: OPENAI_API_KEY

Ready for Phase 1: Data Model and Contracts.

---

## Sources

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [Tools - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/tools/)
- [PyPI: openai-agents](https://pypi.org/project/openai-agents/)
- [Sessions - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/sessions/)
- [Context Engineering - Short-Term Memory Management](https://cookbook.openai.com/examples/agents_sdk/session_memory)
- [Agents - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/agents/)
- [OpenAI Cookbook - Agents](https://cookbook.openai.com/topic/agents)
- [GitHub - openai/openai-agents-python](https://github.com/openai/openai-agents-python)
