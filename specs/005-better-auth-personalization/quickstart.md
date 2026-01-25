# Quickstart: Better Auth Authentication & Personalization

**Feature**: 005-better-auth-personalization
**Estimated Setup Time**: 30-45 minutes
**Prerequisites**: Node.js 20+, Python 3.11+, Neon PostgreSQL account

## Overview

This guide walks through setting up the complete authentication and personalization stack locally:

1. Neon PostgreSQL database configuration
2. Better Auth service setup (Node.js/Express)
3. FastAPI backend integration
4. Docusaurus frontend configuration
5. End-to-end testing

---

## Step 1: Neon PostgreSQL Setup

### 1.1 Create Neon Project

1. Visit [https://console.neon.tech](https://console.neon.tech)
2. Create new project: "Book_HTHON_Auth"
3. Select region: closest to your deployment (e.g., US East for Vercel)
4. Copy connection string from "Connection Details"

**Connection String Format**:
```
postgresql://username:password@host.neon.tech/dbname?sslmode=require
```

### 1.2 Initialize Database Schema

**Option A: Better Auth Auto-Migration** (Recommended)
```bash
# From auth-service directory (created in Step 2)
npx better-auth migrate --connection-string="<your-neon-url>"
```

**Option B: Manual SQL Execution**
```bash
# Download schema from Better Auth docs or use Neon SQL Editor
psql "<your-neon-url>" < schema.sql
```

### 1.3 Create Custom Profile Table

Run in Neon SQL Editor:
```sql
CREATE TABLE user_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  python_experience TEXT CHECK (python_experience IN ('beginner', 'intermediate', 'advanced')),
  ros_experience TEXT CHECK (ros_experience IN ('none', 'beginner', 'intermediate', 'advanced')),
  has_rtx_gpu BOOLEAN DEFAULT FALSE,
  gpu_model TEXT,
  has_jetson BOOLEAN DEFAULT FALSE,
  jetson_model TEXT,
  robot_type TEXT,
  learning_goals TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profile_user_id ON user_profile(user_id);
```

---

## Step 2: Better Auth Service Setup

### 2.1 Create Auth Service Directory

```bash
# From project root
mkdir auth-service
cd auth-service
npm init -y
```

### 2.2 Install Dependencies

```bash
npm install better-auth @better-auth/pg express cors dotenv
npm install --save-dev typescript @types/express @types/node ts-node nodemon
```

### 2.3 Create TypeScript Config

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 2.4 Create Environment File

**.env**:
```env
# Database
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-random-32-char-secret-here
BETTER_AUTH_URL=http://localhost:3001
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Generate Secret**:
```bash
openssl rand -base64 32
```

### 2.5 Create Auth Configuration

**src/auth.ts**:
```typescript
import { betterAuth } from "better-auth";
import { postgresAdapter } from "@better-auth/pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: postgresAdapter(pool),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh if accessed within 1 day
  },
  trustedOrigins: (process.env.ALLOWED_ORIGINS || "").split(","),
});
```

### 2.6 Create Express Server

**src/index.ts**:
```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auth } from "./auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(","),
  credentials: true, // REQUIRED for cookies
}));

// Body parsing
app.use(express.json());

// Mount Better Auth routes at /api/auth
app.all("/api/auth/*", auth.handler);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔐 Better Auth service running on http://localhost:${PORT}`);
  console.log(`📍 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});
```

### 2.7 Add NPM Scripts

**package.json**:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "better-auth migrate"
  }
}
```

### 2.8 Start Auth Service

```bash
npm run dev
```

**Verify**:
- Open `http://localhost:3001/health` → Should return `{ status: "healthy" }`
- Check logs for database connection success

---

## Step 3: FastAPI Backend Integration

### 3.1 Install Python Dependencies

```bash
cd backend
pip install asyncpg python-dotenv
```

**Or add to pyproject.toml**:
```toml
[project.dependencies]
asyncpg = "^0.29.0"
python-dotenv = "^1.0.0"
```

### 3.2 Update .env File

**backend/.env**:
```env
# Existing variables...
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://book-hthon.vercel.app
```

### 3.3 Create Database Client

**backend/database.py**:
```python
import asyncpg
import os
from typing import Optional

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            os.getenv("DATABASE_URL"),
            min_size=1,
            max_size=10
        )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    async def fetch_one(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetch_all(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

db = Database()
```

### 3.4 Create Session Dependency

**backend/dependencies.py**:
```python
from fastapi import Cookie, HTTPException
from typing import Optional
from datetime import datetime, timezone
from database import db

async def get_current_user(
    session_token: Optional[str] = Cookie(None, alias="better-auth.session_token")
):
    """Validate session and return user ID."""
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    # Query session table
    session = await db.fetch_one(
        '''SELECT "userId", "expiresAt" FROM session WHERE token = $1''',
        session_token
    )

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid session"
        )

    # Check expiration
    if session['expiresAt'] < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    return session['userId']
```

### 3.5 Create Profile Endpoints

**backend/routers/profile.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from dependencies import get_current_user
from database import db

router = APIRouter(prefix="/api", tags=["Profile"])

class UserProfile(BaseModel):
    python_experience: str
    ros_experience: str
    has_rtx_gpu: bool
    gpu_model: Optional[str] = None
    has_jetson: bool
    jetson_model: Optional[str] = None
    robot_type: Optional[str] = None
    learning_goals: List[str] = []

@router.get("/profile", response_model=UserProfile)
async def get_profile(user_id: str = Depends(get_current_user)):
    profile = await db.fetch_one(
        "SELECT * FROM user_profile WHERE user_id = $1",
        user_id
    )

    if not profile:
        raise HTTPException(404, "Profile not found")

    return UserProfile(**dict(profile))

@router.post("/profile", response_model=UserProfile, status_code=201)
async def create_profile(
    profile: UserProfile,
    user_id: str = Depends(get_current_user)
):
    await db.execute(
        """
        INSERT INTO user_profile (
            user_id, python_experience, ros_experience,
            has_rtx_gpu, gpu_model, has_jetson, jetson_model,
            robot_type, learning_goals
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        user_id, profile.python_experience, profile.ros_experience,
        profile.has_rtx_gpu, profile.gpu_model, profile.has_jetson,
        profile.jetson_model, profile.robot_type, profile.learning_goals
    )

    return profile

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile: UserProfile,
    user_id: str = Depends(get_current_user)
):
    await db.execute(
        """
        UPDATE user_profile
        SET python_experience = $1, ros_experience = $2,
            has_rtx_gpu = $3, gpu_model = $4, has_jetson = $5,
            jetson_model = $6, robot_type = $7, learning_goals = $8,
            updated_at = NOW()
        WHERE user_id = $9
        """,
        profile.python_experience, profile.ros_experience,
        profile.has_rtx_gpu, profile.gpu_model, profile.has_jetson,
        profile.jetson_model, profile.robot_type, profile.learning_goals,
        user_id
    )

    return profile
```

### 3.6 Update api.py

**backend/api.py** (add to existing file):
```python
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from database import db
from routers import profile

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "").split(","),
    allow_credentials=True,  # REQUIRED for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include profile router
app.include_router(profile.router)
```

### 3.7 Start FastAPI

```bash
cd backend
uvicorn api:app --reload --port 8000
```

**Verify**:
- Open `http://localhost:8000/docs` → Should see `/api/profile` endpoints

---

## Step 4: Docusaurus Frontend Setup

### 4.1 Install Better Auth React SDK

```bash
cd .. # Back to project root
npm install better-auth
```

### 4.2 Create Auth Client

**src/lib/auth-client.ts**:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.REACT_APP_AUTH_URL || "http://localhost:3001/api/auth",
});
```

### 4.3 Swizzle Root Component

```bash
npx docusaurus swizzle @docusaurus/theme-classic Root --wrap --typescript
```

### 4.4 Add Auth Context to Root

**src/theme/Root.tsx**:
```typescript
import React, { createContext } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { authClient } from '@site/src/lib/auth-client';

export const AuthContext = createContext<any>(null);

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

### 4.5 Create Auth Navbar Component

**src/components/NavbarItems/AuthNavbarItem.tsx**:
```typescript
import React, { useContext } from 'react';
import { AuthContext } from '@theme/Root';

export default function AuthNavbarItem() {
  const { session, isPending, authClient } = useContext(AuthContext);

  if (isPending) {
    return <div className="navbar__item">•••</div>;
  }

  if (session?.user) {
    return (
      <button
        className="navbar__link"
        onClick={async () => {
          await authClient.signOut();
          window.location.href = '/';
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {session.user.name || 'User'} (Sign Out)
      </button>
    );
  }

  return (
    <a href="/auth/sign-in" className="navbar__link">
      Sign In
    </a>
  );
}
```

### 4.6 Register Custom Navbar Item

**src/theme/NavbarItem/ComponentTypes.js**:
```javascript
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import AuthNavbarItem from '@site/src/components/NavbarItems/AuthNavbarItem';

export default {
  ...ComponentTypes,
  'custom-auth': AuthNavbarItem,
};
```

### 4.7 Update Docusaurus Config

**docusaurus.config.ts** (add to navbar.items):
```typescript
navbar: {
  items: [
    // ... existing items
    {
      type: 'custom-auth',
      position: 'right',
    },
  ],
},
```

### 4.8 Create Auth Pages

**src/pages/auth/sign-in.tsx**:
```typescript
import React, { useState } from 'react';
import Layout from '@theme/Layout';
import { authClient } from '@site/src/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <Layout title="Sign In">
      <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
        <h1>Sign In</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Sign In
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Don't have an account? <a href="/auth/sign-up">Sign Up</a>
        </p>
      </div>
    </Layout>
  );
}
```

### 4.9 Add Environment Variables

**.env.local**:
```env
REACT_APP_AUTH_URL=http://localhost:3001/api/auth
REACT_APP_API_URL=http://localhost:8000
```

### 4.10 Start Docusaurus

```bash
npm start
```

**Verify**:
- Open `http://localhost:3000`
- See "Sign In" in navbar
- Click → redirects to `/auth/sign-in`

---

## Step 5: End-to-End Testing

### Test Flow

1. **Sign Up**:
   - Navigate to `http://localhost:3000/auth/sign-up` (create this page similar to sign-in)
   - Create account: `test@example.com` / `testpass123`
   - Check Neon `user` table → new user created

2. **Sign In**:
   - Navigate to `/auth/sign-in`
   - Enter credentials
   - Check browser cookies → `better-auth.session_token` set
   - Navbar should show "Test User (Sign Out)"

3. **Create Profile**:
   ```bash
   curl -X POST http://localhost:8000/api/profile \
     -H "Content-Type: application/json" \
     -b "better-auth.session_token=<token-from-browser>" \
     -d '{
       "python_experience": "beginner",
       "ros_experience": "none",
       "has_rtx_gpu": false,
       "has_jetson": false,
       "learning_goals": ["simulation"]
     }'
   ```
   - Check Neon `user_profile` table → profile created

4. **Fetch Profile**:
   ```bash
   curl http://localhost:8000/api/profile \
     -b "better-auth.session_token=<token>"
   ```
   - Should return profile JSON

5. **Sign Out**:
   - Click "Sign Out" in navbar
   - Cookie cleared, session deleted from DB
   - Navbar shows "Sign In" again

---

## Troubleshooting

### Issue: CORS errors in browser console

**Fix**:
- Ensure `allow_credentials=True` in FastAPI CORS
- Ensure `credentials: true` in Better Auth service CORS
- Add `credentials: "include"` in all frontend fetch calls

### Issue: Session cookie not sent to FastAPI

**Fix**:
```typescript
// Add to ALL fetch calls
fetch(url, {
  credentials: "include"
});
```

### Issue: Database connection failed

**Fix**:
- Check `DATABASE_URL` format includes `?sslmode=require`
- Verify Neon project is running (not paused)
- Test connection: `psql "<DATABASE_URL>" -c "SELECT 1;"`

### Issue: Better Auth migration fails

**Fix**:
```bash
# Run migration with explicit connection string
npx better-auth migrate --connection-string="<full-neon-url>"
```

### Issue: TypeScript errors in Docusaurus

**Fix**:
```bash
# Clear cache and rebuild
npm run clear
npm run build
```

---

## Next Steps

1. Implement `/auth/sign-up` page with profile form
2. Add "Personalize Chapter" button to documentation layout
3. Implement client-side personalization logic
4. Deploy to Vercel (auth service + frontend) and Railway (FastAPI)

---

**Setup Complete!** 🎉

You now have a working local authentication system with Better Auth, FastAPI, and Docusaurus.
