# Tasks: Urdu Translation with Auth-Gated Toggle

**Input**: Design documents from `specs/006-urdu-translation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — no test-file tasks generated. Verification steps are included in the Polish phase.

**Organization**: Tasks grouped by user story. Each story is independently implementable and testable as a vertical slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency, scaffold directories and the shared language-state module that both the toggle and the chatbot will use.

- [X] T001 Install react-markdown and rehype-highlight packages — run `npm install react-markdown rehype-highlight` in repo root and commit the updated `package.json` and `package-lock.json`
- [X] T002 [P] Create the Urdu static-content directory tree — create `static/docs-ur/intro.md`, `static/docs-ur/module-1-ros2/`, `static/docs-ur/module-2-digital-twin/`, `static/docs-ur/module-3-isaac/`, `static/docs-ur/module-4-vla/`, `static/docs-ur/capstone/` with `.gitkeep` files so the structure is tracked by git
- [X] T003 [P] Create the LanguageToggle component directory — create `src/components/LanguageToggle/index.tsx` (empty stub) and `src/components/LanguageToggle/styles.module.css` (empty stub)
- [X] T004 [P] Create the shared language-state module at `src/lib/languageState.ts` — export a module-level `let currentLanguage = 'en'`, a `getCurrentLanguage(): string` getter, a `setLanguage(lang: string): void` setter that also notifies subscribers, and a `subscribe(fn): () => void` function so ChatWidget can react to changes without prop-drilling

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The DB column and the translation glossary must exist before any user-story work begins.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [X] T005 Run the language-preference migration against Neon Postgres — execute `ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en';` using the same Node pg runner pattern from previous migrations (see `auth-service/migration.sql` for the pattern). Verify the column exists with a `SELECT column_name FROM information_schema.columns WHERE table_name='user_profile'` query.
- [X] T006 Create `specs/006-urdu-translation/glossary.md` — list all technical terms that MUST stay in English across every Urdu translation: ROS 2, node, topic, publisher, subscriber, service, action, Gazebo, URDF, Xacro, Isaac Sim, Omniverse, Isaac Gym, VLA, RT-1, RT-2, PaLM-E, CLIP, ViT, Jetson, RTX, GPU, Colab, URDF. Each term gets a one-line note on how to handle it (e.g., "keep in backticks, do not translate").

**Checkpoint**: DB column deployed. Glossary created. User-story implementation can now begin.

---

## Phase 3: User Story 1 — Logged-In Reader Switches a Chapter to Urdu (Priority: P1) 🎯 MVP

**Goal**: A signed-in user can toggle any chapter between English and Urdu instantly. Code blocks stay in English. Layout flips to RTL. This is the minimum shippable increment.

**Independent Test**: Sign in → navigate to the Intro page → click اردو → verify Urdu prose, English code blocks, RTL layout → click English → verify original content restored.

### Implementation for User Story 1

- [X] T007 [P] [US1] Translate `docs/intro.md` to Urdu and write to `static/docs-ur/intro.md` — translate all prose and headings following `glossary.md` (T006). Keep all code fences, inline code, file paths, URLs verbatim. Set front-matter `title` to the Urdu translation and add `language: ur`. This is the first Urdu file and the one US1 will be tested against.
- [X] T008 [P] [US1] Update the GET handler in `api/profile.js` — add `language_preference` to the `SELECT` column list in the query and include it in the JSON response object returned to the client. No other logic changes.
- [X] T009 [US1] Implement the core LanguageToggle component in `src/components/LanguageToggle/index.tsx` — (1) import and call `useSession()` from `src/lib/auth-client`; return null while pending or if no `session.user`; (2) define the 9-entry slug map (page-path → Urdu file path, per `research.md` Decision 5); return null if current `useLocation().pathname` has no map entry; (3) on mount, fetch language preference from `GET /api/profile` and call `setLanguage()` from `src/lib/languageState.ts`; (4) render a two-button toggle "اردو" | "English" with the active button highlighted; (5) on اردو click: `fetch('/docs-ur/<mapped-path>')`, render the response body via `react-markdown` inside a `<div dir="rtl" lang="ur" className={styles.urduContent}>`, and save a ref to the original Docusaurus-rendered `.docItemContent` DOM for later revert; (6) on English click: restore the original content from the ref. Add `aria-pressed` and appropriate `aria-label` to the toggle buttons.
- [X] T010 [US1] Style the toggle button in `src/components/LanguageToggle/styles.module.css` — two-state pill button (اردو | English). Active state uses the site's primary green (`#2e8555`). Inactive state is muted. Match the visual weight of the existing PersonalizeButton. Ensure minimum touch target of 44 × 44 px.
- [X] T011 [US1] Add RTL container and code-block override styles to `src/css/custom.css` — `.urduContent { direction: rtl; text-align: right; font-family: 'Noto Nastaliq', serif; font-size: 1.1rem; line-height: 1.7; }` and `.urduContent pre, .urduContent code { direction: ltr; text-align: left; font-family: var(--ifm-font-family-monospace); }` and `.urduContent table { direction: rtl; }`.
- [X] T012 [US1] Add Noto Nastaliq lazy font loader inside `src/components/LanguageToggle/index.tsx` — on first اردو toggle (and only then), check if a `<link>` for Google Fonts Noto Nastaliq already exists in `<head>`; if not, create one (`href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq:wght@400;600&display=swap"`) and append to `document.head`. This keeps the font off the critical path for users who never toggle.
- [X] T013 [US1] Mount LanguageToggle in the swizzled layout at `src/theme/DocItem/Layout/index.tsx` — import LanguageToggle, wrap it in `BrowserOnly` (same pattern as PersonalizeButton), and render it at the top of the content area, above `{props.children}`.

**Checkpoint**: US1 is shippable. Sign in, visit Intro, toggle works end-to-end.

---

## Phase 4: User Story 2 — Anonymous User Sees No Toggle (Priority: P2)

**Goal**: Confirm that the toggle is completely absent from the DOM for logged-out visitors. No additional implementation files — this phase reviews and hardens the auth-gate code paths already established in Phase 3.

**Independent Test**: Open any chapter in an incognito window. Inspect the DOM. No toggle markup should be present at any point during page lifecycle.

### Implementation for User Story 2

- [X] T014 [US2] Audit and harden auth-gate paths in `src/components/LanguageToggle/index.tsx` — confirm three guard conditions all return `null` before any markup is rendered: (1) `isPending === true` (session still loading), (2) `session?.user` is falsy (not signed in), (3) current page path is not in the slug map (chapter has no Urdu translation). Also confirm the mount in `src/theme/DocItem/Layout/index.tsx` (T013) is wrapped in `BrowserOnly` so that zero toggle markup is emitted during server-side rendering. If any guard is missing, add it.

**Checkpoint**: US1 + US2 are complete. The toggle is visible only to signed-in users on translated chapters.

---

## Phase 5: User Story 3 — Language Preference Survives Logout and Re-Login (Priority: P3)

**Goal**: The user's language choice is saved server-side and restored automatically on any future visit — even after logout, on a different device.

**Independent Test**: Sign in → toggle to اردو → sign out → sign back in → visit a chapter → اردو loads automatically without re-toggling.

### Implementation for User Story 3

- [X] T015 [US3] Update the POST handler in `api/profile.js` — add `language_preference` to the INSERT column list and the ON CONFLICT DO UPDATE SET clause, using the value from `req.body.language_preference`. If the field is `undefined` in the request body, do NOT include it in the UPDATE clause (preserve the existing value). Add it to the parameterized query array in the correct position.
- [X] T016 [US3] Add localStorage write in `src/components/LanguageToggle/index.tsx` — immediately on every toggle (before the server POST completes), write the new language value to `localStorage.setItem('ba_language_pref', lang)`. Also call `setLanguage(lang)` on the shared state module so ChatWidget reacts instantly.
- [X] T017 [US3] Add localStorage read fallback in `src/components/LanguageToggle/index.tsx` — in the mount effect, after the `GET /api/profile` call: if the call fails (network error or non-200), read `localStorage.getItem('ba_language_pref')` and use that as the initial language. If both sources are absent, default to `'en'`.
- [X] T018 [US3] Implement auto-apply on page load in `src/components/LanguageToggle/index.tsx` — after resolving the language preference (from server or localStorage fallback), if the value is `'ur'`, automatically trigger the same Urdu fetch + render flow as a manual اردو toggle. The toggle button should reflect the active state. This runs once on mount; subsequent page navigations within the SPA also trigger it via a `useEffect` watching the pathname.

**Checkpoint**: US1 + US2 + US3 complete. Preference persists across sessions.

---

## Phase 6: User Story 4 — RAG Chatbot Responds in Urdu When Urdu Mode Is Active (Priority: P4)

**Goal**: When the reader has Urdu active, the embedded chatbot answers in Urdu. Code in answers stays in English. No vector re-embedding.

**Independent Test**: Toggle to اردو → open ChatWidget → ask "What is a ROS 2 publisher?" → response is in Urdu with any code/commands in English. Toggle back to English → ask the same question → response is in English.

### Implementation for User Story 4

- [X] T019 [P] [US4] Update `src/components/ChatWidget/index.tsx` — import `getCurrentLanguage` from `src/lib/languageState.ts`; in the function that builds the POST body for `/api/chat`, add a `language` key set to `getCurrentLanguage()`. No other changes to the widget.
- [X] T020 [P] [US4] Update `backend/api.py` ChatRequest Pydantic model — add `language: str = "en"` field. This is backward-compatible: existing calls without the field default to English.
- [X] T021 [US4] Update the chat endpoint in `backend/api.py` — after the system prompt is assembled (before the LLM call), check `if request.language == "ur"`. If true, prepend the following text to the system prompt: `"Respond in Urdu. If your answer includes code snippets, commands, file paths, or URLs, keep those in English."` No changes to Qdrant retrieval, embedding, or citation extraction.

**Checkpoint**: US1–US4 complete. Full multilingual experience including chatbot.

---

## Phase 7: User Story 5 — Urdu Content Loads Without Blocking the Page (Priority: P5)

**Goal**: The initial page load time does not increase when Urdu is the persisted preference. English content is visible immediately; Urdu swaps in after its fetch resolves.

**Independent Test**: Throttle network to Slow 3G in DevTools → visit a chapter with اردو saved → English content appears instantly → Urdu content swaps in within 2 seconds → no full-page reload.

### Implementation for User Story 5

- [X] T022 [US5] Add in-memory fetch cache in `src/components/LanguageToggle/index.tsx` — declare a module-level `const urduCache = new Map<string, string>()` outside the component. Before fetching a slug, check `urduCache.get(slug)`. On successful fetch, store the response text: `urduCache.set(slug, text)`. This prevents re-fetching on re-toggle or SPA navigation back to the same chapter.
- [X] T023 [US5] Confirm non-blocking auto-apply in `src/components/LanguageToggle/index.tsx` — review the auto-apply logic from T018: the `fetch` must be inside an `async` effect that does NOT await before the component's first render. The English content (Docusaurus default) must be visible on initial paint. Urdu content replaces it only after `fetch` resolves and the state update triggers a re-render. If the current implementation blocks on fetch before first render, refactor to use a two-phase render: (1) render English, (2) after fetch, update state to Urdu.

**Checkpoint**: All 5 user stories complete. Feature is fully functional and performant.

---

## Phase 8: Content Translation — Remaining 8 Chapters

**Purpose**: Translate the remaining chapters. All 8 are independent and can run in parallel with each other. They can also run in parallel with Phases 3–7 (code work), but must complete before Phase 9 (validation).

**Rule for each file**: Read the English source from `docs/`. Translate prose and headings to Urdu following `glossary.md` (T006). Keep ALL code fences, inline code, file paths, URLs, CLI commands verbatim. Set front-matter `title` to the Urdu translation. Add `language: ur` to front matter. Write result to the corresponding path under `static/docs-ur/`.

- [X] T024 [P] Translate `docs/module-1-ros2/index.md` → write to `static/docs-ur/module-1-ros2/index.md`
- [X] T025 [P] Translate `docs/module-1-ros2/week-3-ros2-architecture.md` → write to `static/docs-ur/module-1-ros2/week-3-ros2-architecture.md`
- [X] T026 [P] Translate `docs/module-1-ros2/week-4-pub-sub.md` → write to `static/docs-ur/module-1-ros2/week-4-pub-sub.md`
- [X] T027 [P] Translate `docs/module-1-ros2/week-5-services-actions.md` → write to `static/docs-ur/module-1-ros2/week-5-services-actions.md`
- [X] T028 [P] Translate `docs/module-2-digital-twin/index.md` → write to `static/docs-ur/module-2-digital-twin/index.md`
- [X] T029 [P] Translate `docs/module-3-isaac/index.md` → write to `static/docs-ur/module-3-isaac/index.md`
- [X] T030 [P] Translate `docs/module-4-vla/index.md` → write to `static/docs-ur/module-4-vla/index.md`
- [X] T031 [P] Translate `docs/capstone/index.md` → write to `static/docs-ur/capstone/index.md`

---

## Phase 9: Polish & Validation

**Purpose**: Structural integrity, cross-browser rendering, chatbot language correctness, performance, and production deploy.

- [X] T032 Create the translation validation script at `scripts/validate-urdu-translations.js` — a Node.js script that takes no arguments, reads every `.md` file in `static/docs-ur/`, finds its English counterpart in `docs/`, and asserts: (1) identical count of code fences (` ``` `); (2) every fenced code block in English appears byte-for-byte in the Urdu file; (3) identical count of headings at each level (h1, h2, h3, h4); (4) warns (does not fail) on any prose paragraph that is byte-identical to English (likely untranslated). Print PASS or FAIL per file.
- [X] T033 Run `node scripts/validate-urdu-translations.js` against all 9 Urdu files. Fix any structural parity failures (missing code blocks, heading count mismatch, untranslated paragraphs) in the affected `static/docs-ur/` files. Re-run until all 9 files pass.
- [X] T034 [P] Verify RTL rendering visually — open each of the 9 chapters with اردو active. Test on desktop viewport (1280 px) and mobile viewport (375 px). Confirm: headings are right-aligned, body text is right-aligned, code blocks are left-aligned and horizontally scrollable, tables render correctly, sidebar chapter titles are readable.
- [X] T035 [P] Verify chatbot language switching — with اردو active, ask 3 questions spanning different modules (e.g., "What is a ROS 2 topic?", "How does Gazebo simulation work?", "What is a VLA model?"). Confirm all responses are in Urdu and any code/commands in the responses are in English. Switch to English, ask the same 3 questions, confirm English responses.
- [X] T036 Run a Lighthouse performance audit on the Intro page (or any chapter) with اردو as the persisted preference. Record the Total Blocking Time and LCP. Compare against a baseline audit with English only. Confirm the difference in page load time is < 100 ms.
- [X] T037 Deploy to production — run `npx vercel --prod` from repo root to deploy the main site (includes `static/docs-ur/` and updated `api/profile.js`). Redeploy the FastAPI backend (Railway or equivalent) to pick up the `language` field in `backend/api.py`. Verify on live `book-hthon.vercel.app`: sign in, toggle اردو on a chapter, confirm it works. Confirm chatbot responds in Urdu.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)          ─── no deps, start immediately
        │
        ▼
Phase 2 (Foundational)   ─── BLOCKS all user stories
        │
        ├──────────────────────────────────────────────┐
        ▼                                              ▼
Phase 3 (US1 — P1) 🎯    Phase 8 (Content — all [P]) ─ runs in parallel with Phases 3–7
        │
        ▼
Phase 4 (US2 — P2)
        │
        ▼
Phase 5 (US3 — P3)
        │
        ▼
Phase 6 (US4 — P4)
        │
        ▼
Phase 7 (US5 — P5)
        │
        ▼ (also waits for Phase 8)
Phase 9 (Polish & Deploy)
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only. No other story dependency. This is the MVP.
- **US2 (P2)**: Depends on US1 (reviews and hardens US1's auth-gate code). No new files.
- **US3 (P3)**: Depends on US1 (adds persistence to the toggle built in US1).
- **US4 (P4)**: Depends on Phase 1 (languageState module, T004). Can start after Phase 2 in parallel with US1 for the backend task (T020), but the ChatWidget task (T019) needs the languageState module populated by US1/US3.
- **US5 (P5)**: Depends on US3 (optimises the auto-apply introduced in T018).

### Within Each User Story

- Models / data changes before UI changes (e.g., T008 before T009; T015 before T016)
- Core component before mount integration (e.g., T009 before T013)
- Font loader after core component exists (T012 after T009)
- Backend model before endpoint logic (T020 before T021)

### Parallel Opportunities

| Parallel group | Tasks | Constraint |
|---|---|---|
| Setup parallelism | T002, T003, T004 | All different directories; T001 must finish first (installs the dep) |
| US1 kickoff | T007, T008 | Translation and profile.js are independent files |
| US4 backend + frontend | T019, T020 | ChatWidget and api.py are on different services |
| Content translation | T024–T031 | All 8 files are independent; needs glossary (T006) |
| Polish checks | T034, T035 | RTL visual and chatbot checks are independent |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T006)
3. Complete Phase 3: US1 (T007–T013)
4. **STOP and VALIDATE**: Sign in, visit Intro, toggle اردو, verify prose/code/RTL, toggle back.
5. Ship if green.

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (T007–T013) → test → ship MVP (1 chapter, toggle works)
3. US2 (T014) → auth-gate verified
4. US3 (T015–T018) → persistence works across sessions
5. US4 (T019–T021) → chatbot speaks Urdu
6. US5 (T022–T023) → performance optimised
7. Phase 8 (T024–T031) → all 9 chapters translated (can overlap with steps 2–6)
8. Phase 9 (T032–T037) → validate everything, deploy

### Parallel Team Strategy

With two developers:
- Developer A: US1 → US2 → US3 → US5 (frontend track)
- Developer B: Phase 8 translations (T024–T031) in parallel, then US4 backend (T020–T021)
- Both converge at Phase 9.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete sibling tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Phase 8 translations can run the entire time code work is happening — they are pure content with zero code dependency
- The glossary (T006) is the single source of truth for all translators; update it if a new term is encountered
