from fastapi import Cookie, HTTPException, Request
from typing import Optional
import httpx
import os

# Get auth service URL from environment (production or local)
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:3001")

async def get_current_user(request: Request):
    """Validate session by calling auth-service and return user ID."""

    # Get session cookie from request
    session_token = request.cookies.get("better-auth.session_token")

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    # Validate session with auth-service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/api/auth/get-session",
                cookies={"better-auth.session_token": session_token},
                timeout=5.0
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid session"
                )

            session_data = response.json()

            # Extract user ID from session
            if not session_data or "user" not in session_data:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid session data"
                )

            return session_data["user"]["id"]

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )
