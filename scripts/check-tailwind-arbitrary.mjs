#!/usr/bin/env node
/**
 * Fail when Liquid uses Tailwind arbitrary-value / arbitrary-variant classes
 * that are absent from the compiled theme bundle (assets/theme.css).
 *
 * Scans layout/, sections/, snippets/, blocks/, templates/ (.liquid + .json).
 * Extracts bracket tokens from HTML `class` attributes and from quoted Liquid
 * strings that look like class lists (e.g. section_padding assigns).
 *
 * Usage:
 *   node scripts/check-tailwind-arbitrary.mjs [--build] [--self-test]
 *
 *   --build     Run `npm run build:css` first so checks use fresh CSS.
 *   --self-test Run built-in positive/negative fixture tests and exit.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const themeCssPath = path.join(root, 'assets', 'theme.css');

const SCAN_DIRS = ['layout', 'sections', 'snippets', 'blocks', 'templates'];
const SCAN_EXT = new Set(['.liquid', '.json']);

/** Variant prefixes that Tailwind emits as trailing selector pseudos. */
const PSEUDO_VARIANTS = new Set([
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'active',
  'visited',
  'disabled',
]);

/** Arbitrary utility (px-[1rem]) or arbitrary variant ([&_svg]:size-full). */
const ARBITRARY_TOKEN =
  /(?:[A-Za-z][\w-]*:)*[A-Za-z][\w-]*-\[[^\s"'`<>]+?\]|\[[^\s"'`<>]+?\]:[A-Za-z][\w-]*(?:-\[[^\s"'`<>]+?\])?/g;

const CLASS_ATTR =
  /class\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/gi;

const ASSIGN_STRING =
  /(?:^|[\s{])(?:assign|echo)\s+[^'"`\n]*?=\s*(['"])([\s\S]*?)\1/gim;

const JSON_STRING = /"(?:[^"\\]|\\.)*"/g;

function escapeForSelector(className) {
  return className.replace(/([\\:\[\].#%])/g, '\\$1');
}

/**
 * Tailwind encodes the full class (variants + utility) and appends a pseudo
 * for the rightmost interactive variant (hover:, focus:, …).
 */
function selectorNeedle(className) {
  if (className.startsWith('[')) {
    return '.' + escapeForSelector(className);
  }
  const segments = className.split(':');
  if (segments.length < 2) {
    return '.' + escapeForSelector(className);
  }
  const variants = segments.slice(0, -1);
  let suffix = '';
  for (let i = variants.length - 1; i >= 0; i--) {
    if (PSEUDO_VARIANTS.has(variants[i])) {
      suffix = `:${variants[i]}`;
      break;
    }
  }
  return '.' + escapeForSelector(className) + suffix;
}

function classPresentInCss(css, className) {
  return css.includes(selectorNeedle(className));
}

function extractTokensFromText(text) {
  const found = new Set();
  for (const match of text.matchAll(ARBITRARY_TOKEN)) {
    found.add(match[0]);
  }
  return [...found];
}

function collectFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    walk(abs, files);
  }
  return files.sort();
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXT.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function scanFile(filePath, css) {
  const rel = path.relative(root, filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath);
  const missing = [];

  const report = (className, line) => {
    if (!classPresentInCss(css, className)) {
      missing.push({ file: rel, line, className });
    }
  };

  if (ext === '.liquid') {
    for (const match of text.matchAll(CLASS_ATTR)) {
      const value = match[1] ?? match[2] ?? match[3] ?? '';
      if (value.includes('{{') || value.includes('{%')) continue;
      const line = lineNumberAt(text, match.index);
      for (const token of extractTokensFromText(value)) {
        report(token, line);
      }
    }

    for (const match of text.matchAll(ASSIGN_STRING)) {
      const value = match[2];
      const line = lineNumberAt(text, match.index);
      for (const token of extractTokensFromText(value)) {
        report(token, line);
      }
    }
  } else if (ext === '.json') {
    for (const match of text.matchAll(JSON_STRING)) {
      const inner = match[0].slice(1, -1);
      if (!inner.includes('-[') && !inner.includes(']:')) continue;
      const line = lineNumberAt(text, match.index);
      for (const token of extractTokensFromText(inner)) {
        report(token, line);
      }
    }
  }

  return missing;
}

function runCheck({ build = false } = {}) {
  if (build) {
    execSync('npm run build:css', { cwd: root, stdio: 'inherit' });
  } else if (!fs.existsSync(themeCssPath)) {
    process.stderr.write(
      'check-tailwind-arbitrary: assets/theme.css missing — run npm run build:css or pass --build\n',
    );
    process.exit(1);
  }

  const css = fs.readFileSync(themeCssPath, 'utf8');
  const allMissing = [];
  for (const file of collectFiles()) {
    allMissing.push(...scanFile(file, css));
  }

  if (allMissing.length > 0) {
    process.stderr.write(
      'check-tailwind-arbitrary: arbitrary Tailwind classes not present in assets/theme.css\n',
    );
    for (const { file, line, className } of allMissing) {
      process.stderr.write(`${file}:${line}:${className}\n`);
    }
    process.stderr.write('Run: npm run build:css (after adding classes to @source / content)\n');
    process.exit(1);
  }

  process.stdout.write(
    `check-tailwind-arbitrary: ok (scanned ${collectFiles().length} files)\n`,
  );
}

function runSelfTest() {
  const sampleCss = [
    '.min-w-\\[85vw\\]{min-width:85vw}',
    '.z-\\[1\\]{z-index:1}',
    '.px-\\[4\\.5rem\\]{padding-inline:4.5rem}',
    '.hover\\:bg-\\[red\\]:hover{background:red}',
    '.md\\:px-\\[2rem\\]{padding-inline:2rem}',
    '.\\[\\&_svg\\]\\:size-full svg{width:100%}',
  ].join('');

  const cases = [
  { className: 'min-w-[85vw]', css: sampleCss, expect: true },
  { className: 'z-[1]', css: sampleCss, expect: true },
  { className: 'px-[4.5rem]', css: sampleCss, expect: true },
  { className: 'hover:bg-[red]', css: sampleCss, expect: true },
  { className: 'md:px-[2rem]', css: sampleCss, expect: true },
  { className: '[&_svg]:size-full', css: sampleCss, expect: true },
  { className: 'min-w-[99vw]', css: sampleCss, expect: false },
  { className: 'bg-[missing]', css: sampleCss, expect: false },
];

  for (const { className, css, expect } of cases) {
    const got = classPresentInCss(css, className);
    if (got !== expect) {
      process.stderr.write(
        `self-test failed for ${className}: expected ${expect}, got ${got} (needle ${selectorNeedle(className)})\n`,
      );
      process.exit(1);
    }
  }

  const fixtureLiquid = `{% assign section_padding = 'py-36 px-[4.5rem]' %}
<div class="z-[1] hover:bg-[red] min-w-[85vw]"></div>`;
  const tokens = new Set();
  for (const m of fixtureLiquid.matchAll(CLASS_ATTR)) {
    for (const t of extractTokensFromText(m[1] ?? '')) tokens.add(t);
  }
  for (const m of fixtureLiquid.matchAll(ASSIGN_STRING)) {
    for (const t of extractTokensFromText(m[2])) tokens.add(t);
  }
  const expectedExtracted = new Set([
    'px-[4.5rem]',
    'z-[1]',
    'hover:bg-[red]',
    'min-w-[85vw]',
  ]);
  for (const t of expectedExtracted) {
    if (!tokens.has(t)) {
      process.stderr.write(`self-test extract missing token: ${t}\n`);
      process.exit(1);
    }
  }

  process.stdout.write('check-tailwind-arbitrary: self-test ok\n');
}

const args = process.argv.slice(2);
if (args.some((a) => a === '--self-test')) {
  runSelfTest();
} else {
  runCheck({ build: args.includes('--build') });
}