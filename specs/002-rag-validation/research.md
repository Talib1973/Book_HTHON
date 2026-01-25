# Research & Technical Decisions - RAG Validation

**Feature**: 002-rag-validation
**Date**: 2026-01-16
**Phase**: Phase 0 (Planning)

## Overview

This document captures technical decisions for implementing a RAG retrieval validation script that tests semantic search quality before agent integration.

## Decision 1: Test Query Source and Structure

**Decision**: Curate 10-15 test queries manually based on the 13-week syllabus, organized by topic category (ROS 2, Digital Twin, NVIDIA Isaac, VLA, Capstone).

**Rationale**:
- Manual curation ensures queries reflect realistic student questions
- Syllabus-based queries guarantee coverage of all textbook topics
- Topic categorization enables analysis of retrieval performance by domain

**Alternatives Considered**:
1. **Random keyword queries** - Rejected because generic keywords don't reflect natural language usage patterns
2. **Automatically generated queries via LLM** - Rejected for initial version due to 1-day timeline; manual curation is faster
3. **User-submitted queries from production logs** - Rejected because no production system exists yet

**Implementation Approach**:
- Define queries as Python list of dictionaries: `{"query": str, "category": str, "expected_topics": List[str]}`
- Categories: "ROS 2", "Digital Twin (Gazebo/Unity)", "NVIDIA Isaac", "VLA", "Capstone", "General"
- Expected topics used for manual validation (not automated ground-truth matching initially)

---

## Decision 2: Precision@k Calculation Method

**Decision**: Implement precision@k for k=3 and k=5 using manually defined ground-truth relevant document URLs per query.

**Rationale**:
- Precision@k is standard IR metric for evaluating retrieval quality
- k=3 and k=5 align with typical RAG retrieval limits (agents use top-3 to top-5 chunks)
- Manual ground-truth ensures accuracy (automated labeling would require additional embedding similarity thresholds)

**Alternatives Considered**:
1. **MRR (Mean Reciprocal Rank)** - Rejected because precision@k is more interpretable for stakeholders
2. **NDCG (Normalized Discounted Cumulative Gain)** - Rejected due to complexity; requires relevance scores beyond binary relevant/not-relevant
3. **Fully automated ground-truth via embedding similarity** - Rejected because circular logic (using embeddings to validate embeddings)

**Implementation Approach**:
- Ground-truth defined as: `{"query": str, "relevant_urls": List[str]}`
- Precision@k = (# relevant docs in top-k) / k
- Calculate precision@3 and precision@5 for each query, report average across all queries
- Flag queries with precision@3 < 0.5 as "needs investigation"

**Validation Strategy**:
- For initial version, define ground-truth for 5-7 representative queries (subset of 10-15 total)
- Remaining queries validated manually by inspecting top-3 results

---

## Decision 3: Retrieval Similarity Threshold

**Decision**: No hard similarity threshold; retrieve top-k results and display scores for manual review. Flag results with score <0.4 as "low confidence".

**Rationale**:
- Qdrant cosine similarity scores range 0-1; thresholds vary by domain
- Displaying all top-k results with scores enables iterative threshold tuning
- Flagging low scores (<0.4) helps identify queries that need better phrasing or missing content

**Alternatives Considered**:
1. **Hard threshold (e.g., score ≥0.5 required)** - Rejected because may exclude valid results in edge cases
2. **Dynamic threshold based on score distribution** - Rejected due to complexity for single-script implementation
3. **No flagging, display all scores** - Rejected because doesn't highlight potential issues

**Implementation Approach**:
- Retrieve top-k results unconditionally
- Display score alongside each result
- Print warning if top-1 score <0.4: "⚠️ Low confidence - consider rephrasing query or adding content"

---

## Decision 4: Output Format and Verbosity

**Decision**: Human-readable text output with sections per query, showing: query text, top-3 results with metadata (score, URL, title, heading, text preview), and summary statistics at the end.

**Rationale**:
- Text output is platform-agnostic (works in any terminal)
- Structured sections enable easy navigation through multiple queries
- Summary statistics provide at-a-glance quality assessment

**Alternatives Considered**:
1. **JSON output** - Rejected for primary mode because harder to read; could add `--json` flag in future
2. **CSV export** - Rejected because metadata (text previews) would be truncated
3. **HTML report** - Rejected due to 1-day timeline; text-first approach is faster

**Output Structure**:
```text
=============================================================
RAG Retrieval Validation Report
=============================================================
Collection: robotics_textbook
Total Queries: 12
Date: 2026-01-16

─────────────────────────────────────────────────────────────
Query 1/12: "How do I set up a ROS 2 workspace?"
Category: ROS 2
─────────────────────────────────────────────────────────────

Top 3 Results:

1. Score: 0.6523
   Title: Week 1: ROS 2 Setup and Installation
   Heading: Creating Your First Workspace
   URL: https://book-hthon.vercel.app/docs/module1-ros2/week1-setup
   Text: "To set up a ROS 2 workspace, you need to create a directory structure that organizes your packages..."

2. Score: 0.5891
   ...

[Repeat for all queries]

─────────────────────────────────────────────────────────────
Summary Statistics
─────────────────────────────────────────────────────────────
Average Top-1 Score: 0.62
Queries with Top-1 Score ≥0.5: 10/12 (83%)
Precision@3 (5 ground-truth queries): 0.73
Precision@5 (5 ground-truth queries): 0.68

✅ PASS: Retrieval quality meets success criteria (80% relevance, ≥70% precision@3)
```

---

## Decision 5: Cohere API Configuration

**Decision**: Use Cohere embed-multilingual-v3.0 with `input_type="search_query"` (consistent with Spec 001 document embeddings which use `input_type="search_document"`).

**Rationale**:
- Cohere's API distinguishes between query and document embeddings for optimal retrieval
- Using `search_query` for test queries ensures embeddings are optimized for matching against stored documents
- Consistency with Spec 001's `search_document` type

**Alternatives Considered**:
1. **Same `input_type` for both query and docs** - Rejected; Cohere docs recommend separate types for better retrieval accuracy
2. **Different embedding model** - Rejected; must use same model as ingestion pipeline to ensure compatibility

**Implementation Approach**:
```python
query_response = cohere_client.embed(
    texts=[query_text],
    model="embed-multilingual-v3.0",
    input_type="search_query"
)
query_embedding = query_response.embeddings[0]
```

---

## Decision 6: Error Handling and Edge Cases

**Decision**: Implement graceful error handling for: Qdrant connection failures, Cohere API errors, empty collection, and missing environment variables.

**Rationale**:
- Script must be robust for demo purposes (hackathon judges may test error scenarios)
- Clear error messages reduce debugging time for future developers
- Early validation (check env vars, test connection) prevents partial failures

**Error Handling Strategy**:
- **Missing env vars**: Exit with message listing required variables and referencing `.env.example`
- **Qdrant connection failure**: Print connection error, suggest checking `QDRANT_URL` and `QDRANT_API_KEY`
- **Empty collection**: Print warning, suggest running `backend/main.py` to populate collection
- **Cohere API error**: Retry up to 3 times with exponential backoff (reuse tenacity decorator pattern from Spec 001)
- **No results for query**: Display message "No results found (collection may not contain relevant content for this query)"

**Implementation Approach**:
- Validate env vars at script startup
- Test Qdrant connection before processing queries
- Wrap Cohere API calls in try/except with retry logic
- Handle zero results gracefully (not an error, just display message)

---

## Decision 7: Ground-Truth Definition Strategy

**Decision**: Define ground-truth for a subset of 5-7 queries manually by inspecting the deployed textbook site and identifying relevant page URLs.

**Rationale**:
- Manual ground-truth ensures accuracy (automated approaches may miss nuances)
- 5-7 queries sufficient for calculating representative precision@k metrics
- Remaining queries validated qualitatively (manual inspection of top-3 results)

**Ground-Truth Sources**:
- Syllabus structure: `docs/module1-ros2/`, `docs/module2-digital-twin/`, etc.
- Deployed site sitemap: https://book-hthon.vercel.app/sitemap.xml
- Manual review of page content to confirm relevance

**Example Ground-Truth Entry**:
```python
{
    "query": "How do I set up a ROS 2 workspace?",
    "relevant_urls": [
        "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup",
        "https://book-hthon.vercel.app/docs/intro"
    ]
}
```

---

## Decision 8: Script Execution Flow

**Decision**: Implement single-function script with main execution flow: validate env → connect to services → process queries → calculate metrics → display report.

**Rationale**:
- Single-file constraint requires clear execution flow without complex module organization
- Sequential processing (one query at a time) simplifies debugging
- Clear separation between setup, processing, and reporting phases

**Execution Flow**:
```text
1. Load environment variables (COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY)
2. Validate required variables are present
3. Initialize Cohere and Qdrant clients
4. Test Qdrant connection and verify collection exists
5. Define test queries and ground-truth mappings
6. For each query:
   a. Generate query embedding via Cohere
   b. Search Qdrant collection for top-k results
   c. Display results with metadata
   d. Calculate precision@k if ground-truth available
7. Display summary statistics
8. Exit with status code 0 (success) or 1 (failures detected)
```

---

## Decision 9: Dependencies and Reuse

**Decision**: Reuse all dependencies from Spec 001 (cohere, qdrant-client, python-dotenv). No new dependencies required.

**Rationale**:
- All required functionality available in existing dependencies
- Minimizes dependency bloat and installation complexity
- Consistent with 1-day timeline (no time to evaluate new libraries)

**Dependency Versions** (from Spec 001 `pyproject.toml`):
- `cohere` - Latest compatible with embed-multilingual-v3.0 API
- `qdrant-client` - Latest with `query_points()` method
- `python-dotenv` - For `.env` file loading

**No Additional Dependencies Needed**:
- No web framework (FastAPI/Flask) - CLI script only
- No testing framework (pytest) - Manual validation approach
- No data processing libraries (pandas) - Simple Python lists/dicts sufficient

---

## Decision 10: Test Query Examples (Curated List)

**Decision**: Define the following 12 test queries covering all syllabus modules:

**ROS 2 Module (3 queries)**:
1. "How do I set up a ROS 2 workspace?"
2. "ROS 2 publisher subscriber pattern"
3. "What are ROS 2 services and actions?"

**Digital Twin Module (3 queries)**:
4. "Setting up Gazebo simulation for robotics"
5. "How to create URDF files for robot models?"
6. "Unity ML-Agents integration with ROS"

**NVIDIA Isaac Module (3 queries)**:
7. "Getting started with NVIDIA Isaac Sim"
8. "Isaac Gym reinforcement learning tutorial"
9. "Generating synthetic data for robot vision"

**VLA Module (2 queries)**:
10. "What are Vision-Language-Action models?"
11. "RT-1 and RT-2 architectures explained"

**Capstone/General (1 query)**:
12. "Building an autonomous humanoid robot project"

**Rationale**:
- Covers all 4 major modules plus capstone
- Mix of "how-to" questions and conceptual queries
- Natural language phrasing (realistic student questions)
- Sufficient diversity to test retrieval across different topics

---

## Open Questions / Future Enhancements

1. **Automated ground-truth generation**: Could use embedding similarity to auto-label relevant docs, but requires validation
2. **Query expansion**: Adding synonyms or related terms to improve recall (out of scope for v1)
3. **Re-ranking strategies**: Using cross-encoders or LLM-based re-ranking (out of scope for 1-day timeline)
4. **Interactive mode**: Allow user to input custom queries at runtime (could add in future via `--interactive` flag)
5. **JSON export**: Add `--json` flag to output results in JSON format for programmatic analysis

---

## References

- Cohere Embed API: https://docs.cohere.com/reference/embed
- Qdrant Python Client: https://qdrant.tech/documentation/python-client/
- Information Retrieval Metrics: https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)
- Spec 001 Implementation: `backend/main.py` (RAG ingestion pipeline)
