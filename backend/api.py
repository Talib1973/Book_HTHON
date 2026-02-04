"""
FastAPI backend for RAG chatbot integration with Docusaurus frontend.

This module provides a REST API endpoint for the Physical AI & Humanoid Robotics
textbook chatbot, enabling the Docusaurus frontend to interact with the RAG agent.

Endpoints:
    POST /chat: Send a user query and receive agent response with citations

Usage:
    uv run python backend/api.py

    Then access http://localhost:8000/docs for Swagger UI documentation
"""

import os
import sys
import uuid
from typing import Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

# Import existing agent module
import agent  # Import as module to set its globals
from agent import create_agent, validate_environment, initialize_clients
from agents import Runner, SQLiteSession
from database import db
from dependencies import get_current_user

# Load environment variables
load_dotenv()

# Global clients and agent (initialized at startup)
cohere_client = None
qdrant_client = None
agent_instance = None  # Renamed to avoid conflict with agent module
session = None


# ============================================================================
# Pydantic Models (Data Contracts)
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for /chat endpoint."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's question about the textbook",
        examples=["What is ROS 2?"]
    )
    context: Optional[str] = Field(
        None,
        max_length=5000,
        description="Optional selected text from textbook page for context-aware answers",
        examples=["ROS 2 is the second generation of the Robot Operating System..."]
    )
    language: str = Field(
        "en",
        description="Target response language: 'en' (default) or 'ur'. Backward-compatible — omit for English."
    )


class Citation(BaseModel):
    """Source citation for textbook content."""
    title: str = Field(..., description="Textbook page title")
    url: str = Field(..., description="Full URL to source page")


class ChatResponse(BaseModel):
    """Response model for /chat endpoint."""
    response: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Agent's answer with citations"
    )
    sources: list[Citation] = Field(
        default_factory=list,
        max_length=10,
        description="Citations for content used in response"
    )


class ErrorResponse(BaseModel):
    """Error response model for HTTP errors."""
    error: Literal["validation_error", "server_error", "service_unavailable"]
    message: str
    retryable: bool
    error_id: Optional[str] = None


class ProfileRequest(BaseModel):
    """Request model for creating/updating user profile."""
    python_experience: Literal["beginner", "intermediate", "advanced"] = "beginner"
    ros_experience: Literal["none", "beginner", "intermediate", "advanced"] = "none"
    has_rtx_gpu: bool = False
    gpu_model: Optional[str] = None
    has_jetson: bool = False
    jetson_model: Optional[str] = None
    robot_type: Optional[str] = None
    learning_goals: list[str] = Field(default_factory=list, max_length=10)


class ProfileResponse(BaseModel):
    """Response model for profile operations."""
    success: bool
    message: str


class UserProfile(BaseModel):
    """User profile data model."""
    python_experience: str
    ros_experience: str
    has_rtx_gpu: bool
    gpu_model: Optional[str]
    has_jetson: bool
    jetson_model: Optional[str]
    robot_type: Optional[str]
    learning_goals: list[str]
    created_at: str
    updated_at: str


# ============================================================================
# Application Lifecycle
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle manager.

    Initializes global clients and agent on startup, cleans up on shutdown.
    """
    global cohere_client, qdrant_client, agent_instance, session

    print("=" * 60)
    print("FastAPI RAG Chatbot - Starting up...")
    print("=" * 60)

    try:
        # Validate environment variables
        env_vars = validate_environment()

        # Initialize API clients
        cohere_client, qdrant_client = initialize_clients(env_vars)

        # CRITICAL: Set agent.py's global variables so retrieve_textbook_content can use them
        agent.cohere_client = cohere_client
        agent.qdrant_client = qdrant_client

        # Create agent instance
        agent_instance = create_agent()

        # Initialize session for conversation memory
        session = SQLiteSession("fastapi_chatbot")

        # Connect to PostgreSQL database for authentication
        await db.connect()

        print("✅ FastAPI server ready")
        print(f"📡 Listening on http://0.0.0.0:8000")
        print(f"📖 API docs at http://localhost:8000/docs")
        print("=" * 60)

        yield

    except Exception as e:
        print(f"❌ Startup failed: {e}")
        sys.exit(1)

    finally:
        # Cleanup on shutdown
        print("\n🛑 Shutting down FastAPI server...")
        await db.disconnect()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="RAG Chatbot API",
    description="REST API for Physical AI & Humanoid Robotics textbook chatbot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ============================================================================
# CORS Middleware Configuration
# ============================================================================

# Allow requests from Docusaurus dev server and production Vercel site
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,https://book-hthon.vercel.app").split(","),
    allow_credentials=True,  # REQUIRED for session cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get(
    "/",
    summary="Health check endpoint",
    description="Verify the API is running and accessible"
)
async def health_check():
    """Health check endpoint - returns API status."""
    return {
        "status": "ok",
        "service": "RAG Chatbot API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "POST /chat",
            "docs": "GET /docs"
        }
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request - Invalid input"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
        503: {"model": ErrorResponse, "description": "Service Unavailable - Temporary failure"}
    },
    summary="Send a chat message to the RAG agent",
    description="Processes user queries using RAG-powered agent with Qdrant retrieval and OpenAI generation"
)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Process a user query using the RAG-powered agent.

    Args:
        request: ChatRequest with message and optional context

    Returns:
        ChatResponse with agent's answer and source citations

    Raises:
        HTTPException: 400 for validation errors, 500 for server errors, 503 for service unavailable
    """
    global agent_instance, session, cohere_client, qdrant_client

    # Validate message is not empty or whitespace only
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="validation_error",
                message="Message field cannot be empty or whitespace only",
                retryable=False,
                error_id=None
            ).model_dump()
        )

    try:
        # Prepend Urdu language instruction when requested (T021)
        language_prefix = ""
        if request.language == "ur":
            language_prefix = (
                "[LANGUAGE INSTRUCTION] Respond in Urdu. "
                "If your answer includes code snippets, commands, file paths, or URLs, "
                "keep those in English.\n\n"
            )

        # Prepare query (append context if provided)
        query = request.message.strip()
        if request.context:
            query = f"{query}\n\nContext: {request.context.strip()}"

        # Apply language prefix (placed before user query for system-level priority)
        query = f"{language_prefix}{query}"

        # Run agent with session memory (async)
        result = await Runner.run(agent_instance, query, session=session)

        # Extract agent response
        agent_response = result.final_output

        # Parse citations from agent response
        # Agent includes citations as Markdown links: [Title](URL)
        citations = extract_citations(agent_response)

        return ChatResponse(
            response=agent_response,
            sources=citations
        )

    except Exception as e:
        # Check if error is related to Qdrant/Cohere (temporary failures)
        error_str = str(e).lower()
        if any(keyword in error_str for keyword in ["qdrant", "cohere", "connection", "timeout", "unavailable"]):
            error_id = str(uuid.uuid4())
            print(f"❌ Service unavailable [{error_id}]: {e}")

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=ErrorResponse(
                    error="service_unavailable",
                    message="Unable to connect to the retrieval system. Please try again in a moment.",
                    retryable=True,
                    error_id=error_id
                ).model_dump()
            )
        else:
            # Generic server error
            error_id = str(uuid.uuid4())
            print(f"❌ Server error [{error_id}]: {e}")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorResponse(
                    error="server_error",
                    message="An unexpected error occurred. Please try again or contact support if the problem persists.",
                    retryable=False,
                    error_id=error_id
                ).model_dump()
            )


@app.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - Invalid session"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="Create or update user profile",
    description="Save user's learning background and preferences for personalized content"
)
async def create_profile(
    request: ProfileRequest,
    user_id: str = Depends(get_current_user)
) -> ProfileResponse:
    """
    Create or update user profile with learning background.

    Args:
        request: ProfileRequest with programming experience, hardware access, and learning goal
        user_id: User ID from validated session (injected by dependency)

    Returns:
        ProfileResponse with success status

    Raises:
        HTTPException: 401 for invalid session, 500 for server errors
    """
    try:
        # Insert or update user profile (upsert)
        await db.execute(
            '''
            INSERT INTO user_profile (
                user_id, python_experience, ros_experience,
                has_rtx_gpu, gpu_model, has_jetson, jetson_model,
                robot_type, learning_goals
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id)
            DO UPDATE SET
                python_experience = EXCLUDED.python_experience,
                ros_experience = EXCLUDED.ros_experience,
                has_rtx_gpu = EXCLUDED.has_rtx_gpu,
                gpu_model = EXCLUDED.gpu_model,
                has_jetson = EXCLUDED.has_jetson,
                jetson_model = EXCLUDED.jetson_model,
                robot_type = EXCLUDED.robot_type,
                learning_goals = EXCLUDED.learning_goals,
                updated_at = CURRENT_TIMESTAMP
            ''',
            user_id,
            request.python_experience,
            request.ros_experience,
            request.has_rtx_gpu,
            request.gpu_model,
            request.has_jetson,
            request.jetson_model,
            request.robot_type,
            request.learning_goals,
        )

        return ProfileResponse(
            success=True,
            message="Profile saved successfully"
        )

    except Exception as e:
        error_id = str(uuid.uuid4())
        print(f"❌ Profile save error [{error_id}]: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="server_error",
                message="Failed to save profile. Please try again.",
                retryable=True,
                error_id=error_id
            ).model_dump()
        )


@app.get(
    "/profile",
    response_model=UserProfile,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - Invalid session"},
        404: {"model": ErrorResponse, "description": "Profile not found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="Get user profile",
    description="Retrieve the authenticated user's learning profile"
)
async def get_profile(user_id: str = Depends(get_current_user)) -> UserProfile:
    """
    Retrieve user's learning profile.

    Args:
        user_id: User ID from validated session (injected by dependency)

    Returns:
        UserProfile with user's learning background and preferences

    Raises:
        HTTPException: 401 for invalid session, 404 if profile not found, 500 for server errors
    """
    try:
        profile = await db.fetch_one(
            '''
            SELECT python_experience, ros_experience, has_rtx_gpu, gpu_model,
                   has_jetson, jetson_model, robot_type, learning_goals,
                   created_at, updated_at
            FROM user_profile
            WHERE user_id = $1
            ''',
            user_id
        )

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse(
                    error="validation_error",
                    message="Profile not found. Please complete profile setup.",
                    retryable=False
                ).model_dump()
            )

        return UserProfile(
            python_experience=profile['python_experience'],
            ros_experience=profile['ros_experience'],
            has_rtx_gpu=profile['has_rtx_gpu'],
            gpu_model=profile['gpu_model'],
            has_jetson=profile['has_jetson'],
            jetson_model=profile['jetson_model'],
            robot_type=profile['robot_type'],
            learning_goals=profile['learning_goals'] or [],
            created_at=profile['created_at'].isoformat(),
            updated_at=profile['updated_at'].isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        error_id = str(uuid.uuid4())
        print(f"❌ Profile fetch error [{error_id}]: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="server_error",
                message="Failed to fetch profile. Please try again.",
                retryable=True,
                error_id=error_id
            ).model_dump()
        )


def extract_citations(agent_response: str) -> list[Citation]:
    """
    Extract Markdown citations from agent response.

    Parses citations in format: [Title](URL)

    Args:
        agent_response: Agent's generated text with inline citations

    Returns:
        List of Citation objects extracted from response
    """
    import re

    citations = []
    # Match Markdown links: [Title](URL)
    pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
    matches = re.findall(pattern, agent_response)

    # Deduplicate citations (same URL)
    seen_urls = set()
    for title, url in matches:
        if url not in seen_urls:
            citations.append(Citation(title=title, url=url))
            seen_urls.add(url)

    return citations[:10]  # Max 10 citations per data model spec


# ============================================================================
# Server Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
