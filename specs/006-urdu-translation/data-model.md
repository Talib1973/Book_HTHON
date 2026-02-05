# Data Model: 006-urdu-translation

**Stage**: Phase 1 Design
**Date**: 2026-02-04
**Branch**: `006-urdu-translation`

---

## Entity 1 — UserLanguagePreference

**What it represents**: The user's chosen reading language. This is NOT a standalone table — it is a single column added to the existing `user_profile` table. Linked 1:1 to the user via `user_id` (foreign key to Better Auth's `users` table, already present).

### Fields

| Field | Type | Default | Constraints | Notes |
|-------|------|---------|-------------|-------|
| `language_preference` | `varchar(2)` | `'en'` | Values: `'en'` or `'ur'` | Added to existing `user_profile` table |

### State Transitions

```
[no row / NULL]  ──(first profile save)──►  'en'  (default)
       'en'      ──(user toggles Urdu)──►   'ur'
       'ur'      ──(user toggles English)──► 'en'
```

### Client-Side Mirror

A copy of `language_preference` is stored in `localStorage` under key `ba_language_pref`. Written on every toggle and on every successful profile fetch. Read as fallback when `/api/profile` is unreachable.

### Migration

```sql
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en';
```

No data loss. Existing rows get `'en'` automatically. No index needed — this field is never queried in a WHERE clause; it is always fetched as part of the full profile row.

---

## Entity 2 — UrduChapterContent

**What it represents**: The pre-translated Urdu version of a single book chapter. These are static files, not database rows. They live in `static/docs-ur/` and are served directly by Vercel as public assets.

### File Structure

Mirrors `docs/` exactly:

```text
static/docs-ur/
├── intro.md
├── module-1-ros2/
│   ├── index.md
│   ├── week-3-ros2-architecture.md
│   ├── week-4-pub-sub.md
│   └── week-5-services-actions.md
├── module-2-digital-twin/
│   └── index.md
├── module-3-isaac/
│   └── index.md
├── module-4-vla/
│   └── index.md
└── capstone/
    └── index.md
```

### File Contract

Each Urdu `.md` file MUST:
- Have identical front matter keys as its English counterpart (title, sidebar_position, keywords, etc.). The `title` value is translated to Urdu. A `language: ur` field is added.
- Preserve all heading levels and heading count from the English original.
- Preserve all code blocks (```` ``` ````) unchanged — fenced blocks are copied verbatim from English.
- Preserve all inline code (`` `code` ``), file paths, URLs, and CLI commands unchanged.
- Preserve all table structures (same column count, same row count).
- Translate only prose text and heading text.

### Validation Rule

An automated check (run during CI or manually before merge) compares each Urdu file against its English counterpart and asserts:
1. Same number of code fences (`` ``` ``).
2. Every code block in English appears verbatim in Urdu.
3. Same number of headings at each level.
4. No English prose paragraphs are left untranslated (heuristic: no paragraph in the Urdu file is identical to the English unless it is a code block or URL).

---

## Entity 3 — ChatLanguageSignal (request-layer only, no storage)

**What it represents**: The language instruction sent with each chat request. Not persisted — derived at request time from the user's current toggle state.

### Shape (added to existing ChatRequest)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `language` | `string` | `'en'` | `'en'` or `'ur'`. Optional — omit for English (backward-compatible). |

### Handling in Backend

When `language === 'ur'`, the FastAPI handler prepends the following to the system prompt before sending to the LLM:

> "Respond in Urdu. If your answer includes code, commands, file paths, or URLs, keep those in English."

No other backend changes. The field is not stored, logged, or used for retrieval.
