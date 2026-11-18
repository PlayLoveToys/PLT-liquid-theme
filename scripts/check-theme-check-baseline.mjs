#!/usr/bin/env node
/**
 * Run Shopify theme check with a pinned CLI version and enforce a versioned baseline.
 * Fails when errors or warnings exceed ci/theme-check-baseline.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'ci', 'theme-check-baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

const cliPackage = `@shopify/cli@${baseline.shopifyCli}`;

const result = spawnSync(
  'npx',
  ['--yes', cliPackage, 'theme', 'check', '--output', 'json'],
  { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

if (result.error) {
  console.error(`theme-check failed to run: ${result.error.message}`);
  process.exit(1);
}

const raw = (result.stdout || '').trim();
if (!raw) {
  console.error(
    `theme-check produced no JSON output (exit ${result.status ?? 'unknown'})`,
  );
  if (result.stderr?.trim()) {
    console.error(result.stderr.trim());
  }
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  console.error(`theme-check JSON parse error: ${error.message}`);
  process.exit(1);
}
let errors = 0;
let warnings = 0;
for (const file of data) {
  errors += file.errorCount ?? 0;
  warnings += file.warningCount ?? 0;
}

const withinBaseline =
  errors <= baseline.maxErrors && warnings <= baseline.maxWarnings;

console.log(
  `theme-check (@shopify/cli@${baseline.shopifyCli}): ${errors} error(s), ${warnings} warning(s) ` +
    `(baseline ≤ ${baseline.maxErrors}/${baseline.maxWarnings})`,
);

if (!withinBaseline) {
  if (errors > baseline.maxErrors) {
    console.error(
      `theme-check failed: ${errors} errors exceeds baseline max ${baseline.maxErrors}`,
    );
  }
  if (warnings > baseline.maxWarnings) {
    console.error(
      `theme-check failed: ${warnings} warnings exceeds baseline max ${baseline.maxWarnings}`,
    );
  }
  process.exit(1);
}

process.exit(0);