# Contributing

## Git branch flow

All theme development converges on **`dev-ai`**. Staging and production are promoted in order:

1. **Work branches → `dev-ai`** — Create branches from `origin/dev-ai`. Open PRs with **base `dev-ai`**. Chief of Staff can approve and merge here.
2. **`dev-ai` → `stage`** — Single promotion PR; **only `dev-ai`** may be the head branch. Testing and audit happen on `stage`. **Requires Alejandro’s approval** to merge.
3. **`stage` → `main`** — Release PR; **only `stage`** may be the head branch. **Requires Alejandro’s approval** to merge.

```bash
git fetch origin dev-ai stage main
git checkout -b cursor/my-change origin/dev-ai
# … commits …
git push -u origin cursor/my-change
# Open PR: base dev-ai, head cursor/my-change
```

CI job **`branch-flow`** fails pull requests that violate:

- base `stage` with head ≠ `dev-ai`
- base `main` with head ≠ `stage`

Feature PRs into `dev-ai` (any head) pass `branch-flow`.

## Quality gates (local)

From the repo root after `npm ci`:

| Command | Expectation |
|---------|-------------|
| `npx @shopify/cli@3.91.0 theme check -o json` | 6 errors / 362 warnings (or `npm run check:theme-check`) |
| `npm run check:plt` | OK |
| `npm run check:theme-css` | OK |
| `npm run check:tailwind-arbitrary` | OK (`--self-test` for fixtures) |
| `npm run test:templates:ci` | 40/42 (allowlisted `blog.json`, `page.test.json`) |
| `npm run test:harness` | All cases pass |
| `npm run check:no-legacy` | OK (`--self-test` available) |
| `npm run check:branch-flow -- --self-test` | OK |

## Docs

- `AGENTS.md` — Cloud Agent / automation rules.
- `docs/branch-protection.md` — **Proposed** GitHub branch protection (not applied in-repo).
- `docs/ds-port-plan.md` — Design-system port plan (references `main` for historical/release baseline where noted).