"""
Test query to verify Qdrant data
"""
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
import cohere

load_dotenv()

# Initialize clients
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)
cohere_client = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))

# Get collection info
collection_info = qdrant_client.get_collection("robotics_textbook")
print(f"📊 Collection: robotics_textbook")
print(f"   Vectors: {collection_info.points_count}")
print(f"   Dimensions: {collection_info.config.params.vectors.size}")
print(f"   Distance: {collection_info.config.params.vectors.distance}")
print()

# Sample a few points
print("📝 Sample vectors (first 3):")
points = qdrant_client.scroll(
    collection_name="robotics_textbook",
    limit=3,
    with_payload=True,
    with_vectors=False
)

for i, point in enumerate(points[0], 1):
    print(f"\n{i}. ID: {point.id}")
    print(f"   URL: {point.payload.get('url', 'N/A')}")
    print(f"   Title: {point.payload.get('title', 'N/A')}")
    print(f"   Heading: {point.payload.get('heading', 'N/A')}")
    print(f"   Text: {point.payload.get('text', 'N/A')[:100]}...")
    print(f"   Tokens: {point.payload.get('token_count', 'N/A')}")

# Test semantic search
print("\n" + "="*60)
print("🔍 Testing Semantic Search: 'ROS 2 publisher subscriber'")
print("="*60)

# Generate query embedding
query_text = "ROS 2 publisher subscriber"
query_response = cohere_client.embed(
    texts=[query_text],
    model="embed-multilingual-v3.0",
    input_type="search_query"
)
query_embedding = query_response.embeddings[0]

# Search
search_results = qdrant_client.query_points(
    collection_name="robotics_textbook",
    query=query_embedding,
    limit=3
).points

print(f"\nTop 3 results for '{query_text}':\n")
for i, result in enumerate(search_results, 1):
    print(f"{i}. Score: {result.score:.4f}")
    print(f"   Title: {result.payload['title']}")
    print(f"   Heading: {result.payload['heading']}")
    print(f"   URL: {result.payload['url']}")
    print(f"   Text: {result.payload['text'][:150]}...")
    print()
