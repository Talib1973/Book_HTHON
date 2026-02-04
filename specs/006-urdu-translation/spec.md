# Feature Specification: Urdu Translation with Auth-Gated Toggle

**Feature Branch**: `006-urdu-translation`
**Created**: 2026-02-04
**Status**: Draft
**Input**: Introduce Urdu translations of all book content enabled via a chapter-level auth-gated toggle. Includes content translation, RTL support, language preference persistence, RAG chatbot Urdu response, and lazy-loading.

---

## Assumptions

The following defaults were applied without requiring clarification:

1. Urdu content is **pre-translated at build time** and shipped as static files — no runtime machine-translation API is called.
2. The language toggle persists preference to the user's profile row in the existing database. `localStorage` is the offline fallback only.
3. RTL layout is scoped to the chapter content area when Urdu is active; the global site chrome (navbar, sidebar structure) stays LTR but sidebar text flips to Urdu.
4. The RAG chatbot receives a `language: "ur"` signal at the response layer; the existing vector index is not re-built.
5. Code blocks, CLI commands, file paths, URLs, and API payloads inside chapter content are **never** translated — they remain in English inside Urdu text.
6. The 9 existing docs pages (listed below) are the translation scope for this phase:
   - `intro.md` — Welcome to Physical AI & Humanoid Robotics
   - `module-1-ros2/index.md` — Module 1: The Robotic Nervous System
   - `module-1-ros2/week-3-ros2-architecture.md` — Week 3: ROS 2 Architecture
   - `module-1-ros2/week-4-pub-sub.md` — Week 4: Publisher-Subscriber Pattern
   - `module-1-ros2/week-5-services-actions.md` — Week 5: Services and Actions
   - `module-2-digital-twin/index.md` — Module 2: Digital Twin
   - `module-3-isaac/index.md` — Module 3: NVIDIA Isaac Sim
   - `module-4-vla/index.md` — Module 4: Vision-Language-Action
   - `capstone/index.md` — Capstone Project
7. Anonymous (logged-out) users see English only; the toggle is not rendered for them.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Logged-In Reader Switches a Chapter to Urdu (Priority: P1)

A logged-in user navigates to any chapter page. At the top of the content area they see an "اردو / English" toggle. They tap "اردو". The page content instantly switches to the Urdu version of that chapter. Code blocks remain in English. The layout shifts to RTL for the Urdu text. Navigating to another chapter remembers the Urdu preference and shows that chapter in Urdu without manual re-toggling.

**Why this priority**: This is the core value delivery of the feature. Everything else supports this interaction.

**Independent Test**: Can be validated end-to-end by signing in, visiting any chapter, toggling to Urdu, and verifying content, RTL layout, and code-block preservation — without any other feature being complete.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on a chapter page, **When** they tap "اردو" on the toggle, **Then** the chapter prose switches to Urdu, code blocks stay in English, and the text direction becomes RTL.
2. **Given** a user has toggled to Urdu on one chapter, **When** they navigate to a different chapter, **Then** that chapter also loads in Urdu without re-toggling.
3. **Given** a user has toggled to Urdu, **When** they tap "English" on the toggle, **Then** the chapter reverts to the original English content in LTR layout.

---

### User Story 2 — Anonymous User Sees No Toggle (Priority: P2)

A visitor who is not signed in browses the textbook. No language toggle appears anywhere on any chapter page. All content is displayed in English only.

**Why this priority**: Enforces the auth-gate requirement and avoids confusion for anonymous readers. Must be verified before shipping.

**Independent Test**: Open any chapter in a fresh browser session (no cookies). Confirm the toggle is absent and content is English.

**Acceptance Scenarios**:

1. **Given** an anonymous (not signed-in) user is on any chapter page, **When** the page finishes loading, **Then** no language toggle is visible and content is in English.
2. **Given** an anonymous user inspects the page source, **When** they search for the toggle component, **Then** no toggle markup is present in the rendered DOM.

---

### User Story 3 — Language Preference Survives Logout and Re-Login (Priority: P3)

A logged-in user sets their preference to Urdu. They sign out and later sign back in on a different device. Upon visiting a chapter, the content loads in Urdu without them having to toggle again.

**Why this priority**: Persistence across sessions is a key part of the user experience. Failing this degrades to a one-session-only feature.

**Independent Test**: Set preference to Urdu → sign out → sign in (same or different device) → visit a chapter → verify Urdu loads automatically.

**Acceptance Scenarios**:

1. **Given** a user previously set language to Urdu and then signed out, **When** they sign back in and visit any chapter, **Then** the chapter loads in Urdu automatically.
2. **Given** a user is offline after previously choosing Urdu, **When** they visit a chapter while still logged in locally, **Then** the Urdu preference is read from the local fallback and content displays in Urdu.

---

### User Story 4 — RAG Chatbot Responds in Urdu When Urdu Mode Is Active (Priority: P4)

A logged-in user has Urdu toggled on. They open the RAG chatbot and ask a question. The chatbot answers in Urdu, drawing from the same book content it always uses, without any re-embedding.

**Why this priority**: Completes the multilingual experience end-to-end, but depends on the toggle (P1) being functional first.

**Independent Test**: Toggle to Urdu → open chatbot → ask a question → verify response is in Urdu and factually correct against the chapter content.

**Acceptance Scenarios**:

1. **Given** a logged-in user has Urdu active and opens the chatbot, **When** they ask a question about book content, **Then** the chatbot responds in Urdu.
2. **Given** a logged-in user switches back to English, **When** they ask the same question, **Then** the chatbot responds in English.
3. **Given** Urdu is active, **When** the chatbot answers, **Then** any code snippets or commands in the answer remain in English.

---

### User Story 5 — Urdu Content Loads Without Blocking the Page (Priority: P5)

A logged-in user with Urdu preference visits a chapter. The English version appears first (or a minimal skeleton), and the Urdu content replaces it promptly without a full-page reload or noticeable layout shift.

**Why this priority**: Performance polish. The feature works without this, but the user experience degrades on slower connections.

**Independent Test**: Throttle network to "Slow 3G" in DevTools, visit a chapter with Urdu preference, observe load sequence.

**Acceptance Scenarios**:

1. **Given** a user with Urdu preference visits a chapter on a slow connection, **When** the page loads, **Then** Urdu content appears within 2 seconds of the page being interactive and there is no full-page reload.
2. **Given** a user visits a chapter that has never been viewed before, **When** they toggle to Urdu, **Then** the Urdu content is fetched and swapped in without reloading the browser tab.

---

### Edge Cases

- What happens when a chapter has no Urdu translation yet? The toggle should be hidden or disabled for that specific chapter, and English is shown.
- How does the system behave if the Urdu content file fails to load (network error)? Fall back to English content and surface a non-blocking notice.
- What if a user's saved preference conflicts with their current toggle state (e.g., DB says Urdu, user just toggled to English)? The most recent explicit toggle wins; the new state is saved.
- What happens when the user is on a mobile device in RTL mode and opens a code block? The code block must remain horizontally scrollable in LTR regardless of the page direction.
- What if the RAG chatbot is asked a question in English while Urdu mode is active? The chatbot should still respond in Urdu (it follows the active page language, not the input language).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an "اردو / English" language toggle at the top of every chapter page, visible only to authenticated (signed-in) users.
- **FR-002**: When the toggle is set to "اردو", the system MUST replace the chapter prose with its pre-translated Urdu version, while leaving all code blocks, CLI commands, file paths, URLs, and API payloads unchanged.
- **FR-003**: When Urdu content is active, the system MUST render the text in a Right-to-Left layout with an appropriate Urdu-compatible font.
- **FR-004**: The system MUST persist the user's language preference server-side, linked to their existing user profile. It MUST also store the preference locally as a fallback when the user is offline.
- **FR-005**: On any page load, the system MUST read the persisted language preference and apply it automatically — no manual re-toggle required across chapters or sessions.
- **FR-006**: The system MUST provide a complete Urdu translation for each of the 9 existing chapter pages. Translations MUST preserve all headings, section structure, and technical accuracy.
- **FR-007**: When Urdu mode is active, the RAG chatbot MUST generate responses in Urdu. The language signal is sent at the response layer; no changes to the vector index or embeddings are required.
- **FR-008**: Urdu chapter content MUST be loaded on demand (not bundled with the initial page load) to avoid increasing the baseline page weight for users who never use Urdu.
- **FR-009**: The toggle MUST NOT appear or be enabled for any chapter that does not yet have a completed Urdu translation.
- **FR-010**: All Urdu-rendered pages MUST maintain existing accessibility standards: ARIA labels on interactive elements, readable font sizes (minimum 16px for body), and full keyboard navigability in RTL mode.

### Key Entities

- **UserLanguagePreference**: Represents a user's chosen language. Linked 1:1 to the existing user profile. Attributes: `user_id`, `language` (`en` | `ur`), `updated_at`. Persisted server-side; mirrored to local storage as fallback.
- **UrduChapterContent**: The pre-translated Urdu version of a single chapter. Mirrors the structure of its English counterpart. Stored as a static file. Attributes: `chapter_slug`, `language` (`ur`), `content` (full markdown body).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 9 existing chapters have a complete, human-quality Urdu translation available at launch.
- **SC-002**: Logged-in users can switch any chapter between English and Urdu in under 1 second, with no full-page reload.
- **SC-003**: Language preference persists correctly across sign-out/sign-in cycles on the same or different devices — verified by re-login test on at least 2 devices.
- **SC-004**: The initial page load time for a chapter does not increase by more than 100 ms compared to the English-only baseline (Urdu content is lazy-loaded, not bundled).
- **SC-005**: The RAG chatbot correctly responds in Urdu for 100% of test prompts when Urdu mode is active, without requiring any changes to the vector store.
- **SC-006**: Zero logged-out users are able to see or interact with the language toggle across all chapter pages.
- **SC-007**: All code blocks, CLI commands, file paths, and URLs within Urdu chapters remain in English — verified by automated diff against the English originals.
- **SC-008**: RTL layout renders correctly for headings, tables, sidebar links, and pagination when Urdu is active — verified visually on at least one mobile and one desktop viewport.
