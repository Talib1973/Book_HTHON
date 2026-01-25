---
id: 0002
title: Create RAG validation implementation plan
stage: plan
date: 2026-01-16
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-rag-validation
branch: 002-rag-validation
user: Talib1073
command: /sp.plan
labels: ["rag", "validation", "planning", "design", "contracts"]
links:
  spec: ../../specs/002-rag-validation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-rag-validation/plan.md (created - complete implementation plan)
  - specs/002-rag-validation/research.md (created - 10 technical decisions)
  - specs/002-rag-validation/data-model.md (created - 5 entities)
  - specs/002-rag-validation/contracts/validation-functions.md (created - 8 function contracts)
  - specs/002-rag-validation/quickstart.md (created - user guide)
  - CLAUDE.md (updated - added Python 3.10+, cohere, qdrant-client)
tests:
  - Constitution Check: 7/7 principles passed (pre-design)
  - Constitution Check Re-evaluation: 7/7 principles passed (post-design)
---

## Prompt

/sp.plan

(No additional arguments - standard planning workflow for feature 002-rag-validation)

## Response snapshot

Executed complete planning workflow for RAG validation feature:

**Phase 0 - Research (10 Technical Decisions)**:
1. Test Query Source: 12 manually curated queries from 13-week syllabus, organized by topic
2. Precision@k Method: Manual ground-truth for 5-7 queries, calculate precision@3 and precision@5
3. Similarity Threshold: No hard threshold; flag scores <0.4 as low confidence
4. Output Format: Human-readable text with per-query sections and summary statistics
5. Cohere Config: Use `input_type="search_query"` for query embeddings (vs `search_document` for ingestion)
6. Error Handling: Graceful failures for connection, API, empty collection, missing env vars
7. Ground-Truth Strategy: Manual definition by inspecting deployed site URLs
8. Execution Flow: Sequential (validate env → connect → query → report)
9. Dependencies: Reuse all from Spec 001 (cohere, qdrant-client, python-dotenv)
10. Test Queries: 12 queries spanning ROS 2 (3), Digital Twin (3), Isaac (3), VLA (2), Capstone (1)

**Phase 1 - Design**:
- **Data Model** (5 entities):
  - TestQuery: query text, category, expected topics
  - RetrievalResult: rank, score, URL, title, heading, text, token count
  - GroundTruthMapping: query → relevant URLs
  - PrecisionMetric: precision@k calculation results
  - ValidationReport: aggregated summary with pass/fail status

- **Function Contracts** (8 functions):
  - validate_environment() → Dict[str, str]
  - initialize_clients(env_vars) → Tuple[cohere.Client, QdrantClient]
  - generate_query_embedding(query, client) → List[float]
  - search_qdrant(embedding, client, k) → List[RetrievalResult]
  - calculate_precision_at_k(retrieved, relevant, k) → float
  - display_query_results(query, category, results, rank, total) → None
  - display_summary_report(all_results, precision_metrics) → bool
  - main() → int (exit code)

- **Quickstart Guide**: Step-by-step instructions for running validation script, interpreting results, troubleshooting errors

**Technical Context**:
- Language: Python 3.10+
- Dependencies: cohere, qdrant-client, python-dotenv (reused from Spec 001)
- Storage: Qdrant Cloud (existing `robotics_textbook` collection)
- Performance: <30s for 12 queries
- Constraints: Single-file script, no GUI, manual validation

**Constitution Check**: All 7 principles passed both pre-design and post-design gates

## Outcome

- ✅ Impact: Complete implementation plan with research, data model, function contracts, and user guide
- 🧪 Tests: Constitution Check 7/7 passed (pre-design and post-design)
- 📁 Files: 6 files created (plan.md, research.md, data-model.md, contracts/, quickstart.md, updated CLAUDE.md)
- 🔁 Next prompts: Run `/sp.tasks` to generate task breakdown → `/sp.implement` to build test_retrieval.py
- 🧠 Reflection: Clean design with minimal complexity. Reusing Spec 001 infrastructure (Qdrant collection, env vars, dependencies) eliminates setup overhead. Single-file constraint maintains simplicity while 8-function structure ensures modularity. Manual validation approach appropriate for 1-day timeline and development/testing use case.

## Evaluation notes (flywheel)

- Failure modes observed: None - duplicate spec directory (002-robotics-textbook) was cleaned up before planning
- Graders run and results (PASS/FAIL): Constitution Check PASS (7/7 principles, both pre- and post-design)
- Prompt variant (if applicable): Standard /sp.plan workflow with Phase 0 research and Phase 1 design
- Next experiment (smallest change to try): Implement test_retrieval.py following function contracts, test with 12 queries, validate precision@3 ≥70% and 80% relevance criteria met
