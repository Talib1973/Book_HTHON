# Data Model: RAG Pipeline

**Feature**: 001-rag-pipeline
**Date**: 2026-01-15
**Purpose**: Define internal data structures for the RAG ingestion pipeline

## Overview

The RAG pipeline processes web content through several stages, each with distinct data entities. Since this is a batch ingestion script (not a persistent application), most entities exist only in memory during execution. The only persistent storage is in Qdrant Cloud (vector embeddings with metadata).

## Entities

### 1. CrawlTarget

**Purpose**: Represents a discovered URL to be processed during web crawling.

**Fields**:
- `url` (str): Full URL of the page (e.g., "https://textbook.vercel.app/docs/module1/week1")
- `status` (str): Processing status - one of: "pending", "crawling", "completed", "failed"
- `http_status` (int | None): HTTP response code (200, 404, 500, etc.) or None if not yet fetched
- `page_title` (str | None): HTML `<title>` content extracted from page, or None if not yet parsed
- `discovered_links` (list[str]): Internal links discovered on this page (for recursive crawling)
- `error_message` (str | None): Error details if status is "failed"

**Lifecycle**:
1. Created with status="pending" when URL discovered (from sitemap or link crawling)
2. Status updated to "crawling" when HTTP request starts
3. After parsing, status becomes "completed" (success) or "failed" (HTTP error, parsing error)
4. Stored in memory as dict or dataclass during pipeline execution

**Validation Rules**:
- URL must be valid HTTP/HTTPS URL
- URL must belong to base domain (no external links)
- Duplicate URLs discarded (use set for deduplication)

**Example**:
```python
{
    "url": "https://textbook.vercel.app/docs/module1/week1",
    "status": "completed",
    "http_status": 200,
    "page_title": "Week 1: ROS 2 Setup and First Node",
    "discovered_links": [
        "https://textbook.vercel.app/docs/module1/week2",
        "https://textbook.vercel.app/docs/intro"
    ],
    "error_message": None
}
```

---

### 2. TextChunk

**Purpose**: Represents a semantically bounded segment of text extracted from a page, ready for embedding.

**Fields**:
- `chunk_id` (int): Sequential identifier (0, 1, 2, ...) assigned during chunking
- `source_url` (str): URL of the page this chunk came from
- `page_title` (str): Page title for metadata
- `heading_context` (str): Hierarchical heading path (e.g., "Module 1 > Week 1 > Installation")
- `text_content` (str): The actual text content of the chunk
- `token_count` (int): Number of tokens in `text_content` (via tiktoken)
- `position_in_page` (int): Chunk index within the source page (0 = first chunk, 1 = second, etc.)

**Lifecycle**:
1. Created after parsing a page and splitting text by heading boundaries
2. Token count computed using tiktoken.get_encoding("cl100k_base")
3. Passed to embedding generation step
4. After embedding, becomes part of VectorEmbedding entity

**Validation Rules**:
- `token_count` must be ≤562 tokens (512 target + 50 overlap buffer)
- `text_content` must not be empty
- `heading_context` should be "No heading" if page has no H1/H2 tags

**Example**:
```python
{
    "chunk_id": 42,
    "source_url": "https://textbook.vercel.app/docs/module1/week1",
    "page_title": "Week 1: ROS 2 Setup and First Node",
    "heading_context": "Module 1 > Week 1 > Installation",
    "text_content": "To install ROS 2 Humble on Ubuntu 22.04...",
    "token_count": 487,
    "position_in_page": 0
}
```

---

### 3. VectorEmbedding

**Purpose**: Represents the final vector embedding and metadata stored in Qdrant Cloud.

**Fields**:
- `id` (int): Unique identifier for the Qdrant point (same as `chunk_id`)
- `vector` (list[float]): Embedding vector (1024 dimensions for Cohere embed-multilingual-v3.0)
- `payload` (dict): Metadata stored alongside the vector in Qdrant:
  - `url` (str): Source page URL
  - `title` (str): Page title
  - `heading` (str): Heading context (H1/H2 hierarchy)
  - `text` (str): Original chunk text (for display in retrieval results)
  - `token_count` (int): Token count of chunk
  - `position` (int): Position in original page

**Lifecycle**:
1. Created after Cohere API returns embeddings for a batch of TextChunks
2. Upserted to Qdrant Cloud collection using Python client
3. Persists in Qdrant Cloud (survives script execution)

**Validation Rules**:
- `vector` must have exactly 1024 elements (Cohere model output dimension)
- `id` must be unique across all vectors in the collection
- All payload fields must be present (no nulls)

**Example**:
```python
{
    "id": 42,
    "vector": [0.123, -0.456, 0.789, ...],  # 1024 floats
    "payload": {
        "url": "https://textbook.vercel.app/docs/module1/week1",
        "title": "Week 1: ROS 2 Setup and First Node",
        "heading": "Module 1 > Week 1 > Installation",
        "text": "To install ROS 2 Humble on Ubuntu 22.04...",
        "token_count": 487,
        "position": 0
    }
}
```

---

### 4. PipelineState (Internal)

**Purpose**: Tracks overall pipeline execution state and statistics.

**Fields**:
- `total_pages_discovered` (int): Total URLs found during crawling
- `pages_processed` (int): Pages successfully parsed and chunked
- `pages_failed` (int): Pages that returned errors (404, timeouts, etc.)
- `total_chunks_created` (int): Total TextChunks generated
- `total_vectors_stored` (int): Total embeddings upserted to Qdrant
- `start_time` (datetime): Pipeline start timestamp
- `end_time` (datetime | None): Pipeline completion timestamp
- `errors` (list[dict]): List of errors encountered: `{"url": str, "error": str, "timestamp": datetime}`

**Lifecycle**:
1. Initialized at start of `main()` function
2. Updated as each stage completes (crawling, chunking, embedding, storage)
3. Logged to console at completion

**Validation Rules**:
- `pages_processed + pages_failed` should equal `total_pages_discovered` at end
- `total_vectors_stored` should equal `total_chunks_created` (assuming no Qdrant errors)

**Example**:
```python
{
    "total_pages_discovered": 150,
    "pages_processed": 148,
    "pages_failed": 2,
    "total_chunks_created": 1523,
    "total_vectors_stored": 1523,
    "start_time": datetime(2026, 1, 15, 10, 0, 0),
    "end_time": datetime(2026, 1, 15, 10, 45, 30),
    "errors": [
        {"url": "https://textbook.vercel.app/docs/broken", "error": "HTTP 404", "timestamp": ...},
        {"url": "https://textbook.vercel.app/docs/timeout", "error": "Request timeout", "timestamp": ...}
    ]
}
```

---

## Data Flow

```
1. Crawling Phase:
   DOCUSAURUS_URL (env var)
     → discover_urls()
     → [CrawlTarget, CrawlTarget, ...] (pending)

2. Extraction Phase:
   CrawlTarget (pending)
     → fetch_and_parse()
     → CrawlTarget (completed/failed) + HTML content

3. Chunking Phase:
   HTML content
     → extract_and_chunk()
     → [TextChunk, TextChunk, ...] (with heading context, tokens)

4. Embedding Phase:
   [TextChunk] (batched, max 96 per request)
     → generate_embeddings() → Cohere API
     → [VectorEmbedding] (with vectors + payload)

5. Storage Phase:
   [VectorEmbedding]
     → store_vectors() → Qdrant Cloud
     → Persistent storage (queryable)

6. Completion:
   PipelineState
     → log_summary()
     → Console output + exit
```

## State Transitions

### CrawlTarget Status Flow
```
pending → crawling → completed
                  → failed (if HTTP error or parsing error)
```

### Processing Stages
```
URL Discovery (sitemap or link crawl)
  ↓
URL Deduplication (set)
  ↓
HTTP Fetch (requests)
  ↓
HTML Parse (BeautifulSoup)
  ↓
Semantic Chunking (heading-based + token limit)
  ↓
Token Counting (tiktoken)
  ↓
Batch Embedding (Cohere API, max 96 texts)
  ↓
Vector Storage (Qdrant upsert)
  ↓
Pipeline Complete
```

## Relationships

**CrawlTarget → TextChunk**: One-to-many
- One page (CrawlTarget) produces multiple TextChunks
- Relationship: `TextChunk.source_url` references `CrawlTarget.url`

**TextChunk → VectorEmbedding**: One-to-one
- Each TextChunk becomes exactly one VectorEmbedding
- Relationship: `VectorEmbedding.id == TextChunk.chunk_id`

**PipelineState**: Aggregates statistics from all entities
- Tracks counts of CrawlTargets, TextChunks, VectorEmbeddings

## Error Handling

**CrawlTarget Failures**:
- HTTP 404/500: Mark status="failed", log error, continue to next URL
- Network timeout: Retry 3 times with exponential backoff (1s, 2s, 4s), then mark failed
- Invalid HTML: Log warning, skip chunking, mark completed with 0 chunks

**TextChunk Validation Failures**:
- Empty text content: Skip chunk, log warning
- Token count >562: Split chunk recursively until valid

**VectorEmbedding Failures**:
- Cohere API rate limit: Wait and retry with exponential backoff (up to 5 attempts)
- Cohere API error (invalid input): Log error, skip batch, continue
- Qdrant upsert failure: Log error, retry once, then fail loudly (abort pipeline)

## Performance Considerations

**Batching**:
- Cohere API: Batch up to 96 chunks per embed request (reduces API calls by ~96x)
- Qdrant upsert: Batch up to 100 vectors per upsert (reduces network round-trips)

**Memory Management**:
- Process pages sequentially (not all at once) to avoid loading entire site into memory
- Clear TextChunk list after embeddings stored to free memory

**Concurrency** (Future Enhancement - Out of Scope):
- Current implementation: Sequential processing (simple, sufficient for hackathon)
- Future: Use asyncio + aiohttp for parallel crawling (10-20x faster)

---

## Summary

| Entity | Storage | Lifetime | Purpose |
|--------|---------|----------|---------|
| CrawlTarget | In-memory (list/dict) | Pipeline execution | Track crawl progress |
| TextChunk | In-memory (list) | Until embedded | Prepare text for embedding |
| VectorEmbedding | Qdrant Cloud (persistent) | Indefinite | Enable semantic search |
| PipelineState | In-memory (dict) | Pipeline execution | Statistics and logging |

All entities are defined as Python dicts or dataclasses (no ORM needed). No database schema beyond Qdrant's vector collection.
