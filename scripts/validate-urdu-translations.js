#!/usr/bin/env node
/**
 * T032: Structural validation for Urdu translations.
 *
 * For each .md file in static/docs-ur/, finds its English counterpart in docs/
 * and asserts:
 *   1. Identical count of code fences (```)
 *   2. Every fenced code block in English appears verbatim in Urdu
 *   3. Identical heading count at each level (h1-h4)
 *   4. Warns on any prose paragraph that is byte-identical to English
 *      (likely untranslated) — excludes code blocks and bare URLs
 *
 * Exits 0 if all files PASS, 1 if any FAIL.
 */

const fs = require('fs');
const path = require('path');

const URDU_DIR  = path.resolve(__dirname, '..', 'static', 'docs-ur');
const EN_DIR    = path.resolve(__dirname, '..', 'docs');

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripFrontMatter(text) {
  // Remove YAML front matter between --- delimiters
  return text.replace(/^---[\s\S]*?---\s*/, '');
}

function extractCodeBlocks(text) {
  const blocks = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

function countCodeFences(text) {
  return (text.match(/```/g) || []).length;
}

function countHeadingsByLevel(text) {
  const counts = { h1: 0, h2: 0, h3: 0, h4: 0 };
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s/);
    if (m) {
      counts[`h${m[1].length}`]++;
    }
  }
  return counts;
}

function extractProseParagraphs(text) {
  // Strip code blocks first, then split on blank lines
  const stripped = text.replace(/```[^\n]*\n[\s\S]*?```/g, '');
  return stripped
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('<') && !p.startsWith('!') && !p.startsWith('[') && !p.startsWith('-') && !p.match(/^https?:\/\//));
}

// ── Walk docs-ur/ recursively ────────────────────────────────────────────────

function walkDir(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      files = files.concat(walkDir(path.join(dir, e.name), base));
    } else if (e.name.endsWith('.md')) {
      files.push(path.relative(base, path.join(dir, e.name)));
    }
  }
  return files;
}

// ── Map Urdu path → English path ─────────────────────────────────────────────

function urduToEnglish(urduRelPath) {
  // static/docs-ur/intro.md → docs/intro.md
  // static/docs-ur/module-1-ros2/index.md → docs/module-1-ros2/index.md
  return urduRelPath; // same relative structure
}

// ── Main ─────────────────────────────────────────────────────────────────────

const urduFiles = walkDir(URDU_DIR, URDU_DIR);
let allPassed = true;
const results = [];

for (const relPath of urduFiles.sort()) {
  const urduFullPath = path.join(URDU_DIR, relPath);
  const enFullPath   = path.join(EN_DIR, urduToEnglish(relPath));

  if (!fs.existsSync(enFullPath)) {
    results.push({ file: relPath, status: 'SKIP', reason: `No English counterpart at docs/${relPath}` });
    continue;
  }

  const urduRaw = fs.readFileSync(urduFullPath, 'utf8');
  const enRaw   = fs.readFileSync(enFullPath, 'utf8');

  const urduText = stripFrontMatter(urduRaw);
  const enText   = stripFrontMatter(enRaw);

  const errors = [];
  const warnings = [];

  // 1. Code fence count
  const urduFences = countCodeFences(urduText);
  const enFences   = countCodeFences(enText);
  if (urduFences !== enFences) {
    errors.push(`Code fence count mismatch: English=${enFences}, Urdu=${urduFences}`);
  }

  // 2. Code block verbatim check
  const enBlocks  = extractCodeBlocks(enText);
  const urduBlocks = extractCodeBlocks(urduText);
  for (let i = 0; i < enBlocks.length; i++) {
    if (!urduText.includes(enBlocks[i])) {
      errors.push(`Code block #${i + 1} from English not found verbatim in Urdu (first 60 chars: "${enBlocks[i].slice(0, 60).replace(/\n/g, '\\n')}")`);
    }
  }

  // 3. Heading count parity
  const enHeadings  = countHeadingsByLevel(enText);
  const urduHeadings = countHeadingsByLevel(urduText);
  for (const level of ['h1', 'h2', 'h3', 'h4']) {
    if (enHeadings[level] !== urduHeadings[level]) {
      errors.push(`${level} count mismatch: English=${enHeadings[level]}, Urdu=${urduHeadings[level]}`);
    }
  }

  // 4. Untranslated prose warning
  const enParagraphs  = extractProseParagraphs(enText);
  const urduParagraphs = new Set(extractProseParagraphs(urduText));
  for (const p of enParagraphs) {
    if (p.length > 20 && urduParagraphs.has(p)) {
      warnings.push(`Possibly untranslated paragraph (first 80 chars): "${p.slice(0, 80)}"`);
    }
  }

  const status = errors.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') allPassed = false;
  results.push({ file: relPath, status, errors, warnings });
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════');
console.log('  Urdu Translation Structural Validation');
console.log('═══════════════════════════════════════════════════\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '○';
  console.log(`  ${icon} ${r.status.padEnd(6)} ${r.file}`);
  if (r.errors) {
    for (const e of r.errors) console.log(`         ERROR: ${e}`);
  }
  if (r.warnings) {
    for (const w of r.warnings) console.log(`         WARN:  ${w}`);
  }
}

console.log('\n───────────────────────────────────────────────────');
console.log(`  Overall: ${allPassed ? 'PASS ✓' : 'FAIL ✗'} (${results.filter(r => r.status === 'PASS').length}/${results.length} files passed)`);
console.log('───────────────────────────────────────────────────\n');

process.exit(allPassed ? 0 : 1);
