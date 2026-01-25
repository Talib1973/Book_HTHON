# Tasks: Better Auth User Authentication & Chapter Personalization

**Feature**: 005-better-auth-personalization
**Input**: Design documents from `/specs/005-better-auth-personalization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5)
- File paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Better Auth service, database, and dependencies

- [x] T001 Create auth-service/ directory with package.json and TypeScript config
- [x] T002 Install Better Auth dependencies in auth-service/: better-auth, @better-auth/pg, express, cors, dotenv
- [x] T003 [P] Install FastAPI dependencies in backend/: asyncpg, python-dotenv
- [x] T004 [P] Install Docusaurus dependencies: npm install better-auth (root)
- [ ] T005 Create Neon PostgreSQL database and copy connection string to .env files
- [ ] T006 Run Better Auth migration: npx better-auth migrate (creates user, session, account, verification tables)
- [ ] T007 Create user_profile table in Neon SQL Editor per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth service, database clients, CORS - MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Implement Better Auth config in auth-service/src/auth.ts (email/password, session settings, Postgres adapter)
- [ ] T009 [P] Create Express server in auth-service/src/index.ts (mount auth.handler at /api/auth, CORS config)
- [ ] T010 [P] Create database client in backend/database.py (asyncpg pool, connect/disconnect methods)
- [ ] T011 [P] Create session validation dependency in backend/dependencies.py (get_current_user, validates session cookie)
- [ ] T012 Update FastAPI CORS middleware in backend/api.py (allow credentials, add frontend origins)
- [ ] T013 Update FastAPI lifespan in backend/api.py (connect/disconnect database)
- [ ] T014 Create auth client in src/lib/auth-client.ts (createAuthClient with baseURL)
- [ ] T015 Swizzle Docusaurus Root component: npx docusaurus swizzle @docusaurus/theme-classic Root --wrap
- [ ] T016 Implement auth context in src/theme/Root.tsx (AuthContext provider, BrowserOnly wrapper, useSession hook)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Registration with Background Collection (Priority: P1) 🎯 MVP

**Goal**: Visitor signs up with email/password + background form, profile stored in database

**Independent Test**: Complete signup form with Python/ROS experience + hardware details, verify user + profile created in Neon DB, session cookie set, user logged in

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create signup page in src/pages/auth/sign-up.tsx (form with email, password, name fields)
- [ ] T018 [P] [US1] Add background form fields to signup page (python_experience, ros_experience, has_rtx_gpu, gpu_model, has_jetson, jetson_model, robot_type, learning_goals dropdowns/inputs)
- [ ] T019 [US1] Implement signup handler in src/pages/auth/sign-up.tsx (call authClient.signUp.email, then POST /api/profile with background data)
- [ ] T020 [US1] Create profile router in backend/routers/profile.py (FastAPI APIRouter)
- [ ] T021 [US1] Implement POST /api/profile endpoint in backend/routers/profile.py (create user_profile, validate enums, return 201/409/400)
- [ ] T022 [US1] Include profile router in backend/api.py (app.include_router)
- [ ] T023 [US1] Add form validation to signup page (email format, password min 8 chars, required vs optional fields)
- [ ] T024 [US1] Add error handling to signup (duplicate email → "Email exists, log in?", backend errors → user-friendly messages)

**Checkpoint**: User can sign up, fill background form, profile saved, automatically logged in

---

## Phase 4: User Story 2 - Returning User Authentication (Priority: P1)

**Goal**: Registered user logs in, session persists across page navigation

**Independent Test**: Create account, log out, log in again, navigate to different chapter pages, verify session persists without re-auth

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create login page in src/pages/auth/sign-in.tsx (form with email, password fields)
- [ ] T026 [US2] Implement login handler in src/pages/auth/sign-in.tsx (call authClient.signIn.email, redirect to / on success)
- [ ] T027 [P] [US2] Create AuthNavbarItem component in src/components/NavbarItems/AuthNavbarItem.tsx (show user name + "Sign Out" if logged in, else "Sign In" link)
- [ ] T028 [US2] Register custom navbar item in src/theme/NavbarItem/ComponentTypes.js (export custom-auth component)
- [ ] T029 [US2] Add custom-auth navbar item to docusaurus.config.ts (navbar.items, position: right)
- [ ] T030 [US2] Implement sign-out handler in AuthNavbarItem (call authClient.signOut, redirect to /)
- [ ] T031 [US2] Add error handling to login page (invalid credentials → generic error, network errors → retry message)

**Checkpoint**: User can log in, session persists across pages, navbar shows auth state, logout works

---

## Phase 5: User Story 3 - Chapter Content Personalization (Priority: P2)

**Goal**: Authenticated user clicks "Personalize Chapter", content adjusts based on profile (beginner simplification, hardware-specific tips)

**Independent Test**: Log in as beginner (no GPU), click "Personalize Chapter" on any doc, verify advanced sections hidden, cloud GPU alternatives shown

### Implementation for User Story 3

- [ ] T032 [P] [US3] Implement GET /api/profile endpoint in backend/routers/profile.py (fetch user_profile by user_id, return 200/404)
- [ ] T033 [P] [US3] Swizzle DocItem Layout: npx docusaurus swizzle @docusaurus/theme-classic DocItem/Layout --wrap
- [ ] T034 [US3] Create PersonalizeButton component in src/components/PersonalizeButton.tsx (fetch profile, apply personalization, cache state)
- [ ] T035 [US3] Inject PersonalizeButton into DocItem Layout in src/theme/DocItem/Layout/index.tsx (render button above article if session exists)
- [ ] T036 [US3] Implement personalization engine in src/components/PersonalizationEngine.ts (DOM manipulation: hide .advanced-tip, show .beginner-note, adjust .gpu-required, highlight .ros-advanced based on profile)
- [ ] T037 [US3] Add personalization cache in PersonalizeButton (localStorage with 30-day TTL, debounced profile fetch)
- [ ] T038 [US3] Add loading state and error handling to PersonalizeButton (spinner while fetching, fallback if API fails)
- [ ] T039 [US3] Style PersonalizeButton in src/css/custom.css (consistent with Docusaurus theme, hover states)

**Checkpoint**: User can personalize chapters, content adapts to profile, caching prevents redundant API calls

---

## Phase 6: User Story 4 - Profile Updates (Priority: P3)

**Goal**: User updates background profile (hardware upgrade, new skills), future personalizations reflect changes

**Independent Test**: Log in, update profile (beginner → advanced Python), click "Personalize Chapter", verify advanced content now shown

### Implementation for User Story 4

- [ ] T040 [P] [US4] Create profile settings page in src/pages/profile/settings.tsx (form with all profile fields pre-filled from GET /api/profile)
- [ ] T041 [US4] Implement PUT /api/profile endpoint in backend/routers/profile.py (update user_profile, validate enums, return 200/400)
- [ ] T042 [US4] Implement profile update handler in settings page (call PUT /api/profile, clear localStorage cache, show success message)
- [ ] T043 [US4] Add link to profile settings in AuthNavbarItem dropdown (navbar dropdown menu with "Settings" option)
- [ ] T044 [US4] Add form validation to settings page (same validation as signup form)
- [ ] T045 [US4] Add error handling to settings page (API errors → user-friendly messages, optimistic UI updates)

**Checkpoint**: User can update profile, changes persist, personalization reflects updated profile immediately

---

## Phase 7: User Story 5 - Guest Access Without Authentication (Priority: P3)

**Goal**: Unauthenticated visitor can read chapters without personalization features

**Independent Test**: Open textbook site without logging in, verify chapters readable, "Personalize Chapter" button shows "Sign in to personalize" prompt

### Implementation for User Story 5

- [ ] T046 [US5] Update PersonalizeButton to check session state in src/components/PersonalizeButton.tsx (if no session, show "Sign in to personalize" modal instead of personalizing)
- [ ] T047 [US5] Create sign-in prompt modal in PersonalizeButton (modal with "Sign in" and "Sign up" links)
- [ ] T048 [US5] Ensure all chapters readable without auth (no route guards, content accessible by default)

**Checkpoint**: Guest users can browse all content, personalization prompts for login

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Deployment, testing, documentation

- [ ] T049 [P] Test local auth flow: signup → profile → login → logout → verify DB
- [ ] T050 [P] Test personalization flow: login → navigate chapter → click "Personalize" → verify DOM changes
- [ ] T051 Create .env.example files for auth-service, backend, and root (document all required environment variables)
- [ ] T052 Add dev scripts to package.json (concurrent startup for auth-service, backend, frontend)
- [ ] T053 [P] Update README with setup instructions (link to quickstart.md)
- [ ] T054 Configure Vercel deployment for auth-service (serverless functions at /api/auth/*)
- [ ] T055 [P] Configure Railway deployment for FastAPI backend (environment variables, health check)
- [ ] T056 Verify CORS in production (test cross-origin auth between Vercel frontend and Railway backend)
- [ ] T057 [P] Add ARIA labels to auth forms (accessibility: screen reader support, keyboard navigation)
- [ ] T058 Test session expiration and refresh (verify 7-day expiration, auto-refresh within 1-day window)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US1 & US2 can proceed in parallel (P1 priority)
  - US3 depends on US1 & US2 (needs auth working)
  - US4 depends on US3 (needs profile API)
  - US5 can proceed after US3 (minimal changes)
- **Polish (Phase 8)**: Depends on desired user stories

### User Story Dependencies

- **US1 (Signup)**: Foundation only - independent
- **US2 (Login)**: Foundation only - independent (can parallel with US1)
- **US3 (Personalization)**: Needs US1 (profile exists) + US2 (auth working)
- **US4 (Profile Updates)**: Needs US3 (profile API exists)
- **US5 (Guest Access)**: Needs US3 (personalization button exists)

### Parallel Opportunities

- Phase 1: T002, T003, T004 (different projects)
- Phase 2: T009-T011, T014-T016 (different files)
- Phase 3: T017-T018, T020-T021 (frontend/backend)
- Phase 4: T025-T027 (different files)
- Phase 5: T032-T033, T034-T036 (backend/frontend)
- Phase 6: T040-T041 (page/endpoint)
- Phase 8: T049-T050, T053-T055, T057 (independent validation)

---

## Parallel Example: User Story 3

```bash
# Launch backend and frontend tasks together:
Task: "Implement GET /api/profile endpoint in backend/routers/profile.py"
Task: "Swizzle DocItem Layout component"
Task: "Create PersonalizeButton component in src/components/PersonalizeButton.tsx"

# Launch DOM manipulation and caching logic together:
Task: "Implement personalization engine in src/components/PersonalizationEngine.ts"
Task: "Add personalization cache in PersonalizeButton"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Signup)
4. Complete Phase 4: User Story 2 (Login)
5. **STOP**: Test signup → login → logout flow
6. Deploy if ready (working auth system)

### Incremental Delivery

1. MVP (US1 + US2) → Deploy auth-only version
2. Add US3 (Personalization) → Deploy personalized learning
3. Add US4 (Profile Updates) → Deploy profile management
4. Add US5 (Guest Access) → Deploy complete feature

### Parallel Team Strategy

1. Complete Setup + Foundational together
2. Split after Foundational:
   - Developer A: US1 + US2 (auth flow)
   - Developer B: US3 (personalization, depends on US1/US2 done)
   - Developer C: US4 + US5 (profile features, depends on US3 done)

---

## Task Summary

**Total Tasks**: 58
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 9 tasks (BLOCKING)
- Phase 3 (US1 - Signup): 8 tasks
- Phase 4 (US2 - Login): 7 tasks
- Phase 5 (US3 - Personalization): 8 tasks
- Phase 6 (US4 - Profile Updates): 6 tasks
- Phase 7 (US5 - Guest Access): 3 tasks
- Phase 8 (Polish): 10 tasks

**Parallel Tasks**: 21 marked [P] (36% can run in parallel)

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 (31 tasks, ~60% of work)

**Critical Path**: Setup → Foundational → US1 → US2 → US3 → Deploy

---

## Notes

- All tasks include exact file paths
- [P] = different files, no sequential dependencies
- Each user story independently testable at checkpoint
- No tests included (not requested in spec)
- CORS critical for cross-origin auth - validate early
- Session cookies require credentials: "include" everywhere
- Better Auth TypeScript-only → separate Node.js service required
