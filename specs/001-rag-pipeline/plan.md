# Implementation Plan: RAG Pipeline for Physical AI & Humanoid Robotics Textbook

**Branch**: `001-rag-pipeline` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rag-pipeline/spec.md`

## Summary

Build a RAG (Retrieval-Augmented Generation) ingestion pipeline that crawls the deployed Docusaurus textbook site, chunks content by semantic boundaries (headings), generates embeddings using Cohere's embed-multilingual-v3.0 model, and stores vectors with metadata in Qdrant Cloud. The pipeline is delivered as a single self-contained Python script (`backend/main.py`) using UV package manager, with all steps orchestrated in a `main()` function for end-to-end batch processing.

**Key Technical Decisions** (from research.md):
- Python 3.10+ with UV package manager for fast dependency resolution
- Requests + BeautifulSoup4 for static HTML crawling and parsing
- Tiktoken for accurate token counting (cl100k_base encoding)
- Heading-based semantic chunking with 512-token limit and 50-token overlap
- Cohere Python SDK for batch embedding generation (up to 96 texts per API call)
- Qdrant Python client for vector storage in cloud free tier
- Environment variables for configuration (no hardcoded secrets)

## Technical Context

**Language/Version**: Python 3.10+
**Primary Dependencies**: cohere, qdrant-client, beautifulsoup4, requests, tiktoken, python-dotenv, tenacity
**Storage**: Qdrant Cloud (vector database, free tier 1GB)
**Testing**: Manual verification + smoke tests (automated unit tests out of scope for v1)
**Target Platform**: Local execution (developer workstation) or CI/CD (GitHub Actions, future enhancement)
**Project Type**: Single-file backend script (no frontend, no API, no separate modules)
**Performance Goals**: Process 150-page textbook site in <1 hour; 95%+ chunks with H1/H2 context
**Constraints**: 512 tokens/chunk, 50-token overlap; Cohere embed-multilingual-v3.0 only; Qdrant Cloud only; no local vector DB
**Scale/Scope**: ~150 pages, ~1500-2000 text chunks, ~1.5-2MB vector storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Technical Accuracy & Industry Alignment
- ✅ **PASS**: Uses industry-standard tools (Cohere embeddings, Qdrant vector DB)
- ✅ **PASS**: Follows modern Python practices (UV package manager, type hints, environment variables)
- ✅ **PASS**: No legacy patterns or outdated libraries

### Principle II: Modular, Extensible Content Architecture
- ✅ **PASS**: Pipeline processes Docusaurus site with semantic HTML structure
- ✅ **PASS**: Preserves heading hierarchy for semantic chunking
- ⚠️ **ADVISORY**: Pipeline is single-file for simplicity (not modular architecture)
  - **Justification**: User requested "one self-contained script, no separate modules" for ease of deployment and review
  - **Future enhancement**: Could be refactored into modules (crawler, chunker, embedder) if complexity grows

### Principle III: Accessibility & Inclusive Design
- ✅ **PASS**: Processes multilingual content (Cohere's multilingual model)
- ✅ **PASS**: Preserves semantic structure (headings, alt text) for RAG retrieval
- ✅ **N/A**: No UI components (backend pipeline only)

### Principle IV: Deployment-First Development
- ✅ **PASS**: Single-script execution with environment variable configuration
- ✅ **PASS**: Reproducible setup via UV package manager
- ✅ **PASS**: No "local-only" dependencies (cloud services for storage)
- ⚠️ **FUTURE**: CI/CD workflow not implemented in v1 (manual execution only)
  - **Enhancement**: Add GitHub Actions workflow to run pipeline on content changes

### Principle V: Privacy-Respecting Personalization
- ✅ **PASS**: No user data collected (ingestion pipeline, not user-facing app)
- ✅ **PASS**: Only processes public web content (no authentication required)
- ✅ **N/A**: No tracking or analytics

### Principle VI: Semantic Content for RAG Intelligence
- ✅ **PASS**: Chunks preserve heading hierarchy (H1/H2 context)
- ✅ **PASS**: Metadata includes source URL, page title, heading context
- ✅ **PASS**: Uses semantic boundaries (headings) for chunking, not arbitrary token limits
- ✅ **PASS**: Cohere multilingual embeddings optimize for cross-lingual retrieval

### Principle VII: Iterative, Testable Delivery
- ✅ **PASS**: Single vertical slice (complete ingestion pipeline)
- ✅ **PASS**: Testable via manual verification (Qdrant Cloud dashboard query)
- ⚠️ **PARTIAL**: No automated tests in v1 (manual smoke test required)
  - **Justification**: Hackathon timeline prioritizes working implementation over test coverage
  - **Future enhancement**: Add pytest unit tests with mocked API responses

**Overall Gate Result**: ✅ **PASS** (with justifications for partial implementations)

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-pipeline/
├── spec.md                  # Feature specification (user scenarios, requirements, success criteria)
├── plan.md                  # This file (architecture, technical decisions, implementation approach)
├── research.md              # Phase 0: Technical decisions and alternatives considered
├── data-model.md            # Phase 1: Internal data structures (CrawlTarget, TextChunk, VectorEmbedding)
├── quickstart.md            # Phase 1: Setup and execution guide for developers
├── contracts/               # Phase 1: Function signatures and contracts
│   └── pipeline-functions.md
├── checklists/              # Quality validation checklists
│   └── requirements.md      # Specification quality checklist
└── tasks.md                 # Phase 2: NOT created by /sp.plan (requires /sp.tasks command)
```

### Source Code (repository root)

```text
backend/                     # NEW: RAG pipeline script directory
├── pyproject.toml           # UV project config (dependencies, Python version)
├── .python-version          # Python 3.10+
├── .env                     # Environment variables (COHERE_API_KEY, QDRANT_URL, etc.) - NOT COMMITTED
├── .env.example             # Template for .env file (safe to commit)
├── .gitignore               # Ignore .env, __pycache__, *.pyc, uv.lock
└── main.py                  # Single-file RAG pipeline implementation

# Existing project structure (untouched by this feature)
docs/                        # Docusaurus content (source for crawling)
src/                         # Docusaurus React components
static/                      # Static assets
docusaurus.config.js         # Docusaurus configuration
package.json                 # Node.js dependencies (for Docusaurus build)
.github/workflows/           # GitHub Actions (deployment only, no pipeline automation in v1)
```

**Structure Decision**: Single-file backend script (`backend/main.py`) as requested by user. This avoids complexity of multi-module architecture while delivering a complete, testable pipeline. The `backend/` directory is isolated from the Docusaurus project (docs/src/) to prevent dependency conflicts (Python vs Node.js).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Single-file script (vs modular) | User requested "one self-contained script, no separate modules" | Modular architecture (crawler.py, chunker.py, embedder.py) would add import complexity and make code review harder for single-developer hackathon |
| Manual testing (vs automated) | Hackathon timeline prioritizes working implementation | pytest unit tests with mocked API responses would require 2-3 additional hours for test infrastructure setup |
| No CI/CD for pipeline (vs GitHub Actions) | V1 focuses on manual execution, CI/CD is future enhancement | Automated pipeline runs on content changes would require webhook setup, secrets management, and error alerting (out of scope for 1-day timeline) |

**Justification**: All violations are explicitly scoped as future enhancements. V1 delivers a working, reproducible pipeline that meets all functional requirements within the 1-day constraint.

---

## Phase 0: Research Summary

See [research.md](./research.md) for full details. Key decisions:

1. **Python 3.10+ with UV**: Fast package manager, modern Python features
2. **Requests + BeautifulSoup4**: Simple, reliable for static HTML crawling
3. **Tiktoken (cl100k_base)**: Accurate token counting for chunk sizing
4. **Heading-based chunking**: Semantic boundaries (H1/H2) with token limit fallback
5. **Cohere embed-multilingual-v3.0**: Spec-mandated embedding model (1024 dimensions)
6. **Qdrant Cloud**: Spec-mandated vector storage (free tier sufficient)
7. **Environment variables**: Secure credential management (no hardcoded keys)
8. **Exponential backoff retries**: Handle API rate limits gracefully (tenacity library)

**All NEEDS CLARIFICATION items resolved** (no unknowns remaining).

---

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for full entity definitions. Summary:

- **CrawlTarget**: URL to be processed (status: pending/crawling/completed/failed)
- **TextChunk**: Semantic text segment with metadata (≤512 tokens, heading context)
- **VectorEmbedding**: Cohere embedding + Qdrant payload (1024-dim vector)
- **PipelineState**: Execution statistics (pages processed, chunks created, errors)

### Function Contracts

See [contracts/pipeline-functions.md](./contracts/pipeline-functions.md) for full signatures. Summary:

1. `discover_urls(base_url) → list[str]`: Crawl sitemap or follow links
2. `fetch_and_parse(url) → (title, content, headings)`: Extract HTML content
3. `chunk_text(text, headings, ...) → list[dict]`: Semantic chunking with overlap
4. `generate_embeddings(chunks, cohere_client) → list[list[float]]`: Batch embedding API call
5. `store_vectors(embeddings, chunks, qdrant_client) → int`: Upsert to Qdrant Cloud
6. `main()`: Orchestrate all steps, log progress, exit with status code

### Quickstart Guide

See [quickstart.md](./quickstart.md) for step-by-step setup instructions. Covers:

- Installing UV package manager
- Creating `backend/` directory and initializing UV project
- Installing dependencies (`uv add cohere qdrant-client ...`)
- Configuring `.env` file with API credentials
- Running pipeline (`uv run python main.py`)
- Verifying results in Qdrant Cloud dashboard
- Troubleshooting common errors (missing env vars, API rate limits, 404s)

---

## Phase 2: Implementation Tasks

**Created by `/sp.tasks` command** (not this `/sp.plan` command).

Expected task breakdown (for reference):

1. **Setup**: Create `backend/` directory, initialize UV project, configure `.env.example`
2. **URL Discovery**: Implement `discover_urls()` function (sitemap parsing + link crawling)
3. **Content Extraction**: Implement `fetch_and_parse()` function (requests + BeautifulSoup)
4. **Semantic Chunking**: Implement `chunk_text()` function (tiktoken + heading-based splitting)
5. **Embedding Generation**: Implement `generate_embeddings()` function (Cohere SDK + batching)
6. **Vector Storage**: Implement `store_vectors()` function (Qdrant client + collection creation)
7. **Orchestration**: Implement `main()` function (error handling + logging + statistics)
8. **Manual Testing**: Run pipeline against live Docusaurus site, verify Qdrant Cloud results
9. **Documentation**: Update README with usage instructions, commit `.env.example`

---

## Architecture Diagrams

### High-Level Data Flow

```
┌─────────────────────┐
│  Docusaurus Site    │
│ (GitHub Pages/      │
│  Vercel)            │
└──────────┬──────────┘
           │ HTTP GET (requests)
           ▼
┌─────────────────────┐
│  URL Discovery      │
│  - Sitemap parse    │
│  - Link crawling    │
│  - Deduplication    │
└──────────┬──────────┘
           │ List of URLs
           ▼
┌─────────────────────┐
│  Content Extract    │
│  - BeautifulSoup    │
│  - Heading detect   │
│  - Text cleaning    │
└──────────┬──────────┘
           │ (title, content, headings)
           ▼
┌─────────────────────┐
│  Semantic Chunking  │
│  - H1/H2 boundaries │
│  - Token counting   │
│  - 50-token overlap │
└──────────┬──────────┘
           │ List[TextChunk]
           ▼
┌─────────────────────┐
│  Cohere API         │
│  embed-multilingual │
│  -v3.0              │
│  (batch: 96 chunks) │
└──────────┬──────────┘
           │ List[embedding vectors]
           ▼
┌─────────────────────┐
│  Qdrant Cloud       │
│  - Collection:      │
│    robotics_textbook│
│  - Metadata:        │
│    url, title, head │
└─────────────────────┘
```

### Function Call Hierarchy

```
main()
├─> load_dotenv()
├─> validate_environment()
├─> initialize_clients()
│   ├─> cohere.Client(api_key)
│   └─> QdrantClient(url, api_key)
├─> create_qdrant_collection()
├─> discover_urls(base_url)
│   ├─> requests.get(f"{base_url}/sitemap.xml")
│   └─> BeautifulSoup(sitemap_xml, 'xml')
├─> FOR EACH url:
│   ├─> fetch_and_parse(url)
│   │   ├─> requests.get(url, timeout=30)
│   │   └─> BeautifulSoup(html, 'html.parser')
│   ├─> chunk_text(content, headings, url, title)
│   │   ├─> tiktoken.get_encoding("cl100k_base")
│   │   └─> split_by_headings_and_tokens()
│   └─> append chunks to batch
├─> FOR EACH batch (96 chunks):
│   ├─> generate_embeddings(batch, cohere_client)
│   │   └─> cohere_client.embed(texts, model="embed-multilingual-v3.0")
│   └─> store_vectors(embeddings, batch, qdrant_client)
│       └─> qdrant_client.upsert(collection, points)
└─> log_summary(pipeline_state)
```

---

## Deployment Strategy

### V1 (Current Scope)

**Execution Environment**: Local developer workstation or CI/CD runner (manual trigger)

**Deployment Steps**:
1. Clone repository
2. `cd backend && uv init --lib`
3. `uv add cohere qdrant-client beautifulsoup4 requests tiktoken python-dotenv tenacity`
4. Configure `.env` with API credentials
5. `uv run python main.py`
6. Verify results in Qdrant Cloud dashboard

**No Automated Deployment**: Pipeline runs manually on demand (not triggered by content changes)

### V2 (Future Enhancement - Out of Scope)

**Automated Re-Ingestion**:
- GitHub Actions workflow triggered on push to `docs/` directory
- Workflow steps:
  1. Set up Python 3.10+ environment
  2. Install UV and dependencies
  3. Load secrets from GitHub Actions environment variables
  4. Run `uv run python main.py`
  5. Notify on failure (Slack, email, GitHub issue)
- **Benefits**: Keeps vector embeddings in sync with textbook content automatically

**Incremental Updates** (advanced):
- Track content hashes to avoid re-processing unchanged pages
- Only re-embed modified chunks (requires additional state tracking)

---

## Risk Analysis

### High-Severity Risks

1. **Cohere API Rate Limits**
   - **Probability**: Medium (free tier: 100 req/min)
   - **Impact**: Pipeline slowdown or failure
   - **Mitigation**: Batching (96 chunks/request), exponential backoff retries (tenacity library)
   - **Residual**: Acceptable (pipeline may take longer but will complete)

2. **Qdrant Cloud Storage Quota**
   - **Probability**: Low (1GB free tier sufficient for ~100k vectors)
   - **Impact**: Pipeline failure mid-execution
   - **Mitigation**: Pre-calculate storage needs (~1500 chunks × 1024 dims × 4 bytes = ~6MB), monitor quota
   - **Residual**: Low (textbook well within limits)

3. **Docusaurus Site Availability**
   - **Probability**: Low (deployed on Vercel/GitHub Pages, high uptime)
   - **Impact**: Pipeline cannot start or hangs mid-crawl
   - **Mitigation**: Retry logic (3 attempts per URL), skip failed pages, continue processing
   - **Residual**: Acceptable (log errors, partial ingestion is useful)

### Medium-Severity Risks

4. **Malformed HTML / Missing Headings**
   - **Probability**: Medium (Docusaurus generates standard HTML, but custom pages may vary)
   - **Impact**: Poor chunk quality (no semantic context)
   - **Mitigation**: Fallback to token-based chunking if no H1/H2 found, log warnings
   - **Residual**: Acceptable (metadata will show "No heading")

5. **API Credential Leakage**
   - **Probability**: Low (`.gitignore` includes `.env`)
   - **Impact**: Unauthorized API usage, quota exhaustion
   - **Mitigation**: `.env` not committed, `.env.example` template provided, documentation emphasizes security
   - **Residual**: Low (developer responsibility)

### Low-Severity Risks

6. **Inconsistent Chunk Sizes**
   - **Probability**: Low (tiktoken is accurate)
   - **Impact**: Slightly suboptimal retrieval (very large or small chunks)
   - **Mitigation**: Token counting enforces 512±50 token range, overlap preserves context
   - **Residual**: Negligible (minor quality variance)

---

## Performance Optimization Opportunities (Future)

1. **Parallel Crawling**: Use `asyncio` + `aiohttp` for concurrent page fetching (10-20x speedup)
2. **Embedding Caching**: Store chunk hashes to avoid re-embedding unchanged content
3. **Batch Size Tuning**: Test 64 vs 96 chunks per Cohere API call for optimal throughput
4. **Cloud Execution**: Run pipeline on GitHub Actions runners (closer to API servers, faster network)

---

## Acceptance Criteria (from Spec)

Pipeline implementation is complete when:

- ✅ **AC-001**: All publicly accessible pages from deployed Docusaurus site are crawled (100% coverage)
- ✅ **AC-002**: Text chunks preserve heading hierarchy (95%+ with H1/H2 context)
- ✅ **AC-003**: Vector embeddings stored in Qdrant Cloud for 100% of chunks
- ✅ **AC-004**: Pipeline completes in <1 hour for 150-page site
- ✅ **AC-005**: Single-script execution (`uv run python main.py`) with no manual steps
- ✅ **AC-006**: Qdrant vectors queryable with correct metadata (URL, title, headings)
- ✅ **AC-007**: Logs show progress (pages processed, chunks created, errors)

**Validation Method**: Manual testing against live Docusaurus site + Qdrant Cloud dashboard inspection

---

## Next Steps

1. **Run `/sp.tasks`** to generate implementation tasks.md
2. **Implement `backend/main.py`** following contracts in `contracts/pipeline-functions.md`
3. **Test locally** with `.env` configured (see `quickstart.md`)
4. **Verify vectors** in Qdrant Cloud dashboard (query for "ROS 2", check metadata)
5. **Document results** in PR description (pages processed, chunks created, execution time)
6. **Commit** with message: "Implement RAG pipeline for textbook ingestion (001-rag-pipeline)"

---

**Last Updated**: 2026-01-15
**Status**: Design complete, ready for task generation (`/sp.tasks`)
**Architecture Sign-Off**: Constitution gates passed with justifications
