# Implementation Plan: RAG Retrieval Validation

**Branch**: `002-rag-validation` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rag-validation/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a validation script (`backend/test_retrieval.py`) to verify RAG pipeline retrieval quality before agent integration. The script will test semantic search using predefined student queries from the 13-week syllabus, calculate precision@k metrics against ground-truth query-document pairs, and display results with complete metadata (URL, title, heading context). Implementation reuses the existing Qdrant collection (`robotics_textbook`) and Cohere embed-multilingual-v3.0 embeddings from Spec 001.

## Technical Context

**Language/Version**: Python 3.10+ (consistent with Spec 001 backend implementation)
**Primary Dependencies**: cohere (SDK), qdrant-client (Python client), python-dotenv (env vars)
**Storage**: Qdrant Cloud (existing `robotics_textbook` collection created by Spec 001)
**Testing**: Manual validation (visual inspection of retrieval results, no automated test framework)
**Target Platform**: Command-line script (Linux/WSL, macOS, Windows compatible)
**Project Type**: Single-file utility script (`backend/test_retrieval.py`)
**Performance Goals**: Complete 10-15 test queries within 30 seconds total runtime
**Constraints**:
- Must use existing Qdrant collection without modification
- Must use Cohere embed-multilingual-v3.0 with `input_type="search_query"`
- Single file implementation (no separate modules)
- Human-readable text output (no GUI)
- 1-day implementation timeline
**Scale/Scope**: 10-15 curated test queries, retrieve top-3 results per query, calculate precision@3/precision@5 metrics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Technical Accuracy & Industry Alignment
✅ **PASS** - Uses industry-standard tools (Cohere embeddings, Qdrant vector search) aligned with RAG best practices. All retrieval methods follow semantic search conventions.

### Principle II: Modular, Extensible Content Architecture
✅ **PASS** - Single-file validation script can be run independently. No dependencies on other features beyond existing Qdrant collection. Clear separation between ingestion (Spec 001) and validation (this spec).

### Principle III: Accessibility & Inclusive Design
✅ **PASS** - Command-line script accessible via terminal on any platform. Results displayed in readable text format. No GUI barriers.

### Principle IV: Deployment-First Development
✅ **PASS** - Script runs locally without deployment infrastructure. Uses existing deployed textbook site's embedded content via Qdrant Cloud. No CI/CD changes required.

### Principle V: Privacy-Respecting Personalization
✅ **PASS** - No user data collection. Validation script queries static Qdrant collection. No analytics, tracking, or logging of user behavior.

### Principle VI: Semantic Content for RAG Intelligence
✅ **PASS** - Validates that RAG retrieval correctly surfaces semantic content from textbook. Test queries use natural language patterns students would ask. Verifies metadata (headings, titles) is preserved.

### Principle VII: Iterative, Testable Delivery
✅ **PASS** - Single vertical slice: validation script with clear acceptance criteria (precision@3 ≥70%, top-1 relevance ≥80%). Testable via running script and reviewing output.

**Gate Status**: ✅ ALL CHECKS PASSED - Proceed to Phase 0

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
├── main.py                   # RAG ingestion pipeline (Spec 001)
├── test_retrieval.py         # THIS FEATURE - Validation script
├── verify_qdrant.py          # Connection verification (Spec 001)
├── query_test.py             # Manual query testing (Spec 001)
├── .env                      # API credentials (not committed)
├── .env.example              # Credential template
├── .gitignore                # Excludes .env, cache files
├── pyproject.toml            # UV project metadata
└── README.md                 # Setup guide
```

**Structure Decision**: Single-file utility script in existing `backend/` directory. Reuses the same environment variables (`.env`), dependencies (`pyproject.toml`), and Qdrant collection as Spec 001. No new directories or sub-modules required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - All 7 constitution principles passed. No complexity justification required.

---

## Phase 0: Research (Complete)

**Status**: ✅ Complete
**Output**: [research.md](./research.md)

**Key Decisions**:
1. Test Query Source: 12 manually curated queries from 13-week syllabus
2. Precision@k: Calculate precision@3 and precision@5 with manual ground-truth (5-7 queries)
3. Similarity Threshold: No hard threshold; flag scores <0.4 as low confidence
4. Output Format: Human-readable text with per-query sections and summary statistics
5. Cohere Configuration: Use `input_type="search_query"` for query embeddings
6. Error Handling: Graceful failures with clear messages for connection/API errors
7. Ground-Truth: Manual definition by inspecting deployed site URLs
8. Execution Flow: Sequential processing (validate → connect → query → report)
9. Dependencies: Reuse all from Spec 001 (no new dependencies)
10. Test Queries: 12 queries covering ROS 2, Digital Twin, Isaac, VLA, Capstone

---

## Phase 1: Design (Complete)

**Status**: ✅ Complete
**Outputs**:
- [data-model.md](./data-model.md) - 5 entities defined
- [contracts/validation-functions.md](./contracts/validation-functions.md) - 8 function contracts
- [quickstart.md](./quickstart.md) - User guide for running validation

**Data Model Entities**:
1. **TestQuery**: Query text, category, expected topics
2. **RetrievalResult**: Rank, score, URL, title, heading, text, token count
3. **GroundTruthMapping**: Query → relevant URLs for precision calculation
4. **PrecisionMetric**: Query precision@k results
5. **ValidationReport**: Aggregated summary with pass/fail status

**Function Contracts**:
1. `validate_environment()` - Check env vars
2. `initialize_clients()` - Connect to Cohere and Qdrant
3. `generate_query_embedding()` - Cohere embed API call
4. `search_qdrant()` - Top-k vector search
5. `calculate_precision_at_k()` - Precision metric calculation
6. `display_query_results()` - Format per-query output
7. `display_summary_report()` - Aggregate statistics and pass/fail
8. `main()` - Orchestrate complete workflow

**Agent Context**: Updated CLAUDE.md with Python 3.10+, cohere, qdrant-client, Qdrant Cloud

---

## Constitution Check Re-evaluation (Post-Design)

*Re-checking all 7 principles after completing Phase 1 design:*

### Principle I: Technical Accuracy & Industry Alignment
✅ **PASS** - Function contracts follow RAG retrieval best practices (query embeddings, vector search, precision@k metrics). All APIs (Cohere, Qdrant) used according to official documentation.

### Principle II: Modular, Extensible Content Architecture
✅ **PASS** - Clear separation of concerns via 8 functions. Each function has single responsibility (validate, connect, embed, search, calculate, display). Script can be extended (e.g., add --json flag) without breaking existing functionality.

### Principle III: Accessibility & Inclusive Design
✅ **PASS** - Quickstart guide provides step-by-step instructions. Error messages are clear and actionable (e.g., "Run 'uv run python backend/main.py' to create collection"). Terminal output works on all platforms.

### Principle IV: Deployment-First Development
✅ **PASS** - No deployment changes required. Script runs against already-deployed Qdrant Cloud collection. Can be used immediately after implementation without CI/CD updates.

### Principle V: Privacy-Respecting Personalization
✅ **PASS** - Zero data collection. Script outputs to stdout only (no file persistence). No logging of queries or results unless user manually redirects output.

### Principle VI: Semantic Content for RAG Intelligence
✅ **PASS** - Design validates semantic search quality. Test queries mirror natural student questions. Precision@k metrics quantify semantic relevance. Metadata display confirms heading/title context preservation.

### Principle VII: Iterative, Testable Delivery
✅ **PASS** - Quickstart guide provides clear testing steps. Success criteria measurable (precision@3 ≥70%, 80% relevance). Manual validation approach suitable for single-script implementation.

**Post-Design Gate Status**: ✅ ALL CHECKS PASSED - Ready for Phase 2 (Tasks)

---

## Next Steps

1. Run `/sp.tasks` to generate task breakdown for implementation
2. Implement `backend/test_retrieval.py` following function contracts
3. Test with 12 curated queries against existing Qdrant collection
4. Verify precision@3 ≥70% and 80% relevance criteria
5. Document results and proceed to agent integration (future spec)
