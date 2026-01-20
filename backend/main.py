"""
RAG Pipeline for Physical AI & Humanoid Robotics Textbook
Crawls deployed Docusaurus site, chunks content semantically, generates embeddings, stores in Qdrant Cloud
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Tuple, Dict, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
import tiktoken
import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def discover_urls(base_url: str) -> List[str]:
    """
    Discover all page URLs from the Docusaurus site (via sitemap or crawling).

    Args:
        base_url: Root URL of the Docusaurus site (e.g., "https://textbook.vercel.app")

    Returns:
        List of deduplicated full URLs to process

    Raises:
        ValueError: If base_url is invalid
        requests.RequestException: If sitemap fetch fails and no fallback possible
    """
    if not base_url.startswith(('http://', 'https://')):
        raise ValueError(f"Invalid base_url: {base_url}. Must start with http:// or https://")

    logger.info(f"Discovering URLs from {base_url}")

    # Try sitemap first
    sitemap_url = urljoin(base_url, '/sitemap.xml')
    try:
        response = requests.get(sitemap_url, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml-xml')
        urls = []
        for loc in soup.find_all('loc'):
            url = loc.get_text().strip()
            # Filter to only include URLs from base domain
            if url.startswith(base_url):
                urls.append(url)

        if urls:
            logger.info(f"Discovered {len(urls)} URLs from sitemap")
            return sorted(set(urls))
    except Exception as e:
        logger.warning(f"Sitemap not found or failed to parse: {e}. Falling back to link crawling.")

    # Fallback: recursive link crawling
    visited = set()
    to_visit = {base_url}
    urls = []

    while to_visit:
        url = to_visit.pop()
        if url in visited:
            continue

        visited.add(url)
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            urls.append(url)

            soup = BeautifulSoup(response.content, 'html.parser')
            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(url, link['href'])
                # Only follow internal links
                if absolute_url.startswith(base_url) and absolute_url not in visited:
                    # Remove fragments and query params
                    clean_url = absolute_url.split('#')[0].split('?')[0]
                    to_visit.add(clean_url)
        except Exception as e:
            logger.warning(f"Failed to crawl {url}: {e}")
            continue

    logger.info(f"Discovered {len(urls)} URLs via link crawling")
    return sorted(set(urls))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(requests.Timeout)
)
def fetch_and_parse(url: str) -> Tuple[str, str, List[Tuple[str, str]]]:
    """
    Fetch HTML content from a URL and extract main content area.

    Args:
        url: Full URL to fetch

    Returns:
        Tuple of (page_title, html_content, headings)
        - page_title: Content of <title> tag
        - html_content: Main article content (text only, no HTML tags)
        - headings: List of (level, text) for H1 and H2 tags

    Raises:
        requests.HTTPError: For 4xx/5xx status codes
        requests.Timeout: If request exceeds 30 seconds
    """
    logger.debug(f"Fetching {url}")

    response = requests.get(url, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'html.parser')

    # Extract title
    title_tag = soup.find('title')
    page_title = title_tag.get_text().strip() if title_tag else urlparse(url).path

    # Find main content area (Docusaurus uses <article> or .markdown class)
    main_content = soup.find('article') or soup.find(class_='markdown') or soup.find('main') or soup.find('body')

    if not main_content:
        logger.warning(f"No main content found for {url}, using body")
        main_content = soup.find('body')

    # Extract headings (H1 and H2 only)
    headings = []
    for heading in main_content.find_all(['h1', 'h2']):
        level = heading.name
        text = heading.get_text().strip()
        if text:
            headings.append((level, text))

    # Extract text content (no HTML tags)
    html_content = main_content.get_text(separator=' ', strip=True)

    logger.debug(f"Parsed {url}: title='{page_title}', {len(headings)} headings, {len(html_content)} chars")

    return page_title, html_content, headings


def chunk_text(
    text: str,
    headings: List[Tuple[str, str]],
    url: str,
    title: str,
    max_tokens: int = 512,
    overlap_tokens: int = 50
) -> List[Dict]:
    """
    Split text content into semantically meaningful chunks with token limits.

    Args:
        text: Full text content from page
        headings: List of (level, text) heading tuples
        url: Source page URL
        title: Page title
        max_tokens: Maximum tokens per chunk (default 512)
        overlap_tokens: Overlap between consecutive chunks (default 50)

    Returns:
        List of TextChunk dicts with keys: chunk_id, source_url, page_title,
        heading_context, text_content, token_count, position_in_page

    Raises:
        ValueError: If text is empty
    """
    if not text.strip():
        raise ValueError("Text content is empty")

    encoder = tiktoken.get_encoding("cl100k_base")
    chunks = []

    # If no headings, use "No heading" as context
    if not headings:
        heading_context = "No heading"
        tokens = encoder.encode(text)

        # Split into chunks with overlap
        start = 0
        position = 0
        while start < len(tokens):
            end = start + max_tokens
            chunk_tokens = tokens[start:end]
            chunk_text = encoder.decode(chunk_tokens)

            chunks.append({
                "chunk_id": None,  # Will be assigned globally later
                "source_url": url,
                "page_title": title,
                "heading_context": heading_context,
                "text_content": chunk_text,
                "token_count": len(chunk_tokens),
                "position_in_page": position
            })

            start = end - overlap_tokens
            position += 1
    else:
        # Split text by heading positions
        # First, find heading positions in text
        sections = []
        current_headings = []

        for level, heading_text in headings:
            # Build heading hierarchy
            if level == 'h1':
                current_headings = [heading_text]
            elif level == 'h2':
                if len(current_headings) == 0:
                    current_headings = [heading_text]
                elif len(current_headings) == 1:
                    current_headings.append(heading_text)
                else:
                    current_headings[1] = heading_text

            heading_context = " > ".join(current_headings)

            # Find heading position in text
            pos = text.find(heading_text)
            if pos >= 0:
                sections.append({
                    'position': pos,
                    'heading': heading_context,
                    'text': heading_text
                })

        # Sort sections by position
        sections.sort(key=lambda x: x['position'])

        # Extract text between headings
        position = 0
        for i, section in enumerate(sections):
            start_pos = section['position'] + len(section['text'])
            end_pos = sections[i + 1]['position'] if i + 1 < len(sections) else len(text)
            section_text = text[start_pos:end_pos].strip()

            if not section_text:
                continue

            heading_context = section['heading']
            tokens = encoder.encode(section_text)

            # Split large sections into multiple chunks
            start = 0
            while start < len(tokens):
                end = start + max_tokens
                chunk_tokens = tokens[start:end]
                chunk_text = encoder.decode(chunk_tokens)

                chunks.append({
                    "chunk_id": None,  # Will be assigned globally later
                    "source_url": url,
                    "page_title": title,
                    "heading_context": heading_context,
                    "text_content": chunk_text,
                    "token_count": len(chunk_tokens),
                    "position_in_page": position
                })

                start = end - overlap_tokens
                position += 1

    logger.debug(f"Created {len(chunks)} chunks from {url}")
    return chunks


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=16)
)
def generate_embeddings(chunks: List[Dict], cohere_client: cohere.Client) -> List[List[float]]:
    """
    Generate vector embeddings for a batch of text chunks using Cohere API.

    Args:
        chunks: List of TextChunk dicts (max 96 for batching)
        cohere_client: Initialized Cohere API client

    Returns:
        List of embedding vectors (1024 dimensions each), order matches input chunks

    Raises:
        Exception: For API failures, rate limits, or network errors
        ValueError: If batch size >96 or embedding dimensions wrong
    """
    if len(chunks) > 96:
        raise ValueError(f"Batch size {len(chunks)} exceeds maximum of 96")

    if len(chunks) == 0:
        return []

    texts = [chunk["text_content"] for chunk in chunks]

    logger.debug(f"Generating embeddings for {len(texts)} chunks")

    response = cohere_client.embed(
        texts=texts,
        model="embed-multilingual-v3.0",
        input_type="search_document"
    )

    embeddings = response.embeddings

    # Validate dimensions
    if embeddings and len(embeddings[0]) != 1024:
        raise ValueError(f"Expected 1024 dimensions, got {len(embeddings[0])}")

    logger.debug(f"Generated {len(embeddings)} embeddings")
    return embeddings


@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=5, min=5, max=10)
)
def store_vectors(
    embeddings: List[List[float]],
    chunks: List[Dict],
    qdrant_client: QdrantClient,
    collection_name: str = "robotics_textbook"
) -> int:
    """
    Store vector embeddings with metadata in Qdrant Cloud.

    Args:
        embeddings: Embedding vectors from Cohere
        chunks: Corresponding TextChunk dicts (same length and order as embeddings)
        qdrant_client: Initialized Qdrant client
        collection_name: Qdrant collection name (default "robotics_textbook")

    Returns:
        Number of vectors successfully stored

    Raises:
        Exception: For Qdrant errors
    """
    if len(embeddings) != len(chunks):
        raise ValueError(f"Embeddings ({len(embeddings)}) and chunks ({len(chunks)}) length mismatch")

    if len(embeddings) == 0:
        return 0

    points = []
    for embedding, chunk in zip(embeddings, chunks):
        points.append(PointStruct(
            id=chunk["chunk_id"],
            vector=embedding,
            payload={
                "url": chunk["source_url"],
                "title": chunk["page_title"],
                "heading": chunk["heading_context"],
                "text": chunk["text_content"],
                "token_count": chunk["token_count"],
                "position": chunk["position_in_page"]
            }
        ))

    qdrant_client.upsert(
        collection_name=collection_name,
        points=points
    )

    logger.debug(f"Stored {len(points)} vectors in Qdrant")
    return len(points)


def main() -> None:
    """
    Orchestrate the complete RAG pipeline from URL discovery to vector storage.

    Reads from environment variables:
    - COHERE_API_KEY: Cohere API key for embeddings
    - QDRANT_URL: Qdrant Cloud cluster URL
    - QDRANT_API_KEY: Qdrant Cloud API key
    - DOCUSAURUS_URL: Base URL of deployed Docusaurus site
    - QDRANT_COLLECTION_NAME: Optional collection name (default: "robotics_textbook")

    Exits with code 0 on success, 1 on failure
    """
    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("Starting RAG pipeline")
    logger.info("=" * 60)

    # Load environment variables
    load_dotenv()

    # Validate required environment variables
    required_vars = ["COHERE_API_KEY", "QDRANT_URL", "QDRANT_API_KEY", "DOCUSAURUS_URL"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please configure them in .env file")
        sys.exit(1)

    cohere_api_key = os.getenv("COHERE_API_KEY")
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    base_url = os.getenv("DOCUSAURUS_URL")
    collection_name = os.getenv("QDRANT_COLLECTION_NAME", "robotics_textbook")

    logger.info(f"Configuration:")
    logger.info(f"  Docusaurus URL: {base_url}")
    logger.info(f"  Qdrant URL: {qdrant_url}")
    logger.info(f"  Collection: {collection_name}")
    logger.info(f"  Cohere API Key: {'*' * 20}{cohere_api_key[-4:]}")

    # Initialize clients
    logger.info("Initializing API clients...")
    cohere_client = cohere.Client(api_key=cohere_api_key)
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

    # Create Qdrant collection if not exists
    try:
        collections = qdrant_client.get_collections().collections
        collection_exists = any(c.name == collection_name for c in collections)

        if not collection_exists:
            logger.info(f"Creating Qdrant collection '{collection_name}'...")
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=1024,  # Cohere embed-multilingual-v3.0 dimension
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Collection '{collection_name}' created successfully")
        else:
            logger.info(f"Collection '{collection_name}' already exists")
    except Exception as e:
        logger.error(f"Failed to create/check Qdrant collection: {e}")
        sys.exit(1)

    # Pipeline state tracking
    pipeline_state = {
        "total_pages_discovered": 0,
        "pages_processed": 0,
        "pages_failed": 0,
        "total_chunks_created": 0,
        "total_vectors_stored": 0,
        "errors": []
    }

    # Discover URLs
    try:
        urls = discover_urls(base_url)
        pipeline_state["total_pages_discovered"] = len(urls)
        logger.info(f"Discovered {len(urls)} URLs")
    except Exception as e:
        logger.error(f"Failed to discover URLs: {e}")
        sys.exit(1)

    # Process pages and collect chunks
    all_chunks = []
    global_chunk_id = 0

    for idx, url in enumerate(urls, 1):
        try:
            logger.info(f"Processing page {idx}/{len(urls)}: {url}")

            # Fetch and parse
            title, content, headings = fetch_and_parse(url)

            # Chunk text
            chunks = chunk_text(content, headings, url, title)

            # Assign global chunk IDs
            for chunk in chunks:
                chunk["chunk_id"] = global_chunk_id
                global_chunk_id += 1

            all_chunks.extend(chunks)
            pipeline_state["pages_processed"] += 1
            pipeline_state["total_chunks_created"] += len(chunks)

            logger.info(f"  Created {len(chunks)} chunks (total: {len(all_chunks)})")

        except requests.HTTPError as e:
            logger.warning(f"  HTTP error for {url}: {e}")
            pipeline_state["pages_failed"] += 1
            pipeline_state["errors"].append({
                "url": url,
                "error": f"HTTP {e.response.status_code}",
                "timestamp": datetime.now()
            })
        except Exception as e:
            logger.warning(f"  Failed to process {url}: {e}")
            pipeline_state["pages_failed"] += 1
            pipeline_state["errors"].append({
                "url": url,
                "error": str(e),
                "timestamp": datetime.now()
            })

    logger.info(f"Total chunks created: {len(all_chunks)}")

    # Generate embeddings and store in batches
    batch_size = 96
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(all_chunks) + batch_size - 1) // batch_size

        try:
            logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} chunks)")

            # Generate embeddings
            embeddings = generate_embeddings(batch, cohere_client)
            logger.info(f"  Generated {len(embeddings)} embeddings")

            # Store vectors
            count = store_vectors(embeddings, batch, qdrant_client, collection_name)
            pipeline_state["total_vectors_stored"] += count
            logger.info(f"  Stored {count} vectors (total: {pipeline_state['total_vectors_stored']})")

        except Exception as e:
            logger.error(f"Failed to process batch {batch_num}: {e}")
            pipeline_state["errors"].append({
                "batch": batch_num,
                "error": str(e),
                "timestamp": datetime.now()
            })

    # Log final summary
    end_time = datetime.now()
    duration = end_time - start_time

    logger.info("=" * 60)
    logger.info("Pipeline complete")
    logger.info("=" * 60)
    logger.info(f"Pages discovered: {pipeline_state['total_pages_discovered']}")
    logger.info(f"Pages processed: {pipeline_state['pages_processed']}")
    logger.info(f"Pages failed: {pipeline_state['pages_failed']}")
    logger.info(f"Chunks created: {pipeline_state['total_chunks_created']}")
    logger.info(f"Vectors stored: {pipeline_state['total_vectors_stored']}")
    logger.info(f"Execution time: {duration}")

    if pipeline_state["errors"]:
        logger.warning(f"Errors encountered: {len(pipeline_state['errors'])}")
        for error in pipeline_state["errors"][:5]:  # Show first 5 errors
            logger.warning(f"  - {error}")

    logger.info("=" * 60)


if __name__ == "__main__":
    main()
