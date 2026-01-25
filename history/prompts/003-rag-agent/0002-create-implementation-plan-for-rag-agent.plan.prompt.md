---
id: 0002
title: Create implementation plan for RAG agent
stage: plan
date: 2026-01-16
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-rag-agent
branch: 003-rag-agent
user: Talib1073
command: /sp.plan
labels: ["rag", "agent", "planning", "architecture", "openai", "design"]
links:
  spec: ../../specs/003-rag-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-rag-agent/plan.md (updated - complete architecture plan)
  - specs/003-rag-agent/research.md (created - 8 technical decisions)
  - specs/003-rag-agent/data-model.md (created - 4 core entities)
  - specs/003-rag-agent/contracts/agent-functions.md (created - 8 function contracts)
  - specs/003-rag-agent/quickstart.md (created - user guide with examples)
  - CLAUDE.md (updated - added Python 3.11+ and Qdrant Cloud context)
tests:
  - Constitution Check: PASS (all 7 principles compliant or justified)
  - Post-Design Re-evaluation: PASS (no violations)
  - All NEEDS CLARIFICATION items resolved
---

## Prompt

/sp.plan

User requirements:
- Place a single agent.py file in the backend/ folder alongside main.py and test_retrieval.py
- Implement a retrieval tool that queries Qdrant using Cohere embeddings (reusing Spec 1 logic)
- Integrate this tool into an OpenAI Agent via the OpenAI Agents SDK, enabling grounded, multi-turn Q&A over the textbook
- Include a main() function to run CLI-based conversations for testing (e.g., input query → agent response with source URL)
- Ensure no external dependencies beyond existing backend stack—no API, frontend, or auth

## Response snapshot

Completed full architectural planning for RAG-powered agent across 2 phases:

**Phase 0: Research ✅**
- Researched OpenAI Agents SDK (package name, installation, API surface)
- Investigated custom tool registration patterns (`@function_tool` decorator)
- Explored conversation memory options (SQLiteSession selected)
- Defined grounded response patterns and error handling strategies
- Documented 8 technical decisions with rationale and alternatives

**Phase 1: Design ✅**
- Created data model with 4 core entities:
  - Agent (OpenAI Agents SDK instance)
  - RetrievalTool (custom function tool)
  - ConversationTurn (session-managed history)
  - Citation (markdown link in response)
- Designed 8 function contracts:
  - 4 reused from test_retrieval.py (validate, initialize, embed, search)
  - 4 new functions (retrieve_textbook_content tool, create_agent, run_conversation_loop, main)
- Wrote comprehensive quickstart guide with:
  - Installation steps
  - Example conversations
  - Troubleshooting guide
  - Testing checklist for 3 user stories

**Key Architecture Decisions**:
1. **OpenAI Agents SDK** (v0.6.7+) - lightweight framework with built-in tool orchestration
2. **SQLiteSession** - file-based conversation persistence (robotics_chatbot.db)
3. **GPT-4 default** - best citation quality, configurable via OPENAI_MODEL env var
4. **Code reuse** - import functions from test_retrieval.py (DRY principle)
5. **Global clients** - cohere_client/qdrant_client accessible in tool function
6. **Detailed instructions** - explicit citation format and grounding rules
7. **Graceful degradation** - error handling returns user-friendly messages
8. **Manual testing** - CLI-based acceptance testing per spec FR-009

**Constitution Re-Evaluation**:
- All 7 principles compliant or justified
- Partial compliance on Principle III (CLI-only) justified by MVP scope
- ADR candidate identified: "OpenAI Agents SDK vs LangChain" decision

**Estimated Implementation**:
- ~200-300 lines of code (single file: backend/agent.py)
- ~3-4 hours for single developer
- 12+ test queries for manual acceptance testing

## Outcome

- ✅ Impact: Complete architecture plan with research, data model, contracts, and quickstart guide ready for implementation
- 🧪 Tests: Constitution Check PASS, all NEEDS CLARIFICATION resolved, 8 design decisions documented
- 📁 Files: plan.md, research.md, data-model.md, contracts/agent-functions.md, quickstart.md, CLAUDE.md updated
- 🔁 Next prompts: Run `/sp.tasks` to generate task breakdown, then implement backend/agent.py
- 🧠 Reflection: OpenAI Agents SDK research successful via WebSearch + WebFetch. Code reuse strategy maximizes existing Spec 001/002 work. Single-file implementation keeps scope manageable. SQLiteSession provides simple persistence without infrastructure overhead.

## Evaluation notes (flywheel)

- Failure modes observed: WebFetch blocked on openai.github.io domain (network restriction), recovered using PyPI page
- Graders run and results (PASS/FAIL): PASS (Constitution Check complete, all design artifacts created)
- Prompt variant (if applicable): Standard /sp.plan workflow
- Next experiment (smallest change to try): Proceed to /sp.tasks for task generation
