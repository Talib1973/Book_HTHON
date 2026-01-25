# Function Contracts - RAG Validation Script

**Feature**: 002-rag-validation
**File**: `backend/test_retrieval.py`
**Date**: 2026-01-16

## Overview

This document defines the function contracts for the RAG validation script. All functions are implemented in a single file (`test_retrieval.py`) with clear input/output contracts.

---

## Function 1: `validate_environment()`

**Purpose**: Validate that all required environment variables are present and non-empty.

**Signature**:
```python
def validate_environment() -> Dict[str, str]:
    """
    Validate required environment variables.

    Returns:
        Dict with keys: COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY

    Raises:
        SystemExit: If any required variable is missing or empty
    """
```

**Inputs**: None (reads from environment via `os.getenv`)

**Outputs**:
- **Success**: Dictionary with validated credentials
  ```python
  {
      "COHERE_API_KEY": "abc123...",
      "QDRANT_URL": "https://...",
      "QDRANT_API_KEY": "xyz789..."
  }
  ```
- **Failure**: Exits with code 1 and error message listing missing variables

**Error Handling**:
- Missing variable: Print "❌ Missing required environment variable: {VAR_NAME}" and exit
- Empty variable: Print "❌ Environment variable {VAR_NAME} is empty" and exit
- Success: No error, return credentials dictionary

**Example Usage**:
```python
env_vars = validate_environment()
cohere_key = env_vars["COHERE_API_KEY"]
```

---

## Function 2: `initialize_clients(env_vars: Dict[str, str])`

**Purpose**: Initialize and test connections to Cohere and Qdrant services.

**Signature**:
```python
def initialize_clients(env_vars: Dict[str, str]) -> Tuple[cohere.Client, QdrantClient]:
    """
    Initialize API clients and verify connections.

    Args:
        env_vars: Dictionary with COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY

    Returns:
        Tuple of (cohere_client, qdrant_client)

    Raises:
        SystemExit: If connection fails or collection doesn't exist
    """
```

**Inputs**:
- `env_vars`: Dictionary from `validate_environment()`

**Outputs**:
- **Success**: Tuple of initialized clients `(cohere.Client, QdrantClient)`
- **Failure**: Exits with code 1 and error message

**Validation Steps**:
1. Initialize Cohere client with API key
2. Initialize Qdrant client with URL and API key
3. Test Qdrant connection by calling `get_collection("robotics_textbook")`
4. If collection doesn't exist, print error and suggest running `backend/main.py`

**Error Handling**:
- Cohere initialization failure: "❌ Failed to initialize Cohere client: {error}"
- Qdrant connection failure: "❌ Failed to connect to Qdrant: {error}"
- Collection not found: "❌ Collection 'robotics_textbook' not found. Run 'uv run python backend/main.py' to create it."

**Example Usage**:
```python
cohere_client, qdrant_client = initialize_clients(env_vars)
```

---

## Function 3: `generate_query_embedding(query_text: str, cohere_client: cohere.Client)`

**Purpose**: Generate embedding vector for a query using Cohere API.

**Signature**:
```python
def generate_query_embedding(query_text: str, cohere_client: cohere.Client) -> List[float]:
    """
    Generate embedding for a query using Cohere embed-multilingual-v3.0.

    Args:
        query_text: Natural language query string
        cohere_client: Initialized Cohere client

    Returns:
        List of floats representing the embedding vector (1024 dimensions)

    Raises:
        Exception: If Cohere API call fails after retries
    """
```

**Inputs**:
- `query_text`: String (min 1 character, typically 5+ words)
- `cohere_client`: Initialized Cohere client

**Outputs**:
- **Success**: List of 1024 floats (embedding vector)
- **Failure**: Raises exception with Cohere error details

**API Parameters**:
```python
cohere_client.embed(
    texts=[query_text],
    model="embed-multilingual-v3.0",
    input_type="search_query"  # Important: different from "search_document"
)
```

**Error Handling**:
- Retry up to 3 times with exponential backoff (1s, 2s, 4s) for transient errors
- If all retries fail, raise exception with last error message

**Example Usage**:
```python
embedding = generate_query_embedding("How do I set up ROS 2?", cohere_client)
# Returns: [0.123, -0.456, 0.789, ...] (1024 floats)
```

---

## Function 4: `search_qdrant(query_embedding: List[float], qdrant_client: QdrantClient, k: int = 3)`

**Purpose**: Search Qdrant collection for top-k similar chunks.

**Signature**:
```python
def search_qdrant(
    query_embedding: List[float],
    qdrant_client: QdrantClient,
    k: int = 3
) -> List[Dict[str, Any]]:
    """
    Search Qdrant collection for top-k similar vectors.

    Args:
        query_embedding: Query embedding vector (1024 dimensions)
        qdrant_client: Initialized Qdrant client
        k: Number of results to retrieve (default 3)

    Returns:
        List of dictionaries with keys: rank, score, url, title, heading, text, token_count

    Raises:
        Exception: If Qdrant query fails
    """
```

**Inputs**:
- `query_embedding`: List of 1024 floats
- `qdrant_client`: Initialized Qdrant client
- `k`: Integer (typically 3 or 5)

**Outputs**:
- **Success**: List of RetrievalResult dictionaries (as defined in data-model.md)
  ```python
  [
      {
          "rank": 1,
          "score": 0.6523,
          "url": "https://...",
          "title": "...",
          "heading": "...",
          "text": "...",
          "token_count": 287
      },
      ...
  ]
  ```
- **Empty results**: Returns empty list `[]` (not an error)

**Qdrant Query**:
```python
search_results = qdrant_client.query_points(
    collection_name="robotics_textbook",
    query=query_embedding,
    limit=k
).points
```

**Error Handling**:
- Qdrant query failure: Raise exception with error details
- No results found: Return empty list (caller handles display)

**Example Usage**:
```python
results = search_qdrant(embedding, qdrant_client, k=3)
if not results:
    print("No results found")
```

---

## Function 5: `calculate_precision_at_k(retrieved_urls: List[str], relevant_urls: List[str], k: int)`

**Purpose**: Calculate precision@k metric for a query.

**Signature**:
```python
def calculate_precision_at_k(
    retrieved_urls: List[str],
    relevant_urls: List[str],
    k: int
) -> float:
    """
    Calculate precision@k metric.

    Args:
        retrieved_urls: URLs of top-k retrieved results
        relevant_urls: Ground-truth relevant URLs for the query
        k: The k value (should match len(retrieved_urls))

    Returns:
        Precision@k value (0.0 to 1.0)
    """
```

**Inputs**:
- `retrieved_urls`: List of k URLs from search results
- `relevant_urls`: List of ground-truth relevant URLs
- `k`: Integer (3 or 5 typically)

**Outputs**:
- Float between 0.0 and 1.0 representing precision@k

**Calculation**:
```python
relevant_in_topk = set(retrieved_urls) & set(relevant_urls)
precision = len(relevant_in_topk) / k
```

**Example**:
```python
retrieved = ["url1", "url2", "url3"]
relevant = ["url1", "url3", "url5"]
precision = calculate_precision_at_k(retrieved, relevant, 3)
# Returns: 0.6667 (2 out of 3 were relevant)
```

---

## Function 6: `display_query_results(query: str, category: str, results: List[Dict], rank: int, total: int)`

**Purpose**: Display formatted results for a single query.

**Signature**:
```python
def display_query_results(
    query: str,
    category: str,
    results: List[Dict[str, Any]],
    rank: int,
    total: int
) -> None:
    """
    Display formatted retrieval results for a query.

    Args:
        query: Query text
        category: Query category (e.g., "ROS 2")
        results: List of RetrievalResult dictionaries
        rank: Query number (1-based)
        total: Total number of queries
    """
```

**Inputs**:
- `query`: String
- `category`: String
- `results`: List of RetrievalResult dicts from `search_qdrant()`
- `rank`: Current query number (for "Query 3/12" display)
- `total`: Total queries being tested

**Outputs**:
- None (prints to stdout)

**Display Format**:
```text
─────────────────────────────────────────────────────────────
Query 3/12: "ROS 2 publisher subscriber pattern"
Category: ROS 2
─────────────────────────────────────────────────────────────

Top 3 Results:

1. Score: 0.6425
   Title: Week 2: ROS 2 Publisher-Subscriber Pattern
   Heading: Understanding Topics and Messages
   URL: https://book-hthon.vercel.app/docs/module1-ros2/week2-pubsub
   Text: "The publisher-subscriber pattern is the fundamental communication..."

[... repeat for results 2 and 3]

⚠️ Low confidence (top score < 0.4) - Consider rephrasing query or adding content
```

**Low Confidence Warning**: Print warning if top-1 score <0.4

---

## Function 7: `display_summary_report(all_results: List[Dict], precision_metrics: List[Dict])`

**Purpose**: Display aggregated summary statistics and pass/fail status.

**Signature**:
```python
def display_summary_report(
    all_results: List[Dict[str, Any]],
    precision_metrics: List[Dict[str, Any]]
) -> bool:
    """
    Display summary statistics and validation status.

    Args:
        all_results: List of all query results (each has 'query', 'results' keys)
        precision_metrics: List of PrecisionMetric dictionaries

    Returns:
        True if validation passes success criteria, False otherwise
    """
```

**Inputs**:
- `all_results`: List of dictionaries, each containing:
  ```python
  {
      "query": "...",
      "category": "...",
      "results": [...]  # List of RetrievalResults
  }
  ```
- `precision_metrics`: List of PrecisionMetric dicts (from data-model.md)

**Outputs**:
- Returns `True` if pass, `False` if fail
- Prints summary report to stdout

**Calculated Metrics**:
1. Average top-1 score: `sum(result['results'][0]['score']) / len(all_results)`
2. Queries with top-1 score ≥0.5: `count(score >= 0.5) / total`
3. Average precision@3: `sum(p3 for metrics) / len(metrics)`
4. Average precision@5: `sum(p5 for metrics) / len(metrics)`

**Success Criteria**:
```python
pass_status = (
    (queries_above_threshold / total >= 0.80) and  # 80% relevance
    (avg_precision_at_3 >= 0.70 if precision_metrics else True)
)
```

**Display Format**:
```text
─────────────────────────────────────────────────────────────
Summary Statistics
─────────────────────────────────────────────────────────────
Collection: robotics_textbook
Total Queries: 12
Average Top-1 Score: 0.62
Queries with Top-1 Score ≥0.5: 10/12 (83%)
Precision@3 (5 ground-truth queries): 0.73
Precision@5 (5 ground-truth queries): 0.68

✅ PASS: Retrieval quality meets success criteria
   - Relevance: 83% ≥ 80% ✓
   - Precision@3: 0.73 ≥ 0.70 ✓
```

---

## Function 8: `main()`

**Purpose**: Orchestrate the complete validation workflow.

**Signature**:
```python
def main() -> int:
    """
    Main execution flow for RAG validation script.

    Returns:
        0 if validation passes, 1 if validation fails or errors occur
    """
```

**Execution Flow**:
```text
1. Print header with collection name and timestamp
2. validate_environment() → get credentials
3. initialize_clients() → get Cohere and Qdrant clients
4. Define test_queries list (12 queries)
5. Define ground_truth_mappings (5-7 queries)
6. For each query in test_queries:
   a. generate_query_embedding()
   b. search_qdrant() for top-3 results
   c. display_query_results()
   d. If ground-truth exists, calculate_precision_at_k()
7. display_summary_report()
8. Return 0 if pass, 1 if fail
```

**Entry Point**:
```python
if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
```

---

## Error Handling Summary

| Error Scenario | Function | Behavior |
|----------------|----------|----------|
| Missing env var | `validate_environment()` | Exit with code 1, list missing vars |
| Qdrant connection fail | `initialize_clients()` | Exit with code 1, suggest checking credentials |
| Collection not found | `initialize_clients()` | Exit with code 1, suggest running `main.py` |
| Cohere API error | `generate_query_embedding()` | Retry 3 times, then raise exception |
| Qdrant query error | `search_qdrant()` | Raise exception with error details |
| No results for query | `search_qdrant()` | Return empty list (not error) |
| Low similarity score | `display_query_results()` | Print warning, continue execution |

---

## Type Hints

All functions use Python type hints for clarity:
```python
from typing import Dict, List, Tuple, Any
import cohere
from qdrant_client import QdrantClient
```

---

## Testing Strategy

**Manual Validation**:
1. Run script with all 12 test queries
2. Visually inspect top-3 results for each query
3. Verify metadata (URL, title, heading) is correct
4. Check precision@k calculations against manual ground-truth
5. Confirm summary statistics match expected values

**No Automated Tests**: Per spec, manual validation approach for v1 (1-day timeline)
