# Quickstart Guide: Physical AI & Humanoid Robotics Textbook

**Date**: 2026-01-15
**Phase**: 1 (Design & Contracts)
**Purpose**: Step-by-step instructions for local development, building, deploying, and validating the Docusaurus textbook

---

## Prerequisites

**Required Software**:
- Node.js 18+ (LTS) - [Download](https://nodejs.org/)
- npm (included with Node.js)
- Git
- Code editor (VS Code recommended)

**Verify Installation**:
```bash
node --version   # Should be v18.x or higher
npm --version    # Should be 9.x or higher
git --version    # Any recent version
```

**Optional**:
- GitHub CLI (`gh`) for PR management
- Vercel CLI (`vercel`) for manual Vercel deployments

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/talib1973/Book_HTHON.git
cd Book_HTHON
```

### 2. Install Dependencies

```bash
# Install all dependencies from package.json
npm install

# This installs:
# - Docusaurus v3 core
# - React 18.x
# - TypeScript 5.x
# - Prism (syntax highlighting)
# - gh-pages (GitHub Pages deployment)
```

**Expected Output**:
```
added 1234 packages, and audited 1235 packages in 30s
found 0 vulnerabilities
```

### 3. Start Development Server

```bash
npm run start
```

**What This Does**:
1. Compiles TypeScript configuration (`docusaurus.config.ts`, `sidebars.ts`)
2. Builds static site in memory (no `/build` directory yet)
3. Starts local server at `http://localhost:3000`
4. Enables hot-reload (changes to MD files refresh automatically)

**Expected Output**:
```
[SUCCESS] Docusaurus website is running at: http://localhost:3000/Book_HTHON/
```

**Navigate To**:
- Homepage: `http://localhost:3000/Book_HTHON/`
- Module 1 Week 3: `http://localhost:3000/Book_HTHON/module-1-ros2/week-3-ros2-architecture`

**Hot-Reload Testing**:
1. Open `docs/module-1-ros2/week-3-ros2-architecture.md` in editor
2. Edit any text
3. Save file
4. Browser refreshes automatically within 1-2 seconds

**Stop Server**: `Ctrl+C`

---

## Build for Production

### 1. Create Production Build

```bash
npm run build
```

**What This Does**:
1. Compiles all MD files to HTML
2. Bundles React components
3. Optimizes assets (CSS, JS minification)
4. Generates static site in `/build` directory

**Expected Output**:
```
[SUCCESS] Generated static files in "build"
[INFO] Use `npm run serve` to test the build locally.
```

**Build Directory Structure**:
```
build/
├── index.html                          # Homepage
├── module-1-ros2/
│   ├── week-3-ros2-architecture/
│   │   └── index.html                  # Week 3 page
│   ├── week-4-pub-sub/
│   │   └── index.html                  # Week 4 page
│   └── ...
├── assets/                             # Minified CSS, JS
└── img/                                # Static images
```

### 2. Serve Build Locally

```bash
npm run serve
```

**What This Does**:
1. Starts simple HTTP server serving `/build` directory
2. Runs at `http://localhost:3000` (same as dev server)
3. Simulates production environment (no hot-reload)

**Use Cases**:
- Test before deployment (verify all pages load, no 404s)
- Check syntax highlighting (code blocks render correctly)
- Test mobile responsiveness (use Chrome DevTools device emulator)

**Stop Server**: `Ctrl+C`

### 3. Clean Build (If Needed)

```bash
# Remove /build directory and .docusaurus cache
npm run clear

# Then rebuild
npm run build
```

**When to Clean**:
- Stale cache issues (changes not reflecting)
- Sidebar navigation errors
- Broken links that persist after fixing MD files

---

## Deploy to GitHub Pages

### Option 1: Automated Deployment (Recommended)

**Setup** (One-Time):
1. Ensure GitHub Actions workflow exists: `.github/workflows/deploy.yml`
2. Repository Settings > Pages > Source: "Deploy from a branch"
3. Branch: `gh-pages` (will be auto-created on first deployment)

**Deploy**:
```bash
# 1. Commit changes
git add .
git commit -m "Add Week 3 content"

# 2. Push to main branch
git push origin main

# 3. GitHub Actions automatically:
#    - Runs npm ci (install dependencies)
#    - Runs npm run build
#    - Deploys to gh-pages branch
#    - Available at https://talib1973.github.io/Book_HTHON/ within 1-2 minutes
```

**Monitor Deployment**:
- GitHub > Actions tab > View workflow run
- Green checkmark = deployment succeeded
- Red X = build failed (check logs for errors)

**Verify Deployment**:
- Visit: `https://talib1973.github.io/Book_HTHON/`
- Check Module 1 Week 3: `https://talib1973.github.io/Book_HTHON/module-1-ros2/week-3-ros2-architecture`

### Option 2: Manual Deployment

```bash
# Set GitHub username
export GIT_USER=talib1973

# Deploy (builds + pushes to gh-pages branch)
npm run deploy
```

**What This Does**:
1. Runs `npm run build` (creates `/build` directory)
2. Pushes `/build` contents to `gh-pages` branch
3. GitHub Pages serves from `gh-pages` branch

**Expected Output**:
```
[SUCCESS] Deployed to https://talib1973.github.io/Book_HTHON/
```

**Troubleshooting**:
- Error "Permission denied": Ensure `GIT_USER` is set and you have push access
- Error "gh-pages branch not found": First deployment creates it automatically
- 404 errors: Verify `baseUrl: '/Book_HTHON/'` in `docusaurus.config.ts`

---

## Deploy to Vercel

### Option 1: Automated Deployment (Recommended)

**Setup** (One-Time):
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect GitHub repository: `talib1973/Book_HTHON`
4. Configure Build Settings:
   - **Framework Preset**: Docusaurus (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install` (auto-detected)
5. Add Environment Variable:
   - Key: `DEPLOY_TARGET`
   - Value: `vercel`
6. Click "Deploy"

**Deploy**:
```bash
# 1. Commit changes
git add .
git commit -m "Add Week 3 content"

# 2. Push to main branch
git push origin main

# 3. Vercel automatically:
#    - Detects push to main
#    - Runs npm install
#    - Runs npm run build with DEPLOY_TARGET=vercel
#    - Deploys to https://physical-ai-textbook.vercel.app
#    - Available within 30-60 seconds
```

**PR Preview Deployments**:
- Create PR to `main` branch
- Vercel creates preview URL: `https://book-hthon-abc123.vercel.app`
- Each commit to PR updates preview automatically

**Monitor Deployment**:
- Vercel Dashboard > Deployments
- Click deployment to see build logs
- Green "Ready" status = deployment succeeded

### Option 2: Manual Deployment

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**What This Does**:
1. Prompts for project settings (first time only)
   - Project name: `Book_HTHON`
   - Output directory: `build`
2. Runs `npm run build` locally
3. Uploads `/build` to Vercel CDN
4. Returns deployment URL

**Expected Output**:
```
🎉  Deployed to production. https://physical-ai-textbook.vercel.app
```

---

## Accessibility Validation

### 1. Lighthouse Audit

**Steps**:
1. Open site in Chrome: `http://localhost:3000/Book_HTHON/`
2. Open DevTools: `F12` or `Ctrl+Shift+I`
3. Navigate to "Lighthouse" tab
4. Configuration:
   - Mode: Navigation
   - Categories: Performance, Accessibility, Best Practices, SEO
   - Device: Desktop (then repeat with Mobile)
5. Click "Analyze page load"

**Target Scores** (per Technical Context):
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**Common Issues & Fixes**:
- **Accessibility < 90**: Missing alt text on diagrams → Add descriptive alt text to all `<img>` tags
- **Performance < 90**: Large images → Optimize images (< 500KB, use WebP format)
- **SEO < 90**: Missing meta descriptions → Add to `docusaurus.config.ts` themeConfig

### 2. Mobile Responsiveness Testing

**Steps**:
1. Open site in Chrome: `http://localhost:3000/Book_HTHON/`
2. Open DevTools: `F12`
3. Click "Toggle device toolbar": `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
4. Select device presets:
   - **iPad** (768px width) - Minimum viable tablet experience
   - **iPad Pro** (1024px width) - Larger tablet
   - **iPhone SE** (375px width) - Optional (phone not required per scope)

**Validation Checklist**:
- [ ] Text is readable (16px minimum font size, no need to zoom)
- [ ] Code blocks are scrollable horizontally (no text overflow)
- [ ] Navigation is functional:
  - [ ] Sidebar collapses to hamburger menu on mobile (<996px)
  - [ ] Hamburger menu opens/closes on click
  - [ ] All navigation links work
- [ ] Diagrams scale proportionally (no horizontal scroll for images)
- [ ] Buttons/links are clickable (minimum 44x44px tap targets)

**Test Pages**:
- Homepage: `/Book_HTHON/`
- Module landing: `/Book_HTHON/module-1-ros2/`
- Week with code: `/Book_HTHON/module-1-ros2/week-3-ros2-architecture`

### 3. Screen Reader Testing (Optional)

**Windows (Narrator)**:
```
Win + Ctrl + Enter   # Start Narrator
Tab                   # Navigate links
Enter                 # Activate link
Win + Ctrl + Enter   # Stop Narrator
```

**macOS (VoiceOver)**:
```
Cmd + F5              # Start VoiceOver
Cmd + L               # Jump to link list
Ctrl + Option + →    # Next item
Cmd + F5              # Stop VoiceOver
```

**Test**:
- Navigate to Week 3
- Verify VoiceOver/Narrator reads: "Week 3: ROS 2 Architecture, article"
- Navigate to code block
- Verify: "Code block, Python"
- Navigate to diagram
- Verify: Reads full alt text (2-3 sentences)

---

## Content Workflow

### 1. Create New Week File

```bash
# Copy template from existing week
cp docs/module-1-ros2/week-3-ros2-architecture.md docs/module-1-ros2/week-4-pub-sub.md
```

### 2. Edit Front Matter

Open `week-4-pub-sub.md` and update:

```yaml
---
id: week-4-pub-sub                          # Change to match filename
title: "Week 4: ROS 2 Publisher-Subscriber" # Update week number and topic
sidebar_position: 2                         # Increment position
keywords: [ROS 2, publisher, subscriber, topic, message, pub-sub]  # Update keywords
dependencies: [week-3-ros2-architecture]    # Add Week 3 as prerequisite
---
```

### 3. Fill Content Sections

Follow content template structure (see `contracts/README.md` or `plan.md` lines 316-480):

1. **Learning Objectives** (3-5 items)
2. **Prerequisites** (link to Week 3, list software/hardware)
3. **Conceptual Explanation** (what is pub-sub, why it matters, how it works)
4. **Hands-On Lab** (publisher code example, subscriber code example, expected output)
5. **Common Errors & Fixes** (troubleshooting)
6. **External Resources** (ROS 2 docs, tutorials)
7. **Assessment Questions** (5-10 items)
8. **Further Reading** (research papers)

### 4. Add to Sidebar

Edit `sidebars.ts`:

```typescript
{
  type: 'category',
  label: 'Module 1: The Robotic Nervous System (ROS 2)',
  items: [
    'module-1-ros2/index',
    'module-1-ros2/week-3-ros2-architecture',
    'module-1-ros2/week-4-pub-sub',  // Add this line
    'module-1-ros2/week-5-services-actions',
  ],
},
```

### 5. Test Locally

```bash
# Start dev server
npm run start

# Navigate to http://localhost:3000/Book_HTHON/module-1-ros2/week-4-pub-sub
# Verify:
# - Page loads without errors
# - Sidebar shows Week 4 in correct position
# - Code blocks have syntax highlighting
# - Diagrams load (if added)
```

### 6. Build and Verify

```bash
# Build production site
npm run build

# Serve locally
npm run serve

# Navigate to http://localhost:3000/Book_HTHON/module-1-ros2/week-4-pub-sub
# Verify:
# - No 404 errors
# - All links work (click "Week 3" prerequisite link)
# - Code copy button works
```

### 7. Commit and Deploy

```bash
# Stage changes
git add docs/module-1-ros2/week-4-pub-sub.md sidebars.ts

# Commit with descriptive message
git commit -m "Add Week 4: ROS 2 Publisher-Subscriber Pattern

- Added 3 learning objectives
- Included publisher and subscriber code examples
- Added 7 assessment questions
- Prerequisites: Week 3 (ROS 2 Architecture)"

# Push to feature branch
git push origin 001-robotics-textbook

# Create PR (if using GitHub flow)
gh pr create --title "Add Week 4 content" --body "Week 4: ROS 2 Publisher-Subscriber Pattern"

# Merge to main → auto-deploy
```

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run start` | Start dev server (hot-reload) |
| `npm run build` | Build production site |
| `npm run serve` | Serve production build locally |
| `npm run deploy` | Manual deploy to GitHub Pages |
| `npm run clear` | Clear cache and build directory |
| `vercel --prod` | Manual deploy to Vercel |

---

## Troubleshooting

### Error: "Module not found: Error: Can't resolve..."

**Cause**: Missing dependency or TypeScript compilation error

**Solution**:
```bash
# Clear cache
npm run clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Error: "Broken links found"

**Cause**: Incorrect MD links or missing files

**Solution**:
1. Check Docusaurus build output for broken link warnings
2. Verify file paths match sidebar items (e.g., `module-1-ros2/week-3-ros2-architecture` matches `docs/module-1-ros2/week-3-ros2-architecture.md`)
3. Use relative links in MD files: `[Week 3](./week-3-ros2-architecture.md)` not `[Week 3](/week-3-ros2-architecture)`

### Error: "GitHub Pages 404"

**Cause**: Incorrect `baseUrl` in `docusaurus.config.ts`

**Solution**:
- Verify `baseUrl: '/Book_HTHON/'` (must match repository name)
- If using custom domain, set `baseUrl: '/'`

### Error: "Vercel build failed"

**Cause**: Environment variable not set or build command incorrect

**Solution**:
1. Verify Vercel environment variable: `DEPLOY_TARGET=vercel`
2. Check build logs in Vercel dashboard for specific error
3. Test locally: `DEPLOY_TARGET=vercel npm run build`

---

## Quickstart Completion

All setup, build, deployment, and validation procedures documented. Ready for Phase 2: Task generation (`/sp.tasks` command).
