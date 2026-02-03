-- Better Auth Database Tables Migration
-- Run this in your Neon SQL Editor

-- User table
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    name TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image TEXT
);

-- Session table
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account table (for email/password auth)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification table (for email verification tokens)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account("userId");
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

-- User profile table (custom for personalization)
CREATE TABLE IF NOT EXISTS user_profile (
    user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    python_experience TEXT CHECK (python_experience IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    ros_experience TEXT CHECK (ros_experience IN ('none', 'beginner', 'intermediate', 'advanced')) DEFAULT 'none',
    has_rtx_gpu BOOLEAN NOT NULL DEFAULT FALSE,
    gpu_model TEXT,
    has_jetson BOOLEAN NOT NULL DEFAULT FALSE,
    jetson_model TEXT,
    robot_type TEXT,
    learning_goals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_python_exp ON user_profile(python_experience);
CREATE INDEX IF NOT EXISTS idx_user_profile_ros_exp ON user_profile(ros_experience);

-- Migration: drop old columns if they exist, add new ones
-- Run this if user_profile already existed with the old schema:
-- ALTER TABLE user_profile DROP COLUMN IF EXISTS programming_experience;
-- ALTER TABLE user_profile DROP COLUMN IF EXISTS hardware_access;
-- ALTER TABLE user_profile DROP COLUMN IF EXISTS learning_goal;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS python_experience TEXT CHECK (python_experience IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner';
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS ros_experience TEXT CHECK (ros_experience IN ('none', 'beginner', 'intermediate', 'advanced')) DEFAULT 'none';
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS has_rtx_gpu BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS gpu_model TEXT;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS has_jetson BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS jetson_model TEXT;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS robot_type TEXT;
-- ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS learning_goals TEXT[] DEFAULT '{}';

-- Success message
SELECT 'Better Auth tables created successfully!' AS status;
