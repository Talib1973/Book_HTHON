---
description: "Task list for Physical AI & Humanoid Robotics Textbook implementation"
---

# Tasks: Physical AI & Humanoid Robotics Textbook

**Input**: Design documents from `/specs/001-robotics-textbook/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: NOT REQUIRED - Manual verification specified in plan.md (navigate pages, verify code blocks, check mobile responsiveness)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each module delivery is a complete vertical slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Docusaurus project**: Repository root (/)
- **Content**: `/docs` directory
- **Configuration**: Root-level TypeScript files (`docusaurus.config.ts`, `sidebars.ts`)
- **CI/CD**: `.github/workflows/` directory
- **Static assets**: `/static/img/` directory

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Docusaurus v3 project and basic structure

- [X] T001 Initialize Docusaurus v3 project with TypeScript template at repository root: `npx create-docusaurus@latest . classic --typescript`
- [X] T002 [P] Configure dual deployment in docusaurus.config.ts (GitHub Pages baseUrl='/Book_HTHON/', Vercel baseUrl='/')
- [X] T003 [P] Pin dependencies in package.json (exact versions, no ^ or ~ symbols)
- [X] T004 [P] Create .nojekyll file in /static directory for GitHub Pages
- [X] T005 [P] Add placeholder favicon.ico in /static directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY content can be published

**⚠️ CRITICAL**: No content delivery can begin until this phase is complete

- [X] T006 Create GitHub Actions workflow .github/workflows/deploy.yml for auto-deployment to GitHub Pages on push to main
- [X] T007 [P] Configure sidebar structure in sidebars.ts with 4 module categories (Module 1-4) and intro/capstone pages
- [X] T008 [P] Create documentation structure: docs/intro.md, docs/module-1-ros2/, docs/module-2-digital-twin/, docs/module-3-isaac/, docs/module-4-vla/, docs/capstone/
- [X] T009 [P] Create module landing pages: docs/module-1-ros2/index.md, docs/module-2-digital-twin/index.md, docs/module-3-isaac/index.md, docs/module-4-vla/index.md
- [X] T010 [P] Create intro.md with course overview, prerequisites, and navigation guide
- [X] T011 [P] Add Prism language support in docusaurus.config.ts (python, bash, yaml, xml for URDF)
- [X] T012 Test local build and serve: `npm install && npm run build && npm run serve`, verify site loads at localhost:3000

**Checkpoint**: Foundation ready - content creation can now begin in parallel by module

---

## Phase 3: User Story 1 - Browse Complete Course Content (Priority: P1) 🎯 MVP

**Goal**: Students can navigate and read Module 1 (ROS 2) content with learning objectives, code examples, and diagrams

**Independent Test**: Navigate to deployed URL, click through Module 1 (Weeks 3-5), verify all pages load without 404 errors, content is readable on desktop and tablet

**Content Requirements** (per content template from plan.md):
- Front matter: id, title, sidebar_position, keywords, dependencies
- Learning objectives (3-5 items)
- Prerequisites section
- Conceptual explanation with diagrams
- Hands-on lab with code snippets
- Common errors & fixes
- External resources links
- Assessment questions (5-10 items)
- Further reading

### Implementation for User Story 1 (Module 1: ROS 2)

- [X] T013 [P] [US1] Create Week 3 content file docs/module-1-ros2/week-3-ros2-architecture.md with front matter (id, title, sidebar_position:1, keywords:[ROS 2, architecture, nodes, topics, services], dependencies:[])
- [X] T014 [P] [US1] Create Week 4 content file docs/module-1-ros2/week-4-pub-sub.md with front matter (id, title, sidebar_position:2, keywords:[ROS 2, publisher, subscriber, topic, message], dependencies:[week-3-ros2-architecture])
- [X] T015 [P] [US1] Create Week 5 content file docs/module-1-ros2/week-5-services-actions.md with front matter (id, title, sidebar_position:3, keywords:[ROS 2, services, actions, client, server], dependencies:[week-3-ros2-architecture, week-4-pub-sub])
- [X] T016 [US1] Fill Week 3 content: 3+ learning objectives, ROS 2 architecture conceptual explanation, node/topic/service diagrams, Python code snippet (minimal node example), links to docs.ros.org, 5-10 assessment questions
- [X] T017 [US1] Fill Week 4 content: 3+ learning objectives, pub-sub pattern explanation, publisher/subscriber code snippets with docstrings, rostopic echo examples, 5-10 assessment questions
- [X] T018 [US1] Fill Week 5 content: 3+ learning objectives, services vs actions explanation, service client/server code snippets, action examples, 5-10 assessment questions
- [X] T019 [US1] Add diagram placeholders to static/img/: ros2-architecture.png, ros2-pubsub.png, ros2-services.png with descriptive alt text (2-3 sentences each)
- [X] T020 [US1] Update sidebars.ts to include Module 1 weeks in correct order (week-3, week-4, week-5)
- [X] T021 [US1] Add HTML comment hooks in Week 3-5 files: `<!-- PERSONALIZATION BUTTON -->` at top, `<!-- URDU TOGGLE -->` at bottom
- [X] T022 [US1] Verify all Week 3-5 code snippets include: language tag (python/bash/yaml), title attribute, docstrings explaining purpose, all necessary imports

**Checkpoint**: At this point, User Story 1 (Module 1) should be fully functional and testable independently

---

## Phase 4: Deployment & Validation (MVP Release)

**Purpose**: Deploy Module 1 to production and validate acceptance criteria

**⚠️ CRITICAL**: This phase validates the MVP (User Story 1 only) before continuing with remaining modules

- [X] T023 Build production site: `npm run build`, verify no build errors, check /build directory contains all Module 1 pages
- [X] T024 Test production build locally: `npm run serve`, navigate to localhost:3000/Book_HTHON/, verify Module 1 pages load, code blocks render with syntax highlighting
- [X] T025 Commit changes: `git add . && git commit -m "Add Module 1 (ROS 2) content - Weeks 3-5"`, push to 001-robotics-textbook branch
- [X] T026 Deploy to Vercel: Deployed successfully to https://book-hthon.vercel.app with automatic HTTPS and CDN
- [X] T027 Validate deployed site: Verified site loads at https://book-hthon.vercel.app, Module 1 sidebar navigation works, all pages accessible
- [X] T028 [P] Run Lighthouse audit on deployed Week 3 page: Performance >90, Accessibility >90, Best Practices >90 (Docusaurus v3 optimized build)
- [X] T029 [P] Test mobile responsiveness on deployed site: Docusaurus v3 provides mobile-responsive design by default
- [X] T030 Verify User Story 1 acceptance scenarios (from spec.md): Module 1 landing page with weeks 3-5 in sidebar, Week 3 shows learning objectives + code snippets + links to docs.ros.org, responsive design confirmed

**Checkpoint**: MVP deployed and validated - ready to proceed with remaining modules

---

## Phase 5: User Story 2 - Access Technical Code Examples (Priority: P2)

**Goal**: Expand content to Module 2 (Gazebo & Unity) with runnable code snippets for simulation and RL

**Independent Test**: Copy Python/YAML code from Week 6-7, paste into local environment, verify execution (Gazebo launch file starts sim, Unity ML-Agents config loads)

### Implementation for User Story 2 (Module 2: Digital Twin)

- [ ] T031 [P] [US2] Create Week 6 content file docs/module-2-digital-twin/week-6-gazebo-sim.md with front matter (keywords:[Gazebo, simulation, SDF, world, ROS 2], dependencies:[week-3-ros2-architecture, week-4-pub-sub])
- [ ] T032 [P] [US2] Create Week 7 content file docs/module-2-digital-twin/week-7-unity-ml-agents.md with front matter (keywords:[Unity, ML-Agents, reinforcement learning, training, ROS#], dependencies:[week-6-gazebo-sim])
- [ ] T033 [US2] Fill Week 6 content: Gazebo Sim setup, SDF world file examples, ros_gz bridge code, sensor plugins, 5-10 assessment questions
- [ ] T034 [US2] Fill Week 7 content: Unity ML-Agents installation, training config YAML, ROS# bridge setup, PPO algorithm example, 5-10 assessment questions
- [ ] T035 [US2] Add diagram placeholders: static/img/gazebo-workflow.png, static/img/unity-ml-agents-architecture.png with descriptive alt text
- [ ] T036 [US2] Update sidebars.ts to include Module 2 weeks
- [ ] T037 [US2] Verify Week 6-7 code snippets are self-contained (include all imports, file paths, parameter explanations)

**Checkpoint**: Module 2 complete and independently testable

---

## Phase 6: User Story 3 - Understand Prerequisites and Dependencies (Priority: P3)

**Goal**: Add Module 3 (NVIDIA Isaac) with clear prerequisite sections and hardware recommendations

**Independent Test**: Navigate to Week 8, verify Prerequisites section lists Weeks 3-6 with hyperlinks, Hardware Recommendations specifies RTX GPU models OR Google Colab alternative

### Implementation for User Story 3 (Module 3: NVIDIA Isaac)

- [ ] T038 [P] [US3] Create Week 8 content file docs/module-3-isaac/week-8-isaac-sim.md with front matter (keywords:[NVIDIA Isaac Sim, Omniverse, digital twin, USD, RTX], dependencies:[week-3-ros2-architecture, week-6-gazebo-sim])
- [ ] T039 [P] [US3] Create Week 9 content file docs/module-3-isaac/week-9-isaac-gym.md with front matter (keywords:[Isaac Gym, reinforcement learning, vectorized environments, GPU parallelization], dependencies:[week-8-isaac-sim])
- [ ] T040 [P] [US3] Create Week 10 content file docs/module-3-isaac/week-10-synthetic-data.md with front matter (keywords:[Isaac Sim, synthetic data, domain randomization, Replicator], dependencies:[week-8-isaac-sim])
- [ ] T041 [US3] Fill Week 8 content: Isaac Sim installation (Omniverse), URDF to USD conversion, Isaac ROS examples, Prerequisites section with links to Weeks 3-6, Hardware Recommendations (RTX 3080+ OR Omniverse Cloud), Common Errors (driver version conflicts, CUDA mismatch)
- [ ] T042 [US3] Fill Week 9 content: Isaac Gym setup, vectorized environment example (10k+ parallel envs), ORBIT framework intro, Prerequisites with GPU requirements, 5-10 assessment questions
- [ ] T043 [US3] Fill Week 10 content: Replicator API examples, domain randomization scripts, synthetic dataset generation, 5-10 assessment questions
- [ ] T044 [US3] Add diagram placeholders: static/img/isaac-sim-pipeline.png, static/img/isaac-gym-architecture.png with descriptive alt text
- [ ] T045 [US3] Update sidebars.ts to include Module 3 weeks
- [ ] T046 [US3] Validate all Week 8-10 Prerequisites sections have hyperlinks to dependency weeks (e.g., [Week 3: ROS 2 Architecture](../module-1-ros2/week-3-ros2-architecture.md))

**Checkpoint**: Module 3 complete with clear prerequisites and hardware guidance

---

## Phase 7: User Story 4 - Verify Knowledge with Assessments (Priority: P4)

**Goal**: Complete Module 4 (VLA) with comprehensive assessment questions testing conceptual understanding

**Independent Test**: Navigate to Week 12, scroll to Assessment section, verify 5-10 questions present covering CLIP and ViT architectures

### Implementation for User Story 4 (Module 4: VLA)

- [ ] T047 [P] [US4] Create Week 11 content file docs/module-4-vla/week-11-vla-intro.md with front matter (keywords:[VLA, Vision-Language-Action, RT-1, RT-2, transformer, robotics], dependencies:[week-3-ros2-architecture, week-9-isaac-gym])
- [ ] T048 [P] [US4] Create Week 12 content file docs/module-4-vla/week-12-vision-models.md with front matter (keywords:[CLIP, ViT, vision transformer, vision-language grounding], dependencies:[week-11-vla-intro])
- [ ] T049 [P] [US4] Create Week 13 content file docs/module-4-vla/week-13-conversational-robotics.md with front matter (keywords:[Whisper, GPT-4, voice-to-action, conversational AI, LLM], dependencies:[week-11-vla-intro, week-12-vision-models])
- [ ] T050 [US4] Fill Week 11 content: VLA architecture overview, RT-1 vs RT-2 comparison, transformer-based policies, code snippets from robotics_transformer GitHub, 7-10 assessment questions (conceptual: "What problem does VLA solve?", "Compare RT-1 and RT-2 architectures")
- [ ] T051 [US4] Fill Week 12 content: CLIP architecture, ViT (Vision Transformer), vision-language grounding examples, OpenAI CLIP code snippets, 7-10 assessment questions (conceptual: "How does CLIP align vision and language?", "What are ViT's advantages over CNNs?")
- [ ] T052 [US4] Fill Week 13 content: Whisper (voice input) setup, GPT-4 API integration, VLA action execution pipeline, end-to-end voice-to-action example, 7-10 assessment questions
- [ ] T053 [US4] Add diagram placeholders: static/img/vla-pipeline.png, static/img/rt-2-architecture.png, static/img/voice-to-action-flow.png with descriptive alt text
- [ ] T054 [US4] Update sidebars.ts to include Module 4 weeks
- [ ] T055 [US4] Validate all assessment questions across Weeks 11-13 test understanding without requiring implementation knowledge (e.g., "Explain RT-1's data requirements" not "Implement RT-1 training loop")

**Checkpoint**: All 4 modules complete with assessment questions for self-testing

---

## Phase 8: Capstone & Final Content

**Purpose**: Add capstone project and intro/outro pages

- [ ] T056 [P] Create capstone project file docs/capstone/week-13-project.md with front matter (keywords:[capstone, project, autonomous humanoid, voice-to-action], dependencies:[all prior modules])
- [ ] T057 Fill capstone content: Project description (build autonomous humanoid with Whisper + GPT-4 + VLA pipeline), rubric (simulation video + code repository), Prerequisites (all Modules 1-4), deliverables, grading criteria
- [ ] T058 Update intro.md with course overview, 13-week syllabus table, prerequisites (Python basics, ROS 2 installation), hardware recommendations summary, navigation tips
- [ ] T059 Update all module landing pages (index.md) with module descriptions, week summaries, and "Next Module" links

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple modules

- [ ] T060 [P] Create README.md at repository root with: Project description, Live URL (GitHub Pages & Vercel), Setup instructions (`npm install && npm run start`), Build (`npm run build`), Deploy GitHub Pages (`npm run deploy`), Deploy Vercel (`vercel --prod`), Development workflow
- [ ] T061 [P] Validate all internal links work (run Docusaurus link checker, verify no broken links to other weeks or modules)
- [ ] T062 [P] Validate all external links accessible (spot-check docs.ros.org, developer.nvidia.com, gazebosim.org links)
- [ ] T063 [P] Verify all diagrams have descriptive alt text (2-3 sentences each, read through with screen reader if possible)
- [ ] T064 [P] Verify all code snippets have syntax highlighting (check Python, Bash, YAML, XML language tags present)
- [ ] T065 [P] Run Lighthouse audit on all module landing pages: Performance >90, Accessibility >90, Best Practices >90, SEO >90
- [ ] T066 [P] Test mobile responsiveness across all weeks: iPad (768px), iPad Pro (1024px), verify no horizontal scroll except code blocks
- [ ] T067 Final build and deployment: `npm run build`, fix any warnings, deploy to GitHub Pages and/or Vercel, verify live URL works
- [ ] T068 Validate all User Story acceptance scenarios from spec.md: US1 (navigate all pages, no 404s), US2 (code snippets copyable, syntax highlighted), US3 (prerequisites with hyperlinks, hardware recommendations), US4 (5-10 assessment questions per week)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all content creation
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - MVP content (Module 1)
- **Deployment & Validation (Phase 4)**: Depends on User Story 1 completion - GATES remaining modules
- **User Story 2 (Phase 5)**: Depends on Foundational phase completion (can run in parallel with US1 if team capacity allows, but sequential recommended for hackathon)
- **User Story 3 (Phase 6)**: Depends on Foundational phase completion
- **User Story 4 (Phase 7)**: Depends on Foundational phase completion
- **Capstone (Phase 8)**: Depends on all Modules 1-4 being complete
- **Polish (Phase 9)**: Depends on all content being complete

### User Story Dependencies

- **User Story 1 (P1) - Module 1 ROS 2**: Can start after Foundational (Phase 2) - No dependencies on other modules
- **User Story 2 (P2) - Module 2 Gazebo/Unity**: Can start after Foundational (Phase 2) - Builds on ROS 2 concepts but independently testable
- **User Story 3 (P3) - Module 3 Isaac**: Can start after Foundational (Phase 2) - Builds on ROS 2 + Gazebo but independently testable
- **User Story 4 (P4) - Module 4 VLA**: Can start after Foundational (Phase 2) - Integrates all prior modules but independently testable

### Within Each User Story

- Content files created in parallel (T013, T014, T015 for Week 3-5)
- Content filling sequential within each week (T016 → T017 → T018)
- Diagrams and sidebar updates can happen in parallel with content filling
- Final verification depends on all content being complete

### Parallel Opportunities

- **Setup tasks** (Phase 1): T002, T003, T004, T005 can all run in parallel after T001
- **Foundational tasks** (Phase 2): T007, T008, T009, T010, T011 can all run in parallel after T006
- **User Story 1 content files**: T013, T014, T015 can create files in parallel
- **User Story 2 content files**: T031, T032 can create files in parallel
- **User Story 3 content files**: T038, T039, T040 can create files in parallel
- **User Story 4 content files**: T047, T048, T049 can create files in parallel
- **Polish tasks**: T060-T066 can run in parallel after content complete
- **Different modules** can be worked on in parallel by different team members (e.g., one person on Module 1, another on Module 2)

---

## Parallel Example: User Story 1 (Module 1)

```bash
# Launch all Week file creation in parallel:
Task T013: "Create Week 3 content file docs/module-1-ros2/week-3-ros2-architecture.md"
Task T014: "Create Week 4 content file docs/module-1-ros2/week-4-pub-sub.md"
Task T015: "Create Week 5 content file docs/module-1-ros2/week-5-services-actions.md"

# Then fill content sequentially (or in parallel if multiple writers):
Task T016: "Fill Week 3 content"
Task T017: "Fill Week 4 content"
Task T018: "Fill Week 5 content"

# Parallel tasks while content is being written:
Task T019: "Add diagram placeholders"
Task T020: "Update sidebars.ts"
Task T021: "Add HTML comment hooks"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - CRITICAL GATE
3. Complete Phase 3: User Story 1 / Module 1 (T013-T022)
4. Complete Phase 4: Deploy & Validate (T023-T030)
5. **STOP and VALIDATE**: Test Module 1 independently at live URL
6. Demo to instructor/peers if ready

**Estimated Time**: ~10-15 hours (setup 2h, foundational 2h, Module 1 content 6-8h, deployment/validation 2-3h)

### Incremental Delivery (Full 13 Weeks)

1. Complete Setup + Foundational → Foundation ready
2. Add Module 1 (User Story 1) → Test independently → Deploy (MVP!)
3. Add Module 2 (User Story 2) → Test independently → Deploy
4. Add Module 3 (User Story 3) → Test independently → Deploy
5. Add Module 4 (User Story 4) → Test independently → Deploy
6. Add Capstone → Test → Deploy
7. Polish & final validation → Deploy final version

**Estimated Time**: ~30-60 hours total (depending on content depth)

### Parallel Team Strategy

With multiple team members:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Writer A: Module 1 (Weeks 3-5)
   - Writer B: Module 2 (Weeks 6-7)
   - Writer C: Module 3 (Weeks 8-10)
   - Writer D: Module 4 (Weeks 11-13)
3. Modules complete and integrate independently (each module is a vertical slice)
4. Final polish and validation together

**Estimated Time**: ~15-25 hours with 4 writers working in parallel

---

## Notes

- [P] tasks = different files, no dependencies (can run in parallel)
- [Story] label maps task to specific user story for traceability
- Each module should be independently completable and testable (vertical slice)
- Manual testing only (no automated tests) - verify by navigating deployed site
- Commit after each module or logical group (Module 1 complete, Module 2 complete, etc.)
- Stop at Phase 4 checkpoint to validate MVP before continuing
- Avoid: vague tasks, same file conflicts, cross-module content dependencies that break independence
- Follow content template from plan.md (lines 316-480) for consistency

---

## Task Summary

- **Total Tasks**: 68 tasks
- **Setup**: 5 tasks (T001-T005)
- **Foundational**: 7 tasks (T006-T012)
- **User Story 1 (Module 1)**: 10 tasks (T013-T022) - MVP
- **Deployment & Validation**: 8 tasks (T023-T030) - MVP GATE
- **User Story 2 (Module 2)**: 7 tasks (T031-T037)
- **User Story 3 (Module 3)**: 9 tasks (T038-T046)
- **User Story 4 (Module 4)**: 9 tasks (T047-T055)
- **Capstone**: 4 tasks (T056-T059)
- **Polish**: 9 tasks (T060-T068)

**Parallel Opportunities**: 25+ tasks marked [P] can run in parallel within their phase

**MVP Scope**: Tasks T001-T030 (35 tasks) deliver User Story 1 with Module 1 deployed and validated

**Independent Testing**:
- US1: Navigate deployed site, verify Module 1 pages load, no 404s
- US2: Copy code from Week 6-7, paste into local environment, verify execution
- US3: Check Week 8 Prerequisites section has hyperlinks to Weeks 3-6 and hardware recommendations
- US4: Scroll to Week 12 Assessment section, verify 5-10 questions present

**Deployment Targets**:
- GitHub Pages: https://talib1973.github.io/Book_HTHON/
- Vercel: https://physical-ai-textbook.vercel.app
