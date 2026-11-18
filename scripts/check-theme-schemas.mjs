#!/usr/bin/env node
/**
 * Guardrail: every theme block has {% schema %}; every section/block type used in
 * templates/*.json and sections/*-group.json resolves to a Liquid file with schema.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateBaselinePath = path.join(root, 'ci', 'template-json-baseline.json');
const templateParseAllowlist = new Set(
  JSON.parse(fs.readFileSync(templateBaselinePath, 'utf8')).allowedParseFailures ?? [],
);
const schemaBaseline = JSON.parse(
  fs.readFileSync(path.join(root, 'ci', 'theme-schema-baseline.json'), 'utf8'),
);
const schemalessSections = new Set(schemaBaseline.schemalessSections ?? []);
const missingSectionAllowlist = new Set(schemaBaseline.missingSectionAllowlist ?? []);
const SHOPIFY_HEADER = /^\/\*[\s\S]*?\*\/\s*/;

const IGNORED_BLOCK_TYPES = new Set(['@app', '@theme']);

function isAppBlockType(type) {
  return type.startsWith('shopify://') || type.startsWith('@');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function hasSchema(liquidPath) {
  if (!fs.existsSync(liquidPath)) return {exists: false, hasSchema: false};
  const text = readText(liquidPath);
  return {exists: true, hasSchema: /\{%\s*schema\s*%\}/.test(text)};
}

function collectJsonFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function parseJsonFile(filePath) {
  const raw = readText(filePath);
  const body = raw.replace(SHOPIFY_HEADER, '');
  return JSON.parse(body);
}

/** @returns {Set<string>} */
function walkBlocks(blocks, types) {
  if (!blocks || typeof blocks !== 'object') return types;
  for (const [key, block] of Object.entries(blocks)) {
    if (!block || typeof block !== 'object') continue;
    if (typeof block.type === 'string') types.add(block.type);
    walkBlocks(block.blocks, types);
  }
  return types;
}

function collectUsedTypes() {
  const sectionTypes = new Set();
  const blockTypes = new Set();

  const templateFiles = collectJsonFiles(path.join(root, 'templates'));
  const groupDir = path.join(root, 'sections');
  const groupFiles = fs.existsSync(groupDir)
    ? fs
        .readdirSync(groupDir)
        .filter((n) => n.endsWith('-group.json'))
        .map((n) => path.join(groupDir, n))
    : [];

  for (const file of [...templateFiles, ...groupFiles]) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    let data;
    try {
      data = parseJsonFile(file);
    } catch (error) {
      if (templateParseAllowlist.has(relative)) continue;
      throw new Error(`${relative}: ${error.message}`);
    }

    if (data.sections && typeof data.sections === 'object') {
      for (const section of Object.values(data.sections)) {
        if (section && typeof section.type === 'string') sectionTypes.add(section.type);
        walkBlocks(section?.blocks, blockTypes);
      }
    }

    // Section group JSON: { type: "header", sections: { ... } }
    if (data.type && data.sections) {
      sectionTypes.add(data.type);
      for (const section of Object.values(data.sections)) {
        if (section && typeof section.type === 'string') sectionTypes.add(section.type);
        walkBlocks(section?.blocks, blockTypes);
      }
    }
  }

  return {sectionTypes, blockTypes};
}

function schemaDefinesBlockType(sectionLiquid, blockType) {
  const match = sectionLiquid.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!match) return false;
  try {
    const schema = JSON.parse(match[1]);
    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return false;
    return blocks.some((b) => b && b.type === blockType);
  } catch {
    return false;
  }
}

function resolveBlockType(blockType) {
  const themeBlock = path.join(root, 'blocks', `${blockType}.liquid`);
  const theme = hasSchema(themeBlock);
  if (theme.exists && theme.hasSchema) return {ok: true, via: themeBlock};

  if (theme.exists && !theme.hasSchema) {
    return {ok: false, reason: `blocks/${blockType}.liquid missing {% schema %}`};
  }

  const sectionsDir = path.join(root, 'sections');
  for (const name of fs.readdirSync(sectionsDir)) {
    if (!name.endsWith('.liquid')) continue;
    const liquidPath = path.join(sectionsDir, name);
    const text = readText(liquidPath);
    if (!/\{%\s*schema\s*%\}/.test(text)) continue;
    if (schemaDefinesBlockType(text, blockType)) {
      return {ok: true, via: `${liquidPath} (inline block type)`};
    }
  }

  return {ok: false, reason: `no blocks/${blockType}.liquid and no section schema defines type "${blockType}"`};
}

function runCheck() {
  const errors = [];

  const blocksDir = path.join(root, 'blocks');
  if (fs.existsSync(blocksDir)) {
    for (const name of fs.readdirSync(blocksDir)) {
      if (!name.endsWith('.liquid')) continue;
      const liquidPath = path.join(blocksDir, name);
      if (!/\{%\s*schema\s*%\}/.test(readText(liquidPath))) {
        errors.push(`blocks/${name}: missing {% schema %}`);
      }
    }
  }

  const {sectionTypes, blockTypes} = collectUsedTypes();

  for (const sectionType of sectionTypes) {
    const liquidPath = path.join(root, 'sections', `${sectionType}.liquid`);
    const info = hasSchema(liquidPath);
    if (!info.exists) {
      if (missingSectionAllowlist.has(sectionType)) continue;
      errors.push(`section type "${sectionType}" used in JSON but sections/${sectionType}.liquid missing`);
    } else if (!info.hasSchema && !schemalessSections.has(sectionType)) {
      errors.push(`sections/${sectionType}.liquid: missing {% schema %}`);
    }
  }

  for (const blockType of blockTypes) {
    if (IGNORED_BLOCK_TYPES.has(blockType) || isAppBlockType(blockType)) continue;

    const themeBlockPath = path.join(root, 'blocks', `${blockType}.liquid`);
    if (fs.existsSync(themeBlockPath)) {
      if (!/\{%\s*schema\s*%\}/.test(readText(themeBlockPath))) {
        errors.push(`blocks/${blockType}.liquid: missing {% schema %} (referenced in JSON)`);
      }
      continue;
    }

    if (/^(b|a)-[a-z0-9-]+$/i.test(blockType)) {
      errors.push(
        `block type "${blockType}" used in JSON: expected blocks/${blockType}.liquid with {% schema %}`,
      );
      continue;
    }

    const resolved = resolveBlockType(blockType);
    if (!resolved.ok) {
      errors.push(`block type "${blockType}" used in JSON: ${resolved.reason}`);
    }
  }

  return errors;
}

const SELF_TEST_FIXTURES = [
  {name: 'ignored-app', type: '@app', expectOk: true},
  {name: 'ignored-theme', type: '@theme', expectOk: true},
];

function runSelfTest() {
  let failed = 0;
  for (const t of SELF_TEST_FIXTURES) {
    if (!IGNORED_BLOCK_TYPES.has(t.type)) {
      failed += 1;
      process.stderr.write(`self-test: expected ${t.type} ignored\n`);
    }
  }

  const sample = `{% schema %}{"blocks":[{"type":"breadcrumb"}]}{% endschema %}`;
  if (!schemaDefinesBlockType(sample, 'breadcrumb')) {
    failed += 1;
    process.stderr.write('self-test: schemaDefinesBlockType failed\n');
  }
  if (schemaDefinesBlockType(sample, 'missing-type')) {
    failed += 1;
    process.stderr.write('self-test: schemaDefinesBlockType false positive\n');
  }

  const missingSchema = '<div>No schema</div>';
  if (/\{%\s*schema\s*%\}/.test(missingSchema)) {
    failed += 1;
    process.stderr.write('self-test: hasSchema detector false positive\n');
  }

  if (failed > 0) process.exit(1);
  process.stdout.write('check-theme-schemas: self-test ok\n');
}

const selfTest = process.argv.includes('--self-test');
if (selfTest) {
  runSelfTest();
  process.exit(0);
}

const errors = runCheck();
if (errors.length > 0) {
  process.stderr.write('check-theme-schemas: fail\n');
  for (const e of errors) process.stderr.write(`  - ${e}\n`);
  process.exit(1);
}

process.stdout.write('check-theme-schemas: ok\n');