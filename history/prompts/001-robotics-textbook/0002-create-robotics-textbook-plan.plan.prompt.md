---
id: 0002
title: Create robotics textbook plan
stage: plan
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-robotics-textbook
branch: 001-robotics-textbook
user: talib1973
command: /sp.plan
labels: ["plan", "architecture", "docusaurus", "robotics", "design"]
links:
  spec: specs/001-robotics-textbook/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-robotics-textbook/plan.md
  - specs/001-robotics-textbook/research.md
  - specs/001-robotics-textbook/data-model.md
  - specs/001-robotics-textbook/quickstart.md
  - specs/001-robotics-textbook/contracts/README.md
tests:
  - None (planning artifact)
---

## Prompt

```text
Build a production-ready, AI-native technical textbook titled **"Physical AI & Humanoid Robotics"** using Docusaurus v3, fully aligned with the 13-week syllabus from Hackathon I. The book must be **deployed publicly on GitHub Pages or Vercel** and serve as the foundation for future AI features.

**Execution Plan:**

1. **Scaffold Project**
   - Initialize Docusaurus v3 (`classic` template, TypeScript).
   - Configure `docusaurus.config.js` with correct `url` and `baseUrl` for target platform (GitHub Pages: `/repo/`; Vercel: `/`).
   - Add `gh-pages` (for GitHub) or ensure Vercel-compatible build output.

2. **Structure Content**
   - Create `/docs` with 4 modules + intro + capstone:
     - Module 1: ROS 2 (Weeks 3–5)
     - Module 2: Digital Twin – Gazebo & Unity (Weeks 6–7)
     - Module 3: NVIDIA Isaac™ (Weeks 8–10)
     - Module 4: Vision-Language-Action (Weeks 11–13)
   - Define sidebar navigation in `sidebars.js`.

3. **Generate Accurate Content**
   - Each chapter: learning objectives, conceptual explanations, ROS 2/Isaac code snippets, diagram placeholders (`<img alt="..."/>`), and official tool links.
   - Follow syllabus exactly (e.g., Week 13 = Conversational Robotics with Whisper + LLMs).
   - Use semantic headings and consistent frontmatter for RAG readiness.

4. **Ensure Deployment Readiness**
   - Add placeholder images in `/static/img/`, `favicon.ico`, and `.nojekyll`.
   - Include build/deploy scripts in `package.json`.
   - Test locally with `npm run build && npm run serve`.

5. **Document & Prepare for Extensions**
   - Write `README.md` with setup, build, and **both** GitHub Pages + Vercel deployment instructions.
   - Insert HTML comments as hooks:
     `<!-- PERSONALIZATION BUTTON -->`
     `<!-- URDU TOGGLE -->`
   - **Do not implement** auth, chatbot, or translation logic—this is Goal 1 only.

**Deliverables:**
✅ Public GitHub repo
✅ Live URL on GitHub Pages **or** Vercel
✅ Complete 13-week content
✅ Clean, extensible, mobile-responsive site
```

## Response snapshot

Created comprehensive implementation plan for Physical AI & Humanoid Robotics textbook using Docusaurus v3.

**Plan Structure**:
- **Technical Context**: TypeScript 5.x, Docusaurus v3, Node.js 18+, static MD files, dual deployment (GitHub Pages / Vercel)
- **Constitution Check**: All 7 principles validated (Technical Accuracy, Modular Architecture, Accessibility, Deployment-First, Privacy, RAG Intelligence, Iterative Delivery)
- **Project Structure**: Docusaurus default (docs/, static/, src/, .github/workflows/), 13 weeks across 4 modules
- **Phase 0 (Research)**: Docusaurus setup best practices, content structure, CI/CD, accessibility, ROS 2/Gazebo/Isaac/VLA sources
- **Phase 1 (Design & Contracts)**: Data model (6 entities), content template, sidebar config, Docusaurus config, quickstart guide

**Key Decisions**:
- TypeScript template for type safety (`npx create-docusaurus@latest Book_HTHON classic --typescript`)
- Dual deployment via `DEPLOY_TARGET` env var (GitHub Pages `/Book_HTHON/` or Vercel `/`)
- Front matter schema: id, title, sidebar_position, keywords (RAG), dependencies (prerequisites)
- GitHub Actions workflow for auto-deploy on push to main
- ROS 2 Humble, Gazebo Sim, NVIDIA Isaac Sim, VLA research papers (RT-1, RT-2, PaLM-E)

**Artifacts Created**:
1. **plan.md** (868 lines): Complete implementation plan with technical context, constitution check, project structure, research tasks, contracts
2. **research.md** (300+ lines): Docusaurus setup decisions, content structure best practices, CI/CD workflows, accessibility requirements, ROS 2/Isaac/VLA sources
3. **data-model.md** (300+ lines): 6 entities (Module, Week, CodeSnippet, Diagram, ExternalResource, AssessmentQuestion) with validation rules
4. **quickstart.md** (400+ lines): Setup, build, deploy (GitHub Pages / Vercel), accessibility validation, content workflow
5. **contracts/README.md**: References to content template, sidebar config, Docusaurus config (full definitions in plan.md)

**Constitution Re-Evaluation (Post-Design)**:
- 7/7 principles PASS
- All clarifications resolved (GitHub Pages branch auto-created, Vercel PR previews confirmed)
- All validations complete (tablet responsiveness specified, Lighthouse targets defined)
- Ready for `/sp.tasks` command

## Outcome

- ✅ Impact: Implementation plan complete with architecture, contracts, and deployment strategy for Docusaurus v3 robotics textbook
- 🧪 Tests: Accessibility validation (Lighthouse >90, mobile responsive), manual verification (navigate pages, code blocks render)
- 📁 Files: Created plan.md (868 lines), research.md, data-model.md, quickstart.md, contracts/README.md
- 🔁 Next prompts: /sp.tasks (generate task list with setup, content creation, deployment tasks)
- 🧠 Reflection: Plan balances technical rigor (TypeScript, dual deployment, RAG-ready content) with hackathon pragmatism (leverage Docusaurus defaults, minimal custom code). Content template ensures consistency across 13 weeks. CI/CD automation critical for Principle IV (Deployment-First Development).

## Evaluation notes (flywheel)

- Failure modes observed: None (plan passed all constitution checks)
- Graders run and results (PASS/FAIL): Technical Context complete (PASS), Constitution Check 7/7 (PASS), Phase 0 research complete (PASS), Phase 1 contracts complete (PASS)
- Prompt variant (if applicable): Standard /sp.plan flow with detailed execution plan input
- Next experiment (smallest change to try): Validate task breakdown in /sp.tasks aligns with vertical slice delivery (Module 1 → deploy → Module 2-4) per Principle VII
