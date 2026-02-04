# Research: 006-urdu-translation

**Stage**: Phase 0 — resolves all NEEDS CLARIFICATION items and technology decisions before design.
**Date**: 2026-02-04
**Branch**: `006-urdu-translation`

---

## Decision 1 — Urdu Content Delivery Strategy

**Question**: How do we serve pre-translated Urdu markdown so the toggle can swap content instantly without a full page reload, while keeping Urdu off the initial page bundle?

**Decision**: Store Urdu `.md` source files in `static/docs-ur/` (Docusaurus copies `static/` verbatim to the build output). The `LanguageToggle` component fetches the raw `.md` file on demand via `fetch('/docs-ur/<slug>.md')` and renders it client-side using `react-markdown` (with `rehype-highlight` for code blocks). The file is cached in-memory for the session after the first fetch — no second network round-trip on re-toggle.

**Rationale**:
- Docusaurus i18n plugin (`i18n` config) creates a full duplicate site at a locale-prefixed URL (e.g., `/ur/docs/intro`). That forces a page navigation, violating SC-002 (switch in < 1 s, no reload). Eliminated.
- Bundling both English and Urdu into every page at build time doubles page weight. Violates SC-004 (< 100 ms load increase). Eliminated.
- `react-markdown` is the standard lightweight runtime renderer for fetched markdown in React apps. It integrates with the existing `prism-react-renderer` (already in `package.json`) for syntax highlighting. No new heavyweight dependency.
- Placing files in `static/docs-ur/` means Vercel serves them as plain static assets with no serverless function invocation — zero latency overhead.

**Alternatives considered**:
- Docusaurus i18n plugin: rejected (forces page navigation).
- Pre-rendering Urdu to HTML fragments at build time via a custom plugin: viable but adds build complexity and a custom plugin to maintain. `react-markdown` is simpler and well-tested.
- Loading both languages into a single page bundle: rejected (violates SC-004).

---

## Decision 2 — RTL Scope and Font Loading

**Question**: Do we flip the entire page to RTL when Urdu is active, or scope it?

**Decision**: RTL is scoped to the chapter content container only. When Urdu is active, the toggle sets `dir="rtl"` and `lang="ur"` on a wrapper `<div>` that contains the rendered content. Code blocks inside that wrapper explicitly get `dir="ltr"`. The Noto Nastaliq font (Google Fonts) is lazy-loaded via a `<link>` tag injected into `<head>` only on first Urdu toggle — not on initial page load.

**Rationale**:
- The Docusaurus layout chrome (navbar, sidebar navigation structure, pagination controls) is built with LTR assumptions. Flipping the whole page breaks sidebar positioning and nav links. Scoping to content is the established pattern used by multilingual doc sites (e.g., MDN).
- Sidebar *text labels* (chapter titles) do flip to Urdu when the user's preference is Urdu, but the sidebar *layout* (indentation, arrow icons) stays LTR.
- Lazy font loading avoids a render-blocking resource on pages where Urdu is never activated. Font is ~200 KB; loading it only on demand keeps SC-004 intact.

**Alternatives considered**:
- Full-page RTL via Docusaurus i18n: rejected (same reason as Decision 1 — forces page reload).
- Bundling Noto Nastaliq in the static build: increases baseline payload for all users. Rejected.

---

## Decision 3 — Language Preference Persistence

**Question**: Where and how is the user's language choice persisted?

**Decision**: Add a `language_preference` column (`varchar(2)`, default `'en'`) to the existing `user_profile` table in Neon Postgres. Extend the existing `GET /api/profile` and `POST /api/profile` serverless endpoints (in `api/profile.js`) to include this field. On the client, mirror the value to `localStorage` key `ba_language_pref` immediately on every toggle. On page load, read from the server first; fall back to `localStorage` if the profile fetch fails or the user is offline.

**Rationale**:
- The `user_profile` table and the `api/profile.js` CRUD endpoints already exist. Adding one column and one field to the existing payload is the smallest viable change — no new table, no new endpoint.
- `localStorage` fallback is required by FR-004 (offline resilience) and is the same pattern already used for the profile cache (`ba_profile_cache`).
- The constitution (Principle V) requires minimal data collection. A 2-byte language code is the smallest possible addition.

**Alternatives considered**:
- Dedicated `/api/language-preference` endpoint: adds a new serverless function, a new route, and duplicates session-validation logic. Rejected.
- Storing preference only in `localStorage`: fails SC-003 (cross-device persistence). Rejected.
- Storing in Better Auth session directly: Better Auth session schema is managed by the library; modifying it risks breaking session handling. Rejected.

---

## Decision 4 — RAG Chatbot Language Signal

**Question**: How does the chatbot know to respond in Urdu without re-embedding vectors?

**Decision**: The `ChatWidget` component reads the current language state (from the same context/store the toggle writes to) and appends a `language` field (`"en"` | `"ur"`) to the existing `POST /api/chat` request body. The FastAPI handler reads this field and, when `"ur"`, prepends a system-level instruction to the LLM prompt: *"Respond in Urdu. Keep any code, commands, file paths, and URLs in English."* The vector retrieval (Qdrant) and embedding steps are completely unchanged.

**Rationale**:
- The spec explicitly states: "Translation support must not require re-embedding vectors. Language handling occurs at the response layer only." This is the only approach that satisfies that constraint.
- LLMs (the Cohere model already in use) handle instruction-following for language switching reliably. A single system instruction is sufficient.
- No changes to `ChatRequest` schema beyond one optional field. Backward-compatible — if `language` is omitted, defaults to `"en"`.

**Alternatives considered**:
- Dual vector index (English + Urdu): doubles storage, requires re-embedding. Explicitly excluded by non-goals.
- Post-processing translation of the LLM response: adds a second API call (translation service) and latency. Rejected.
- Separate Urdu system prompt file: over-engineered for a single instruction. Rejected.

---

## Decision 5 — Mapping Chapter Slugs to Urdu File Paths

**Question**: How does the toggle component know which Urdu file to fetch for the current chapter?

**Decision**: A static mapping object in the `LanguageToggle` component maps each Docusaurus page path to its corresponding Urdu file in `static/docs-ur/`. The mapping is derived at build time from the `docs-ur/` directory structure, which mirrors `docs/` exactly. If a slug has no mapping (chapter not yet translated), the toggle is hidden for that page (FR-009).

| Page path | Urdu file |
|-----------|-----------|
| `/docs/intro` | `/docs-ur/intro.md` |
| `/docs/module-1-ros2` | `/docs-ur/module-1-ros2/index.md` |
| `/docs/module-1-ros2/week-3-ros2-architecture` | `/docs-ur/module-1-ros2/week-3-ros2-architecture.md` |
| `/docs/module-1-ros2/week-4-pub-sub` | `/docs-ur/module-1-ros2/week-4-pub-sub.md` |
| `/docs/module-1-ros2/week-5-services-actions` | `/docs-ur/module-1-ros2/week-5-services-actions.md` |
| `/docs/module-2-digital-twin` | `/docs-ur/module-2-digital-twin/index.md` |
| `/docs/module-3-isaac` | `/docs-ur/module-3-isaac/index.md` |
| `/docs/module-4-vla` | `/docs-ur/module-4-vla/index.md` |
| `/docs/capstone` | `/docs-ur/capstone/index.md` |

**Rationale**:
- Keeps the toggle component simple — no filesystem scanning at runtime.
- The mapping is small (9 entries) and changes only when new chapters are added.
- Failing to find a mapping = toggle hidden. Defensive by default.

**Alternatives considered**:
- Dynamic discovery via a manifest file generated at build time: adds a build step and a manifest dependency. Over-engineered for 9 files.
- Convention-based path derivation (replace `/docs/` with `/docs-ur/`): fragile when index pages have different URL patterns vs file names. The explicit map is safer.
