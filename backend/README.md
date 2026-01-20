# RAG Pipeline for Physical AI & Humanoid Robotics Textbook

This directory contains the RAG (Retrieval-Augmented Generation) ingestion pipeline that crawls the deployed Docusaurus textbook, chunks content semantically, generates embeddings using Cohere's multilingual model, and stores vectors in Qdrant Cloud.

## Quick Start

### 1. Install UV Package Manager

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Install Dependencies

Dependencies are already configured in `pyproject.toml`. To install:

```bash
cd backend
uv sync
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Get from https://dashboard.cohere.com/api-keys
COHERE_API_KEY=your_cohere_api_key_here

# Get from https://cloud.qdrant.io/clusters
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here

# Your deployed Docusaurus site URL
DOCUSAURUS_URL=https://your-textbook-site.vercel.app
```

### 4. Run the Pipeline

```bash
uv run python main.py
```

## What It Does

The pipeline executes these steps automatically:

1. **URL Discovery**: Crawls the Docusaurus site (via sitemap.xml or link crawling)
2. **Content Extraction**: Parses HTML and extracts main content with heading hierarchy
3. **Semantic Chunking**: Splits content at H1/H2 boundaries with 512-token limit and 50-token overlap
4. **Embedding Generation**: Calls Cohere API to generate 1024-dim multilingual embeddings (batch: 96 chunks)
5. **Vector Storage**: Stores embeddings with metadata (URL, title, headings) in Qdrant Cloud

## Expected Output

```
2026-01-15 10:00:00 [INFO] ============================================================
2026-01-15 10:00:00 [INFO] Starting RAG pipeline
2026-01-15 10:00:00 [INFO] ============================================================
2026-01-15 10:00:01 [INFO] Discovered 150 URLs from sitemap
2026-01-15 10:00:05 [INFO] Processing page 1/150: https://textbook.vercel.app/docs/intro
2026-01-15 10:00:05 [INFO]   Created 12 chunks (total: 12)
...
2026-01-15 10:45:30 [INFO] ============================================================
2026-01-15 10:45:30 [INFO] Pipeline complete
2026-01-15 10:45:30 [INFO] ============================================================
2026-01-15 10:45:30 [INFO] Pages discovered: 150
2026-01-15 10:45:30 [INFO] Pages processed: 148
2026-01-15 10:45:30 [INFO] Pages failed: 2
2026-01-15 10:45:30 [INFO] Chunks created: 1523
2026-01-15 10:45:30 [INFO] Vectors stored: 1523
2026-01-15 10:45:30 [INFO] Execution time: 0:45:30
```

## Verification

After the pipeline completes, verify vectors in Qdrant Cloud:

1. Go to https://cloud.qdrant.io
2. Navigate to your cluster → Collections
3. Find `robotics_textbook` collection
4. Check "Points count" matches "Vectors stored" from pipeline output
5. Test query: "How to install ROS 2?" and verify metadata (URL, title, headings)

## Troubleshooting

### Missing Environment Variables

**Error:** `Missing required environment variables: COHERE_API_KEY, ...`

**Solution:** Ensure `.env` file exists and contains all required variables:
```bash
# Check if .env exists
ls -la .env

# Verify contents (redact before sharing)
cat .env
```

### Cohere API Error: Unauthorized

**Error:** `cohere.errors.UnauthorizedError`

**Solution:** Invalid API key. Get a new key from https://dashboard.cohere.com/api-keys

### Qdrant Connection Failed

**Error:** `Failed to connect to Qdrant`

**Solution:**
1. Verify cluster is running at https://cloud.qdrant.io
2. Check Cluster URL is correct (must include `https://`)
3. Regenerate API key if needed

### Rate Limit Exceeded

**Info:** Pipeline automatically retries with exponential backoff

Cohere free tier: 100 requests/minute. The pipeline batches 96 chunks per request, so ~150 pages × 10 chunks/page = ~1500 chunks = ~16 API calls (well within limit).

## Project Structure

```
backend/
├── main.py              # RAG ingestion pipeline (Spec 001)
├── test_retrieval.py    # Retrieval validation script (Spec 002)
├── verify_qdrant.py     # Connection verification helper
├── query_test.py        # Manual query testing helper
├── pyproject.toml       # UV project configuration
├── .env.example         # Environment variable template
├── .env                 # Your credentials (not committed)
├── .gitignore           # Git ignore rules
├── README.md            # This file
└── .venv/               # Virtual environment (auto-created)
```

## Architecture

See `/specs/001-rag-pipeline/plan.md` for complete architecture documentation.

**Key Functions:**
- `discover_urls()`: Sitemap parsing or recursive crawling
- `fetch_and_parse()`: HTML extraction with BeautifulSoup
- `chunk_text()`: Semantic chunking with tiktoken
- `generate_embeddings()`: Cohere API batch calls
- `store_vectors()`: Qdrant Cloud upsert
- `main()`: Orchestration with error handling

## Performance

**Typical execution time:**
- Small site (50 pages): 5-10 minutes
- Medium site (150 pages): 30-60 minutes
- Large site (500+ pages): 2-4 hours

**Factors:**
- Number of pages and content length
- Network latency (Docusaurus, Cohere, Qdrant)
- Cohere API rate limits (100 req/min on free tier)

## Validating Retrieval Quality

After running the ingestion pipeline, validate that semantic search is working correctly:

```bash
uv run python test_retrieval.py
```

This script tests retrieval quality with 12 queries spanning all syllabus modules (ROS 2, Digital Twin, NVIDIA Isaac, VLA, Capstone). It displays:
- Top-3 results for each query with metadata (URL, title, heading)
- Precision@k metrics for queries with ground-truth
- Summary statistics with pass/fail status

**Success Criteria:**
- ≥80% of queries return relevant top-1 result (score ≥0.5)
- Precision@3 ≥70% for ground-truth queries
- Execution time <30 seconds

See `/specs/002-rag-validation/quickstart.md` for detailed usage guide.

## RAG-Powered Agent

After validating retrieval quality, use the conversational AI agent to interact with the textbook:

```bash
uv run python agent.py
```

This agent provides:
- **Grounded responses** using only textbook content (no hallucination)
- **Source citations** with page title and clickable URL for every claim
- **Multi-turn conversations** with memory (ask follow-up questions naturally)
- **Graceful error handling** when textbook doesn't cover a topic

**Example conversation**:
```
You: What is ROS 2?
Tutor: ROS 2 (Robot Operating System 2) is... [ROS 2 Architecture](https://...)

You: How do I install it?
Tutor: To install ROS 2 on Ubuntu... [Installation Guide](https://...)
```

**Features**:
- Uses OpenAI Agents SDK with GPT-4 (configurable via `OPENAI_MODEL` env var)
- Retrieves top-3 relevant chunks from Qdrant per query
- Session persistence in `robotics_chatbot.db` file
- Type `exit` or `quit` to end conversation

**Success Criteria**:
- <10 seconds per query
- 100% citation rate for textbook-based responses
- Maintains context for 5+ conversation turns

See `/specs/003-rag-agent/quickstart.md` for detailed usage guide and troubleshooting.

## Next Steps

After vectors are stored and validated:
1. Build RAG chatbot frontend (query Qdrant for semantic search)
2. Implement FastAPI backend for `/api/chat` endpoint
3. Integrate with Claude/GPT for answer generation
4. Add GitHub Actions workflow for automated re-ingestion on content changes

## Support

- Architecture: `/specs/001-rag-pipeline/plan.md`
- Function contracts: `/specs/001-rag-pipeline/contracts/pipeline-functions.md`
- Setup guide: `/specs/001-rag-pipeline/quickstart.md`
- Issues: Create GitHub issue with logs (redact API keys!)

---

**Feature**: 001-rag-pipeline
**Last Updated**: 2026-01-15
**Status**: ✅ Complete and ready to run
