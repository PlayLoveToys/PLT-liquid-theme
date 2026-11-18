# Agent / Cloud Agent workflow

This repo uses a three-branch promotion line. **Do not open pull requests directly to `main`** for theme port work.

## Branch flow

```text
feature/cursor-*  →  dev-ai  →  stage  →  main
     (PR)              (PR)        (PR)
```

| Step | Base branch | Head branch | Who may merge |
|------|-------------|-------------|----------------|
| Integration | `dev-ai` | Any work branch (`cursor/…`, `feature/…`) | Chief of Staff (and team per policy) |
| Staging / QA | `stage` | **`dev-ai` only** | Chief of Staff may merge; **Alejandro must approve** merges into `stage` |
| Production | `main` | **`stage` only** | **Alejandro must approve** merges into `main` |

## Rules for agents

1. **Branch from `origin/dev-ai`** for new theme work (fetch first; `dev-ai` moves after integration PRs).
2. **Target `dev-ai`** as the PR base for feature, integration, and port stack PRs.
3. Do **not** merge to `stage` or `main` unless the user explicitly requests promotion and approval is in place.
4. Do **not** force-push shared branches (`dev-ai`, `stage`, `main`).
5. Run local gates before push (`CONTRIBUTING.md`). CI enforces the same plus `check:branch-flow` on pull requests.

## Promotion PRs (human-driven)

- **`dev-ai` → `stage`:** one consolidation PR after integration/testing on `dev-ai` (e.g. post–port stack).
- **`stage` → `main`:** release after QA on `stage`.

See `CONTRIBUTING.md` and `docs/branch-protection.md` (proposed GitHub settings).