# Pipeline Function Contracts

**Feature**: 001-rag-pipeline
**Date**: 2026-01-15
**Purpose**: Define function signatures and contracts for the RAG pipeline implementation

## Overview

This document specifies the public interface (function signatures, inputs, outputs, errors) for the main.py pipeline script. All functions are internal to the script (not exposed as API endpoints).

---

## 1. discover_urls()

**Purpose**: Discover all page URLs from the Docusaurus site (via sitemap or crawling).

**Signature**:
```python
def discover_urls(base_url: str) -> list[str]:
```

**Inputs**:
- `base_url` (str): Root URL of the Docusaurus site (e.g., "https://textbook.vercel.app")

**Outputs**:
- Returns: list[str] - Deduplicated list of full URLs to process
- Raises: `ValueError` if base_url is invalid
- Raises: `requests.RequestException` if sitemap fetch fails and no fallback possible

**Behavior**:
1. Check for sitemap at `{base_url}/sitemap.xml`
2. If sitemap exists:
   - Parse XML, extract all `<loc>` URLs
   - Filter URLs to only include those starting with `base_url`
3. If no sitemap:
   - Start at `base_url`, recursively crawl internal links
   - Use BeautifulSoup to extract `<a href>` links
   - Deduplicate using set()
4. Return sorted list of unique URLs

**Edge Cases**:
- Sitemap contains external links (non-base_url): Filter out
- Circular links (A→B→A): Handle with visited set
- Relative links (/docs/foo): Convert to absolute URLs

**Example**:
```python
urls = discover_urls("https://textbook.vercel.app")
# Returns: ["https://textbook.vercel.app/",
#           "https://textbook.vercel.app/docs/intro",
#           "https://textbook.vercel.app/docs/module1/week1", ...]
```

---

## 2. fetch_and_parse()

**Purpose**: Fetch HTML content from a URL and extract main content area.

**Signature**:
```python
def fetch_and_parse(url: str) -> tuple[str, str, list[tuple[str, str]]]:
```

**Inputs**:
- `url` (str): Full URL to fetch

**Outputs**:
- Returns: tuple of (page_title, html_content, headings)
  - `page_title` (str): Content of `<title>` tag
  - `html_content` (str): Main article content (text only, no HTML tags)
  - `headings` (list[tuple[str, str]]): List of (level, text) for H1 and H2 tags
    - Example: [("h1", "Module 1"), ("h2", "Week 1: Setup"), ("h2", "Installation")]
- Raises: `requests.HTTPError` for 4xx/5xx status codes
- Raises: `requests.Timeout` if request exceeds 30 seconds

**Behavior**:
1. Send GET request with timeout=30s
2. Check response.status_code, raise HTTPError if not 200
3. Parse HTML with BeautifulSoup
4. Extract `<title>` text
5. Find main content: `<article>` tag or element with class "markdown"
6. Extract all H1 and H2 tags with text content
7. Get text content (no HTML tags) from main content area
8. Return tuple of extracted data

**Edge Cases**:
- No `<title>` tag: Use URL path as fallback
- No `<article>` or `.markdown`: Try `<main>` tag, else use `<body>`
- No H1/H2 headings: Return empty list for headings

**Example**:
```python
title, content, headings = fetch_and_parse("https://textbook.vercel.app/docs/module1/week1")
# title: "Week 1: ROS 2 Setup"
# content: "To install ROS 2 Humble on Ubuntu 22.04, first update your system..."
# headings: [("h1", "Module 1: ROS 2"), ("h2", "Week 1: Setup"), ("h2", "Installation Steps")]
```

---

## 3. chunk_text()

**Purpose**: Split text content into semantically meaningful chunks with token limits.

**Signature**:
```python
def chunk_text(
    text: str,
    headings: list[tuple[str, str]],
    url: str,
    title: str,
    max_tokens: int = 512,
    overlap_tokens: int = 50
) -> list[dict]:
```

**Inputs**:
- `text` (str): Full text content from page
- `headings` (list[tuple[str, str]]): List of (level, text) heading tuples
- `url` (str): Source page URL
- `title` (str): Page title
- `max_tokens` (int): Maximum tokens per chunk (default 512)
- `overlap_tokens` (int): Overlap between consecutive chunks (default 50)

**Outputs**:
- Returns: list[dict] - List of TextChunk dicts (see data-model.md)
  - Each dict contains: chunk_id, source_url, page_title, heading_context, text_content, token_count, position_in_page
- Raises: `ValueError` if text is empty

**Behavior**:
1. Initialize tiktoken encoder: `tiktoken.get_encoding("cl100k_base")`
2. Split text by H1/H2 heading positions
3. For each section between headings:
   - Build heading_context string (e.g., "Module 1 > Week 1 > Installation")
   - Tokenize section text
   - If tokens ≤ max_tokens: Create single chunk
   - If tokens > max_tokens:
     - Split at max_tokens boundaries with overlap_tokens overlap
     - Create multiple chunks, each with same heading_context
4. Assign sequential chunk_id (0, 1, 2, ...) across all pages
5. Assign position_in_page (0 = first chunk of page, 1 = second, etc.)
6. Return list of chunk dicts

**Edge Cases**:
- No headings: Use "No heading" as heading_context
- Very long section (>2000 tokens): Split into multiple chunks with overlap
- Empty text after heading: Skip, log warning

**Example**:
```python
chunks = chunk_text(
    text="To install ROS 2 Humble...",
    headings=[("h1", "Module 1"), ("h2", "Installation")],
    url="https://textbook.vercel.app/docs/module1/week1",
    title="Week 1: Setup"
)
# Returns: [
#   {
#     "chunk_id": 0,
#     "source_url": "https://textbook.vercel.app/docs/module1/week1",
#     "page_title": "Week 1: Setup",
#     "heading_context": "Module 1 > Installation",
#     "text_content": "To install ROS 2 Humble...",
#     "token_count": 487,
#     "position_in_page": 0
#   },
#   ...
# ]
```

---

## 4. generate_embeddings()

**Purpose**: Generate vector embeddings for a batch of text chunks using Cohere API.

**Signature**:
```python
def generate_embeddings(chunks: list[dict], cohere_client: cohere.Client) -> list[list[float]]:
```

**Inputs**:
- `chunks` (list[dict]): List of TextChunk dicts (max 96 for batching)
- `cohere_client` (cohere.Client): Initialized Cohere API client

**Outputs**:
- Returns: list[list[float]] - List of embedding vectors (1024 dimensions each)
  - Order matches input chunks order
- Raises: `cohere.errors.CohereAPIError` for API failures
- Raises: `cohere.errors.RateLimitError` if rate limit exceeded

**Behavior**:
1. Extract text_content from each chunk dict
2. Call `cohere_client.embed(texts=[...], model="embed-multilingual-v3.0", input_type="search_document")`
3. Extract embeddings from response
4. Validate embedding dimensions (must be 1024)
5. Return list of embeddings

**Retry Logic** (using tenacity library):
- Retry on RateLimitError: 5 attempts with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Retry on network errors: 3 attempts with 2s backoff
- Fail loudly on other API errors (log error and re-raise)

**Edge Cases**:
- Empty chunks list: Return empty list
- Batch size >96: Raise ValueError (caller must split batches)
- API returns wrong dimensions: Raise ValueError

**Example**:
```python
client = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))
chunks = [{"text_content": "ROS 2 is a framework...", ...}, ...]
embeddings = generate_embeddings(chunks, client)
# Returns: [[0.123, -0.456, 0.789, ...], [0.234, -0.567, ...], ...]
# Each inner list has 1024 floats
```

---

## 5. store_vectors()

**Purpose**: Store vector embeddings with metadata in Qdrant Cloud.

**Signature**:
```python
def store_vectors(
    embeddings: list[list[float]],
    chunks: list[dict],
    qdrant_client: QdrantClient,
    collection_name: str = "robotics_textbook"
) -> int:
```

**Inputs**:
- `embeddings` (list[list[float]]): Embedding vectors from Cohere
- `chunks` (list[dict]): Corresponding TextChunk dicts (same length and order as embeddings)
- `qdrant_client` (QdrantClient): Initialized Qdrant client
- `collection_name` (str): Qdrant collection name (default "robotics_textbook")

**Outputs**:
- Returns: int - Number of vectors successfully stored
- Raises: `qdrant_client.http.exceptions.UnexpectedResponse` for Qdrant errors

**Behavior**:
1. Create list of PointStruct objects:
   - id: chunk["chunk_id"]
   - vector: embedding
   - payload: {url, title, heading, text, token_count, position}
2. Call `qdrant_client.upsert(collection_name=..., points=[...])`
3. Return count of upserted points

**Retry Logic**:
- Retry on network errors: 2 attempts with 5s backoff
- Fail on quota exceeded error (log error, abort pipeline)

**Edge Cases**:
- Collection doesn't exist: Will be created in main() setup step
- Duplicate IDs: Upsert will overwrite (idempotent)
- Empty embeddings list: Return 0

**Example**:
```python
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
count = store_vectors(embeddings, chunks, client)
# Returns: 96 (if batch of 96 vectors stored successfully)
```

---

## 6. main()

**Purpose**: Orchestrate the complete RAG pipeline from URL discovery to vector storage.

**Signature**:
```python
def main() -> None:
```

**Inputs**: None (reads from environment variables)

**Outputs**:
- Returns: None
- Exits: 0 on success, 1 on failure
- Logs: Progress and statistics to console

**Behavior**:
1. Load environment variables (COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY, DOCUSAURUS_URL)
2. Validate all required env vars are set
3. Initialize Cohere and Qdrant clients
4. Create Qdrant collection if not exists
5. Discover URLs: `urls = discover_urls(base_url)`
6. Initialize PipelineState for statistics tracking
7. For each URL:
   - Fetch and parse: `title, content, headings = fetch_and_parse(url)`
   - Chunk text: `chunks = chunk_text(content, headings, url, title)`
   - Update statistics: increment chunks_created
8. Batch chunks (max 96 per batch) and process:
   - Generate embeddings: `embeddings = generate_embeddings(batch, cohere_client)`
   - Store vectors: `count = store_vectors(embeddings, batch, qdrant_client)`
   - Update statistics: increment vectors_stored
9. Log final summary:
   - Total pages discovered
   - Pages processed vs failed
   - Total chunks created
   - Total vectors stored
   - Execution time
10. Exit with code 0

**Error Handling**:
- Missing env var: Log error, exit with code 1
- Unhandled exception: Log traceback, exit with code 1
- Partial failures (some pages 404): Log warnings, continue processing

**Logging Output Example**:
```
2026-01-15 10:00:00 [INFO] Starting RAG pipeline
2026-01-15 10:00:01 [INFO] Discovered 150 URLs from sitemap
2026-01-15 10:00:05 [INFO] Processed page 1/150: https://textbook.vercel.app/docs/intro
2026-01-15 10:00:05 [INFO] Created 12 chunks from page
...
2026-01-15 10:45:30 [INFO] Pipeline complete
2026-01-15 10:45:30 [INFO] ========== Summary ==========
2026-01-15 10:45:30 [INFO] Pages discovered: 150
2026-01-15 10:45:30 [INFO] Pages processed: 148
2026-01-15 10:45:30 [INFO] Pages failed: 2
2026-01-15 10:45:30 [INFO] Chunks created: 1523
2026-01-15 10:45:30 [INFO] Vectors stored: 1523
2026-01-15 10:45:30 [INFO] Execution time: 45m 30s
```

**Example**:
```python
if __name__ == "__main__":
    main()
```

---

## Environment Variables Contract

**Required**:
- `COHERE_API_KEY` (str): Cohere API key for embeddings
- `QDRANT_URL` (str): Qdrant Cloud cluster URL (e.g., "https://xyz.qdrant.io")
- `QDRANT_API_KEY` (str): Qdrant Cloud API key
- `DOCUSAURUS_URL` (str): Base URL of deployed Docusaurus site

**Optional**:
- `QDRANT_COLLECTION_NAME` (str): Collection name (default: "robotics_textbook")
- `MAX_TOKENS_PER_CHUNK` (int): Max chunk size (default: 512)
- `CHUNK_OVERLAP_TOKENS` (int): Overlap size (default: 50)

**Validation**:
- All required vars must be set and non-empty
- URLs must be valid HTTP/HTTPS
- Token counts must be positive integers

---

## Dependencies & Imports

**Required Libraries** (install via `uv add`):
```python
import os
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

import requests
from bs4 import BeautifulSoup
import tiktoken
import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from tenacity import retry, stop_after_attempt, wait_exponential
```

**Version Constraints** (pyproject.toml):
```toml
[project.dependencies]
requests = "^2.31.0"
beautifulsoup4 = "^4.12.0"
tiktoken = "^0.5.0"
cohere = "^5.0.0"
qdrant-client = "^1.7.0"
python-dotenv = "^1.0.0"
tenacity = "^8.2.0"
```

---

## Summary

All functions defined above compose the complete RAG pipeline:

```
main()
  ↓
discover_urls(base_url) → [urls]
  ↓
for each url:
  fetch_and_parse(url) → (title, content, headings)
    ↓
  chunk_text(content, headings, ...) → [chunks]
    ↓
batch chunks (96 per batch):
  generate_embeddings(batch, cohere_client) → [embeddings]
    ↓
  store_vectors(embeddings, batch, qdrant_client) → count
```

No external API endpoints exposed (this is a batch script, not a web service).
