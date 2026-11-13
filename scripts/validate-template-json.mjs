#!/usr/bin/env node
/**
 * Strict JSON parse for Shopify JSON templates (header block comment only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', 'templates');

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

let failed = false;

for (const filePath of collectJsonFiles(templatesDir)) {
  const relative = path.relative(path.join(__dirname, '..'), filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const jsonBody = stripShopifyHeader(raw);
  try {
    JSON.parse(jsonBody);
  } catch (error) {
    failed = true;
    console.error(`${relative}: ${error.message}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`OK: ${collectJsonFiles(templatesDir).length} template JSON file(s) parsed.`);
