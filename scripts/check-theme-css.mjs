#!/usr/bin/env node
/**
 * Guard against a stale assets/theme.css after design-system cheesecake
 * owns component CSS (mega-menu, bento, …). Fail closed when global.css
 * imports cheesecake but the compiled bundle is missing required markers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const globalCssPath = path.join(root, 'styles', 'global.css');
const themeCssPath = path.join(root, 'assets', 'theme.css');

const CHEESECAKE_IMPORT = 'themes/cheesecake.css';

/** Markers that must appear when cheesecake (via DS base.css) is the theme source. */
const REQUIRED_MARKERS = [
  'mega-menu-grid',
  'bento-grid',
  'marquee',
  'product-review',
  'predictive-search',
  'article-f-pattern',
];

const globalCss = fs.readFileSync(globalCssPath, 'utf8');
if (!globalCss.includes(CHEESECAKE_IMPORT)) {
  process.stdout.write(
    `check-theme-css: skip (styles/global.css does not import ${CHEESECAKE_IMPORT})\n`,
  );
  process.exit(0);
}

if (!fs.existsSync(themeCssPath)) {
  process.stderr.write('check-theme-css: assets/theme.css is missing\n');
  process.exit(1);
}

const themeCss = fs.readFileSync(themeCssPath, 'utf8');
const missing = REQUIRED_MARKERS.filter((marker) => !themeCss.includes(marker));

if (missing.length > 0) {
  process.stderr.write(
    'check-theme-css: assets/theme.css is stale or incomplete after cheesecake import.\n' +
      `Missing markers: ${missing.join(', ')}\n` +
      'Run: npm run build:css\n',
  );
  process.exit(1);
}

process.stdout.write(
  `check-theme-css: ok (${REQUIRED_MARKERS.length} markers present)\n`,
);
