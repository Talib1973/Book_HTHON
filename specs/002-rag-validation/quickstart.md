# Quickstart Guide - RAG Validation Script

**Feature**: 002-rag-validation
**File**: `backend/test_retrieval.py`
**Date**: 2026-01-16

## Overview

This guide walks through running the RAG validation script to verify retrieval quality of the embedded textbook content.

---

## Prerequisites

1. **Completed RAG Pipeline (Spec 001)**:
   - Qdrant collection `robotics_textbook` must exist with embedded vectors
   - Run `uv run python backend/main.py` if collection doesn't exist yet

2. **Environment Variables**:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in credentials:
     ```bash
     COHERE_API_KEY=your_cohere_key_here
     QDRANT_URL=https://your-cluster-id.qdrant.io
     QDRANT_API_KEY=your_qdrant_key_here
     ```

3. **Python Environment**:
   - Python 3.10+ installed
   - UV package manager installed (https://github.com/astral-sh/uv)

---

## Quick Start (5 minutes)

### Step 1: Navigate to Backend Directory
```bash
cd backend/
```

### Step 2: Verify Environment Variables
```bash
# Quick check - should show your credentials (not "MISSING")
uv run python verify_qdrant.py
```

Expected output:
```text
✅ Connected successfully!
Collections found: 1
  - robotics_textbook (30 points)
```

### Step 3: Run Validation Script
```bash
uv run python test_retrieval.py
```

### Step 4: Review Results
The script will:
1. Test 12 queries across all syllabus modules
2. Display top-3 results for each query with metadata
3. Calculate precision@3 and precision@5 metrics
4. Show summary statistics and pass/fail status

Expected runtime: ~20-30 seconds

---

## Sample Output

```text
=============================================================
RAG Retrieval Validation Report
=============================================================
Collection: robotics_textbook
Total Queries: 12
Date: 2026-01-16T10:30:00Z

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
   Title: Introduction to Physical AI & Robotics
   Heading: Prerequisites
   URL: https://book-hthon.vercel.app/docs/intro
   Text: "Before starting with ROS 2 development, ensure you have a proper workspace configured..."

3. Score: 0.5234
   ...

[Repeat for all 12 queries]

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

## Understanding the Results

### Per-Query Results

Each query displays:
- **Score**: Cosine similarity (0.0-1.0, higher = more relevant)
  - ≥0.6: Highly relevant
  - 0.4-0.6: Moderately relevant
  - <0.4: Low relevance (⚠️ warning shown)
- **Title**: Page title from textbook
- **Heading**: Specific section heading where content was found
- **URL**: Direct link to source page
- **Text**: Preview of retrieved chunk (first 150 chars)

### Summary Metrics

1. **Average Top-1 Score**: Mean similarity of the best result for each query
   - Target: ≥0.5 indicates generally relevant retrieval

2. **Queries with Top-1 Score ≥0.5**: Percentage of queries returning relevant top result
   - Success Criterion: ≥80%

3. **Precision@3**: Of the top-3 results, what fraction were actually relevant?
   - Success Criterion: ≥70%
   - Only calculated for queries with defined ground-truth

4. **Precision@5**: Same as precision@3 but for top-5 results
   - Typically lower than precision@3 (more results = diluted relevance)

### Pass/Fail Status

**PASS** if:
- ≥80% of queries have top-1 score ≥0.5 (relevance threshold)
- Precision@3 ≥70% (accuracy threshold)

**FAIL** if either criterion not met

---

## Troubleshooting

### Error: "Missing required environment variable: COHERE_API_KEY"
**Solution**: Create `backend/.env` file and add credentials from `.env.example`

### Error: "Collection 'robotics_textbook' not found"
**Solution**: Run the ingestion pipeline first:
```bash
uv run python backend/main.py
```

### Error: "Failed to connect to Qdrant"
**Solutions**:
1. Check `QDRANT_URL` and `QDRANT_API_KEY` in `.env`
2. Verify Qdrant Cloud cluster is running (https://cloud.qdrant.io)
3. Check for whitespace in URL (common copy-paste error)

### Warning: "Low confidence (top score < 0.4)"
**Not an error** - Indicates query may need rephrasing or textbook content may not cover this topic.

**Solutions**:
1. Rephrase query to match terminology in textbook
2. Check if topic is actually covered in syllabus
3. If topic should be covered, add content to textbook and re-run ingestion

### All scores below 0.3
**Possible causes**:
1. Qdrant collection is empty or corrupted
2. Embeddings were generated with different model/version
3. Wrong collection name

**Solution**: Re-run ingestion pipeline:
```bash
uv run python backend/main.py
```

---

## Modifying Test Queries

To test custom queries, edit `test_retrieval.py` and modify the `test_queries` list:

```python
test_queries = [
    {
        "query": "Your custom query here",
        "category": "General",
        "expected_topics": ["keyword1", "keyword2"]
    },
    # ... more queries
]
```

Then re-run the script:
```bash
uv run python test_retrieval.py
```

---

## Next Steps

After validating retrieval quality:

1. **If PASS**: Proceed to integrate RAG with AI agent (future feature)
2. **If FAIL**:
   - Review low-scoring queries
   - Check textbook content coverage
   - Consider adding more content for underperforming topics
   - Re-run ingestion pipeline after content updates

---

## Performance Expectations

- **Execution Time**: 20-30 seconds for 12 queries
  - ~1-2 seconds per query (Cohere embed + Qdrant search)
  - Cohere API latency: ~500ms per query
  - Qdrant search latency: ~100-200ms per query

- **API Usage**:
  - Cohere: 12 embedding requests (one per query)
  - Qdrant: 12 search requests
  - Total cost: ~$0.01 on Cohere free tier

---

## File Structure After Running

```text
backend/
├── main.py               # RAG ingestion (Spec 001)
├── test_retrieval.py     # THIS SCRIPT - Validation
├── verify_qdrant.py      # Connection check (Spec 001)
├── query_test.py         # Manual testing (Spec 001)
├── .env                  # Credentials (not committed)
└── README.md             # General setup guide
```

No new files created - script outputs to stdout only.

---

## Advanced Usage

### Run with Custom k Value

Edit `test_retrieval.py` to change retrieval limit:
```python
# In main() function, modify search_qdrant() call:
results = search_qdrant(embedding, qdrant_client, k=5)  # Changed from 3 to 5
```

### Export Results to File

Redirect stdout to file:
```bash
uv run python test_retrieval.py > validation_report.txt
```

### Define Custom Ground-Truth

Edit `ground_truth_mappings` in `test_retrieval.py`:
```python
ground_truth_mappings = [
    {
        "query": "Your query",
        "relevant_urls": [
            "https://book-hthon.vercel.app/docs/module1/page1",
            "https://book-hthon.vercel.app/docs/module2/page2"
        ]
    }
]
```

---

## FAQ

**Q: Can I run this without re-running the ingestion pipeline?**
A: Yes, as long as the Qdrant collection `robotics_textbook` already exists with vectors.

**Q: Do I need to modify the script for my own queries?**
A: No for quick validation. Yes if you want to test specific custom queries (edit `test_queries` list).

**Q: What if my textbook content changes?**
A: Re-run `backend/main.py` to re-embed updated content, then re-run this validation script.

**Q: Can I use this script in production?**
A: This is a development/testing tool. For production, integrate retrieval logic into a FastAPI endpoint or agent workflow.

**Q: How do I interpret precision@k if I don't have ground-truth?**
A: Manually review the top-3 results for relevance. If they "make sense" for the query, retrieval is working correctly.
