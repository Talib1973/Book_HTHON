"""
Verify Qdrant connection and list collections
"""
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

print(f"QDRANT_URL value: '{qdrant_url}'")
print(f"QDRANT_URL length: {len(qdrant_url)}")
print(f"QDRANT_URL repr: {repr(qdrant_url)}")
print(f"QDRANT_API_KEY: {'*' * 20}{qdrant_api_key[-4:] if qdrant_api_key else 'MISSING'}")
print()

# Strip whitespace
qdrant_url_clean = qdrant_url.strip() if qdrant_url else None
print(f"Cleaned URL: '{qdrant_url_clean}'")
print()

try:
    print("Attempting connection with original URL...")
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    collections = client.get_collections()
    print(f"✅ Connected successfully!")
    print(f"Collections found: {len(collections.collections)}")
    for col in collections.collections:
        # Get collection info for point count
        col_info = client.get_collection(col.name)
        point_count = col_info.points_count if hasattr(col_info, 'points_count') else 'unknown'
        print(f"  - {col.name} ({point_count} points)")
except Exception as e:
    print(f"❌ Connection failed with original URL: {e}")
    print()

    if qdrant_url_clean != qdrant_url:
        print("Trying with cleaned URL (whitespace stripped)...")
        try:
            client = QdrantClient(url=qdrant_url_clean, api_key=qdrant_api_key)
            collections = client.get_collections()
            print(f"✅ Connected successfully with cleaned URL!")
            print(f"Collections found: {len(collections.collections)}")
            for col in collections.collections:
                print(f"  - {col.name} ({col.points_count} points)")
        except Exception as e2:
            print(f"❌ Connection failed with cleaned URL: {e2}")
