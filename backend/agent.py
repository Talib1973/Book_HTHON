"""
RAG-Powered Agent for Physical AI & Humanoid Robotics Textbook

This module implements a conversational AI agent that answers questions about the
Physical AI & Humanoid Robotics textbook using:
- OpenAI Agents SDK for tool orchestration
- Custom retrieval tool querying Qdrant vector database
- Cohere embeddings for semantic search
- GPT-4 for grounded response generation with source citations
- SQLiteSession for multi-turn conversation memory

Usage:
    uv run python agent.py

    Then ask questions about ROS 2, Digital Twins, NVIDIA Isaac, VLA, etc.
    Type 'exit' or 'quit' to end the conversation.

Example:
    You: What is ROS 2?
    Tutor: ROS 2 (Robot Operating System 2) is...
           [ROS 2 Architecture](https://textbook.../module1/week1)

Features:
- Grounded responses using only textbook content
- Source citations with page title and clickable URL
- Multi-turn conversations with context maintenance
- Graceful error handling for retrieval failures

Requirements:
- OPENAI_API_KEY, COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY in .env
- Qdrant collection 'robotics_textbook' populated (run main.py first)
"""

import os
import sys
from typing import Dict, List, Any, Tuple, Optional
from openai import OpenAI, AsyncOpenAI

import cohere
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from agents import Agent, Runner, function_tool, SQLiteSession, OpenAIChatCompletionsModel

# Load environment variables
load_dotenv()

# Use OpenRouter for free model access
ROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
client = AsyncOpenAI(
    api_key=ROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)
third_party_model = OpenAIChatCompletionsModel(openai_client=client, model="mistralai/devstral-2512:free")
# Global client variables (initialized in main(), used in retrieve_textbook_content)
cohere_client: Optional[cohere.Client] = None
qdrant_client: Optional[QdrantClient] = None


# Agent system instructions for grounded responses and citations
INSTRUCTIONS = """You are an expert tutor for the Physical AI & Humanoid Robotics course.

Your role:
1. Answer student questions using ONLY information retrieved from the textbook
2. ALWAYS cite your sources with page title and URL in Markdown format
3. If the textbook doesn't cover a topic, acknowledge this rather than guessing
4. For follow-up questions, maintain context from previous conversation turns

Citation format:
- ALWAYS include [Page Title](URL) after each factual claim from the textbook
- If using multiple sources, cite each one separately
- Citations must be clickable Markdown links with the exact URL from retrieved chunks
- Example: "ROS 2 uses DDS for communication [ROS 2 Architecture](https://textbook.../module1/week2)"
- When retrieval tool returns results, use the 'title' and 'url' fields from each result for citations

When the retrieval tool returns no relevant results:
- Say: "I couldn't find information about that in the textbook"
- Suggest: "This topic might not be covered, or try rephrasing your question"
- Do NOT fabricate information or use knowledge outside the textbook

When the retrieval tool returns an error:
- Acknowledge: "I'm having trouble accessing the textbook right now"
- Suggest: "Please try again in a moment"
"""


def validate_environment() -> Dict[str, str]:
    """
    Validate required environment variables for agent operation.

    Returns:
        Dict[str, str]: Environment variables (OPENAI_API_KEY, COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY)

    Raises:
        SystemExit: If any required variable is missing (prints error message and exits with code 1)
    """
    required_vars = ["OPENAI_API_KEY", "COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY"]
    env_vars = {}
    missing_vars = []

    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            env_vars[var] = value

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print(f"\nPlease add to backend/.env file:")
        for var in missing_vars:
            print(f"  {var}=your_key_here")
        print(f"\nGet API keys from:")
        print(f"  - OpenAI: https://platform.openai.com/api-keys")
        print(f"  - Cohere: https://dashboard.cohere.com/api-keys")
        print(f"  - Qdrant: https://cloud.qdrant.io/clusters")
        sys.exit(1)

    return env_vars


def initialize_clients(env_vars: Dict[str, str]) -> Tuple[cohere.Client, QdrantClient]:
    """
    Initialize API clients for Cohere and Qdrant.

    Args:
        env_vars: Dict with COHERE_API_KEY, QDRANT_URL, QDRANT_API_KEY

    Returns:
        Tuple[cohere.Client, QdrantClient]: Initialized clients

    Raises:
        SystemExit: If Qdrant collection 'robotics_textbook' doesn't exist
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


def generate_query_embedding(query_text: str, cohere_client: cohere.Client) -> List[float]:
    """
    Generate embedding for query text using Cohere embed-multilingual-v3.0.

    Args:
        query_text: User's question or search query
        cohere_client: Initialized Cohere client

    Returns:
        List[float]: 1024-dimensional embedding vector

    Raises:
        Exception: If Cohere API fails after 3 retries
    """
    try:
        response = cohere_client.embed(
            texts=[query_text],
            model="embed-multilingual-v3.0",
            input_type="search_query"  # Different from "search_document"
        )
        return response.embeddings[0]
    except Exception as e:
        raise Exception(f"Cohere embedding generation failed: {e}")


def search_qdrant(
    query_embedding: List[float],
    qdrant_client: QdrantClient,
    k: int = 3
) -> List[Dict[str, Any]]:
    """
    Search Qdrant collection for top-k similar chunks.

    Args:
        query_embedding: 1024-dimensional embedding vector
        qdrant_client: Initialized Qdrant client
        k: Number of top results to retrieve (default: 3)

    Returns:
        List[Dict[str, Any]]: Results with rank, score, url, title, heading, text
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
                "text": result.payload.get("text", "")
            })

        return results

    except Exception as e:
        raise Exception(f"Qdrant search failed: {e}")


@function_tool
def retrieve_textbook_content(query: str, k: int = 3) -> Dict[str, Any]:
    """
    Retrieve relevant content from the Physical AI & Humanoid Robotics textbook.

    This tool searches the textbook's vector database for chunks relevant to the query.
    Use this when the user asks about ROS 2, Digital Twins, NVIDIA Isaac, VLA models,
    or any robotics concepts covered in the course.

    Args:
        query: The user's question or search query. Be specific for better results.
        k: Number of top results to retrieve (default: 3, max: 10)

    Returns:
        Dictionary with:
            - results: List of relevant chunks with metadata (url, title, heading, text)
            - error: None if successful, error message string if failed
    """
    global cohere_client, qdrant_client

    try:
        # Clamp k to valid range
        k = max(1, min(k, 10))

        # Generate embedding and search
        embedding = generate_query_embedding(query, cohere_client)
        results = search_qdrant(embedding, qdrant_client, k)

        return {"results": results, "error": None}

    except Exception as e:
        return {"results": [], "error": f"Retrieval failed: {str(e)}"}


def create_agent() -> Agent:
    """
    Create and configure the RAG-powered agent.

    Returns:
        Agent: Configured agent with retrieval tool and system instructions

    Raises:
        None (relies on environment variables being validated beforehand)
    """
    # model = os.getenv("OPENAI_MODEL", "gpt-4")

    agent = Agent(
        name="Robotics Tutor",
        instructions=INSTRUCTIONS,
        tools=[retrieve_textbook_content],
        model=third_party_model)

    return agent


def run_conversation_loop(agent: Agent, session: SQLiteSession) -> None:
    """
    Run interactive CLI conversation loop with the agent.

    Args:
        agent: Configured Agent instance
        session: SQLiteSession for conversation memory

    Returns:
        None (runs until user types 'exit' or 'quit')
    """
    print("=" * 60)
    print("Robotics Tutor - Physical AI & Humanoid Robotics")
    print("=" * 60)
    print("Ask questions about ROS 2, Digital Twins, NVIDIA Isaac, VLA, etc.")
    print("Type 'exit' or 'quit' to end the conversation.\n")

    while True:
        try:
            query = input("\nYou: ").strip()

            if not query:
                continue

            if query.lower() in ["exit", "quit"]:
                print("\nGoodbye! Your conversation has been saved.")
                break

            # Run agent with session memory
            result = Runner.run_sync(agent, query, session=session)

            print(f"\nTutor: {result.final_output}")

        except KeyboardInterrupt:
            print("\n\nGoodbye! Your conversation has been saved.")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again.")


def main() -> int:
    """
    Main entry point for RAG-powered agent.

    Returns:
        int: Exit code (0 for success, 1 for error)
    """
    global cohere_client, qdrant_client

    try:
        # Phase 1: Environment validation
        env_vars = validate_environment()

        # Phase 2: Client initialization
        cohere_client, qdrant_client = initialize_clients(env_vars)

        # Phase 3: Agent creation
        agent = create_agent()

        # Phase 4: Session initialization
        session = SQLiteSession("robotics_chatbot")

        # Phase 5: Run conversation loop
        run_conversation_loop(agent, session)

        return 0

    except KeyboardInterrupt:
        print("\n\nInterrupted. Exiting...")
        return 0
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
