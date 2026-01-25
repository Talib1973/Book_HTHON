# Feature Specification: RAG Retrieval Validation for Physical AI & Humanoid Robotics Textbook

**Feature Branch**: `002-rag-validation`
**Created**: 2026-01-16
**Status**: Draft
**Input**: User description: "Retrieve and validate RAG pipeline for 'Physical AI & Humanoid Robotics' textbook - Target audience: Developers verifying retrieval quality before agent integration - Focus: Confirming that queries return relevant, accurate chunks from the embedded textbook"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Semantic Search Testing (Priority: P1)

As a developer, I need to test semantic search retrieval against the embedded textbook so that I can verify that natural language queries return relevant content before integrating with an AI agent.

**Why this priority**: This is the foundational validation capability - without verifying retrieval quality, we cannot confidently build agent features on top of the RAG pipeline. It represents the minimum viable testing that ensures the pipeline actually works.

**Independent Test**: Can be fully tested by running test_retrieval.py with predefined queries and manually verifying that returned chunks match expected topics from the 13-week syllabus.

**Acceptance Scenarios**:

1. **Given** a natural language query like "ROS 2 publisher subscriber", **When** I run the test script, **Then** top-3 retrieved chunks come from relevant textbook sections (e.g., Week 4 ROS 2 content)
2. **Given** a retrieved chunk, **When** examining the metadata, **Then** it includes correct source URL, page title, and heading context
3. **Given** multiple test queries, **When** running the script, **Then** results are consistent across repeated executions (same query returns same top results)
4. **Given** a query about a specific topic (e.g., "Inverse kinematics"), **When** retrieving results, **Then** the text content contains relevant information about that topic
5. **Given** the test script execution, **When** it completes, **Then** a summary report shows query text, top-3 results with scores, and source metadata

---

### User Story 2 - Precision@k Metrics Calculation (Priority: P2)

As a developer, I need quantitative metrics for retrieval quality so that I can objectively assess whether the RAG pipeline meets accuracy requirements before production deployment.

**Why this priority**: While manual verification (P1) confirms basic functionality, quantitative metrics provide objective benchmarks for comparing approaches and detecting regressions. This is critical for production readiness but secondary to proving the system works at all.

**Independent Test**: Can be tested by defining ground-truth query-document pairs from the syllabus, running retrieval, and calculating precision@k metrics (e.g., precision@3, precision@5).

**Acceptance Scenarios**:

1. **Given** a set of ground-truth query-document pairs, **When** I run precision@k evaluation, **Then** the script calculates and displays precision@3 and precision@5 metrics
2. **Given** a query with known relevant documents, **When** evaluating retrieval, **Then** the script correctly identifies whether expected documents appear in top-k results
3. **Given** multiple test queries, **When** calculating aggregate metrics, **Then** the script reports overall precision@k averaged across all queries
4. **Given** low precision scores (<50%), **When** viewing results, **Then** the script outputs which queries failed and what was retrieved instead

---

### User Story 3 - Student Question Test Cases (Priority: P3)

As a developer, I need to test retrieval using realistic student questions from the course syllabus so that I can validate the system handles real-world usage patterns.

**Why this priority**: This ensures the system works for actual use cases beyond generic test queries. It's important for user acceptance but builds on the core retrieval validation (P1) and metrics (P2).

**Independent Test**: Can be tested by creating a curated list of 10-15 student questions spanning the 13-week syllabus and verifying retrieval results cover the expected topics.

**Acceptance Scenarios**:

1. **Given** student questions like "How do I set up a ROS 2 workspace?", **When** running retrieval, **Then** results include content from relevant weeks (e.g., Week 3-4)
2. **Given** questions spanning multiple topics (kinematics, ROS, sensors), **When** evaluating coverage, **Then** retrieval successfully returns relevant content for at least 80% of test questions
3. **Given** a student question with ambiguous phrasing, **When** retrieving results, **Then** the system still returns contextually relevant chunks (demonstrates robustness)
4. **Given** test results, **When** reviewing output, **Then** each question shows the top-3 chunks with highlighted key phrases matching the query intent

---

### Edge Cases

- What happens when a query has no relevant results in the collection? (System should return top-3 by similarity score but flag low scores, e.g., all scores <0.3)
- How does the system handle very short queries (1-2 words)? (Still generate embeddings and search, but may return broader results)
- What happens when the Qdrant collection is empty or unavailable? (Fail gracefully with clear error message indicating connection or collection issue)
- How does the script handle queries in different phrasing (e.g., "ROS publisher" vs "ROS 2 pub/sub pattern")? (Should return similar results due to semantic embeddings)
- What happens when a query uses technical jargon not in the textbook? (Return best-matching results but scores may be lower; flag for review)
- How does the system handle multi-sentence or paragraph-length queries? (Cohere API supports longer queries; test should verify embeddings work correctly)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST connect to the existing Qdrant Cloud collection (`robotics_textbook`) created by the RAG pipeline
- **FR-002**: System MUST use Cohere embed-multilingual-v3.0 with `input_type="search_query"` to generate query embeddings
- **FR-003**: System MUST retrieve top-k results (default k=3) from Qdrant using cosine similarity
- **FR-004**: System MUST display retrieved results with: similarity score, source URL, page title, heading context, text preview (first 150 characters)
- **FR-005**: System MUST support a curated list of at least 10 test queries representing student questions from the syllabus
- **FR-006**: System MUST calculate precision@k metrics when ground-truth relevant documents are provided
- **FR-007**: System MUST output results in a readable format showing query text, top-k results, and metadata for each result
- **FR-008**: System MUST reproduce consistent results when the same query is run multiple times (deterministic retrieval)
- **FR-009**: System MUST handle API authentication via environment variables (reuse Cohere and Qdrant credentials from Spec 1)
- **FR-010**: System MUST provide clear error messages if connection fails or collection does not exist
- **FR-011**: System MUST be implemented in a single executable Python file (`backend/test_retrieval.py`)
- **FR-012**: System MUST log each query and its top result score for debugging and analysis

### Key Entities

- **TestQuery**: Represents a test query, containing: query text, expected topics/keywords (optional for ground-truth), query category (e.g., "ROS 2", "kinematics", "sensors")
- **RetrievalResult**: Represents a retrieved chunk, containing: similarity score, source URL, page title, heading context, text content, chunk position
- **PrecisionMetric**: Represents evaluation metrics, containing: query ID, precision@3 score, precision@5 score, ground-truth matches found, total relevant documents

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All test queries successfully return top-3 results from the Qdrant collection with similarity scores ≥0.4
- **SC-002**: For at least 80% of test queries, the top-1 result contains content directly relevant to the query topic (manual validation)
- **SC-003**: Precision@3 metric ≥70% when evaluated against ground-truth query-document pairs (if ground-truth is defined)
- **SC-004**: Test script completes execution for all 10+ test queries within 30 seconds total runtime
- **SC-005**: Retrieved metadata (URL, title, heading) is correctly displayed for 100% of results
- **SC-006**: Test script can be run by a developer with only environment credentials configured (no code changes required)
- **SC-007**: Output format is readable and includes clear separation between different test queries and their results

## Scope & Constraints *(mandatory)*

### In Scope

- Testing semantic search retrieval from the existing Qdrant collection
- Calculating precision@k metrics for retrieval quality
- Curating 10-15 realistic student test queries from the syllabus
- Displaying retrieval results with complete metadata
- Single executable test script (`backend/test_retrieval.py`)

### Out of Scope

- Re-embedding or modifying the existing Qdrant collection
- Chat interface or interactive query input
- FastAPI endpoint or web service for retrieval
- Integration with AI agent or response generation
- Automated ground-truth generation (ground-truth pairs defined manually if needed)
- Retrieval algorithm tuning or re-ranking strategies
- Query expansion or preprocessing beyond basic embedding

### Constraints

- **Data Source**: Must use only the existing `robotics_textbook` collection in Qdrant Cloud
- **Embedding Model**: Must use Cohere embed-multilingual-v3.0 with `input_type="search_query"`
- **Retrieval Method**: Must use Qdrant's native similarity search (no custom ranking)
- **Test Queries**: Must be based on realistic student questions from the 13-week syllabus
- **Output Format**: Must be human-readable text output (no GUI or web interface)
- **Timeline**: Complete implementation within 1 day
- **File Structure**: Single file implementation in `backend/test_retrieval.py`

### Assumptions

- The Qdrant collection `robotics_textbook` exists and contains vectors from Spec 1 implementation
- Cohere API credentials from Spec 1 are still valid and have sufficient quota
- Qdrant Cloud cluster is accessible and responsive
- Test queries are in English (consistent with textbook content)
- Ground-truth relevant documents can be manually identified from the syllabus if needed for precision@k
- Similarity scores from Qdrant cosine distance are reliable indicators of relevance
- Network connectivity is reliable during test script execution

### Dependencies

- **External Services**:
  - Cohere API (embed-multilingual-v3.0 endpoint) - requires API key
  - Qdrant Cloud service - requires cluster URL and API key
- **Data Dependencies**:
  - Existing Qdrant collection `robotics_textbook` with vectors created by Spec 1
  - 13-week syllabus content defining expected query topics
- **Technical Dependencies**:
  - Python 3.10+ runtime environment (consistent with Spec 1)
  - Cohere Python SDK (already installed in backend/)
  - Qdrant Python client (already installed in backend/)
  - Environment variables: `COHERE_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`
