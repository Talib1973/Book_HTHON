---
id: 0002
title: Better Auth FastAPI Integration Research
stage: general
date: 2026-01-22
surface: agent
model: claude-haiku-4-5-20251001
feature: 005-better-auth-personalization
branch: 005-better-auth-personalization
user: none
command: Research Better Auth integration with FastAPI backend
labels: ["authentication", "better-auth", "fastapi", "integration", "research"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - (research only - no files created)
tests:
  - (research only - no tests run)
---

## Prompt

Research Better Auth (https://www.better-auth.com/) integration with FastAPI backend:

1. Better Auth architecture and how it works with Python backends
2. Best practices for integrating Better Auth with FastAPI
3. How to set up email/password authentication with Better Auth
4. Custom fields or user metadata patterns in Better Auth
5. Session management and token handling between Better Auth and FastAPI
6. Database schema requirements (specifically for Neon Serverless PostgreSQL)
7. CORS configuration needed for cross-origin auth between Docusaurus frontend and FastAPI backend

Provide concrete implementation patterns, code examples if available from documentation, and any gotchas or best practices.

## Response snapshot

Comprehensive research completed covering 7 key areas of Better Auth integration with FastAPI. Key findings: Better Auth is a TypeScript-first framework designed for frontend + backend separation; integration with Python backends requires either JWT plugin validation or direct session table queries; session management uses signed cookies with optional JWT encoding; Neon PostgreSQL serverless is fully supported; CORS requires trustedOrigins configuration and credential handling across both client and server.

---

## Better Auth Architecture & Python Backend Integration

### Core Architecture

Better Auth is a **TypeScript-first, framework-agnostic authentication framework** with over 25.5K GitHub stars. Key architectural principles:

- **Universal Authentication**: Supports multiple frontends (React, Vue, Svelte, Next.js, Astro, Hono, etc.)
- **Backend-Agnostic**: No native Python/FastAPI integration, but provides standardized REST API endpoints and JWT validation
- **Plugin-Based Extensibility**: Core + plugins = comprehensive auth system
- **Session & Token Hybrid**: Supports both signed cookies and JWT tokens

### TypeScript-First Caveat

**Important**: Better Auth is a TypeScript npm package, NOT a Python library. For FastAPI backends, you're integrating via:
1. REST API endpoints called from Better Auth
2. JWT token validation using the JWKS endpoint
3. Direct database queries to verify sessions

### How It Works with Python Backends

```
┌─────────────────┐          ┌──────────────┐          ┌──────────────┐
│   Docusaurus    │          │  Better Auth │          │   FastAPI    │
│    Frontend     │◄────────►│  (TypeScript)│◄────────►│   Backend    │
└─────────────────┘          └──────────────┘          └──────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Neon PostgreSQL  │
                            │  (Serverless)    │
                            └──────────────────┘
```

The FastAPI backend validates auth by:
- Checking the session cookie against the database (session table)
- Using JWT plugin to verify tokens via JWKS endpoint
- Making direct queries to the database (shared Neon instance)

---

## Best Practices for FastAPI Integration

### 1. **Recommended Architecture Pattern**

**JWT Plugin Approach** (Recommended for APIs):
```python
# FastAPI receives JWT token
# Validates using JWKS endpoint from Better Auth
# Does NOT require session table queries

import httpx
from jose import jwt
from jose.backends.cryptography_backend import RSAKey

@app.get("/protected")
async def protected(token: str = Header(...)):
    # Fetch JWKS from Better Auth
    async with httpx.AsyncClient() as client:
        jwks = await client.get("http://better-auth-server/api/auth/jwks")
        key_set = jwks.json()

    # Verify token
    decoded = jwt.get_unverified_header(token)
    key = next(k for k in key_set['keys'] if k['kid'] == decoded['kid'])
    payload = jwt.decode(token, key, algorithms=["ES256"])
    return {"message": f"Hello {payload['sub']}"}
```

**Session Cookie Approach** (For stateful APIs):
```python
# Better Auth sets session cookie
# FastAPI validates by querying session table

@app.get("/me")
async def get_me(session_token: str = Cookie(...)):
    async with db.cursor() as cursor:
        await cursor.execute(
            "SELECT users.* FROM users JOIN sessions ON users.id = sessions.userId WHERE sessions.token = %s AND sessions.expiresAt > NOW()",
            (session_token,)
        )
        user = await cursor.fetchone()
    return {"user": user}
```

### 2. **Deployment Considerations**

- Deploy Better Auth as a separate TypeScript service (Next.js, Remix, etc.)
- FastAPI is purely an API layer (no frontend served from it)
- Both share the same Neon PostgreSQL database instance
- Use environment variables for connection strings

### 3. **Key Integration Points**

| Component | Responsibility |
|-----------|-----------------|
| Better Auth | Handle signup, login, OAuth, email verification, password reset |
| FastAPI | Validate auth, serve data, handle business logic |
| Neon PostgreSQL | Store users, sessions, accounts, verification tokens |
| Docusaurus | Display content, call API (no direct auth calls to FastAPI) |

---

## Email & Password Authentication Setup

### Basic Configuration

```typescript
// Better Auth setup (auth.ts)
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    disableSignUp: false,
    // Password reset configuration
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click here to reset: ${url}`,
      });
    },
  },
  emailVerification: {
    enabled: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Click here to verify: ${url}`,
      });
    },
    sendOnSignIn: true,
    requireEmailVerification: true, // Enforce before login
  },
});
```

### Sign Up Flow

```typescript
// Client-side
const { data, error } = await authClient.signUp.email({
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePassword123",
  image: "https://example.com/avatar.png",
});
```

### Security Details

- **Password Hashing**: scrypt by default (OWASP-recommended for OpenSSL without Argon2id)
- **Password Storage**: Stored in `account` table with `providerId = "credential"`
- **Token Expiration**:
  - Reset tokens: 3600 seconds (default)
  - Email verification tokens: configurable
  - Sessions: 7 days (default)
- **Security Best Practice**: Don't await email sends to prevent timing attacks
  ```typescript
  // ❌ Wrong - allows timing attacks
  await sendVerificationEmail(...);

  // ✅ Correct - fire and forget with platform support
  context.waitUntil(sendVerificationEmail(...));
  ```

---

## Custom Fields & User Metadata

### Adding Custom Fields

**Method 1: Additional Fields** (Recommended for simple cases)
```typescript
export const auth = betterAuth({
  user: {
    additionalFields: {
      age: {
        type: "number" as const,
        required: false,
      },
      role: {
        type: "string" as const,
        required: false,
        defaultValue: "user",
      },
      preferences: {
        type: "object" as const,
        required: false,
      },
    },
  },
});
```

Then use CLI to apply schema:
```bash
npx @better-auth/cli@latest generate
npx @better-auth/cli@latest migrate
```

**Method 2: Custom Plugin** (For complex requirements)
```typescript
import { createAuthEndpoint } from "better-auth/api";

const customFieldsPlugin = {
  id: "custom-fields",
  endpoints: {
    // Custom endpoints for managing user data
  },
  schema: {
    // Add custom database tables
    userMetadata: {
      fields: {
        userId: { type: "string", required: true },
        preferences: { type: "text" }, // JSON stored as text
        customField: { type: "string" },
      },
      relations: {
        user: { references: "user.id", onDelete: "cascade" },
      },
    },
  },
};
```

### Important Security Notes

- **Don't store sensitive information** in user or session tables
- Create separate encrypted tables for:
  - Payment info
  - API keys
  - Authentication secrets
- Use database-level encryption for sensitive custom fields

### Type-Safe Access

```typescript
// Custom fields automatically typed in hooks
const { data: session } = useSession();
console.log(session.user.age); // TypeScript knows this exists
console.log(session.user.preferences); // Typed as object
```

---

## Session Management & Token Handling

### Session Architecture

Better Auth uses **hybrid session management**:

```
┌─────────────────────────────────────────┐
│  Signed Cookie (Always)                 │
│  Contains: session token                │
│  Signed: Yes (prevents tampering)       │
│  Encrypted: Optional                    │
└─────────────────────────────────────────┘
         ▼ (Can be)
┌─────────────────────────────────────────┐
│  Session Database Entry                 │
│  Tables: sessions                       │
│  Fields: id, userId, token, expiresAt,  │
│          ipAddress, userAgent           │
└─────────────────────────────────────────┘
```

### Session Flow

1. User signs in → Better Auth generates session
2. Session token stored in signed cookie + database
3. On next request, cookie validated
4. Optional: refresh after `updateAge` threshold (default 7 days)
5. Fresh sessions (< 1 day old) required for sensitive operations

### Session Table Schema

```sql
CREATE TABLE "session" (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  ipAddress VARCHAR(255),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);
```

### JWT Plugin for FastAPI

Better Auth provides **optional JWT tokens** for stateless validation:

```typescript
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      // Configuration
      issuer: "https://your-better-auth.com",
      audience: ["api.example.com"],
      expiresIn: "15m", // JWT expiration (short-lived)
      algorithm: "ES256", // EdDSA, ES256, RS256, PS256

      // Custom payload
      definePayload: async (user) => {
        return {
          sub: user.id,
          email: user.email,
          role: user.role || "user",
        };
      },
    }),
  ],
});
```

### FastAPI JWT Validation

```python
from jose import jwt, JWTError
import httpx

class JWTValidator:
    def __init__(self, better_auth_url: str):
        self.better_auth_url = better_auth_url
        self.jwks_cache = None

    async def get_jwks(self):
        """Cache JWKS for 24 hours"""
        if self.jwks_cache is None:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.better_auth_url}/api/auth/jwks")
                self.jwks_cache = response.json()
        return self.jwks_cache

    async def verify_token(self, token: str):
        """Verify JWT token"""
        try:
            header = jwt.get_unverified_header(token)
            jwks = await self.get_jwks()

            # Find key by kid
            key = next(k for k in jwks['keys'] if k['kid'] == header['kid'])

            # Verify signature
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                audience="api.example.com",
            )
            return payload
        except JWTError:
            return None

# Usage in FastAPI
validator = JWTValidator(os.getenv("BETTER_AUTH_URL"))

@app.get("/api/protected")
async def protected(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    payload = await validator.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401)
    return {"user": payload}
```

### Token Retrieval from Better Auth

Clients get JWT tokens via:

```typescript
// Method 1: Client plugin (recommended)
const token = await authClient.getToken();

// Method 2: Call /token endpoint with bearer auth
GET /api/auth/token
Authorization: Bearer <session-token>

// Response
{
  "token": "eyJhbGc...",
  "type": "Bearer",
  "expiresIn": 900  // 15 minutes
}

// Method 3: Automatic in getSession response
const session = await auth.getSession({
  headers: request.headers,
});
// session includes "set-auth-jwt" header
```

### Session Comparison

| Feature | Cookie Session | JWT Token |
|---------|----------------|-----------|
| Storage | HttpOnly cookie | Authorization header |
| Revocation | Database query | Wait for expiration |
| Size | Small | Medium (payload-dependent) |
| CSRF Protection | Built-in | Must implement manually |
| Refresh | Automatic (7d) | Manual (15m default) |
| Mobile/API | Limited | Ideal |

---

## Database Schema for Neon Serverless PostgreSQL

### Core Tables (Auto-Generated)

Better Auth CLI automatically generates these tables:

#### 1. User Table
```sql
CREATE TABLE "user" (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  image TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Session Table
```sql
CREATE TABLE "session" (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  ipAddress VARCHAR(255),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);
```

#### 3. Account Table
```sql
CREATE TABLE "account" (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  accountId VARCHAR(255),
  providerId VARCHAR(255) NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope TEXT,
  idToken TEXT,
  password VARCHAR(255), -- For email/password auth
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  UNIQUE(userId, providerId)
);
```

#### 4. Verification Table
```sql
CREATE TABLE "verification" (
  id VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Neon-Specific Setup

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL, // Neon connection string
  }),
  experimental: {
    joins: true, // Enable join optimization (2-3x performance)
  },
});
```

### Custom Schema Migration

For non-default schema (e.g., `auth` instead of `public`):

```typescript
export const auth = betterAuth({
  database: new Pool({
    connectionString: `${process.env.DATABASE_URL}?options=-c search_path=auth`,
  }),
});
```

Ensure schema exists and user has permissions:
```sql
CREATE SCHEMA auth;
GRANT ALL PRIVILEGES ON SCHEMA auth TO your_user;
```

### Neon Serverless Considerations

- **Connection String**: Uses websocket protocol
- **Connection Pooling**: Managed by Neon (included in FREE tier)
- **Scale to Zero**: Database automatically pauses when idle
- **Branches**: Create test branches for CI/CD
- **Autoscaling**: Compute units scale with demand

### Schema Generation & Migration

```bash
# Generate migration files
npx @better-auth/cli@latest generate

# Apply migrations
npx @better-auth/cli@latest migrate

# Check schema
npx @better-auth/cli@latest show
```

### Adding Custom Fields to Schema

```typescript
const auth = betterAuth({
  user: {
    additionalFields: {
      role: { type: "string", required: false },
      organizationId: { type: "string", required: false },
      metadata: { type: "object", required: false },
    },
  },
});
```

Then re-generate and migrate:
```bash
npx @better-auth/cli@latest generate
npx @better-auth/cli@latest migrate
```

---

## CORS Configuration for Cross-Origin Auth

### Problem: Docusaurus Frontend → Better Auth → FastAPI

```
Docusaurus (http://localhost:3000)
         ▼
    Better Auth server (http://localhost:5173)
         ▼
    FastAPI backend (http://localhost:8000)
         ▼
    Neon PostgreSQL
```

### Better Auth CORS Setup

**Option 1: Trusted Origins Array**
```typescript
export const auth = betterAuth({
  baseURL: "http://localhost:5173",
  trustedOrigins: [
    "http://localhost:3000",     // Docusaurus dev
    "https://docs.example.com",  // Docusaurus prod
    "http://localhost:8000",     // FastAPI (if making auth calls)
  ],
});
```

**Option 2: Dynamic Trusted Origins**
```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: async (request) => {
    const origin = request.headers.get("origin");
    const allowedDomains = process.env.ALLOWED_ORIGINS?.split(",") || [];
    return allowedDomains.includes(origin);
  },
});
```

### Framework-Specific CORS Middleware

**Better Auth + Hono Example** (TypeScript backend):
```typescript
import { cors } from "hono/cors";
import { Hono } from "hono";
import { toNodeHandler } from "better-auth/node";

const app = new Hono();

// CORS must be registered BEFORE auth handler
app.use(cors({
  origin: ["http://localhost:3000", "https://docs.example.com"],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["X-Custom-Header"],
  maxAge: 3600,
}));

app.all("/api/auth/*", toNodeHandler(auth));
```

**Better Auth + Express Example**:
```typescript
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ["http://localhost:3000", "https://docs.example.com"];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
}));

app.all("/api/auth/*", toNodeHandler(auth));
```

### FastAPI CORS Configuration

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Docusaurus dev
        "https://docs.example.com",   # Docusaurus prod
        "http://localhost:5173",      # Better Auth dev
        "https://auth.example.com",   # Better Auth prod
    ],
    allow_credentials=True,  # CRITICAL: Must be True for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Custom-Header"],
    max_age=3600,
)

@app.get("/api/me")
async def get_me(session: Session = Depends(get_session)):
    return session
```

### Cookie Handling with CORS

**Client-Side (Docusaurus)**:
```typescript
// CRITICAL: Include credentials for cookies to be sent/received
fetch("http://localhost:5173/api/auth/signin", {
  method: "POST",
  credentials: "include",  // Send cookies
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "..." }),
})
```

**Session Cookie Flow**:
```
1. Docusaurus calls Better Auth signin
   ▼
2. Better Auth sets Set-Cookie header
   ▼
3. Browser stores cookie (credentials: "include")
   ▼
4. Docusaurus calls FastAPI
   ▼
5. Browser auto-sends cookie (credentials: "include")
   ▼
6. FastAPI validates cookie against session table
```

### Known CORS Issues & Gotchas

| Issue | Solution |
|-------|----------|
| `credentials: true` on both sides | Must match: if server has it, client must send it |
| Cookie not sent to FastAPI | Add `credentials: "include"` in all fetch calls |
| Preflight CORS errors | Ensure `OPTIONS` method is allowed |
| CORS headers missing | Middleware must be registered BEFORE route handlers |
| Cross-subdomain cookies | Set `SameSite=None; Secure` in cookie config |

### Example: Complete CORS Setup for Docusaurus + Better Auth + FastAPI

```typescript
// Better Auth (auth.ts)
export const auth = betterAuth({
  baseURL: "https://auth.example.com",
  trustedOrigins: [
    "https://docs.example.com",
    "http://localhost:3000",
  ],
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

// Express server (index.ts)
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";

const app = express();

// CORS middleware FIRST
app.use(cors({
  origin: ["https://docs.example.com", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// Body parser
app.use(express.json());

// Auth handler
app.all("/api/auth/*", toNodeHandler(auth));

// Python FastAPI (main.py)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://docs.example.com",
        "http://localhost:3000",
        "https://auth.example.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Integration Summary & Architecture Decisions

### Recommended Integration Pattern

```yaml
Architecture:
  Better Auth Service:
    - Role: Authentication server
    - Framework: TypeScript (Next.js/Express/Hono)
    - Responsibility: Signup, login, OAuth, email verification, password reset
    - Database: Neon PostgreSQL (shared with FastAPI)
    - Endpoints: /api/auth/*

  FastAPI Backend:
    - Role: API + authorization layer
    - Framework: Python with FastAPI
    - Responsibility: Validate auth, serve data, implement business logic
    - Auth Validation: JWT plugin (JWKS) OR session table queries
    - Endpoints: /api/* (business logic)

  Docusaurus Frontend:
    - Role: Content + documentation
    - Framework: React/TypeScript
    - Auth: Via Better Auth client SDK
    - API Calls: To FastAPI (with validated session/token)

  Database:
    - Neon PostgreSQL serverless
    - Tables: users, sessions, accounts, verification (+ custom)
    - Shared between Better Auth and FastAPI
    - Experimental joins enabled for performance

Session Flow:
  1. User signs in via Docusaurus → Better Auth
  2. Better Auth creates session, sets cookie, stores in DB
  3. Cookie sent with credentials: "include"
  4. FastAPI validates session (or uses JWT token)
  5. FastAPI serves data to Docusaurus
```

### Key Gotchas & Best Practices

1. **TypeScript-First**: Better Auth is NOT a Python library—it's TypeScript only
2. **Shared Database**: Both Better Auth and FastAPI access the same Neon instance
3. **Cookie Credentials**: MUST use `credentials: "include"` on BOTH client and server CORS config
4. **CORS Ordering**: Register CORS middleware BEFORE auth handlers
5. **No `express.json()` Before Auth**: Causes client API to hang (Express)
6. **Email Timing Attacks**: Don't await email sends in signup/reset
7. **Separate Sensitive Tables**: Never store secrets in user/session tables
8. **JWT Expiration**: Keep short (15m) with refresh flow
9. **Session Refresh**: Automatic after `updateAge` threshold (7d default)
10. **Fresh Sessions**: Sensitive operations require sessions < 1 day old

---

## Resources

- [Better Auth Official Docs](https://www.better-auth.com/docs)
- [PostgreSQL Adapter Setup](https://www.better-auth.com/docs/adapters/postgresql)
- [Configuration Options](https://www.better-auth.com/docs/reference/options)
- [API Endpoints](https://www.better-auth.com/docs/concepts/api)
- [Email & Password Setup](https://www.better-auth.com/docs/authentication/email-password)
- [Database Schema](https://www.better-auth.com/docs/concepts/database)
- [Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [JWT Plugin](https://www.better-auth.com/docs/plugins/jwt)
- [Plugins Architecture](https://www.better-auth.com/docs/concepts/plugins)
- [Express Integration](https://www.better-auth.com/docs/integrations/express)
- [Neon PostgreSQL Setup](https://medium.com/@abgkcode/building-a-full-stack-application-with-next-js-drizzle-orm-neon-postgresql-and-better-auth-6d7541fba48a)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [FastAPI Cookie Parameters](https://fastapi.tiangolo.com/tutorial/cookie-params/)

## Outcome

- ✅ Impact: Comprehensive research covering all 7 requested areas with concrete code examples
- 🧪 Tests: Research validation only (no tests applicable)
- 📁 Files: Created PHR document at `/mnt/c/Users/DELL/Desktop/Projects/Book_HTHON/history/prompts/005-better-auth-personalization/0002-better-auth-fastapi-integration-research.general.prompt.md`
- 🔁 Next prompts: Create integration spec based on findings; implement Better Auth service starter; implement FastAPI validation middleware; test CORS configuration
- 🧠 Reflection: Better Auth is production-ready with excellent TypeScript support; FastAPI integration requires custom validation layer (recommended: JWT plugin via JWKS); Neon PostgreSQL serverless is ideal for auth workloads with included connection pooling

## Evaluation notes (flywheel)

- Failure modes observed: None—comprehensive documentation available for all components
- Graders run and results (PASS/FAIL): Research completeness: PASS
- Prompt variant (if applicable): null
- Next experiment: Create concrete FastAPI middleware for Better Auth JWT validation
