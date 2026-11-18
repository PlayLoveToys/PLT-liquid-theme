#!/usr/bin/env node
/**
 * Run every snippet harness case under tools/snippet-harness/cases/.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = path.join(root, 'tools', 'snippet-harness', 'cases');
const renderScript = path.join(root, 'tools', 'snippet-harness', 'render.mjs');

const cases = fs
  .readdirSync(casesDir)
  .filter((name) => name.endsWith('.mjs'))
  .map((name) => name.replace(/\.mjs$/, ''))
  .sort();

if (cases.length === 0) {
  console.error('harness: no cases found');
  process.exit(1);
}

let failed = 0;

for (const name of cases) {
  try {
    execFileSync(process.execPath, [renderScript, name], {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    const casePath = path.join(casesDir, `${name}.mjs`);
    const caseMod = await import(pathToFileURL(casePath).href);
    if (typeof caseMod.verify === 'function') {
      await caseMod.verify({root});
    }
    console.log(`harness: ${name} OK`);
  } catch (error) {
    failed += 1;
    const detail = error.stderr?.trim() || error.message;
    console.error(`harness: ${name} FAILED\n${detail}`);
  }
}

console.log(`harness: ${cases.length - failed}/${cases.length} case(s) passed`);

if (failed > 0) {
  process.exit(1);
}