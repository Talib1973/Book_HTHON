# Data Model: Better Auth Authentication & Chapter Personalization

**Feature**: 005-better-auth-personalization
**Date**: 2026-01-22
**Database**: Neon Serverless PostgreSQL

## Entity Relationship Diagram

```
┌──────────────┐
│     user     │ (Better Auth managed)
├──────────────┤
│ id (PK)      │──┐
│ email        │  │
│ name         │  │
│ emailVerified│  │
│ image        │  │
│ createdAt    │  │
│ updatedAt    │  │
└──────────────┘  │
                  │ 1:1
                  ▼
            ┌─────────────────┐
            │  user_profile   │ (Custom)
            ├─────────────────┤
            │ id (PK)         │
            │ user_id (FK)    │
            │ python_exp      │
            │ ros_exp         │
            │ has_rtx_gpu     │
            │ gpu_model       │
            │ has_jetson      │
            │ jetson_model    │
            │ robot_type      │
            │ learning_goals  │
            │ createdAt       │
            │ updatedAt       │
            └─────────────────┘

┌──────────────┐
│   session    │ (Better Auth managed)
├──────────────┤
│ id (PK)      │
│ userId (FK) ─┼──→ user.id
│ token        │
│ expiresAt    │
│ ipAddress    │
│ userAgent    │
│ createdAt    │
└──────────────┘

┌──────────────┐
│   account    │ (Better Auth managed)
├──────────────┤
│ id (PK)      │
│ userId (FK) ─┼──→ user.id
│ accountId    │
│ providerId   │
│ password     │ (scrypt hashed)
│ accessToken  │
│ refreshToken │
│ expiresAt    │
│ createdAt    │
└──────────────┘

┌──────────────┐
│verification  │ (Better Auth managed)
├──────────────┤
│ id (PK)      │
│ identifier   │ (email)
│ value        │ (verification code)
│ expiresAt    │
│ createdAt    │
└──────────────┘
```

## Entity Definitions

### 1. user (Better Auth Managed)

**Purpose**: Core user account for authentication

**Schema**:
```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_email ON "user"(email);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique user identifier |
| name | TEXT | nullable | User's display name |
| email | TEXT | UNIQUE, NOT NULL | Email for login |
| emailVerified | BOOLEAN | DEFAULT FALSE | Email verification status |
| image | TEXT | nullable | Profile picture URL |
| createdAt | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last profile update |

**Validation Rules**:
- Email must match regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Name length: 1-100 characters (if provided)
- Email uniqueness enforced at database level

**Lifecycle**:
- **Create**: On signup via Better Auth `/sign-up` endpoint
- **Update**: Via Better Auth profile update endpoints
- **Delete**: Cascade deletes to `user_profile`, `session`, `account`

---

### 2. user_profile (Custom Table)

**Purpose**: Store learner background context for content personalization

**Schema**:
```sql
CREATE TABLE user_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Programming experience levels
  python_experience TEXT CHECK (
    python_experience IN ('beginner', 'intermediate', 'advanced')
  ),
  ros_experience TEXT CHECK (
    ros_experience IN ('none', 'beginner', 'intermediate', 'advanced')
  ),

  -- Hardware access
  has_rtx_gpu BOOLEAN DEFAULT FALSE,
  gpu_model TEXT, -- e.g., "RTX 4090", "RTX 3060 Ti", null
  has_jetson BOOLEAN DEFAULT FALSE,
  jetson_model TEXT, -- e.g., "Orin Nano", "Orin NX", "AGX Orin", null
  robot_type TEXT, -- e.g., "Unitree Go1", "Custom", "None", null

  -- Learning goals (PostgreSQL array type)
  learning_goals TEXT[], -- e.g., ['simulation', 'real-robot', 'ai-research']

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX idx_user_profile_python_exp ON user_profile(python_experience);
CREATE INDEX idx_user_profile_ros_exp ON user_profile(ros_experience);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Profile record ID |
| user_id | TEXT | FK → user.id, UNIQUE | One profile per user |
| python_experience | TEXT | ENUM | Python skill level |
| ros_experience | TEXT | ENUM | ROS 2 skill level |
| has_rtx_gpu | BOOLEAN | DEFAULT FALSE | RTX GPU access |
| gpu_model | TEXT | nullable | Specific GPU model |
| has_jetson | BOOLEAN | DEFAULT FALSE | Jetson device access |
| jetson_model | TEXT | nullable | Specific Jetson model |
| robot_type | TEXT | nullable | Physical robot access |
| learning_goals | TEXT[] | nullable | Array of goal keywords |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last profile update |

**Validation Rules**:
- `python_experience`: Must be one of `{'beginner', 'intermediate', 'advanced'}` or NULL
- `ros_experience`: Must be one of `{'none', 'beginner', 'intermediate', 'advanced'}` or NULL
- `gpu_model`: Max length 100 characters
- `jetson_model`: Max length 100 characters
- `robot_type`: Max length 100 characters
- `learning_goals`: Max 10 elements, each max 50 characters

**Default Values** (on signup if not provided):
```json
{
  "python_experience": "beginner",
  "ros_experience": "none",
  "has_rtx_gpu": false,
  "gpu_model": null,
  "has_jetson": false,
  "jetson_model": null,
  "robot_type": null,
  "learning_goals": []
}
```

**Lifecycle**:
- **Create**: On first signup via FastAPI `/api/profile` (or during signup form submission)
- **Update**: Via FastAPI `PUT /api/profile` endpoint
- **Delete**: Cascade delete when `user` is deleted

---

### 3. session (Better Auth Managed)

**Purpose**: Manage active user sessions for authentication

**Schema**:
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_session_user_id ON session("userId");
CREATE INDEX idx_session_expires ON session("expiresAt");
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Session record ID |
| userId | TEXT | FK → user.id | Session owner |
| token | TEXT | UNIQUE, NOT NULL | Session token (signed) |
| expiresAt | TIMESTAMP | NOT NULL | Session expiration |
| ipAddress | TEXT | nullable | Client IP (audit) |
| userAgent | TEXT | nullable | Client browser (audit) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Session start time |

**Validation Rules**:
- Token must be cryptographically signed (handled by Better Auth)
- `expiresAt` must be future timestamp (7 days from creation by default)
- `ipAddress`: Valid IPv4 or IPv6 format
- `userAgent`: Max length 500 characters

**State Transitions**:
```
[Created] → [Active] → [Expired/Revoked]
```

**Lifecycle**:
- **Create**: On successful login via Better Auth
- **Extend**: Automatically refreshed if accessed within `updateAge` window (1 day)
- **Delete**: On logout, or automatic cleanup after `expiresAt`

**Cleanup Strategy**:
```sql
-- Run daily via cron or Neon scheduled query
DELETE FROM session WHERE "expiresAt" < NOW();
```

---

### 4. account (Better Auth Managed)

**Purpose**: Store authentication provider credentials (email/password)

**Schema**:
```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  password TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("providerId", "accountId")
);

CREATE INDEX idx_account_user_id ON account("userId");
CREATE INDEX idx_account_provider ON account("providerId", "accountId");
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Account record ID |
| userId | TEXT | FK → user.id | Account owner |
| accountId | TEXT | NOT NULL | User's email (for email/password) |
| providerId | TEXT | NOT NULL | Provider name (e.g., "credential") |
| password | TEXT | nullable | Scrypt-hashed password |
| accessToken | TEXT | nullable | OAuth access token (unused for email/password) |
| refreshToken | TEXT | nullable | OAuth refresh token (unused) |
| expiresAt | TIMESTAMP | nullable | Token expiration (unused) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Account creation |

**Password Hashing**:
- Algorithm: **scrypt** (OWASP-recommended, resistant to GPU brute-force)
- Salt: 16 bytes, cryptographically random
- Parameters: N=16384, r=8, p=1 (Better Auth defaults)

**Validation Rules**:
- Password minimum length: 8 characters (enforced by Better Auth)
- Email/password pair uniqueness enforced via `UNIQUE(providerId, accountId)`
- Password field NEVER returned in API responses

---

### 5. verification (Better Auth Managed)

**Purpose**: Manage email verification and password reset tokens

**Schema**:
```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email address
  value TEXT NOT NULL, -- verification code or token
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_identifier ON verification(identifier);
CREATE INDEX idx_verification_expires ON verification("expiresAt");
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Verification record ID |
| identifier | TEXT | NOT NULL | Email being verified |
| value | TEXT | NOT NULL | Verification code (6-digit) or reset token |
| expiresAt | TIMESTAMP | NOT NULL | Token expiration |
| createdAt | TIMESTAMP | DEFAULT NOW() | Token creation |

**Token Types**:
1. **Email Verification**: 6-digit numeric code, 15-minute expiration
2. **Password Reset**: 32-character random token, 1-hour expiration

**Lifecycle**:
- **Create**: On signup (email verification) or forgot password request
- **Validate**: On verification link click or code submission
- **Delete**: After successful verification or expiration

**Cleanup Strategy**:
```sql
-- Run hourly via cron
DELETE FROM verification WHERE "expiresAt" < NOW();
```

---

## Indexes and Performance

### Query Patterns

**Most Frequent Queries** (optimize with indexes):

1. **Session Validation** (every authenticated request):
```sql
SELECT user_id, expires_at
FROM session
WHERE token = $1 AND expires_at > NOW();
```
→ Index: `idx_session_token` (UNIQUE)

2. **Profile Fetch** (personalization):
```sql
SELECT * FROM user_profile WHERE user_id = $1;
```
→ Index: `idx_user_profile_user_id` (UNIQUE)

3. **User Lookup by Email** (login):
```sql
SELECT id, email FROM "user" WHERE email = $1;
```
→ Index: `idx_user_email` (UNIQUE)

### Index Strategy

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| user | idx_user_email | email | B-tree | Login lookup |
| user_profile | idx_user_profile_user_id | user_id | B-tree | Profile fetch |
| user_profile | idx_user_profile_python_exp | python_experience | B-tree | Analytics (optional) |
| user_profile | idx_user_profile_ros_exp | ros_experience | B-tree | Analytics (optional) |
| session | idx_session_token | token | B-tree | Session validation |
| session | idx_session_user_id | userId | B-tree | User session list |
| session | idx_session_expires | expiresAt | B-tree | Cleanup queries |
| account | idx_account_user_id | userId | B-tree | Account lookup |
| account | idx_account_provider | providerId, accountId | B-tree | Provider auth |
| verification | idx_verification_identifier | identifier | B-tree | Verification lookup |
| verification | idx_verification_expires | expiresAt | B-tree | Cleanup queries |

---

## Data Migration

### Initial Schema Setup

**Step 1: Better Auth Auto-Migration**
```bash
# Run Better Auth CLI to create core tables
npx better-auth migrate
```

**Step 2: Create Custom Profile Table**
```sql
-- Run via Neon SQL Editor or migration tool
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
CREATE INDEX idx_user_profile_python_exp ON user_profile(python_experience);
CREATE INDEX idx_user_profile_ros_exp ON user_profile(ros_experience);
```

### Future Migrations

**Versioning Strategy**: Use Neon database branches for testing migrations before applying to production.

**Example: Adding New Field**
```sql
-- Migration: 2026-01-23_add_timezone_to_profile.sql
ALTER TABLE user_profile ADD COLUMN timezone TEXT;
CREATE INDEX idx_user_profile_timezone ON user_profile(timezone);
```

---

## Security Considerations

### Sensitive Data Protection

| Data Type | Storage | Encryption | Access Control |
|-----------|---------|------------|----------------|
| Password | `account.password` | Scrypt hash | Never returned in API |
| Session Token | `session.token` | Signed (HMAC) | Cookie only, HTTP-only |
| Email | `user.email` | Plaintext (indexed) | Authenticated users only |
| Profile Data | `user_profile.*` | Plaintext | Own profile only |

### SQL Injection Prevention

**Always use parameterized queries**:
```python
# ✅ CORRECT
await db.query("SELECT * FROM user_profile WHERE user_id = $1", user_id)

# ❌ NEVER DO THIS
await db.query(f"SELECT * FROM user_profile WHERE user_id = '{user_id}'")
```

### Row-Level Security (Optional)

**Enable RLS for user_profile** (if using Neon's RLS feature):
```sql
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_select_own
  ON user_profile FOR SELECT
  USING (user_id = current_setting('app.user_id')::TEXT);

CREATE POLICY user_profile_update_own
  ON user_profile FOR UPDATE
  USING (user_id = current_setting('app.user_id')::TEXT);
```

---

## Backup and Recovery

### Neon Built-in Features

- **Point-in-Time Recovery (PITR)**: 7-day retention on free tier
- **Database Branching**: Create test environments from production snapshots
- **Automated Backups**: Daily snapshots (configurable)

### Recovery Strategy

**Scenario: Accidental Profile Deletion**
```sql
-- Restore from PITR backup (via Neon console)
-- Or recover from database branch snapshot
```

**Scenario: Data Corruption**
```sql
-- Restore specific table from backup
pg_restore --table=user_profile backup.dump
```

---

## Data Retention Policy

### Session Cleanup

**Automatic Expiration**:
- Sessions expire after 7 days of inactivity
- Expired sessions deleted automatically by Better Auth cleanup job

**Manual Cleanup** (if needed):
```sql
DELETE FROM session WHERE "expiresAt" < NOW() - INTERVAL '30 days';
```

### Verification Token Cleanup

**Automatic Expiration**:
- Email verification: 15 minutes
- Password reset: 1 hour

**Cleanup Job**:
```sql
DELETE FROM verification WHERE "expiresAt" < NOW();
```

### User Data Deletion

**GDPR Compliance**: Users can request account deletion

```sql
-- Cascade deletes user_profile, session, account, verification
DELETE FROM "user" WHERE id = $1;
```

---

**Data Model Version**: 1.0
**Last Updated**: 2026-01-22
**Ready for Implementation**: ✅ Yes
