# Research: RAG Pipeline Technical Decisions

**Feature**: 001-rag-pipeline
**Date**: 2026-01-15
**Purpose**: Document technical decisions and alternatives for RAG pipeline implementation

## 1. Python Version & Package Manager

### Decision: Python 3.10+ with UV package manager

**Rationale**:
- Python 3.10 provides improved type hints and pattern matching useful for pipeline logic
- UV is a fast, modern Python package manager (written in Rust) that's compatible with pip/PyPI
- UV supports `uv init --lib` for quick project bootstrapping
- User explicitly requested UV in the plan input

**Alternatives Considered**:
- **Poetry**: More mature but slower dependency resolution
- **pip + venv**: Standard approach but lacks modern dependency resolution features
- **Pipenv**: Good but not as fast as UV for lock file generation

**Implementation**:
```bash
uv init --lib
uv add cohere qdrant-client beautifulsoup4 requests tiktoken
```

## 2. Web Crawling Strategy

### Decision: Requests + BeautifulSoup4 for HTML parsing

**Rationale**:
- Docusaurus generates static HTML, no JavaScript rendering needed
- `requests` is simple, reliable for HTTP GET operations
- BeautifulSoup4 excels at HTML parsing with CSS selectors
- Sitemap.xml (if available) provides complete URL list for crawling

**Alternatives Considered**:
- **Scrapy**: Full framework, overkill for single-domain static site
- **Selenium/Playwright**: Unnecessary for static HTML (adds complexity, requires browser)
- **httpx**: Modern async alternative to requests, but sync is sufficient for batch processing

**Implementation**:
- Check for `sitemap.xml` at root URL
- If sitemap exists, parse all `<loc>` URLs
- If no sitemap, crawl starting from root, follow internal links
- Use `set()` for URL deduplication

## 3. Content Extraction

### Decision: BeautifulSoup4 with main content selector

**Rationale**:
- Docusaurus uses predictable HTML structure: `<article>` or `.markdown` class for main content
- CSS selectors eliminate navigation, headers, footers automatically
- Preserve heading hierarchy (H1, H2) for semantic chunking

**Alternatives Considered**:
- **Trafilatura**: Automatic main content extraction, but less control over heading preservation
- **Readability**: Python port, good for articles but may miss technical code blocks
- **Custom regex**: Fragile, fails with HTML variations

**Implementation**:
```python
soup = BeautifulSoup(html, 'html.parser')
article = soup.find('article') or soup.find(class_='markdown')
# Extract headings for chunk boundaries
headings = article.find_all(['h1', 'h2'])
```

## 4. Token Counting

### Decision: tiktoken library (OpenAI's tokenizer)

**Rationale**:
- Cohere's `embed-multilingual-v3.0` uses similar tokenization to GPT models
- `tiktoken` is fast (C implementation) and accurate
- Provides `cl100k_base` encoding compatible with multilingual models
- Spec requires 512-token chunks - need precise counting

**Alternatives Considered**:
- **transformers.AutoTokenizer**: Accurate but slower, requires downloading model tokenizer
- **Character/word-based splitting**: Inaccurate, tokens ≠ words (especially for non-English text)
- **Cohere API token count endpoint**: Adds API call overhead for every chunk

**Implementation**:
```python
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
tokens = enc.encode(text)
# Chunk at 512 tokens, overlap 50
```

## 5. Semantic Chunking Strategy

### Decision: Heading-based boundaries with token limit fallback

**Rationale**:
- Spec prioritizes semantic boundaries (H1/H2 headings)
- Must handle edge cases: long sections, missing headings
- Overlap preserves context across chunks for better retrieval

**Alternatives Considered**:
- **Fixed token chunks only**: Loses semantic context, may split mid-sentence
- **Sentence-based chunking**: Better than character, but headings are stronger semantic markers
- **LangChain RecursiveCharacterTextSplitter**: Adds dependency, but similar logic

**Implementation**:
1. Parse HTML, extract text with heading markers
2. Split at H1/H2 tags into sections
3. For each section:
   - If ≤512 tokens → single chunk
   - If >512 tokens → split at 512-token boundaries with 50-token overlap
4. Metadata: store heading hierarchy (e.g., "Module 1 > Week 1 > ROS 2 Setup")

## 6. Embedding Generation

### Decision: Cohere Python SDK with embed-multilingual-v3.0

**Rationale**:
- Spec mandates Cohere embed-multilingual-v3.0 (no alternatives)
- Python SDK handles authentication, retries, error codes
- Batch API supports up to 96 texts per request (reduces API calls)

**Alternatives Considered**:
- **Direct REST API**: Possible but requires manual retry logic, error handling
- **Other embedding models**: Out of scope per spec constraints

**Implementation**:
```python
import cohere
co = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))

# Batch embed (max 96 chunks per call)
response = co.embed(
    texts=chunk_batch,
    model="embed-multilingual-v3.0",
    input_type="search_document"  # For indexing
)
embeddings = response.embeddings
```

**Rate Limiting**:
- Cohere free tier: 100 requests/minute
- Implement exponential backoff: 1s, 2s, 4s, 8s retries
- Use `tenacity` library for retry decorator

## 7. Vector Storage

### Decision: Qdrant Cloud with Python client

**Rationale**:
- Spec mandates Qdrant Cloud free tier (no alternatives)
- Python client simplifies collection creation, upserting vectors
- Cloud deployment avoids local database setup

**Alternatives Considered**:
- **Qdrant local**: Out of scope per spec
- **Other vector DBs (Pinecone, Weaviate)**: Out of scope per spec

**Implementation**:
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Create collection (run once)
client.create_collection(
    collection_name="robotics_textbook",
    vectors_config=VectorParams(
        size=1024,  # Cohere embed-multilingual-v3.0 dimension
        distance=Distance.COSINE
    )
)

# Upsert vectors with metadata
client.upsert(
    collection_name="robotics_textbook",
    points=[
        PointStruct(
            id=idx,
            vector=embedding,
            payload={
                "url": source_url,
                "title": page_title,
                "heading": heading_context,
                "text": chunk_text
            }
        )
        for idx, (embedding, chunk) in enumerate(zip(embeddings, chunks))
    ]
)
```

## 8. Error Handling & Logging

### Decision: Python logging module with structured output

**Rationale**:
- Spec requires progress logging (pages processed, chunks created, errors)
- Standard library logging sufficient for single-script use
- Structured format enables debugging without external tools

**Alternatives Considered**:
- **Rich library**: Beautiful terminal output, but adds dependency
- **Print statements**: Unstructured, no log levels, hard to filter
- **Loguru**: Modern alternative, but stdlib is sufficient

**Implementation**:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Usage
logger.info(f"Crawled {len(urls)} pages")
logger.warning(f"Page {url} returned 404, skipping")
logger.error(f"Cohere API error: {e}")
```

## 9. Configuration Management

### Decision: Environment variables with .env.example

**Rationale**:
- Spec requires credentials via environment variables
- `.env.example` documents required variables without exposing secrets
- `python-dotenv` library loads .env files for local development

**Alternatives Considered**:
- **Config files (YAML/JSON)**: Risk of committing secrets
- **Command-line args**: Tedious for multiple credentials
- **Hardcoded**: Security violation per constitution

**Implementation**:
```bash
# .env.example
COHERE_API_KEY=your_cohere_api_key_here
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
DOCUSAURUS_URL=https://your-textbook-site.vercel.app
```

```python
from dotenv import load_dotenv
load_dotenv()

cohere_key = os.getenv("COHERE_API_KEY")
if not cohere_key:
    raise ValueError("COHERE_API_KEY not set")
```

## 10. Project Structure

### Decision: Single-file backend/main.py with UV project structure

**Rationale**:
- User specified "single main.py file, no separate modules"
- UV creates minimal structure: `pyproject.toml`, `src/` directory
- All functions in one file for simplicity (crawl, chunk, embed, store, main)

**Alternatives Considered**:
- **Multi-module structure**: Better for large projects, but spec requires self-contained script
- **Notebook (Jupyter)**: Interactive, but harder to run in CI/CD

**Final Structure**:
```text
backend/
├── pyproject.toml          # UV project file
├── .env.example            # Environment variable template
├── .gitignore              # Ignore .env, __pycache__
└── main.py                 # All pipeline code
```

## 11. Deployment Target URL

### Decision: Read from DOCUSAURUS_URL environment variable

**Rationale**:
- Textbook may be deployed to GitHub Pages or Vercel
- URL varies by environment (production vs staging)
- Environment variable allows testing against different deployments

**Implementation**:
```python
base_url = os.getenv("DOCUSAURUS_URL")
if not base_url:
    raise ValueError("DOCUSAURUS_URL not set (e.g., https://textbook.vercel.app)")
```

## 12. Testing Strategy (Phase 2)

### Decision: Manual verification + smoke test script

**Rationale**:
- Spec requires reproducible pipeline execution
- Automated testing of external APIs (Cohere, Qdrant) requires mocking
- For hackathon timeline, manual verification is acceptable

**Future Enhancements** (out of scope):
- Unit tests with mocked API responses (pytest + responses library)
- Integration test against staging Qdrant collection
- CI/CD workflow to run pipeline on content changes

**Verification Steps**:
1. Run `uv run python main.py`
2. Check logs for "Processed X pages, created Y chunks, stored Z vectors"
3. Query Qdrant Cloud dashboard to verify vector count
4. Test retrieval query: search for "ROS 2" and verify metadata returned

## Summary of Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | Python 3.10+ | Modern features, ecosystem support |
| Package Manager | UV | Fast, modern, user-requested |
| Web Crawling | requests + BeautifulSoup4 | Simple, reliable for static HTML |
| Token Counting | tiktoken | Accurate, fast tokenization |
| Chunking | Custom (heading-based) | Semantic boundaries per spec |
| Embedding | Cohere embed-multilingual-v3.0 | Spec-mandated model |
| Vector DB | Qdrant Cloud | Spec-mandated storage |
| Error Handling | Python logging | Standard, sufficient |
| Config | Environment variables + dotenv | Secure, flexible |
| Structure | Single main.py | User-requested simplicity |

## Open Questions (Resolved)

1. **Docusaurus sitemap availability?** → Assume yes; fallback to link crawling if missing
2. **Cohere embedding dimensions?** → 1024 for embed-multilingual-v3.0
3. **Qdrant collection name?** → Use "robotics_textbook" (configurable via env var if needed)
4. **Handling code blocks in chunks?** → Preserve as part of text content, tokenize normally
5. **Chunk ID strategy?** → Sequential integer IDs (0, 1, 2, ...) based on processing order

All technical decisions documented. Ready for Phase 1: Data Model & Contracts.
