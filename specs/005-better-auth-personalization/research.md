# Research: Better Auth Authentication & Chapter Personalization

**Feature**: 005-better-auth-personalization
**Date**: 2026-01-22
**Research Phase**: Phase 0

## Overview

This document consolidates research findings for implementing Better Auth authentication with FastAPI backend and Docusaurus frontend, along with client-side chapter personalization features.

## 1. Better Auth Architecture Decision

### Key Finding: Better Auth is TypeScript-Only

Better Auth is a **TypeScript-first, framework-agnostic authentication framework**, not a Python library. This requires architectural adaptation.

### Decision: Hybrid Architecture

**Chosen Approach**: Deploy Better Auth as a lightweight Node.js/Express service alongside FastAPI

**Rationale**:
- Better Auth provides battle-tested session management and security patterns
- Separating auth concerns from business logic follows microservices best practices
- Both services can share the same Neon PostgreSQL database
- FastAPI validates sessions via shared database queries or JWT verification

**Architecture**:
```
Docusaurus Frontend (React 19)
    ↓ (Better Auth React SDK)
Better Auth Service (Node.js/Express) ←→ Neon PostgreSQL (Shared)
    ↓ (Session validation)              ↑
FastAPI Backend (Python 3.11+) ─────────┘
    ↓ (Profile API, Personalization)
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Python-only auth (Flask-Login, FastAPI-Users) | No additional service | Reinvent session security, less tested | Better Auth provides superior DX and security patterns |
| OAuth-only (Auth0, Clerk) | Managed service | Cost, vendor lock-in, overkill for email/password | Specification requires self-hosted, email/password only |
| Django Auth | Mature Python ecosystem | Requires Django framework, heavy | FastAPI already chosen, incompatible |

## 2. Database Schema

### Better Auth Auto-Generated Tables

Better Auth creates 4 core tables in Neon PostgreSQL:

**user**
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  image TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**session**
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**account**
```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  password TEXT, -- scrypt hashed for email/password
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**verification**
```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone
  value TEXT NOT NULL, -- verification code or token
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Custom User Profile Table

**user_profile** (custom table for background data)
```sql
CREATE TABLE user_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES user(id) ON DELETE CASCADE,

  -- Programming experience (ENUM or TEXT)
  python_experience TEXT CHECK (python_experience IN ('beginner', 'intermediate', 'advanced')),
  ros_experience TEXT CHECK (ros_experience IN ('none', 'beginner', 'intermediate', 'advanced')),

  -- Hardware access (JSON or separate columns)
  has_rtx_gpu BOOLEAN DEFAULT FALSE,
  gpu_model TEXT, -- e.g., "RTX 4090", "RTX 3060"
  has_jetson BOOLEAN DEFAULT FALSE,
  jetson_model TEXT, -- e.g., "Orin Nano", "Orin NX"
  robot_type TEXT, -- e.g., "Unitree Go1", "Custom"

  -- Learning goals (free text or JSON array)
  learning_goals TEXT[], -- e.g., ['simulation', 'real-robot', 'ai-research']

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);
```

**Decision**: Store background in separate table rather than Better Auth's `additionalFields` to maintain separation of concerns and enable easier querying.

## 3. Session Management Strategy

### Chosen Approach: Cookie-Based Session Validation

**Implementation**:
1. Better Auth sets secure, HTTP-only session cookies on signup/login
2. Docusaurus frontend automatically sends cookies with all requests (via `credentials: "include"`)
3. FastAPI validates sessions by querying the shared `session` table in Neon PostgreSQL
4. Session tokens are signed and include expiration timestamps

**FastAPI Session Validation Pattern**:
```python
from fastapi import Depends, HTTPException, Cookie
from typing import Optional

async def get_current_user(
    session_token: Optional[str] = Cookie(None, alias="better-auth.session_token")
):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Query Neon PostgreSQL session table
    session = await db.query(
        "SELECT user_id, expires_at FROM session WHERE token = $1",
        session_token
    )

    if not session or session['expires_at'] < datetime.now():
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    # Fetch user profile
    user = await db.query(
        "SELECT * FROM user WHERE id = $1",
        session['user_id']
    )

    return user
```

**Session Configuration**:
- **Expiration**: 7 days (configurable via Better Auth config)
- **Refresh**: Automatic after `updateAge` threshold (default: 1 day)
- **Revocation**: Delete from `session` table for immediate logout

### Alternative Considered: JWT Plugin

- **Pros**: Stateless, no database queries for validation
- **Cons**: Cannot immediately revoke sessions, 15-minute expiration requires frequent refresh
- **Rejected**: Session-based approach simpler for this use case, immediate revocation important for educational platform

## 4. CORS Configuration

### Critical Setup for Cross-Origin Auth

**FastAPI CORS Middleware**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://book-hthon.vercel.app",  # Production
        "http://localhost:3000",           # Docusaurus dev
        "http://localhost:5173"            # Potential Vite dev
    ],
    allow_credentials=True,  # MANDATORY for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**Better Auth Service CORS**:
```typescript
// auth-service/index.ts
import cors from 'cors';

app.use(cors({
  origin: [
    'https://book-hthon.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,  // MANDATORY
}));
```

**Frontend Fetch Configuration**:
```typescript
// All fetch calls to auth/backend must include:
fetch(url, {
  credentials: "include",  // MANDATORY to send cookies
});
```

**Key Gotcha**: CORS preflight (`OPTIONS` requests) must be handled before auth middleware, or they'll fail with 401.

## 5. Better Auth React SDK Integration

### Docusaurus Integration Pattern: Swizzle Root Component

**Why Root Component?**
- Renders at the very top of React tree (above Layout/Navbar)
- Never unmounts during page navigation
- Perfect for global auth state persistence

**Implementation**:
```bash
npx docusaurus swizzle @docusaurus/theme-classic Root --wrap
```

**Root Component with Auth Context**:
```typescript
// src/theme/Root.tsx
import React, { createContext } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: process.env.REACT_APP_AUTH_URL || 'http://localhost:3001',
});

export const AuthContext = createContext(null);

export default function Root({ children }) {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        const { data: session, isPending } = authClient.useSession();

        return (
          <AuthContext.Provider value={{ session, isPending, authClient }}>
            {children}
          </AuthContext.Provider>
        );
      }}
    </BrowserOnly>
  );
}
```

**BrowserOnly Wrapper**: Essential to prevent SSR/SSG hydration mismatches (Docusaurus is static).

### Custom Navbar Auth Component

**Implementation**:
```typescript
// src/components/NavbarItems/AuthNavbarItem.tsx
import React, { useContext } from 'react';
import { AuthContext } from '@theme/Root';

export default function AuthNavbarItem() {
  const { session, isPending, authClient } = useContext(AuthContext);

  if (isPending) return <div className="navbar__item">•••</div>;

  if (session?.user) {
    return (
      <div className="navbar__item navbar__item--dropdown">
        <button onClick={() => authClient.signOut()}>
          {session.user.name} (Sign Out)
        </button>
      </div>
    );
  }

  return (
    <a href="/auth/sign-in" className="navbar__link">Sign In</a>
  );
}
```

**Register in docusaurus.config.ts**:
```typescript
navbar: {
  items: [
    { type: 'custom-auth', position: 'right' }
  ]
}
```

## 6. Client-Side Content Personalization

### Chosen Strategy: DOM Manipulation + React Components

**Three-Layer Approach**:

**Layer 1: Personalize Button Injection** (Docusaurus Layout Wrapper)
```typescript
// src/theme/DocItem/Layout/index.tsx
import React, { useContext } from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import { AuthContext } from '@theme/Root';
import PersonalizeButton from '@site/src/components/PersonalizeButton';

export default function Layout(props) {
  const { session } = useContext(AuthContext);

  return (
    <>
      {session && <PersonalizeButton />}
      <OriginalLayout {...props} />
    </>
  );
}
```

**Layer 2: Personalization Logic** (Client-Side State)
```typescript
// src/components/PersonalizeButton.tsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '@theme/Root';

export default function PersonalizeButton() {
  const { session } = useContext(AuthContext);
  const [isPersonalized, setIsPersonalized] = useState(false);

  const handlePersonalize = async () => {
    // Fetch user profile from FastAPI /profile endpoint
    const response = await fetch('https://api.example.com/profile', {
      credentials: 'include'
    });
    const profile = await response.json();

    // Apply personalization based on profile
    applyPersonalization(profile);
    setIsPersonalized(true);
  };

  return (
    <button
      className="personalize-btn"
      onClick={handlePersonalize}
    >
      {isPersonalized ? 'Personalized ✓' : 'Personalize Chapter'}
    </button>
  );
}
```

**Layer 3: DOM Content Adjustment**
```typescript
function applyPersonalization(profile) {
  const { python_experience, has_rtx_gpu, ros_experience } = profile;

  // Beginner mode: Simplify advanced sections
  if (python_experience === 'beginner') {
    document.querySelectorAll('.advanced-tip').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.beginner-note').forEach(el => {
      el.style.display = 'block';
    });
  }

  // GPU-specific content
  if (!has_rtx_gpu) {
    document.querySelectorAll('.gpu-required').forEach(el => {
      el.classList.add('dimmed');
      const altText = document.createElement('div');
      altText.className = 'cloud-alternative';
      altText.textContent = '💡 No GPU? Try Google Colab (free GPU)';
      el.appendChild(altText);
    });
  }

  // ROS 2 expertise adjustments
  if (ros_experience === 'advanced') {
    document.querySelectorAll('.ros-advanced').forEach(el => {
      el.style.display = 'block';
    });
  }
}
```

### Markdown Content Annotations

**Strategy**: Use HTML comments in Markdown to mark personalizable sections

```markdown
<!-- BEGIN: advanced-tip -->
**Advanced**: For optimal performance, use `rclcpp::spin_some()` instead of `spin()`.
<!-- END: advanced-tip -->

<!-- BEGIN: beginner-note -->
**New to ROS 2?** Think of nodes as individual programs that communicate via topics.
<!-- END: beginner-note -->

<!-- BEGIN: gpu-required -->
This training step requires an RTX 3060 or better (VRAM ≥ 12GB).
<!-- END: gpu-required -->
```

**Parser Script** (run at build time or client-side):
```typescript
function parsePersonalizationMarkers() {
  const content = document.querySelector('article');
  const html = content.innerHTML;

  // Wrap marked sections in divs with classes
  const processed = html
    .replace(/<!-- BEGIN: ([\w-]+) -->/g, '<div class="$1" data-personalize>')
    .replace(/<!-- END: [\w-]+ -->/g, '</div>');

  content.innerHTML = processed;
}
```

### Performance Optimization

**Caching Strategy**:
```typescript
class PersonalizationCache {
  private static KEY = 'personalization_prefs';
  private static TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  static get() {
    const cached = localStorage.getItem(this.KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.TTL) {
      this.clear();
      return null;
    }

    return data;
  }

  static set(profile) {
    localStorage.setItem(this.KEY, JSON.stringify({
      data: profile,
      timestamp: Date.now()
    }));
  }

  static clear() {
    localStorage.removeItem(this.KEY);
  }
}
```

**Debounced API Calls**:
```typescript
const debouncedFetch = debounce(async (url) => {
  return await fetch(url, { credentials: 'include' });
}, 300);
```

## 7. FastAPI Backend Extensions

### New Endpoints Required

**Profile Endpoint** (`/api/profile`)
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

class UserProfile(BaseModel):
    python_experience: str
    ros_experience: str
    has_rtx_gpu: bool
    gpu_model: Optional[str]
    has_jetson: bool
    jetson_model: Optional[str]
    robot_type: Optional[str]
    learning_goals: List[str]

@router.get("/profile", response_model=UserProfile)
async def get_profile(user = Depends(get_current_user)):
    """Fetch user background profile for personalization."""
    profile = await db.query(
        "SELECT * FROM user_profile WHERE user_id = $1",
        user['id']
    )
    return profile

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile: UserProfile,
    user = Depends(get_current_user)
):
    """Update user background profile."""
    await db.execute(
        """
        UPDATE user_profile
        SET python_experience = $1,
            ros_experience = $2,
            has_rtx_gpu = $3,
            gpu_model = $4,
            has_jetson = $5,
            jetson_model = $6,
            robot_type = $7,
            learning_goals = $8,
            updated_at = NOW()
        WHERE user_id = $9
        """,
        profile.python_experience,
        profile.ros_experience,
        profile.has_rtx_gpu,
        profile.gpu_model,
        profile.has_jetson,
        profile.jetson_model,
        profile.robot_type,
        profile.learning_goals,
        user['id']
    )
    return profile
```

## 8. Deployment Considerations

### Better Auth Service Deployment

**Options**:
1. **Vercel Serverless Function** (Recommended for prototype)
   - Deploy as `/api/auth/*` routes
   - Same domain as Docusaurus (no CORS issues)
   - Free tier sufficient for hackathon

2. **Railway/Render** (Recommended for production)
   - Dedicated Node.js service
   - Persistent connections to Neon PostgreSQL
   - Auto-scaling

**Decision**: Deploy Better Auth to Vercel serverless functions for simplicity (same deployment target as frontend).

### Environment Variables

**Better Auth Service** (`.env`):
```env
DATABASE_URL=postgresql://user:pass@neon.tech:5432/dbname
BETTER_AUTH_SECRET=<random-secret-32-chars>
BETTER_AUTH_URL=https://book-hthon.vercel.app
```

**FastAPI Backend** (`.env`):
```env
DATABASE_URL=postgresql://user:pass@neon.tech:5432/dbname
CORS_ORIGINS=https://book-hthon.vercel.app,http://localhost:3000
```

**Docusaurus Frontend** (`.env`):
```env
REACT_APP_AUTH_URL=https://book-hthon.vercel.app/api/auth
REACT_APP_API_URL=https://api.railway.app
```

## 9. Testing Strategy

### Local Testing Flow

1. **Start Better Auth Service**: `cd auth-service && npm run dev` (port 3001)
2. **Start FastAPI Backend**: `cd backend && uvicorn api:app --reload` (port 8000)
3. **Start Docusaurus Frontend**: `npm start` (port 3000)
4. **Test Flow**:
   - Navigate to `http://localhost:3000/auth/sign-up`
   - Create account with email/password + background form
   - Verify profile stored in Neon PostgreSQL
   - Navigate to any chapter
   - Click "Personalize Chapter"
   - Verify content adjustments based on profile

### Integration Tests

**Session Validation Test**:
```python
# test_auth_integration.py
async def test_session_validation():
    # Create session in Better Auth
    response = await client.post('/auth/sign-in', json={
        'email': 'test@example.com',
        'password': 'testpass123'
    })
    cookie = response.cookies['better-auth.session_token']

    # Use session cookie in FastAPI request
    profile_response = await client.get(
        '/api/profile',
        cookies={'better-auth.session_token': cookie}
    )

    assert profile_response.status_code == 200
    assert 'python_experience' in profile_response.json()
```

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Better Auth version incompatibility | Pin to specific version (e.g., `better-auth@1.0.0`) |
| Session cookie not sent cross-origin | Enforce `credentials: "include"` in all fetch calls, test CORS thoroughly |
| Neon PostgreSQL connection limits | Use connection pooling (pg-pool), limit concurrent connections |
| Personalization performance lag | Cache profile in localStorage (30-day TTL), debounce API calls |
| Hydration mismatch in Docusaurus | Wrap all auth logic in `BrowserOnly` component |
| Session fixation attacks | Better Auth rotates session tokens on privilege escalation |
| SQL injection in profile queries | Use parameterized queries exclusively, validate input types |

## 11. Open Questions (Resolved)

All technical clarifications resolved through research:

✅ **Better Auth Python support?** → No, TypeScript-only. Deploy as separate Node.js service.
✅ **Session storage strategy?** → Database-backed sessions via shared Neon PostgreSQL.
✅ **Custom fields in Better Auth?** → Use separate `user_profile` table for separation of concerns.
✅ **Docusaurus auth state management?** → Swizzle Root component, use React Context.
✅ **Personalization performance?** → Client-side DOM manipulation + localStorage caching.
✅ **CORS configuration?** → Allow credentials, register frontend origins, handle OPTIONS preflight.

## 12. Next Steps (Phase 1)

1. Create `data-model.md` with complete database schema
2. Generate OpenAPI contracts for FastAPI endpoints (`/contracts/`)
3. Create `quickstart.md` with local development setup
4. Update agent context with new technologies (Better Auth, Node.js service)

---

**Research Completed**: 2026-01-22
**Ready for Phase 1**: ✅ Yes
**Constitution Violations**: None
