# Contracts Directory

This directory contains contract templates and configuration snippets for the Physical AI & Humanoid Robotics Textbook.

**Full contract definitions are embedded in**: `../plan.md` (Phase 1: Design & Contracts section)

## Files (Defined in plan.md)

1. **content-template.md**: Template for each week's MD file
   - See plan.md lines 316-480 for full template
   - Includes all required sections: learning objectives, code snippets, diagrams, assessment questions

2. **sidebars-config.ts**: Sidebar navigation structure
   - See plan.md lines 482-534 for full TypeScript configuration
   - Defines 4 module categories with nested week items

3. **docusaurus-config.ts**: Docusaurus configuration snippets
   - See plan.md lines 536-652 for full TypeScript configuration
   - Includes dual deployment support (GitHub Pages / Vercel)

## Usage

During implementation (Phase 2: Tasks):
1. Copy `content-template.md` from plan.md to create each week's MD file
2. Use `sidebars-config.ts` structure to build `sidebars.ts` in repository root
3. Use `docusaurus-config.ts` snippets to build `docusaurus.config.ts` in repository root

## Quick Reference

**Content Template Sections** (from plan.md):
- Front matter: id, title, sidebar_position, keywords, dependencies
- Learning Objectives (3-5 items)
- Prerequisites (knowledge + hardware/software)
- Conceptual Explanation (theory + diagrams)
- Hands-On Lab (code examples + expected outputs)
- Common Errors & Fixes (troubleshooting)
- External Resources (official docs, tutorials)
- Assessment Questions (5-10 items)
- Further Reading (research papers, advanced topics)

**Sidebar Structure** (from plan.md):
- Intro page
- 4 Module categories
  - Module 1: ROS 2 (Weeks 3-5)
  - Module 2: Gazebo & Unity (Weeks 6-7)
  - Module 3: NVIDIA Isaac (Weeks 8-10)
  - Module 4: VLA (Weeks 11-13)
- Capstone project

**Docusaurus Config** (from plan.md):
- Deployment: Dual support (GitHub Pages `/Book_HTHON/` or Vercel `/`)
- i18n: English default (Urdu future enhancement)
- Prism: Python, Bash, YAML, XML syntax highlighting
- Theme: Dark/light mode, responsive navbar
