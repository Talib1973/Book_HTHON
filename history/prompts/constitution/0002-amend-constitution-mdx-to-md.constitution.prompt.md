---
id: 0002
title: Amend constitution MDX to MD
stage: constitution
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: talib1973
command: /sp.constitution (amendment)
labels: ["constitution", "amendment", "technical-clarification", "markdown"]
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

```text
Please change from Docusaurus v3 (React + MDX) to Docusaurus v3 (React + MD) in the sp.constitution prompt, after this I will give you sp.specify prompt
```

## Response snapshot

Amended constitution from v1.0.0 to v1.0.1 (PATCH-level change) to clarify content format from MDX (Markdown + JSX) to MD (plain Markdown).

**Changes made**:
1. **Principle VI** (.specify/memory/constitution.md:106): "MDX front matter" → "Markdown front matter"
2. **Technical Architecture - Frontend** (.specify/memory/constitution.md:124): "MDX for interactive content (embed React components in markdown)" → "Markdown for content"
3. **Content & Learning Design - Weekly Structure** (.specify/memory/constitution.md:170): "Each week = 1 MDX file" → "Each week = 1 MD file"
4. **Version** (.specify/memory/constitution.md:219): 1.0.0 → 1.0.1
5. **Sync Impact Report**: Updated to reflect v1.0.1 amendment rationale

**Rationale for PATCH version bump**: This is a technical clarification of content file format, not a new principle or backward-incompatible change. Simplifies content authoring by removing JSX/React component embedding requirement.

## Outcome

- ✅ Impact: Constitution now specifies plain Markdown (.md) instead of MDX (.mdx) for textbook content files
- 🧪 Tests: None (documentation artifact)
- 📁 Files: Updated .specify/memory/constitution.md (5 edits)
- 🔁 Next prompts: User will provide /sp.specify prompt to create feature specification
- 🧠 Reflection: MD format simplifies content authoring and aligns with standard Docusaurus usage. Removes complexity of JSX in markdown while preserving all required features (front matter, code blocks, diagrams).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Version increment correct (PATCH) (PASS), Sync Impact Report updated (PASS), all MDX references replaced (PASS)
- Prompt variant (if applicable): User-requested amendment (interactive)
- Next experiment (smallest change to try): Validate MD format in /sp.specify content structure specification
