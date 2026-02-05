-- Migration: Add language_preference column to user_profile
-- Feature: 006-urdu-translation
-- Idempotent: IF NOT EXISTS / DEFAULT handles existing rows safely.
-- Run via: Neon SQL Editor, or: node scripts/migrate-language-preference.js

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profile' AND column_name = 'language_preference';
