<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.0.1
Rationale: Technical clarification - change content format from MDX to MD (plain Markdown)

Modified Principles: None (technical specification update only)

Changed Sections:
- Technical Architecture: Frontend specification (MDX → MD)
- Content & Learning Design: File format specification (MDX → MD)
- Principle VI: Front matter reference (MDX → Markdown)

Removed Sections: None

Templates Requiring Updates:
✅ No template changes required (format choice doesn't affect spec/plan/tasks structure)

Follow-up TODOs: None
-->

# Physical AI & Humanoid Robotics Textbook Constitution

## Core Principles

### I. Technical Accuracy & Industry Alignment

Every technical component MUST align with industry-standard robotics tools and practices. All code examples, ROS 2 packages, URDF files, Gazebo simulations, Unity integrations, and NVIDIA Isaac workflows MUST be validated against official documentation and tested in real environments.

**Rationale**: Students transitioning to research or industry require production-ready knowledge. Inaccurate or outdated examples create technical debt in student learning and reduce course credibility.

**Non-Negotiable Rules**:
- ROS 2 Humble or later (no ROS 1 legacy patterns)
- Gazebo Classic or Gazebo Sim (Ignition) aligned with ROS 2 distribution
- Unity ML-Agents Toolkit for reinforcement learning demos
- NVIDIA Isaac Sim SDK with Omniverse for digital twin workflows
- Vision-Language-Action (VLA) architectures based on published research (RT-1, RT-2, PaLM-E patterns)
- All hardware recommendations MUST specify minimum specs (GPU, RAM, Jetson model)

### II. Modular, Extensible Content Architecture

Content MUST be structured as independent, reusable modules. Each module (ROS 2, Gazebo/Unity, Isaac, VLA) can be read, tested, and understood in isolation, with clearly documented dependencies.

**Rationale**: Enables instructors to customize course sequences, students to skip prerequisites they already know, and future AI agents to personalize learning paths.

**Non-Negotiable Rules**:
- Each module defined as a Docusaurus docs category with standalone landing page
- Cross-module dependencies explicitly listed in front matter
- Code snippets self-contained (include imports, assume minimal setup)
- Diagrams include alt text describing architecture for RAG indexing
- Every module includes: Learning Objectives → Theory → Hands-On Lab → Assessment Questions

### III. Accessibility & Inclusive Design

The textbook MUST be accessible to diverse learners via responsive design, semantic HTML, multilingual support (English/Urdu toggle), and multiple learning modalities (text, code, diagrams, video placeholders).

**Rationale**: Robotics education has historically excluded non-English speakers, students without high-end hardware, and learners with disabilities. This constitution commits to breaking those barriers.

**Non-Negotiable Rules**:
- Mobile-responsive design (works on tablets, laptops without GPU)
- Semantic HTML5 (`<article>`, `<section>`, `<code>`) for screen readers and RAG parsing
- Urdu translation toggle per chapter (stored client-side, no backend dependency initially)
- Video placeholders with transcripts or detailed alt descriptions
- Simulation alternatives for students without RTX GPU (cloud Colab notebooks, lower-fidelity demos)

### IV. Deployment-First Development

Every feature MUST be deployable to production (GitHub Pages or Vercel) from day one. No "local-only" development without CI/CD path. All commits to main branch MUST trigger automated builds and previews.

**Rationale**: Hackathon context requires live demo URL at submission. Development without deployment strategy leads to last-minute integration failures.

**Non-Negotiable Rules**:
- GitHub Actions workflow for automated build/deploy on push to main
- Deployment target configured (GitHub Pages base URL or Vercel project)
- All dependencies pinned (package.json, requirements.txt) to avoid "works on my machine"
- Build errors MUST fail CI/CD (zero tolerance for silent failures)
- Environment variables documented in `.env.example` if needed (though client-side app minimizes this)

### V. Privacy-Respecting Personalization

User data collection (via Better Auth) MUST be minimal, transparent, and serve personalization features. No tracking for analytics. No third-party data sharing. Users MUST understand what data enables which features.

**Rationale**: Education platforms often over-collect data. This project models privacy-first AI personalization aligned with GDPR/CCPA principles.

**Non-Negotiable Rules**:
- Better Auth collects only: email, hashed password, user background (programming level, hardware access, learning goals)
- User background stored in Neon Serverless PostgreSQL, never sold or shared
- Personalization is opt-in (users can skip signup and read textbook anonymously)
- Clear privacy policy in footer: "We collect X to enable Y. Data never shared. Delete account anytime."
- RAG chatbot queries NOT logged unless user explicitly opts in for improvement feedback

### VI. Semantic Content for RAG Intelligence

All content MUST be structured for vector retrieval. Chapter text, code comments, diagram alt text, and error messages MUST use descriptive language optimized for embedding models (e.g., OpenAI text-embedding-ada-002).

**Rationale**: The RAG chatbot is a differentiating feature. Poor content structure yields irrelevant retrieval, undermining the AI tutor experience.

**Non-Negotiable Rules**:
- Headings describe concepts explicitly ("ROS 2 Publisher-Subscriber Pattern" not "How It Works")
- Code snippets include docstrings explaining purpose, not just syntax
- Error messages suggest fixes ("If `roscore` fails, ensure ROS 2 sourced: `source /opt/ros/humble/setup.bash`")
- Diagrams accompanied by 2-3 sentence alt text describing architecture flow
- Markdown front matter includes `keywords` array for each page (e.g., `keywords: [ROS 2, pub-sub, topic, message]`)

### VII. Iterative, Testable Delivery

Features MUST ship incrementally with testable acceptance criteria. No "big bang" releases. Every PR MUST deliver a vertical slice (e.g., "Module 1 Week 1 content + deployment" not "all content skeletons").

**Rationale**: Hackathon timeline demands frequent validation. Incremental delivery enables course-correction based on user feedback (instructor review, peer testing).

**Non-Negotiable Rules**:
- Each feature branch represents one vertical slice (spec → plan → tasks → implementation → deployed)
- PRs include acceptance test (e.g., "Navigate to /docs/module1/week1, verify code snippet runs")
- Deployment previews generated for every PR (Vercel preview URLs or GitHub Pages staging)
- No merge without: (1) CI passing, (2) deployment preview verified, (3) peer review (if team size > 1)

## Technical Architecture

**Frontend**:
- Docusaurus v3 (React + MD)
- Markdown for content
- Client-side state management (Zustand or Context API) for personalization toggles
- Responsive CSS (mobile-first, tablet breakpoints at 768px, desktop at 1024px)

**Backend** (future phase, optional for base 100 points):
- FastAPI for RAG chatbot API (`/api/chat` endpoint)
- OpenAI Agents SDK or ChatKit for conversational interface
- Qdrant Cloud Free Tier for vector storage (chapter embeddings)
- Neon Serverless PostgreSQL for user profiles (Better Auth integration)

**Authentication** (bonus feature, +50 points):
- Better Auth (https://www.better-auth.com/) for signup/signin
- Collects: email, password (hashed), programming experience (beginner/intermediate/advanced), hardware access (RTX GPU yes/no, Jetson model, robot type), learning goals (free text)

**Deployment**:
- Primary: GitHub Pages with custom domain support OR Vercel (free tier)
- CI/CD: GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Preview deployments: Vercel automatic PR previews OR Netlify Deploy Previews (if switching from GitHub Pages)

**Content Structure**:
```
docs/
├── intro.md                          # Course overview, prerequisites
├── module1-ros2/                     # The Robotic Nervous System
│   ├── week1-setup.md               # ROS 2 installation, first node
│   ├── week2-pubsub.md              # Publisher-Subscriber pattern
│   └── week3-services.md            # ROS 2 services and actions
├── module2-digital-twin/             # Gazebo & Unity
│   ├── week4-gazebo.md              # Gazebo simulation setup
│   ├── week5-urdf.md                # Robot description (URDF/Xacro)
│   └── week6-unity.md               # Unity ML-Agents integration
├── module3-isaac/                    # NVIDIA Isaac
│   ├── week7-isaac-sim.md           # Isaac Sim basics, Omniverse
│   ├── week8-isaac-gym.md           # Reinforcement learning in Isaac Gym
│   └── week9-synthetic-data.md      # Synthetic data generation
├── module4-vla/                      # Vision-Language-Action
│   ├── week10-vla-intro.md          # VLA architectures (RT-1, RT-2)
│   ├── week11-vision.md             # Vision models (CLIP, ViT)
│   └── week12-action.md             # Action prediction, policy learning
└── capstone/
    └── week13-project.md             # Autonomous Humanoid project
```

## Content & Learning Design

**Weekly Structure** (13 weeks total):
- Each week = 1 MD file in appropriate module folder
- Week file includes:
  - **Learning Objectives** (3-5 bullet points)
  - **Prerequisites** (links to prior weeks)
  - **Theory** (conceptual explanation with diagrams)
  - **Hands-On Lab** (code walkthrough with ROS 2/Gazebo/Isaac commands)
  - **Hardware Recommendations** (RTX GPU specs, Jetson models, robot kits)
  - **Common Errors & Fixes** (troubleshooting section)
  - **Assessment Questions** (5-10 multiple choice or short answer)
  - **Further Reading** (links to official docs, research papers)

**Capstone Project** (Week 13):
- Build an autonomous humanoid robot with voice-to-action pipeline
- Pipeline: Voice input (Whisper) → LLM reasoning (GPT-4) → Action plan (VLA model) → ROS 2 execution (Gazebo/Isaac Sim)
- Deliverable: Simulation video + code repository
- Rubric provided in `docs/capstone/week13-project.md`

**Personalization Features** (+50 points each):
1. **Per-Chapter Personalization**: Button triggers AI rewrite of current chapter based on user background (e.g., "Simplify for beginners" or "Add advanced GPU optimization tips")
2. **Urdu Translation Toggle**: Client-side switch stores preference, fetches Urdu markdown from `/docs-ur/` mirror (pre-translated or AI-translated during build)

## Governance

**Amendment Process**:
1. Proposed changes to this constitution MUST be documented in an Architecture Decision Record (ADR) under `history/adr/`.
2. ADR MUST include: Context, Decision, Consequences, Alternatives Considered.
3. Constitution version incremented per semantic versioning:
   - **MAJOR** (e.g., 1.0.0 → 2.0.0): Remove or redefine a core principle (backward incompatible)
   - **MINOR** (e.g., 1.0.0 → 1.1.0): Add new principle, expand guidance materially
   - **PATCH** (e.g., 1.0.0 → 1.0.1): Clarifications, typos, wording improvements
4. All team members (or instructor, if solo project) MUST approve MAJOR/MINOR changes.

**Compliance**:
- Every feature spec (`specs/*/spec.md`) MUST include "Constitution Alignment" section referencing relevant principles.
- Every implementation plan (`specs/*/plan.md`) MUST pass "Constitution Check" gate before Phase 0 research.
- PRs violating principles (e.g., hard-coded API keys, inaccessible UI) MUST be rejected with reference to specific principle.

**Complexity Justification**:
- If a design violates a principle (e.g., adding a complex backend when client-side would suffice), the plan MUST include "Complexity Tracking" table with:
  - Violation description
  - Why it's necessary (user value, technical constraint)
  - Simpler alternative rejected and why

**Documentation Standards**:
- Constitution supersedes all other practices.
- `CLAUDE.md` provides runtime development guidance (agent behavior, PHR creation, ADR suggestions).
- Templates in `.specify/templates/` MUST align with constitution principles.
- Conflicts between constitution and templates: constitution wins. Update templates via amendment process.

**Version**: 1.0.1 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
