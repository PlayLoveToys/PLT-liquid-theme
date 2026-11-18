# Proposed branch protection (not applied in this repository)

This document is **documentation only**. It does not change GitHub settings. **Alejandro** should enable these rules in the repository settings (or via API) when ready.

## Branches to protect

| Branch | Purpose |
|--------|---------|
| `stage` | QA / audit before production |
| `main` | Production storefront theme |

`dev-ai` is the integration branch; protect optionally (require PR + gates, allow Chief of Staff merge without Alejandro if desired).

## Recommended rules (stage and main)

For **each** of `stage` and `main`:

1. **Require a pull request before merging** (no direct pushes).
2. **Require approvals:** at least **1**; restrict who can dismiss reviews.
3. **Required reviewers for merge:** add **Alejandro** as required reviewer on `stage` and `main` (GitHub: Settings → Branches → rule → “Require review from Code Owners” with `CODEOWNERS`, or explicit required reviewers).
4. **Require status checks to pass:**
   - `gates`
   - `branch-flow` (only on PRs; still list if GitHub allows optional checks)
5. **Do not allow** force pushes or branch deletion.
6. **Require conversation resolution** before merge (optional).

### Required status checks (from `.github/workflows/ci.yml`)

| Check / job | When |
|-------------|------|
| `gates` | push to `dev-ai` / `stage` / `main`; PRs targeting those branches |
| `branch-flow` | pull requests only |

## Activation (GitHub UI)

1. Open [Branches settings](https://github.com/PlayLoveToys/PLT-liquid-theme/settings/branches).
2. **Add branch ruleset** or **Add rule** for `stage`.
3. Enable “Require a pull request”, “Require approvals” (1+), required checks `gates` (and `branch-flow` if listed).
4. Under **Restrict who can push**, leave empty or limit to admins; merges go through PR only.
5. Repeat for `main`.
6. In **Rules → Require review from Code Owners**, maintain `.github/CODEOWNERS` with Alejandro on `stage` and `main` paths if using code owners.

## Activation (`gh api` sketch)

Requires admin token. Adjust `ALEMBO` user id / team and rule IDs after inspecting the repo.

```bash
# Example: list existing rulesets
gh api repos/PlayLoveToys/PLT-liquid-theme/rulesets --jq '.[] | {id, name, target}'

# Create or update via Rulesets API (GitHub recommends rulesets over legacy branch protection):
# POST /repos/{owner}/{repo}/rulesets
# See: https://docs.github.com/en/rest/repos/rules
```

Legacy branch protection (per branch):

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  repos/PlayLoveToys/PLT-liquid-theme/branches/stage/protection \
  -f required_status_checks='{"strict":true,"contexts":["gates"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  -F restrictions=null \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

Repeat for `branches/main/protection`. Tune `contexts` to match exact check names shown on a green PR after the first CI run.

## Promotion flow (reminder)

- PR head **`dev-ai`** → base **`stage`**
- PR head **`stage`** → base **`main`**

CI enforces this in job `branch-flow`; branch protection should require that job + `gates` so bad PRs never merge.