# Next Steps: Better Auth Implementation

## ✅ Completed (Phase 1: Tasks T001-T004)

- **T001**: Created auth-service/ with package.json, tsconfig.json, .env.example
- **T002**: Installed Better Auth dependencies (better-auth v1.4.17, express, cors, pg, typescript)
- **T003**: Added asyncpg v0.31.0 to backend dependencies
- **T004**: Installed better-auth in Docusaurus root
- Created .env.example files for auth-service, backend, and root

## ⏸️ Paused: Requires Manual Setup (T005-T007)

These tasks require external service setup:

### T005: Create Neon PostgreSQL Database

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Create new project: "Book_HTHON_Auth"
3. Copy connection string from "Connection Details"
4. Update .env files:
   - `auth-service/.env` (copy from `.env.example`)
   - `backend/.env` (add DATABASE_URL)

### T006: Run Better Auth Migration

```bash
cd auth-service
npx better-auth migrate
```

This creates tables: `user`, `session`, `account`, `verification`

### T007: Create user_profile Table

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

## 📋 Phase 2: Foundational (Next - T008-T016)

Once database is set up, resume with:

```bash
# From project root
claude /sp.implement
```

This will execute:
- T008-T016: Auth service core, database clients, CORS setup
- Phase 3+: User story implementations

## 📖 Full Guide

See `specs/005-better-auth-personalization/quickstart.md` for complete setup instructions.

## 🔄 Current Status

**Phase 1**: 4/7 tasks complete (57%)
**Blocked by**: External database setup (Neon PostgreSQL)
**Time estimate**: 10-15 minutes to complete T005-T007
