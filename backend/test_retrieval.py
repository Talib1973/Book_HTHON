"""
RAG Retrieval Validation Script

This script validates the quality of semantic search retrieval for the
"Physical AI & Humanoid Robotics" textbook embedded in Qdrant Cloud.

Features:
- Test retrieval with natural language queries from the 13-week syllabus
- Display top-k results with metadata (URL, title, heading, text preview)
- Calculate precision@k metrics for queries with ground-truth
- Summary report with pass/fail status based on success criteria

Usage:
    uv run python backend/test_retrieval.py

Requirements:
    - Qdrant collection 'robotics_textbook' must exist (created by main.py)
    - Environment variables: COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY
"""

import os
import sys
from typing import Dict, List, Tuple, Any
from datetime import datetime
from dotenv import load_dotenv
import cohere
from qdrant_client import QdrantClient
from tenacity import retry, stop_after_attempt, wait_exponential

# Load environment variables
load_dotenv()


# ============================================================================
# FOUNDATIONAL FUNCTIONS (Phase 2)
# ============================================================================

def validate_environment() -> Dict[str, str]:
    """
    Validate required environment variables.

    Returns:
        Dict with keys: COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY

    Raises:
        SystemExit: If any required variable is missing or empty
    """
    required_vars = ["COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY"]
    env_vars = {}

    for var in required_vars:
        value = os.getenv(var)
        if not value:
            print(f"❌ Missing required environment variable: {var}")
            print(f"\nPlease create backend/.env file with:")
            print(f"  COHERE_API_KEY=your_key_here")
            print(f"  QDRANT_URL=https://your-cluster.qdrant.io")
            print(f"  QDRANT_API_KEY=your_key_here")
            print(f"\nSee backend/.env.example for reference.")
            sys.exit(1)

        # Strip whitespace (common copy-paste issue)
        env_vars[var] = value.strip()

    return env_vars


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
    try:
        # Initialize Cohere client
        cohere_client = cohere.Client(api_key=env_vars["COHERE_API_KEY"])

        # Initialize Qdrant client
        qdrant_client = QdrantClient(
            url=env_vars["QDRANT_URL"],
            api_key=env_vars["QDRANT_API_KEY"]
        )

        # Verify collection exists
        try:
            collection_info = qdrant_client.get_collection("robotics_textbook")
            print(f"✅ Connected to Qdrant collection 'robotics_textbook' ({collection_info.points_count} vectors)")
        except Exception as e:
            print(f"❌ Collection 'robotics_textbook' not found")
            print(f"   Error: {e}")
            print(f"\n💡 Run 'uv run python backend/main.py' to create the collection first")
            sys.exit(1)

        return cohere_client, qdrant_client

    except Exception as e:
        print(f"❌ Failed to initialize clients: {e}")
        sys.exit(1)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4)
)
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
    try:
        response = cohere_client.embed(
            texts=[query_text],
            model="embed-multilingual-v3.0",
            input_type="search_query"  # Important: different from "search_document"
        )
        return response.embeddings[0]
    except Exception as e:
        print(f"⚠️ Cohere API error (retrying...): {e}")
        raise


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
    try:
        search_results = qdrant_client.query_points(
            collection_name="robotics_textbook",
            query=query_embedding,
            limit=k
        ).points

        # Convert to structured format
        results = []
        for idx, result in enumerate(search_results, 1):
            results.append({
                "rank": idx,
                "score": result.score,
                "url": result.payload.get("url", "N/A"),
                "title": result.payload.get("title", "N/A"),
                "heading": result.payload.get("heading", "N/A"),
                "text": result.payload.get("text", ""),
                "token_count": result.payload.get("token_count", 0)
            })

        return results

    except Exception as e:
        print(f"❌ Qdrant search error: {e}")
        raise


# ============================================================================
# USER STORY 1: DISPLAY FUNCTIONS
# ============================================================================

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
    print("─" * 60)
    print(f"Query {rank}/{total}: \"{query}\"")
    print(f"Category: {category}")
    print("─" * 60)
    print()

    if not results:
        print("⚠️  No results found (collection may not contain relevant content for this query)")
        print()
        return

    print(f"Top {len(results)} Results:")
    print()

    for result in results:
        print(f"{result['rank']}. Score: {result['score']:.4f}")
        print(f"   Title: {result['title']}")
        print(f"   Heading: {result['heading']}")
        print(f"   URL: {result['url']}")
        print(f"   Text: {result['text'][:150]}...")
        print()

    # Low confidence warning (T012)
    if results and results[0]['score'] < 0.4:
        print("⚠️  Low confidence (top score < 0.4) - Consider rephrasing query or adding content")

    print()


# ============================================================================
# USER STORY 2: PRECISION@K METRICS
# ============================================================================

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
    relevant_in_topk = set(retrieved_urls[:k]) & set(relevant_urls)
    precision = len(relevant_in_topk) / k if k > 0 else 0.0
    return precision


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
    print("─" * 60)
    print("Summary Statistics")
    print("─" * 60)
    print()

    # Calculate average top-1 score
    top1_scores = [r['results'][0]['score'] for r in all_results if r['results']]
    avg_top1_score = sum(top1_scores) / len(top1_scores) if top1_scores else 0.0

    # Count queries above threshold
    queries_above_threshold = sum(1 for score in top1_scores if score >= 0.5)
    total_queries = len(all_results)
    relevance_percentage = (queries_above_threshold / total_queries) * 100 if total_queries > 0 else 0.0

    print(f"Total Queries: {total_queries}")
    print(f"Average Top-1 Score: {avg_top1_score:.2f}")
    print(f"Queries with Top-1 Score ≥0.5: {queries_above_threshold}/{total_queries} ({relevance_percentage:.0f}%)")

    # Calculate average precision metrics if available
    if precision_metrics:
        p3_scores = [m['precision@3'] for m in precision_metrics]
        p5_scores = [m['precision@5'] for m in precision_metrics]
        avg_p3 = sum(p3_scores) / len(p3_scores)
        avg_p5 = sum(p5_scores) / len(p5_scores)

        print(f"Precision@3 ({len(precision_metrics)} ground-truth queries): {avg_p3:.2f}")
        print(f"Precision@5 ({len(precision_metrics)} ground-truth queries): {avg_p5:.2f}")
    else:
        avg_p3 = None

    print()

    # Determine pass/fail status
    relevance_pass = relevance_percentage >= 80.0
    precision_pass = (avg_p3 is None) or (avg_p3 >= 0.70)
    pass_status = relevance_pass and precision_pass

    if pass_status:
        print("✅ PASS: Retrieval quality meets success criteria")
        if relevance_pass:
            print(f"   - Relevance: {relevance_percentage:.0f}% ≥ 80% ✓")
        if precision_pass and avg_p3 is not None:
            print(f"   - Precision@3: {avg_p3:.2f} ≥ 0.70 ✓")
    else:
        print("❌ FAIL: Retrieval quality does not meet success criteria")
        if not relevance_pass:
            print(f"   - Relevance: {relevance_percentage:.0f}% < 80% ✗")
        if not precision_pass and avg_p3 is not None:
            print(f"   - Precision@3: {avg_p3:.2f} < 0.70 ✗")

    print()
    return pass_status


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main() -> int:
    """
    Main execution flow for RAG validation script.

    Returns:
        0 if validation passes, 1 if validation fails or errors occur
    """
    # Header
    print("=" * 60)
    print("RAG Retrieval Validation Report")
    print("=" * 60)
    print(f"Collection: robotics_textbook")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    # Validate environment
    env_vars = validate_environment()

    # Initialize clients
    cohere_client, qdrant_client = initialize_clients(env_vars)
    print()

    # Define test queries (T019 - expanded to 12 queries for US3)
    test_queries = [
        # ROS 2 Module (3 queries)
        {
            "query": "How do I set up a ROS 2 workspace?",
            "category": "ROS 2",
            "expected_topics": ["workspace", "setup", "installation", "ROS 2"]
        },
        {
            "query": "ROS 2 publisher subscriber pattern",
            "category": "ROS 2",
            "expected_topics": ["publisher", "subscriber", "topic", "message"]
        },
        {
            "query": "What are ROS 2 services and actions?",
            "category": "ROS 2",
            "expected_topics": ["services", "actions", "request", "reply"]
        },
        # Digital Twin Module (3 queries)
        {
            "query": "Setting up Gazebo simulation for robotics",
            "category": "Digital Twin (Gazebo/Unity)",
            "expected_topics": ["Gazebo", "simulation", "setup", "robotics"]
        },
        {
            "query": "How to create URDF files for robot models?",
            "category": "Digital Twin (Gazebo/Unity)",
            "expected_topics": ["URDF", "robot model", "description", "XML"]
        },
        {
            "query": "Unity ML-Agents integration with ROS",
            "category": "Digital Twin (Gazebo/Unity)",
            "expected_topics": ["Unity", "ML-Agents", "integration", "simulation"]
        },
        # NVIDIA Isaac Module (3 queries)
        {
            "query": "Getting started with NVIDIA Isaac Sim",
            "category": "NVIDIA Isaac",
            "expected_topics": ["Isaac Sim", "NVIDIA", "setup", "installation"]
        },
        {
            "query": "Isaac Gym reinforcement learning tutorial",
            "category": "NVIDIA Isaac",
            "expected_topics": ["Isaac Gym", "reinforcement learning", "training", "RL"]
        },
        {
            "query": "Generating synthetic data for robot vision",
            "category": "NVIDIA Isaac",
            "expected_topics": ["synthetic data", "computer vision", "dataset", "generation"]
        },
        # VLA Module (2 queries)
        {
            "query": "What are Vision-Language-Action models?",
            "category": "VLA",
            "expected_topics": ["VLA", "vision", "language", "action", "model"]
        },
        {
            "query": "RT-1 and RT-2 architectures explained",
            "category": "VLA",
            "expected_topics": ["RT-1", "RT-2", "architecture", "robotics transformer"]
        },
        # Capstone/General (1 query)
        {
            "query": "Building an autonomous humanoid robot project",
            "category": "Capstone",
            "expected_topics": ["capstone", "humanoid", "autonomous", "project"]
        }
    ]

    # Define ground-truth mappings (T014 - expanded for US3)
    ground_truth_mappings = [
        {
            "query": "How do I set up a ROS 2 workspace?",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-1-ros2/week-3-ros2-architecture",
                "https://book-hthon.vercel.app/docs/module-1-ros2/",
                "https://book-hthon.vercel.app/docs/intro"
            ]
        },
        {
            "query": "ROS 2 publisher subscriber pattern",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-1-ros2/week-4-pub-sub",
                "https://book-hthon.vercel.app/docs/module-1-ros2/week-3-ros2-architecture"
            ]
        },
        {
            "query": "What are ROS 2 services and actions?",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-1-ros2/week-5-services-actions",
                "https://book-hthon.vercel.app/docs/module-1-ros2/"
            ]
        },
        {
            "query": "Setting up Gazebo simulation for robotics",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-2-digital-twin/",
                "https://book-hthon.vercel.app/docs/intro"
            ]
        },
        {
            "query": "Getting started with NVIDIA Isaac Sim",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-3-isaac/",
                "https://book-hthon.vercel.app/docs/intro"
            ]
        },
        {
            "query": "What are Vision-Language-Action models?",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/module-4-vla/",
                "https://book-hthon.vercel.app/docs/intro"
            ]
        },
        {
            "query": "Building an autonomous humanoid robot project",
            "relevant_urls": [
                "https://book-hthon.vercel.app/docs/capstone/",
                "https://book-hthon.vercel.app/docs/intro"
            ]
        }
    ]

    # Create ground-truth lookup
    ground_truth_dict = {gt["query"]: gt["relevant_urls"] for gt in ground_truth_mappings}

    total_queries = len(test_queries)
    print(f"Testing {total_queries} queries...")
    print()

    # Collect all results (T017 - for US2)
    all_results = []
    precision_metrics = []

    # Process all queries
    for idx, test_query in enumerate(test_queries, 1):
        # Generate embedding
        embedding = generate_query_embedding(test_query["query"], cohere_client)

        # Search Qdrant (get top-5 for precision@5 calculation)
        results = search_qdrant(embedding, qdrant_client, k=5)

        # Display top-3 results
        display_query_results(
            query=test_query["query"],
            category=test_query["category"],
            results=results[:3],  # Show only top-3 in display
            rank=idx,
            total=total_queries
        )

        # Store results for summary
        all_results.append({
            "query": test_query["query"],
            "category": test_query["category"],
            "results": results
        })

        # Calculate precision@k if ground-truth exists (T017)
        if test_query["query"] in ground_truth_dict:
            retrieved_urls = [r["url"] for r in results]
            relevant_urls = ground_truth_dict[test_query["query"]]

            precision_at_3 = calculate_precision_at_k(retrieved_urls, relevant_urls, 3)
            precision_at_5 = calculate_precision_at_k(retrieved_urls, relevant_urls, 5)

            precision_metrics.append({
                "query": test_query["query"],
                "precision@3": precision_at_3,
                "precision@5": precision_at_5
            })

    # Display summary report (T017)
    print("=" * 60)
    pass_status = display_summary_report(all_results, precision_metrics)
    print("=" * 60)

    # Return appropriate exit code (T017)
    return 0 if pass_status else 1


if __name__ == "__main__":
    sys.exit(main())
