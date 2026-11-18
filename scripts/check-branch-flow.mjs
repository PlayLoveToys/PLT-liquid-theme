#!/usr/bin/env node
/**
 * Enforces promoted-branch PR flow:
 *   feature/* → dev-ai → stage → main
 *
 * Usage:
 *   node scripts/check-branch-flow.mjs --base <baseRef> --head <headRef>
 *   node scripts/check-branch-flow.mjs --self-test
 */

const SELF_TESTS = [
  { base: 'dev-ai', head: 'cursor/my-feature', expectOk: true },
  { base: 'stage', head: 'dev-ai', expectOk: true },
  { base: 'main', head: 'stage', expectOk: true },
  { base: 'stage', head: 'cursor/my-feature', expectOk: false },
  { base: 'main', head: 'dev-ai', expectOk: false },
  { base: 'main', head: 'cursor/hotfix', expectOk: false },
];

/**
 * @param {string} baseRef
 * @param {string} headRef
 * @returns {{ ok: boolean, message: string }}
 */
export function checkBranchFlow(baseRef, headRef) {
  const base = baseRef.trim();
  const head = headRef.trim();

  if (base === 'stage' && head !== 'dev-ai') {
    return {
      ok: false,
      message:
        `branch-flow: pull requests to \`stage\` must have head branch \`dev-ai\` (got \`${head}\`). ` +
        'Open a PR from `dev-ai` into `stage` after integration on `dev-ai`.',
    };
  }

  if (base === 'main' && head !== 'stage') {
    return {
      ok: false,
      message:
        `branch-flow: pull requests to \`main\` must have head branch \`stage\` (got \`${head}\`). ` +
        'Promote via `stage` after testing on `stage`.',
    };
  }

  return { ok: true, message: 'branch-flow: ok' };
}

function runSelfTest() {
  let failed = 0;
  for (const t of SELF_TESTS) {
    const r = checkBranchFlow(t.base, t.head);
    if (r.ok !== t.expectOk) {
      failed += 1;
      process.stderr.write(
        `check-branch-flow: self-test fail base=${t.base} head=${t.head} expected ok=${t.expectOk} got ok=${r.ok}\n`,
      );
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
  process.stdout.write('check-branch-flow: self-test ok\n');
}

function parseArgs(argv) {
  let base = process.env.BASE_REF ?? '';
  let head = process.env.HEAD_REF ?? '';
  let selfTest = false;

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--self-test') {
      selfTest = true;
    } else if (a === '--base' && argv[i + 1]) {
      base = argv[++i];
    } else if (a === '--head' && argv[i + 1]) {
      head = argv[++i];
    }
  }
  return { base, head, selfTest };
}

const { base, head, selfTest } = parseArgs(process.argv);

if (selfTest) {
  runSelfTest();
  process.exit(0);
}

if (!base || !head) {
  process.stderr.write('check-branch-flow: --base and --head required (or --self-test)\n');
  process.exit(2);
}

const result = checkBranchFlow(base, head);
if (result.ok) {
  process.stdout.write(`${result.message}\n`);
  process.exit(0);
}

process.stderr.write(`${result.message}\n`);
process.exit(1);