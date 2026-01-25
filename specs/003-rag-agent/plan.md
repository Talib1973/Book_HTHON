# Implementation Plan: RAG-Powered Agent

**Branch**: `003-rag-agent` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-rag-agent/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an autonomous AI agent using OpenAI Agents SDK that answers questions about the Physical AI & Humanoid Robotics textbook. The agent integrates a custom retrieval tool querying Qdrant vector store (from Spec 001) using Cohere embeddings, generates grounded responses with source citations, and supports multi-turn conversations with memory. Single-file implementation (backend/agent.py) testable via CLI for rapid iteration.

## Technical Context

**Language/Version**: Python 3.11+ (existing backend/pyproject.toml specifies python = ">=3.11")
**Primary Dependencies**:
- OpenAI Agents SDK (NEEDS CLARIFICATION: package name, installation, API surface)
- openai (for GPT-4/GPT-3.5 model access)
- cohere (embed-multilingual-v3.0, reused from Spec 001)
- qdrant-client (reused from Spec 001)
- python-dotenv (reused from Spec 001)
- UV package manager (existing)

**Storage**: Qdrant Cloud (existing `robotics_textbook` collection from Spec 001)
**Testing**: Manual CLI testing (no automated test framework per spec FR-009)
**Target Platform**: CLI/Jupyter notebook (Linux/macOS/Windows with Python 3.11+)
**Project Type**: Single-file Python script (backend/agent.py)
**Performance Goals**: <10 seconds per query (SC-001), supports ≥5 conversation turns (SC-004)
**Constraints**:
- No web server/API required (FR-009)
- Single file implementation (FR-008)
- Reuse existing backend dependencies (user requirement)
- Session-only memory (no persistence)

**Scale/Scope**:
- Single developer CLI tool
- ~300-400 lines of code (estimated based on test_retrieval.py size)
- 12+ test queries covering all textbook modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Technical Accuracy & Industry Alignment
- ✅ **Compliant**: Uses OpenAI Agents SDK (industry-standard agent framework)
- ✅ **Compliant**: Reuses validated Qdrant + Cohere embeddings from Spec 001/002
- ✅ **Compliant**: Grounded responses prevent hallucination (FR-005, FR-011)

### Principle II: Modular, Extensible Content Architecture
- ✅ **Compliant**: Single-file architecture keeps scope bounded (backend/agent.py)
- ✅ **Compliant**: Reuses existing modules (no modifications to Spec 001 pipeline)
- ✅ **Compliant**: Custom retrieval tool is composable (can be extracted later)

### Principle III: Accessibility & Inclusive Design
- ⚠️ **Partial**: CLI-only interface (not web-accessible initially)
- ✅ **Justification**: MVP phase - web frontend planned for future (constitution allows incremental delivery per Principle VII)

### Principle IV: Deployment-First Development
- ✅ **Compliant**: No deployment needed (local CLI tool)
- ✅ **Compliant**: Uses existing backend/ dependencies (already pinned in pyproject.toml)

### Principle V: Privacy-Respecting Personalization
- ✅ **Compliant**: No user data collection (session-only memory)
- ✅ **Compliant**: No tracking or analytics (local CLI execution)

### Principle VI: Semantic Content for RAG Intelligence
- ✅ **Compliant**: Agent retrieves from semantically-structured textbook (Spec 001)
- ✅ **Compliant**: Source citations (FR-006) enable verification and trust

### Principle VII: Iterative, Testable Delivery
- ✅ **Compliant**: Single vertical slice (agent with retrieval + citations + memory)
- ✅ **Compliant**: Manual acceptance testing via CLI (FR-009)
- ✅ **Compliant**: Testable success criteria (SC-001 to SC-007)

**GATE STATUS**: ✅ PASS (1 partial compliance justified by MVP scope)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── agent.py              # NEW: RAG-powered agent with OpenAI Agents SDK
├── main.py               # Existing: RAG ingestion pipeline (Spec 001)
├── test_retrieval.py     # Existing: Retrieval validation (Spec 002)
├── verify_qdrant.py      # Existing: Connection verification helper
├── query_test.py         # Existing: Manual query testing helper
├── pyproject.toml        # Existing: UV dependencies (add openai + agents SDK)
├── .env.example          # Existing: Add OPENAI_API_KEY documentation
├── .env                  # Existing: User adds OPENAI_API_KEY
├── README.md             # Update: Add agent.py usage section
└── .venv/                # Existing: Virtual environment

specs/003-rag-agent/
├── spec.md               # Feature specification
├── plan.md               # This file
├── research.md           # Phase 0 output (to be created)
├── data-model.md         # Phase 1 output (to be created)
├── quickstart.md         # Phase 1 output (to be created)
└── contracts/            # Phase 1 output (to be created)
    └── agent-functions.md
```

**Structure Decision**: Extends existing backend/ structure from Spec 001/002. Single-file implementation (agent.py) alongside existing RAG infrastructure. No new directories or test frameworks needed (manual CLI testing per FR-009). Dependencies managed via existing pyproject.toml.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - all complexity justified by spec requirements.

N/A - No constitution violations to track.

---

## Post-Design Constitution Re-Evaluation

*Re-check after Phase 1 design (research.md, data-model.md, contracts/, quickstart.md complete)*

### Updated Technical Context

**Primary Dependencies** (resolved from research.md):
- ✅ `openai-agents` package (v0.6.7+) - OpenAI Agents SDK
- ✅ `openai` - GPT-4/GPT-3.5 model access
- ✅ `cohere` - embed-multilingual-v3.0 (existing)
- ✅ `qdrant-client` - vector search (existing)
- ✅ `python-dotenv` - environment variables (existing)

**NEEDS CLARIFICATION**: All items resolved in research.md Decision 1-8.

### Constitution Compliance Re-Check

#### Principle I: Technical Accuracy & Industry Alignment
- ✅ **Compliant**: OpenAI Agents SDK is industry-standard framework (Decision 1)
- ✅ **Compliant**: GPT-4 model selection based on best practices (Decision 7)
- ✅ **Compliant**: Reuses validated retrieval logic from Spec 002 (Decision 8)
- ✅ **Compliant**: Citation format follows academic standards (Decision 4)

#### Principle II: Modular, Extensible Content Architecture
- ✅ **Compliant**: RetrievalTool is composable (can be extracted to shared module later)
- ✅ **Compliant**: Agent instructions isolated in constants (easy to modify)
- ✅ **Compliant**: Session storage pluggable (SQLite → PostgreSQL upgrade path)

#### Principle III: Accessibility & Inclusive Design
- ⚠️ **Partial**: CLI-only interface (no web accessibility)
- ✅ **Justification Updated**: MVP scope per Principle VII (incremental delivery). Web frontend is planned future enhancement (would enable screen readers, mobile access).
- ✅ **Mitigation**: CLI tool accessible via standard terminal (screen reader compatible)

#### Principle IV: Deployment-First Development
- ✅ **Compliant**: No deployment needed (local CLI tool)
- ✅ **Compliant**: Dependencies pinned via uv.lock (generated by UV)
- ✅ **Future Path**: Web version deployable to Vercel (frontend) + Cloud Run (backend API)

#### Principle V: Privacy-Respecting Personalization
- ✅ **Compliant**: Session data stored locally (SQLite file)
- ✅ **Compliant**: No user tracking or analytics
- ✅ **Compliant**: Conversation history deletable (rm robotics_chatbot.db)

#### Principle VI: Semantic Content for RAG Intelligence
- ✅ **Compliant**: Retrieval uses semantically-structured textbook (Spec 001)
- ✅ **Compliant**: Agent instructions emphasize citation transparency
- ✅ **Compliant**: Metadata (URL, title, heading) preserved in responses

#### Principle VII: Iterative, Testable Delivery
- ✅ **Compliant**: Single vertical slice (agent with all 3 user stories)
- ✅ **Compliant**: Manual testing checklist in quickstart.md
- ✅ **Compliant**: Success criteria measurable (SC-001 to SC-007)

**FINAL GATE STATUS**: ✅ PASS (all principles compliant or justified)

---

## Phase Artifacts Summary

### Phase 0: Research ✅ Complete

**Artifact**: `research.md`

**Decisions Made**:
1. OpenAI Agents SDK package (`openai-agents` v0.6.7+)
2. Custom retrieval tool pattern (`@function_tool` decorator)
3. Conversation memory (SQLiteSession)
4. Agent instructions for grounded responses
5. CLI execution (Runner.run_sync)
6. Error handling strategy
7. Model selection (GPT-4 default)
8. Code reuse from test_retrieval.py

**Outcome**: All "NEEDS CLARIFICATION" items resolved. Ready for implementation.

---

### Phase 1: Design ✅ Complete

**Artifacts**:
- `data-model.md` - 4 core entities (Agent, RetrievalTool, ConversationTurn, Citation)
- `contracts/agent-functions.md` - 7 public functions + 1 tool function
- `quickstart.md` - Complete user guide with examples and troubleshooting

**Key Design Decisions**:
- **Entities**: Agent (stateless), RetrievalTool (function), ConversationTurn (session-managed), Citation (markdown link)
- **Functions**: Reuse 4 functions from test_retrieval.py, add 4 new functions
- **Performance**: 3-6s per query (well under <10s requirement)
- **Memory**: Unlimited conversation turns (context window limited by model)

**Outcome**: Complete implementation blueprint. Estimated ~200-300 lines of code.

---

## Implementation Readiness

**Status**: ✅ Ready for `/sp.tasks` command

**Prerequisites Complete**:
- [X] Spec 001: RAG ingestion pipeline (Qdrant collection exists)
- [X] Spec 002: RAG validation (retrieval functions tested)
- [X] Spec 003 Spec: Feature requirements defined
- [X] Spec 003 Plan: Architecture and design complete
- [X] Research: All technical unknowns resolved
- [X] Data Model: Entities and relationships documented
- [X] Contracts: Function signatures and behavior defined
- [X] Quickstart: User guide and testing checklist ready

**Next Command**: `/sp.tasks` to generate task breakdown for implementation.

**Estimated Implementation Effort**:
- Setup: Install openai-agents, update .env (5 minutes)
- Core Implementation: 7 functions, ~200 lines (2-3 hours)
- Testing: Manual CLI testing with 12 queries (30 minutes)
- Documentation: Update backend/README.md (15 minutes)
- **Total**: ~3-4 hours for single developer

---

## Risk Analysis

### Technical Risks

**Risk 1: OpenAI API Rate Limits**
- **Probability**: Low (standard tier: 3,500 RPM for GPT-4)
- **Impact**: Medium (CLI tool unusable during rate limit)
- **Mitigation**: Add retry logic with exponential backoff (agents SDK has built-in)
- **Contingency**: Switch to GPT-3.5-turbo (higher rate limits)

**Risk 2: GPT-3.5 Citation Quality**
- **Probability**: Medium (GPT-3.5 less reliable for structured output)
- **Impact**: Medium (missing citations violate FR-006)
- **Mitigation**: Default to GPT-4, document GPT-3.5 as cost-saving option
- **Contingency**: Add post-processing to validate citations present

**Risk 3: Session File Corruption**
- **Probability**: Low (SQLite robust)
- **Impact**: Low (user can delete and restart)
- **Mitigation**: Document session reset process in quickstart.md
- **Contingency**: Add session validation on startup

**Risk 4: Retrieval Returns No Results**
- **Probability**: Medium (for very specific or off-topic queries)
- **Impact**: Low (agent gracefully handles per Decision 6)
- **Mitigation**: Agent instructions include "no results" handling
- **Contingency**: User rephrases query or checks textbook coverage

### Dependency Risks

**Risk 1: OpenAI Agents SDK Breaking Changes**
- **Probability**: Medium (v0.6.7 pre-1.0, API may change)
- **Impact**: High (agent.py may break on SDK update)
- **Mitigation**: Pin openai-agents version in pyproject.toml
- **Contingency**: Maintain compatibility with specific SDK version

**Risk 2: Cohere/Qdrant API Downtime**
- **Probability**: Low (99.9% uptime SLAs)
- **Impact**: High (agent cannot retrieve)
- **Mitigation**: Error handling returns user-friendly message (Decision 6)
- **Contingency**: Document offline mode (use GPT-4 knowledge without retrieval)

### User Experience Risks

**Risk 1: Conversation Context Overflow**
- **Probability**: Medium (long conversations exceed context window)
- **Impact**: Medium (agent loses early context)
- **Mitigation**: Document context limits in quickstart.md
- **Contingency**: Implement context summarization (future enhancement)

**Risk 2: Poor Citation Click-Through**
- **Probability**: Low (URLs validated in Spec 001)
- **Impact**: Medium (user can't verify sources)
- **Mitigation**: Test citation URLs in acceptance testing
- **Contingency**: Add URL validation in retrieval tool

---

## Success Metrics Tracking

**How to Measure** (per SC-001 to SC-007):

1. **SC-001: <10s per query**
   - Measure: Time each query with `time` command
   - Target: 100% of queries < 10s
   - Tracking: Manual timing during testing

2. **SC-002: Zero fabricated facts**
   - Measure: Manual review of responses vs textbook content
   - Target: 0 fabricated facts in 12 test queries
   - Tracking: Checklist in quickstart.md

3. **SC-003: 100% citation rate**
   - Measure: Count citations in responses using textbook content
   - Target: Every textbook-based response has ≥1 citation
   - Tracking: Manual review during testing

4. **SC-004: ≥5 conversation turns**
   - Measure: Test multi-turn conversation (e.g., 7 turns)
   - Target: Agent maintains context through turn 5+
   - Tracking: Follow-up question test in quickstart.md

5. **SC-005: 90% retrieval success**
   - Measure: 12 in-scope queries from Spec 002
   - Target: ≥11 queries return relevant results
   - Tracking: Reuse test_retrieval.py validation

6. **SC-006: 100% out-of-scope acknowledgment**
   - Measure: Test 3 off-topic queries ("weather", "stock price", etc.)
   - Target: 3/3 queries acknowledged as out-of-scope
   - Tracking: Edge case testing in quickstart.md

7. **SC-007: CLI runnable**
   - Measure: `uv run python agent.py` succeeds
   - Target: Runs without errors on fresh environment
   - Tracking: Fresh install test on clean VM

---

## Architecture Decision Records (ADR) Candidates

Based on significant decisions made during planning:

### ADR 1: OpenAI Agents SDK vs LangChain *(Suggested)*

**Decision**: Use OpenAI Agents SDK instead of LangChain for agent framework

**Context**: Need agent orchestration with tool calling and conversation memory

**Rationale**:
- Lighter weight (~100MB vs ~500MB for LangChain)
- Built-in session management (SQLiteSession, etc.)
- Native OpenAI integration (no abstraction overhead)
- Simpler API for single-tool agent

**Consequences**:
- Locked into OpenAI ecosystem (can't easily switch to Anthropic/Google models)
- Less mature than LangChain (v0.6 vs LangChain v0.1+)
- Smaller community and fewer examples

**Alternatives Considered**:
- LangChain: Rejected due to complexity overhead
- Raw OpenAI Function Calling: Rejected due to no conversation memory
- Custom Agent Loop: Rejected due to reinventing wheels

**Status**: Implemented in research.md Decision 1

📋 **Architectural decision detected**: OpenAI Agents SDK selection for tool orchestration framework
Document reasoning and tradeoffs? Run `/sp.adr "OpenAI Agents SDK vs LangChain"`

---

### ADR 2: SQLite vs In-Memory Conversation Storage *(Optional)*

**Decision**: Use SQLiteSession for conversation persistence

**Context**: Need to maintain conversation history across multiple turns

**Rationale**:
- Persists conversations across script restarts
- Simple file-based storage (no database server)
- Built into OpenAI Agents SDK (zero setup)

**Consequences**:
- Session file can become large for very long conversations
- Not suitable for multi-user scenarios (single session file)
- File corruption possible (though unlikely with SQLite)

**Alternatives Considered**:
- In-Memory List: Rejected due to no persistence
- PostgreSQL: Rejected as overkill for single-user CLI
- Redis: Rejected due to external dependency

**Status**: Lower priority (straightforward decision, well-documented in research.md Decision 3)

---

## Next Steps

1. **Run `/sp.tasks`**: Generate task breakdown for implementation
   - Tasks will be organized by user story (P1 → P2 → P3)
   - Each task will reference contracts/agent-functions.md
   - Manual testing approach per spec requirements

2. **Implement `backend/agent.py`**:
   - Follow contracts/agent-functions.md function signatures
   - Reuse code from test_retrieval.py where possible
   - Add INSTRUCTIONS constant for agent system prompt

3. **Update `backend/.env.example`**:
   - Add OPENAI_API_KEY documentation
   - Add OPENAI_MODEL optional variable

4. **Update `backend/README.md`**:
   - Add section for agent.py usage
   - Link to specs/003-rag-agent/quickstart.md

5. **Manual Testing**:
   - Follow quickstart.md testing checklist
   - Verify all 3 user stories work
   - Test edge cases (off-topic, errors, multi-turn)

6. **Optional: Create ADR**:
   - Document OpenAI Agents SDK selection (ADR 1)
   - Run `/sp.adr "OpenAI Agents SDK vs LangChain"`

---

**Plan Status**: ✅ Complete
**Date Completed**: 2026-01-16
**Ready for**: `/sp.tasks` command
