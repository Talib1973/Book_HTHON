# Data Model - RAG Validation

**Feature**: 002-rag-validation
**Date**: 2026-01-16
**Phase**: Phase 1 (Design)

## Overview

This document defines the data entities for the RAG validation script. All entities are in-memory Python data structures (no database persistence).

---

## Entity 1: TestQuery

**Description**: Represents a test query to be evaluated against the RAG system.

**Attributes**:
- `query` (str, required): Natural language query text (e.g., "How do I set up a ROS 2 workspace?")
- `category` (str, required): Topic category from syllabus (e.g., "ROS 2", "Digital Twin", "NVIDIA Isaac", "VLA", "Capstone", "General")
- `expected_topics` (List[str], optional): Keywords or topics expected in relevant results (used for manual validation)

**Validation Rules**:
- `query` must be non-empty string, minimum 5 characters
- `category` must be one of: "ROS 2", "Digital Twin (Gazebo/Unity)", "NVIDIA Isaac", "VLA", "Capstone", "General"
- `expected_topics` can be empty list (for queries without defined ground-truth)

**Example**:
```python
{
    "query": "How do I set up a ROS 2 workspace?",
    "category": "ROS 2",
    "expected_topics": ["workspace", "colcon", "setup", "installation"]
}
```

**State**: Stateless (no lifecycle transitions)

---

## Entity 2: RetrievalResult

**Description**: Represents a single retrieved chunk from the Qdrant collection in response to a query.

**Attributes**:
- `rank` (int, required): Position in top-k results (1-based, e.g., 1 = top result)
- `score` (float, required): Cosine similarity score (0.0 to 1.0, higher is better)
- `url` (str, required): Source page URL from metadata (e.g., "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup")
- `title` (str, required): Page title from metadata (e.g., "Week 1: ROS 2 Setup and Installation")
- `heading` (str, required): Heading context from metadata (e.g., "Creating Your First Workspace")
- `text` (str, required): Chunk text content (full text, displayed with 150-char preview)
- `token_count` (int, optional): Token count from metadata (informational only)

**Validation Rules**:
- `rank` must be positive integer (1, 2, 3, ...)
- `score` must be float in range [0.0, 1.0]
- `url` must be valid HTTP/HTTPS URL
- `title`, `heading`, `text` must be non-empty strings

**Example**:
```python
{
    "rank": 1,
    "score": 0.6523,
    "url": "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup",
    "title": "Week 1: ROS 2 Setup and Installation",
    "heading": "Creating Your First Workspace",
    "text": "To set up a ROS 2 workspace, you need to create a directory structure...",
    "token_count": 287
}
```

**State**: Stateless (read-only data from Qdrant response)

---

## Entity 3: GroundTruthMapping

**Description**: Represents ground-truth relevant documents for a specific query, used to calculate precision@k metrics.

**Attributes**:
- `query` (str, required): The query text (matches TestQuery.query)
- `relevant_urls` (List[str], required): List of URLs that are considered relevant for this query

**Validation Rules**:
- `query` must match an existing TestQuery.query value
- `relevant_urls` must be non-empty list
- Each URL in `relevant_urls` must be valid HTTP/HTTPS URL

**Example**:
```python
{
    "query": "How do I set up a ROS 2 workspace?",
    "relevant_urls": [
        "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup",
        "https://book-hthon.vercel.app/docs/intro"
    ]
}
```

**Usage**: Used to calculate precision@k by comparing retrieved result URLs against this list.

**State**: Stateless (static configuration data)

---

## Entity 4: PrecisionMetric

**Description**: Represents precision@k evaluation results for a single query.

**Attributes**:
- `query` (str, required): The query text
- `k` (int, required): The k value (e.g., 3 for precision@3, 5 for precision@5)
- `precision` (float, required): Calculated precision value (0.0 to 1.0)
- `retrieved_urls` (List[str], required): URLs of top-k retrieved results
- `relevant_retrieved` (List[str], required): URLs that were both retrieved and marked as relevant (intersection)
- `relevant_count` (int, required): Number of relevant docs in top-k (len of relevant_retrieved)

**Validation Rules**:
- `k` must be positive integer (typically 3 or 5)
- `precision` = relevant_count / k (value between 0.0 and 1.0)
- `retrieved_urls` length must equal k
- `relevant_retrieved` must be subset of both `retrieved_urls` and ground-truth `relevant_urls`

**Calculation Formula**:
```
precision@k = (number of relevant docs in top-k) / k
```

**Example**:
```python
{
    "query": "How do I set up a ROS 2 workspace?",
    "k": 3,
    "precision": 0.6667,  # 2 out of 3 were relevant
    "retrieved_urls": [
        "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup",  # relevant
        "https://book-hthon.vercel.app/docs/intro",  # relevant
        "https://book-hthon.vercel.app/docs/module2-digital-twin/week4-gazebo"  # not relevant
    ],
    "relevant_retrieved": [
        "https://book-hthon.vercel.app/docs/module1-ros2/week1-setup",
        "https://book-hthon.vercel.app/docs/intro"
    ],
    "relevant_count": 2
}
```

**State**: Computed value (calculated after retrieval completes)

---

## Entity 5: ValidationReport

**Description**: Aggregated report containing all validation results and summary statistics.

**Attributes**:
- `collection_name` (str, required): Qdrant collection name (e.g., "robotics_textbook")
- `total_queries` (int, required): Number of queries tested
- `query_results` (List[Dict], required): List of per-query results containing query, category, top-k RetrievalResults
- `precision_metrics` (List[PrecisionMetric], optional): Precision@k metrics for queries with ground-truth
- `avg_top1_score` (float, required): Average similarity score of top-1 results across all queries
- `queries_above_threshold` (int, required): Count of queries where top-1 score ≥0.5
- `avg_precision_at_3` (float, optional): Average precision@3 across all ground-truth queries
- `avg_precision_at_5` (float, optional): Average precision@5 across all ground-truth queries
- `pass_status` (bool, required): Whether validation meets success criteria (≥80% relevance, ≥70% precision@3)
- `timestamp` (str, required): Report generation timestamp (ISO 8601 format)

**Success Criteria Evaluation**:
```python
pass_status = (
    (queries_above_threshold / total_queries >= 0.80) and  # 80% relevance
    (avg_precision_at_3 >= 0.70 if avg_precision_at_3 else True)  # 70% precision@3
)
```

**Example**:
```python
{
    "collection_name": "robotics_textbook",
    "total_queries": 12,
    "query_results": [...],  # Full list of per-query results
    "precision_metrics": [...],  # Precision@k for 5 queries with ground-truth
    "avg_top1_score": 0.62,
    "queries_above_threshold": 10,
    "avg_precision_at_3": 0.73,
    "avg_precision_at_5": 0.68,
    "pass_status": True,  # Both criteria met
    "timestamp": "2026-01-16T10:30:00Z"
}
```

**State**: Final output (generated once all queries processed)

---

## Data Flow

```text
1. TestQuery (input)
   → Generate embedding via Cohere
   → Search Qdrant collection
   → Retrieve RetrievalResults (top-k)

2. RetrievalResults + GroundTruthMapping (if available)
   → Calculate PrecisionMetric

3. All query results + PrecisionMetrics
   → Aggregate into ValidationReport
   → Display report to user
```

---

## Relationships

- **TestQuery → RetrievalResult**: One-to-many (1 query produces k results)
- **TestQuery → GroundTruthMapping**: One-to-one (optional, only for queries with defined ground-truth)
- **GroundTruthMapping + RetrievalResult → PrecisionMetric**: Many-to-one (multiple results and ground-truth produce single metric)
- **All entities → ValidationReport**: Many-to-one (all data aggregated into single report)

---

## Implementation Notes

- All entities implemented as Python dictionaries (no ORM or database)
- Type hints used for clarity: `Dict[str, Any]`, `List[RetrievalResult]`, etc.
- Validation performed via simple assertions or if-checks (no schema validation library needed for single-file script)
- Data only exists in memory during script execution (no persistence between runs)
