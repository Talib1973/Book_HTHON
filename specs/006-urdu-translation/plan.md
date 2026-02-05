# Implementation Plan: Urdu Translation with Auth-Gated Toggle

**Branch**: `006-urdu-translation` | **Date**: 2026-02-04 | **Spec**: `spec.md`
**Input**: Feature specification from `specs/006-urdu-translation/spec.md`

---

## Summary

Add pre-translated Urdu content for all 9 existing chapters, surfaced via an auth-gated toggle at the top of each doc page. The toggle fetches Urdu markdown on demand, renders it client-side with RTL layout and Noto Nastaliq font, and persists the user's language choice to their existing profile in Neon Postgres (with a `localStorage` fallback). The RAG chatbot receives a language signal at the request layer and instructs the LLM to respond in Urdu when active. No new backend services, no new database tables, no re-embedding of vectors.

---

## Technical Context

**Language/Version**: TypeScript / Node.js >= 20 (frontend + serverless); Python 3.11+ (FastAPI backend)
**Primary Dependencies**: Docusaurus 3.9.2, React 19, better-auth 1.4.17, pg 8.x, react-markdown (NEW), Cohere SDK (existing, backend)
**Storage**: Neon Serverless PostgreSQL (`user_profile` table — one column added); static files in `static/docs-ur/`
**Testing**: Manual browser testing (auth-gated flows); automated structural validation script for Urdu file parity
**Target Platform**: Vercel (main site + auth-service); Railway or equivalent (FastAPI backend)
**Performance Goals**: Urdu toggle switch < 1 s; initial page load increase < 100 ms (Urdu lazy-loaded)
**Constraints**: No runtime machine translation; no vector re-embedding; no changes to auth provider; English is always default
**Scale/Scope**: 9 chapter files; 1 new React component; 1 column migration; 2 endpoint field extensions

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Verdict | Notes |
|-----------|---------|-------|
| I — Technical Accuracy | PASS | Translations must preserve technical terms verbatim (enforced by validation rule in data-model.md). Code blocks untouched. |
| II — Modular Content | PASS | `static/docs-ur/` mirrors `docs/` module structure exactly. Each Urdu file is independently fetchable. |
| III — Accessibility & Inclusive Design | PASS | This feature directly implements the constitution's explicit Urdu toggle requirement. RTL, ARIA, font-size constraints all addressed in spec FR-010. |
| IV — Deployment-First | PASS | All changes ship as static files + serverless function edits. Vercel preview deploys on every push. |
| V — Privacy-Respecting Personalization | PASS | One 2-byte field (`language_preference`) added to existing profile. Minimal, purposeful, no third-party sharing. |
| VI — Semantic Content for RAG | PASS | Urdu files preserve heading structure and keywords. English vectors remain the retrieval source; Urdu is response-layer only. |
| VII — Iterative Delivery | PASS | Work streams are independently shippable (see Task Sequencing). |

**Complexity note**: Constitution Principle III originally stated language preference is "stored client-side, no backend dependency initially." This plan upgrades to server-side persistence (Neon Postgres) with localStorage as offline fallback. This is the planned evolution indicated by the word "initially" in the constitution. The added server-side column enables cross-device persistence (SC-003). No amendment required — this is within the scope of the original intent.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-urdu-translation/
├── spec.md                              # Feature specification
├── plan.md                              # This file
├── research.md                          # Phase 0: 5 architecture decisions
├── data-model.md                        # Phase 1: entities, migrations, validation
├── quickstart.md                        # Phase 1: developer onboarding guide
├── contracts/
│   ├── profile-language-preference.yaml # OpenAPI: profile API extension
│   └── chat-language-signal.yaml        # OpenAPI: chat API extension
├── checklists/
│   └── requirements.md                  # Spec quality checklist (from /sp.specify)
└── tasks.md                             # Phase 2 output (created by /sp.tasks — not yet)
```

### Source Code (repository root)

```text
static/
└── docs-ur/                             # NEW: Urdu markdown source (9 files)
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

src/components/
├── LanguageToggle/                      # NEW: auth-gated toggle + Urdu renderer
│   ├── index.tsx
│   └── styles.module.css
├── ChatWidget/index.tsx                 # MODIFIED: appends `language` to chat request
├── AuthNav/index.tsx                    # UNMODIFIED
└── PersonalizeButton.tsx                # UNMODIFIED

src/theme/DocItem/Layout/index.tsx       # MODIFIED: mounts LanguageToggle alongside PersonalizeButton

api/profile.js                           # MODIFIED: language_preference in GET/POST
backend/api.py                           # MODIFIED: reads `language` from ChatRequest
src/css/custom.css                       # MODIFIED: RTL container styles + Urdu font
package.json                             # MODIFIED: adds react-markdown dependency
```

---

## 1. Phase Breakdown

### Phase A — Content Translation
Translate all 9 English chapters to Urdu. This is the largest block of work by volume but has zero code dependencies — can start on day one in parallel with all code work.

### Phase B — Database Migration
Single `ALTER TABLE` to add `language_preference` column. Runs once against Neon.

### Phase C — Backend Extensions
- `api/profile.js`: include `language_preference` in SELECT and INSERT/UPDATE queries and JSON payloads.
- `backend/api.py`: add `language` field to `ChatRequest`; prepend Urdu system instruction when `language === 'ur'`.

### Phase D — Frontend: LanguageToggle Component
The core UI piece. Auth-gated, fetches Urdu content on demand, renders with `react-markdown`, manages RTL wrapper and font.

### Phase E — Frontend: RTL Styles & Font
CSS for the RTL content container. Lazy font loader for Noto Nastaliq. Code-block LTR override.

### Phase F — Frontend: DocItem Layout Integration
Mount `LanguageToggle` in the swizzled `DocItem/Layout` so it appears on every doc page.

### Phase G — ChatWidget Integration
Read current language state in `ChatWidget` and send it with the chat request.

### Phase H — Testing & Validation
Structural parity check script, manual auth-gate testing, cross-browser RTL, chatbot language verification.

### Phase I — Deployment & Rollout
Deploy to Vercel preview, verify, merge to master, production deploy.

---

## 2. Task Sequencing & Dependencies

```
Phase A (Translation)  ─────────────────────────────────┐
                                                         ▼
Phase B (DB Migration) ──► Phase C (Backend) ──► Phase D (Toggle) ──► Phase F (Layout mount)
                                                         ▲                      │
Phase E (RTL + Font)   ──────────────────────────────────┘                      ▼
                                                                         Phase G (ChatWidget)
                                                                                 │
                                                                                 ▼
                                                                         Phase H (Testing)
                                                                                 │
                                                                                 ▼
                                                                         Phase I (Deploy)
```

**Parallelizable streams**:
- Phase A (translation) runs entirely in parallel with Phases B–E. No code dependency.
- Phase B (migration) and Phase E (CSS/font) are independent of each other.
- Phase C (backend) can start as soon as Phase B is done — does not wait for frontend.

**Critical path**: B → C → D → F → G → H → I. Phase D (LanguageToggle) is the single largest task and gates everything downstream.

**Phase A must complete before Phase H** (testing needs actual Urdu content).

---

## 3. Frontend Plan

### 3.1 LanguageToggle Component (`src/components/LanguageToggle/index.tsx`)

1. Import `useSession` from `src/lib/auth-client.ts`. If no session, return `null` (toggle not rendered).
2. On mount, fetch language preference: try `GET /api/profile` → read `language_preference`. On failure, read `localStorage` key `ba_language_pref`. Default to `'en'`.
3. Maintain a static slug map (9 entries, see `research.md` Decision 5). If the current page path has no entry, return `null` (FR-009).
4. Render a two-state toggle button: "اردو" | "English". Use `aria-pressed`, `aria-label` for accessibility.
5. On toggle to `'ur'`:
   - If not already cached in a module-level `Map<slug, string>`, `fetch('/docs-ur/<path>.md')` → store raw text in the cache.
   - Render the cached markdown via `react-markdown` with `rehype-highlight` (reuses existing prism config).
   - Wrap output in `<div dir="rtl" lang="ur" className={styles.urduContent}>`.
   - On fetch failure, fall back to English and show a non-blocking toast/notice.
   - Save `'ur'` to `localStorage` (`ba_language_pref`) and `POST /api/profile` (best-effort, non-blocking).
6. On toggle to `'en'`:
   - Restore the original Docusaurus-rendered content (saved in a React ref on first Urdu toggle).
   - Save `'en'` to `localStorage` and `POST /api/profile`.
7. On initial page load with persisted preference `'ur'`, auto-trigger the Urdu fetch + render before the user sees English.

### 3.2 RTL Layout & Font (`src/css/custom.css`)

```css
/* Urdu content container — RTL scoped */
.urduContent {
  direction: rtl;
  text-align: right;
  font-family: 'Noto Nastaliq', 'Urdu Typeface', serif;
  font-size: 1.1rem;          /* Nastaliq needs slightly larger size for readability */
  line-height: 1.7;
}

/* Code blocks inside Urdu stay LTR */
.urduContent pre,
.urduContent code {
  direction: ltr;
  text-align: left;
  font-family: var(--ifm-font-family-monospace);
}

/* Tables in RTL */
.urduContent table {
  direction: rtl;
}
```

### 3.3 Font Loading

Inject a `<link>` tag for Google Fonts (`Noto Nastaliq`) into `<head>` only when Urdu is first activated. Use `document.createElement('link')` + `document.head.appendChild(...)`. Set `font-display: swap` to avoid FOUT blocking.

### 3.4 Auth State Detection

Reuse the existing `useSession()` hook from `src/lib/auth-client.ts`. The pattern is identical to `PersonalizeButton.tsx` — wrap in `BrowserOnly` for SSR safety.

---

## 4. Backend Plan

### 4.1 Database Migration

```sql
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en';
```

Run via Node pg script (same pattern as previous migrations). Idempotent — safe to re-run.

### 4.2 `api/profile.js` Changes

**GET handler** — add `language_preference` to the SELECT column list and include it in the JSON response object. No other logic change.

**POST handler** — add `language_preference` to the INSERT/ON CONFLICT UPDATE column list and parameter array. If the field is absent from the request body, default to the existing value (do not overwrite with NULL).

### 4.3 `backend/api.py` Changes

**ChatRequest model** — add an optional `language` field with default `'en'`:
```python
language: str = "en"  # "en" or "ur"
```

**Chat endpoint logic** — after assembling the system prompt, if `request.language == "ur"`, prepend:
> "Respond in Urdu. If your answer includes code snippets, commands, file paths, or URLs, keep those in English."

No changes to Qdrant retrieval, embedding, or citation extraction.

---

## 5. Content Workflow Plan

### 5.1 Translation Process

For each of the 9 chapters:
1. Read the English source from `docs/`.
2. Identify all translatable segments: prose paragraphs, heading text, table cell text, list item text.
3. Identify all non-translatable segments: code fences, inline code, file paths, URLs, CLI commands, front matter keys (except `title`).
4. Translate prose and headings to Urdu. Add `language: ur` to front matter.
5. Write the result to `static/docs-ur/` preserving the exact path structure.

### 5.2 Technical Terminology Consistency

Maintain a shared glossary across all 9 files. Key terms that should remain in English (not translated): ROS 2, Gazebo, URDF, Xacro, Isaac Sim, Omniverse, VLA, CLIP, ViT, publisher, subscriber, node, topic, service, action, Jetson, RTX, GPU. These are industry-standard identifiers used verbatim in the robotics community. Surround them in backticks in the Urdu text to visually distinguish them as technical terms.

### 5.3 Review & QA

After each file is translated, run the structural validation check (described in `data-model.md`):
- Same code-fence count as English original.
- All code blocks identical.
- Same heading-level distribution.
- No untranslated prose paragraphs (heuristic diff).

A second human review pass confirms natural Urdu flow and technical accuracy before the file is committed.

---

## 6. RAG Chatbot Alignment Plan

### 6.1 Language Selection Logic

The `ChatWidget` component reads the current language state from the same source the `LanguageToggle` writes to. Implementation options (pick one during coding):
- A React Context that both components share (cleanest if both are mounted in the same tree).
- A simple module-level export (`getCurrentLanguage()`) in a shared `languageState.ts` file.

### 6.2 Response-Layer Handling

When `language === 'ur'` is sent in the request:
1. Qdrant retrieval runs as normal — English chunks are retrieved.
2. Citations are extracted from the English chunks — they stay in English in the response.
3. The system prompt is augmented with the Urdu instruction before the LLM call.
4. The LLM generates its answer in Urdu, referencing the English retrieved context.
5. The response is returned to the client unchanged — no post-processing.

### 6.3 Fallback Behaviour

- If the LLM fails to respond in Urdu (unlikely but possible): the response arrives in English. The client displays it as-is. No error is raised.
- If `language` is omitted from the request: defaults to `'en'`. Fully backward-compatible.

---

## 7. Testing Strategy

### 7.1 Structural Validation (automated)

A Node.js script (`scripts/validate-urdu-translations.js`) compares each file in `static/docs-ur/` against its English counterpart in `docs/`:
- Assert equal code-fence count.
- Assert all English code blocks appear verbatim.
- Assert equal heading count per level (h1, h2, h3, h4).
- Warn on any prose paragraph that is byte-identical to English (likely untranslated).

Run in CI on every push to `006-urdu-translation`.

### 7.2 Auth-Gate Testing

- **Logged out**: visit each chapter → toggle must be absent from DOM.
- **Logged in**: visit each chapter → toggle must be present.
- **Session expires mid-session**: toggle should disappear on next render cycle.

### 7.3 Toggle Functional Testing

- Toggle to Urdu → verify prose is Urdu, code blocks are English, layout is RTL.
- Toggle back to English → verify original content restored exactly.
- Refresh with Urdu preference saved → verify Urdu loads automatically.
- Clear `localStorage` while DB still has `'ur'` → verify preference is fetched from server.

### 7.4 RTL Rendering Verification

- Desktop (1280 px) and mobile (375 px) viewports.
- Verify: headings right-aligned, paragraphs right-aligned, code blocks left-aligned, tables right-aligned, sidebar links readable.
- Test in Chrome and Firefox (minimum cross-browser bar).

### 7.5 Chatbot Language Test

- Set language to Urdu → open chatbot → ask 3 questions covering different chapters → verify all responses are in Urdu.
- Verify code snippets in chatbot responses remain in English.
- Set language back to English → ask the same questions → verify English responses.

---

## 8. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | RTL layout breaks sidebar or pagination in unexpected ways | Medium | High | Scope RTL to content container only (Decision 2). Test on both viewports before merge. |
| 2 | Urdu translation quality is inconsistent across chapters | Medium | Medium | Shared glossary (§5.2). Structural validation script catches structural drift. Human review pass before commit. |
| 3 | `react-markdown` rendering diverges from Docusaurus's native rendering (e.g., different heading IDs, missing table styles) | Medium | Medium | Style the `urduContent` container to inherit Docusaurus theme CSS. Test tables and headings explicitly. |
| 4 | Noto Nastaliq font fails to load (Google Fonts blocked, slow network) | Low | Medium | CSS `font-family` stack falls back to system Urdu font. Text remains readable. |
| 5 | Cold-start latency on `api/profile.js` delays language preference read | Low | Low | `localStorage` fallback fires immediately; server value reconciles on next successful fetch. |
| 6 | SEO: search engines index the raw Urdu `.md` files in `static/docs-ur/` | Low | Low | These are plain `.md` files, not HTML pages. Search engines typically do not index non-HTML static assets served without a dedicated route. If needed, add a `robots.txt` rule to exclude `/docs-ur/`. |

---

## 9. Rollout Strategy

1. **Feature branch work**: all development on `006-urdu-translation`. Vercel auto-generates a preview URL for the branch.
2. **Incremental merge readiness**: the feature is testable as soon as Phase D (LanguageToggle) + at least 1 Urdu file are complete. No need to wait for all 9 translations.
3. **Merge to master**: once all 9 translations pass validation and all testing in §7 is green.
4. **Production deploy**: `npx vercel --prod` from repo root. FastAPI redeploy for the chatbot change.
5. **Monitoring**: after deploy, spot-check the toggle on 2–3 chapters. Verify chatbot. No rollback mechanism is needed beyond reverting the merge commit — the feature is purely additive (new files + one DB column with a safe default).

---

## 10. Definition of Done

A chapter is "done" when:
- [ ] Urdu `.md` file exists in `static/docs-ur/` at the correct path.
- [ ] Structural validation script passes for that file.
- [ ] Human review confirms translation quality and glossary compliance.
- [ ] Toggle appears for that chapter when logged in, is absent when logged out.
- [ ] Toggling to Urdu renders prose in Urdu, RTL, Noto Nastaliq. Code blocks stay English LTR.
- [ ] Toggling back to English restores the original content exactly.

The feature is "done" when:
- [ ] All 9 chapters are individually done (above).
- [ ] Language preference persists across sign-out / sign-in (tested on 2 devices).
- [ ] Chatbot responds in Urdu when Urdu is active; English when English is active.
- [ ] Initial page load increase is < 100 ms (measured via Lighthouse or browser DevTools).
- [ ] Deployed to production on Vercel and verified live.
- [ ] No regressions in existing personalization, auth, or chatbot features.
