# Quickstart Guide: RAG Pipeline Setup & Execution

**Feature**: 001-rag-pipeline
**Date**: 2026-01-15
**Audience**: Developers setting up the RAG ingestion pipeline for the first time

## Prerequisites

Before running the pipeline, ensure you have:

1. **Python 3.10 or later** installed
2. **UV package manager** installed (https://github.com/astral-sh/uv)
3. **Active accounts** for:
   - Cohere API (free tier: https://cohere.com)
   - Qdrant Cloud (free tier: https://cloud.qdrant.io)
4. **Deployed Docusaurus site** (GitHub Pages or Vercel)

---

## Step 1: Install UV (if not already installed)

**macOS/Linux**:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Verify installation**:
```bash
uv --version
# Should output: uv 0.x.x
```

---

## Step 2: Create Project Structure

```bash
# Navigate to repository root
cd /path/to/Book_HTHON

# Create backend directory
mkdir -p backend
cd backend

# Initialize UV project
uv init --lib
```

**Expected output**:
```
Initialized project `backend` at /path/to/Book_HTHON/backend
```

---

## Step 3: Install Dependencies

```bash
# Add required packages
uv add cohere qdrant-client beautifulsoup4 requests tiktoken python-dotenv tenacity
```

**Expected output**:
```
Resolved 15 packages in 1.2s
Installed 15 packages in 350ms
  + beautifulsoup4==4.12.3
  + cohere==5.0.4
  + qdrant-client==1.7.3
  + requests==2.31.0
  + tiktoken==0.5.2
  + python-dotenv==1.0.1
  + tenacity==8.2.3
  ...
```

---

## Step 4: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Copy example template
cp .env.example .env  # If .env.example exists

# OR create new file
touch .env
```

**Edit `.env` with your credentials**:
```env
# Cohere API Key (get from https://dashboard.cohere.com/api-keys)
COHERE_API_KEY=your_cohere_api_key_here

# Qdrant Cloud (get from https://cloud.qdrant.io/clusters)
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here

# Docusaurus Site URL (your deployed textbook)
DOCUSAURUS_URL=https://your-textbook-site.vercel.app

# Optional: Override defaults
# QDRANT_COLLECTION_NAME=robotics_textbook
# MAX_TOKENS_PER_CHUNK=512
# CHUNK_OVERLAP_TOKENS=50
```

**⚠️ Security Note**: Never commit `.env` to git. Ensure `.gitignore` includes `.env`.

---

## Step 5: Get API Credentials

### Cohere API Key

1. Go to https://dashboard.cohere.com/api-keys
2. Sign up or log in
3. Create a new API key (free tier: 100 requests/minute)
4. Copy key to `.env` as `COHERE_API_KEY`

### Qdrant Cloud

1. Go to https://cloud.qdrant.io
2. Sign up or log in
3. Create a new cluster (free tier: 1GB storage)
4. Copy Cluster URL (e.g., `https://abc123.qdrant.io`) to `.env` as `QDRANT_URL`
5. Generate API key from cluster settings
6. Copy API key to `.env` as `QDRANT_API_KEY`

### Docusaurus Site URL

1. Ensure your Docusaurus textbook is deployed (GitHub Pages or Vercel)
2. Copy the live URL (e.g., `https://talib1973.github.io/Book_HTHON` or `https://book-hthon.vercel.app`)
3. Add to `.env` as `DOCUSAURUS_URL`

---

## Step 6: Verify Setup

Create a test script to verify environment variables:

```bash
# In backend/ directory
cat > test_env.py <<'EOF'
import os
from dotenv import load_dotenv

load_dotenv()

required_vars = ["COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY", "DOCUSAURUS_URL"]
missing = [var for var in required_vars if not os.getenv(var)]

if missing:
    print(f"❌ Missing environment variables: {', '.join(missing)}")
    print("Please configure them in .env file")
else:
    print("✅ All required environment variables are set")
    print(f"Cohere API Key: {'*' * 20}{os.getenv('COHERE_API_KEY')[-4:]}")
    print(f"Qdrant URL: {os.getenv('QDRANT_URL')}")
    print(f"Docusaurus URL: {os.getenv('DOCUSAURUS_URL')}")
EOF

# Run test
uv run python test_env.py
```

**Expected output**:
```
✅ All required environment variables are set
Cohere API Key: ********************abc1
Qdrant URL: https://xyz123.qdrant.io
Docusaurus URL: https://textbook.vercel.app
```

---

## Step 7: Create main.py

**Option A**: Implement manually (see `/specs/001-rag-pipeline/plan.md` for architecture)

**Option B**: Wait for `/sp.tasks` command to generate implementation tasks

**Placeholder for testing** (minimal version):
```python
# backend/main.py
import os
from dotenv import load_dotenv

def main():
    load_dotenv()

    # Validate environment
    required = ["COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY", "DOCUSAURUS_URL"]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        raise ValueError(f"Missing environment variables: {', '.join(missing)}")

    print("✅ Environment validated")
    print("🚀 Starting RAG pipeline...")
    # TODO: Implement pipeline logic
    print("✅ Pipeline complete (placeholder)")

if __name__ == "__main__":
    main()
```

---

## Step 8: Run the Pipeline

```bash
# In backend/ directory
uv run python main.py
```

**Expected output** (placeholder version):
```
✅ Environment validated
🚀 Starting RAG pipeline...
✅ Pipeline complete (placeholder)
```

**Expected output** (full implementation):
```
2026-01-15 10:00:00 [INFO] Starting RAG pipeline
2026-01-15 10:00:01 [INFO] Discovered 150 URLs from sitemap
2026-01-15 10:00:05 [INFO] Processed page 1/150: https://textbook.vercel.app/docs/intro
2026-01-15 10:00:05 [INFO] Created 12 chunks from page
2026-01-15 10:00:06 [INFO] Generated embeddings for batch of 96 chunks
2026-01-15 10:00:07 [INFO] Stored 96 vectors in Qdrant
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

---

## Step 9: Verify Results in Qdrant Cloud

1. Go to https://cloud.qdrant.io
2. Navigate to your cluster
3. Open "Collections" tab
4. Find `robotics_textbook` collection
5. Check "Points count" — should match "Vectors stored" from pipeline output
6. Click "Query" tab to test semantic search:
   - Query text: "How to install ROS 2?"
   - Limit: 5
   - Verify results contain relevant metadata (url, title, heading)

---

## Troubleshooting

### Error: "Missing environment variables"

**Solution**: Ensure `.env` file exists in `backend/` directory and contains all required variables.

```bash
# Check if .env exists
ls -la .env

# Verify contents (do NOT share output with others - contains secrets)
cat .env
```

### Error: "Cohere API error: Unauthorized"

**Solution**: Invalid API key. Double-check `COHERE_API_KEY` in `.env`.

```bash
# Verify key is set (last 4 characters only)
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('COHERE_API_KEY')[-4:])"
```

### Error: "Qdrant connection failed"

**Solution**: Check Qdrant cluster is running and URL/API key are correct.

1. Visit Qdrant Cloud dashboard
2. Verify cluster status is "Active"
3. Copy Cluster URL exactly (including `https://`)
4. Regenerate API key if needed

### Error: "HTTP 404" for Docusaurus site

**Solution**: Ensure site is deployed and publicly accessible.

```bash
# Test site accessibility
curl -I https://your-textbook-site.vercel.app

# Should return: HTTP/2 200
```

### Error: "Rate limit exceeded" (Cohere)

**Solution**: Free tier limit reached. Wait 1 minute or upgrade plan.

- Free tier: 100 requests/minute
- Pipeline batches 96 chunks per request
- ~150 pages × 10 chunks/page = ~1500 chunks = ~16 API calls (within limit)
- If exceeded, pipeline will auto-retry with exponential backoff

### Warning: "Page returned 404, skipping"

**Not an error**: Some pages may be missing or moved. Pipeline logs warning and continues.

```
2026-01-15 10:05:32 [WARNING] Page https://textbook.vercel.app/docs/broken returned 404, skipping
```

**Action**: Verify URL in browser. If page should exist, check Docusaurus build logs.

---

## Next Steps

1. **Verify vector storage**: Query Qdrant Cloud to ensure embeddings are searchable
2. **Run pipeline on content updates**: Re-run `uv run python main.py` to update embeddings
3. **Integrate with RAG chatbot** (future feature): Use stored vectors for semantic search

---

## Performance Expectations

**Typical execution time**:
- Small site (50 pages): ~5-10 minutes
- Medium site (150 pages): ~30-60 minutes
- Large site (500+ pages): ~2-4 hours

**Factors affecting speed**:
- Number of pages
- Page content length
- Network latency to Docusaurus site, Cohere API, Qdrant Cloud
- Cohere API rate limits (free tier: 100 req/min)

**Optimization tips** (future enhancements - out of scope for v1):
- Use asyncio + aiohttp for parallel page fetching
- Cache embeddings to avoid re-processing unchanged pages
- Run pipeline in cloud (GitHub Actions, Vercel cron job) for faster network access

---

## File Structure Summary

After setup, your `backend/` directory should look like this:

```
backend/
├── pyproject.toml          # UV project config (dependencies)
├── .python-version         # Python version (3.10+)
├── .env                    # Environment variables (DO NOT COMMIT)
├── .env.example            # Template for .env (safe to commit)
├── .gitignore              # Ignore .env, __pycache__, etc.
├── main.py                 # RAG pipeline implementation
└── test_env.py             # Optional: environment validation script
```

---

## Support

For issues or questions:
- Check `/specs/001-rag-pipeline/plan.md` for architecture details
- Review `/specs/001-rag-pipeline/contracts/pipeline-functions.md` for function specifications
- Create GitHub issue with error logs and environment details (redact API keys!)

---

**Last updated**: 2026-01-15
**Feature**: 001-rag-pipeline
**Status**: Setup complete, ready for implementation
