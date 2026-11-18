#!/usr/bin/env node
/**
 * Validate template JSON with an explicit allowlist for known-bad files (baseline 40/42).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'ci', 'template-json-baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const templatesDir = path.join(root, 'templates');

const SHOPIFY_HEADER = /^\/\*[\s\S]*?\*\/\s*/;

function stripShopifyHeader(source) {
  return source.replace(SHOPIFY_HEADER, '');
}

function collectJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allowSet = new Set(baseline.allowedParseFailures);
const allFiles = collectJsonFiles(templatesDir);

if (allFiles.length !== baseline.totalFiles) {
  console.error(
    `test:templates:ci expected ${baseline.totalFiles} JSON template(s), found ${allFiles.length}`,
  );
  process.exit(1);
}

const failures = [];

for (const filePath of allFiles) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  const raw = fs.readFileSync(filePath, 'utf8');
  const jsonBody = stripShopifyHeader(raw);
  try {
    JSON.parse(jsonBody);
  } catch (error) {
    failures.push({ relative, message: error.message });
  }
}

const unexpected = failures.filter((f) => !allowSet.has(f.relative));
const missingAllowed = [...allowSet].filter(
  (allowed) => !failures.some((f) => f.relative === allowed),
);

if (unexpected.length > 0) {
  for (const { relative, message } of unexpected) {
    console.error(`${relative}: ${message}`);
  }
  console.error(
    `test:templates:ci failed: ${unexpected.length} unexpected parse failure(s) ` +
      `(allowed only: ${[...allowSet].join(', ')})`,
  );
  process.exit(1);
}

if (missingAllowed.length > 0) {
  console.error(
    `test:templates:ci failed: baseline allowlist file(s) now parse OK (update baseline): ${missingAllowed.join(', ')}`,
  );
  process.exit(1);
}

const passed = allFiles.length - failures.length;
console.log(
  `test:templates:ci OK: ${passed}/${allFiles.length} parsed; ` +
    `${failures.length} expected failure(s): ${[...allowSet].join(', ')}`,
);