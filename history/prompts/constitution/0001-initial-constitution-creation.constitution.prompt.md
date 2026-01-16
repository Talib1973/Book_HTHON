---
id: 0001
title: Initial constitution creation
stage: constitution
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: talib1973
command: /sp.constitution
labels: ["constitution", "project-setup", "governance", "principles"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - None (documentation artifact)
---

## Prompt

```yaml
project:
  name: "Physical AI & Humanoid Robotics Textbook"
  description: |
    Create a comprehensive, AI-native technical textbook for a university-level course on Physical AI and Humanoid Robotics.
    The book must teach students how to bridge digital AI with physical embodiment using ROS 2, Gazebo, Unity,
    NVIDIA Isaac Sim, and Vision-Language-Action (VLA) architectures.

core_principles:
  - Technical accuracy aligned with industry-standard robotics tools
  - Modular, extensible architecture for future AI integration
  - Accessibility via responsive design and multilingual support (Urdu toggle)
  - Full deployment readiness on GitHub Pages or Vercel

technical_stack:
  frontend:
    - Docusaurus v3 (React + MDX)
    - Responsive design with mobile support
    - Client-side personalization and translation toggles
  backend:
    - FastAPI (for RAG chatbot API – future phase)
    - Neon Serverless PostgreSQL (user/auth data)
    - Qdrant Cloud Free Tier (vector storage)
    - OpenAI Agents / ChatKit SDK (for conversational interface)
  auth:
    - Better Auth (https://www.better-auth.com/) for signup/signin
    - Collect user background: programming experience, hardware access (RTX GPU, Jetson, robot type), learning goals
  deployment:
    - GitHub Pages **or** Vercel (fully automated CI/CD)
    - Public live URL required for evaluation

content_structure:
  modules:
    - Module 1: The Robotic Nervous System (ROS 2)
    - Module 2: The Digital Twin (Gazebo & Unity)
    - Module 3: The AI-Robot Brain (NVIDIA Isaac™)
    - Module 4: Vision-Language-Action (VLA)
  weekly_breakdown: true (13 weeks total)
  includes:
    - Code snippets (Python, ROS 2, URDF)
    - Diagram placeholders with alt text
    - Hardware recommendations (RTX workstations, Jetson kits, robots)
    - Capstone project: Autonomous Humanoid with voice-to-action pipeline

non_functional_requirements:
  - Mobile-responsive and fast-loading
  - Clear navigation and consistent typography
  - Semantic HTML for RAG compatibility
  - SEO-friendly metadata per page
  - Extensible hooks for:
      - User-triggered chapter personalization
      - Urdu/English toggle per chapter
      - Embedded RAG chatbot (context-aware, supports selected text)

evaluation_alignment:
  - Base functionality (100 pts): textbook + deployment + structure
  - +50 pts: reusable intelligence via Claude Subagents/Skills
  - +50 pts: Better Auth with background collection
  - +50 pts: personalization button per chapter
  - +50 pts: Urdu translation toggle per chapter

constraints:
  - Must be fully deployable on GitHub Pages or Vercel
  - All source code must be in a public GitHub repository
  - No external branding or organizational references


deliverables:
  - Public GitHub repo
  - Live textbook URL (GitHub Pages or Vercel)
  - README with setup, build, and deployment instructions
  - 90-second demo video link (submitted separately)
```

## Response snapshot

Created comprehensive project constitution (v1.0.0) with 7 core principles:

1. **Technical Accuracy & Industry Alignment**: Mandates ROS 2 Humble+, Gazebo Sim, Unity ML-Agents, NVIDIA Isaac, and VLA architectures (RT-1/RT-2 patterns) with validated code examples
2. **Modular, Extensible Content Architecture**: Independent modules with explicit dependencies, self-contained code snippets, semantic structure for RAG
3. **Accessibility & Inclusive Design**: Mobile-responsive, semantic HTML5, Urdu translation toggle, screen reader support, hardware-agnostic alternatives
4. **Deployment-First Development**: GitHub Actions CI/CD, automated builds on every commit, zero tolerance for silent failures
5. **Privacy-Respecting Personalization**: Minimal data collection (email, background only), transparent usage, opt-in personalization, no third-party sharing
6. **Semantic Content for RAG Intelligence**: Descriptive headings, docstrings in code, alt text on diagrams, keyword front matter for vector retrieval
7. **Iterative, Testable Delivery**: Vertical slice PRs, deployment previews, acceptance tests, no "big bang" releases

Added sections for Technical Architecture (Docusaurus v3, FastAPI/RAG optional, Better Auth), Content & Learning Design (13-week structure with capstone), and Governance (amendment process, compliance gates, complexity justification).

All template alignment verified. Constitution written to `.specify/memory/constitution.md` with Sync Impact Report prepended.

## Outcome

- ✅ Impact: Project governance established with clear technical constraints and quality gates for robotics textbook development
- 🧪 Tests: None (constitution is a documentation artifact defining project rules)
- 📁 Files: Created .specify/memory/constitution.md (219 lines)
- 🔁 Next prompts: /sp.specify (create feature spec for MVP textbook structure) or /sp.plan (design implementation plan for Docusaurus setup + Module 1 content)
- 🧠 Reflection: Constitution balances academic rigor (technical accuracy, modular design) with hackathon pragmatism (deployment-first, incremental delivery). Privacy principle differentiates from typical ed-tech platforms. RAG semantic content principle ensures AI tutor quality.

## Evaluation notes (flywheel)

- Failure modes observed: None yet (initial creation)
- Graders run and results (PASS/FAIL): Constitution template fully filled (PASS), no unexplained placeholders (PASS), principles testable and declarative (PASS)
- Prompt variant (if applicable): Default /sp.constitution flow with comprehensive YAML input
- Next experiment (smallest change to try): Validate constitution gates during /sp.plan execution (Constitution Check section should reference all 7 principles)
