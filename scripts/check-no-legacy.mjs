#!/usr/bin/env node
/**
 * Anti-regression: retired Alpine cart assets, Alpine.store/$store, and (optionally) Bulma.
 *
 * Bulma rules run only when LEGACY_ENFORCE_BULMA=1 (enable after the Bulma-removal PR lands).
 * Alpine x-directives may remain in an explicit allowlist until carousel/hero PRs (#29, #30) merge.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const RETIRED_ASSET_FILENAMES = [
  'cart-store.js',
  'alpine-product-card.js',
  'b-style.css',
  'b-style.source.css',
];

/** Liquid files still allowed to use Alpine directives until follow-up PRs merge. */
const ALPINE_LIQUID_ALLOWLIST = new Set([
  'blocks/b-carousel.liquid',
  'sections/aa-hero-toggle-content.liquid',
  'sections/collection-list.liquid',
  'snippets/_collection-hero-collapsable-content.liquid',
  'snippets/_collection-seo-faqs.liquid',
]);

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'tools',
  'ci',
  'docs',
]);

const THEME_SCAN_DIRS = ['assets', 'blocks', 'layout', 'sections', 'snippets', 'templates'];

const ALPINE_STORE_PATTERNS = [
  /\bAlpine\.store\b/,
  /\$store\./,
  /\$store\[/,
];

/** Attribute-style directives only (avoids `[x-cloak]` rules in inline CSS). */
const ALPINE_DIRECTIVE_PATTERNS = [
  /(?<!\[)\bx-data\s*=/,
  /(?<!\[)\bx-init\s*=/,
  /(?<!\[)\bx-show\s*=/,
  /(?<!\[)\bx-text\s*=/,
  /(?<!\[)\bx-cloak(?:\s|>|=)/,
  /(?<!\[)\bx-model\s*=/,
  /(?<!\[)\bx-bind:/,
  /(?<!\[)\bx-on:/,
  /\bAlpine\.data\b/,
];

/** @click is common in non-Alpine docs; only flag in Liquid with x-data family nearby is hard — skip bare @click. */

const BULMA_BANNED_RE = [
  /\bfrom\s+['"]bulma/i,
  /\bbulma\/css/i,
  /assets\/b-style(?:\.source)?\.css/,
  /\bclass="[^"]*\bb-(?:button|columns|column|box|container|card|content|field|input|label|level|media|navbar|section|title|is-|has-)\b/,
];

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, out);
    else out.push(abs);
  }
  return out;
}

function rel(p) {
  return path.relative(root, p).replaceAll('\\', '/');
}

function isThemeSource(abs) {
  const r = rel(abs);
  if (r.startsWith('docs/')) return false;
  if (r === 'assets/alpine-bundle.js') return false;
  return true;
}

function lineHits(content, patterns) {
  const hits = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (patterns.some((re) => re.test(line))) {
      hits.push({ line: i + 1, text: line.trimEnd() });
    }
  }
  return hits;
}

function collectViolations() {
  const violations = [];

  for (const name of RETIRED_ASSET_FILENAMES) {
    const p = path.join(root, 'assets', name);
    if (fs.existsSync(p)) {
      violations.push({
        kind: 'retired-asset',
        file: `assets/${name}`,
        detail: 'asset file must stay deleted',
      });
    }
  }

  const themeLiquid = path.join(root, 'layout', 'theme.liquid');
  if (fs.existsSync(themeLiquid)) {
    const body = fs.readFileSync(themeLiquid, 'utf8');
    for (const name of RETIRED_ASSET_FILENAMES) {
      if (body.includes(name)) {
        violations.push({
          kind: 'retired-asset-load',
          file: 'layout/theme.liquid',
          detail: `must not load ${name}`,
        });
      }
    }
    if (/\balpinejs\b/i.test(body) || body.includes('cdn.jsdelivr.net/npm/alpinejs')) {
      violations.push({
        kind: 'alpine-cdn',
        file: 'layout/theme.liquid',
        detail: 'do not add Alpine CDN while bundled runtime is retired',
      });
    }
  }

  const files = THEME_SCAN_DIRS.flatMap((d) => walkFiles(path.join(root, d)));

  for (const abs of files) {
    if (!isThemeSource(abs)) continue;
    const r = rel(abs);
    const ext = path.extname(abs).toLowerCase();
  if (!['.liquid', '.js', '.mjs', '.json'].includes(ext)) continue;

    const content = fs.readFileSync(abs, 'utf8');

    const storeHits = lineHits(content, ALPINE_STORE_PATTERNS);
    for (const hit of storeHits) {
      violations.push({
        kind: 'alpine-store',
        file: r,
        line: hit.line,
        detail: hit.text,
      });
    }

    if (ext === '.liquid' && !ALPINE_LIQUID_ALLOWLIST.has(r)) {
      const directiveHits = lineHits(content, ALPINE_DIRECTIVE_PATTERNS);
      for (const hit of directiveHits) {
        violations.push({
          kind: 'alpine-directive',
          file: r,
          line: hit.line,
          detail: hit.text,
        });
      }
    }
  }

  for (const name of ['b-style.css', 'b-style.source.css']) {
    const p = path.join(root, 'assets', name);
    if (fs.existsSync(p)) {
      violations.push({
        kind: 'bulma-asset',
        file: `assets/${name}`,
        detail: 'Bulma CSS bundle must stay deleted',
      });
    }
  }

  if (process.env.LEGACY_ENFORCE_BULMA === '1') {
    const allFiles = walkFiles(root).filter((p) => {
      const r = rel(p);
      return (
        !r.startsWith('docs/') &&
        !r.startsWith('node_modules/') &&
        r !== 'assets/alpine-bundle.js'
      );
    });
    for (const abs of allFiles) {
      const r = rel(abs);
      if (!/\.(liquid|css|js|mjs|json)$/.test(abs)) continue;
      const content = fs.readFileSync(abs, 'utf8');
      const hits = lineHits(content, BULMA_BANNED_RE);
      for (const hit of hits) {
        violations.push({
          kind: 'bulma',
          file: r,
          line: hit.line,
          detail: hit.text.trim(),
        });
      }
    }
  }

  return violations;
}

function runSelfTest() {
  const samples = [
    { text: '  x-data="carousel()"', patterns: ALPINE_DIRECTIVE_PATTERNS },
    { text: 'Alpine.store("cart"', patterns: ALPINE_STORE_PATTERNS },
    { text: "cart-store.js", patterns: [/\bcart-store\.js\b/] },
  ];
  for (const { text, patterns } of samples) {
    if (!patterns.some((re) => re.test(text))) {
      process.stderr.write(`check:no-legacy self-test failed: did not match ${text}\n`);
      process.exit(1);
    }
  }
  process.stdout.write('check:no-legacy: self-test OK (detectors fire on sample patterns)\n');
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }

  const violations = collectViolations();

  if (violations.length > 0) {
    process.stderr.write(`check:no-legacy: ${violations.length} violation(s)\n`);
    for (const v of violations) {
      const loc = v.line ? `${v.file}:${v.line}` : v.file;
      process.stderr.write(`  [${v.kind}] ${loc} — ${v.detail}\n`);
    }
    process.exit(1);
  }

  const bulmaNote =
    process.env.LEGACY_ENFORCE_BULMA === '1'
      ? 'Bulma markup enforcement on.'
      : 'Bulma markup scan off (assets b-style* always blocked).';
  process.stdout.write(
    `check:no-legacy: ok — retired cart Alpine assets blocked; ` +
      `${ALPINE_LIQUID_ALLOWLIST.size} Alpine allowlist file(s); ${bulmaNote}\n`,
  );
}

main();