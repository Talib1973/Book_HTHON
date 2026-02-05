# Quickstart: 006-urdu-translation

**Purpose**: Everything a developer needs to start working on this feature from a cold checkout. No prior context assumed.

---

## 1. Prerequisites

- Node.js >= 20 (matches `engines` in `package.json`)
- Access to the Neon Postgres database (connection string in `.env` as `DATABASE_URL`)
- Vercel CLI logged in (for deploying auth-service and main site)
- The `006-urdu-translation` branch checked out

## 2. Repo Layout for This Feature

```text
docs/                          # English source (READ-ONLY for this feature)
static/docs-ur/                # Urdu markdown source files (NEW — created by this feature)
src/components/
  LanguageToggle/              # NEW: auth-gated toggle component
    index.tsx
    styles.module.css
  ChatWidget/index.tsx         # MODIFIED: sends `language` field
api/profile.js                 # MODIFIED: includes language_preference
backend/api.py                 # MODIFIED: reads `language` from chat request
src/css/custom.css             # MODIFIED: RTL + Urdu font styles
specs/006-urdu-translation/    # This feature's spec, plan, contracts
```

## 3. Local Setup

```bash
# 1. Install deps (if not already)
npm install

# 2. Start Docusaurus dev server
npm start
# Site runs at http://localhost:3000

# 3. The dev server serves static/ automatically.
#    Once Urdu files exist in static/docs-ur/, they are accessible at:
#    http://localhost:3000/docs-ur/intro.md   (raw markdown)
```

## 4. Database Migration

Run this migration against the Neon database. It is idempotent (IF NOT EXISTS / DEFAULT handles existing rows):

```sql
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en';
```

Run via the same Node pg script pattern used for previous migrations (see `auth-service/migration.sql` for the runner pattern), or via the Neon web console.

## 5. Developing the LanguageToggle Component

1. Create `src/components/LanguageToggle/index.tsx`.
2. It uses `useSession()` from `src/lib/auth-client.ts` to gate visibility.
3. It reads language preference from `GET /api/profile` on mount (or from `localStorage` key `ba_language_pref` as fallback).
4. On toggle, it:
   - Fetches the Urdu `.md` from `/docs-ur/<mapped-path>` (see `research.md` Decision 5 for the slug map).
   - Renders it via `react-markdown`.
   - Wraps the output in a `div` with `dir="rtl" lang="ur"`.
   - Saves the new preference via `POST /api/profile` and to `localStorage`.
5. On revert to English, it re-renders the original Docusaurus-rendered content (stored in a ref on first toggle).

## 6. Adding a New Urdu Translation

1. Copy the English source from `docs/<path>.md` to `static/docs-ur/<path>.md`.
2. Translate all prose and headings to Urdu.
3. Leave ALL code blocks, inline code, file paths, URLs, CLI commands untouched.
4. Update `title` in front matter to the Urdu translation. Add `language: ur`.
5. Run the validation check (see `data-model.md` — Validation Rule) to confirm structural parity.
6. The chapter's toggle will automatically become visible (the slug map in LanguageToggle includes it).

## 7. Testing Locally

| What to test | How |
|---|---|
| Toggle visibility (auth gate) | Open a chapter while logged out — toggle must be absent. Log in — toggle appears. |
| Urdu content swap | Toggle to اردو — prose changes, code blocks stay English, text is RTL. |
| Preference persistence | Toggle to اردو — refresh page — اردو should auto-load. |
| Offline fallback | Toggle to اردو — clear network in DevTools — refresh — اردو loads from localStorage pref. |
| Chatbot language | Toggle to اردو — open ChatWidget — ask a question — response should be in Urdu. |

## 8. Deploying

- `api/profile.js` and `static/docs-ur/` are part of the main Vercel project. `npx vercel --prod` from repo root deploys both.
- `backend/api.py` (FastAPI) is deployed separately (Railway or equivalent). Redeploy after modifying the chat endpoint.
- No changes to auth-service required.
