# AGENTS.md — supply-chain & package-manager policy

Instructions for AI coding agents (Claude Code, Cursor, Copilot, etc.) and human
contributors working in this template and apps that inherit from it.

This file is **prescriptive, not descriptive**: it states the target state.
When you find the codebase out of alignment, treat that as work to do — open
an issue or PR to close the gap, do not adapt the policy to the code.

---

## 1. Stack baseline (non-negotiable)

| Tool | Pin | Where |
|------|-----|-------|
| Package manager | `pnpm@11.0.0` (exact) | `package.json` → `packageManager` |
| Node.js | `>=22` | `package.json` → `engines.node`, `.nvmrc` |
| pnpm at runtime | `>=11` | `package.json` → `engines.pnpm` |
| Lockfile | `pnpm-lock.yaml` only | repo root |

**Why exact pnpm pin:** [Corepack does not accept range specifiers](https://github.com/nodejs/corepack/issues/208) — `pnpm@^11.0.0` or `pnpm@11.x` will fail. To upgrade pnpm: bump the exact version in `packageManager` in a dedicated PR. Do not write comments suggesting the pin "floats" — it does not.

**Why pnpm 11 specifically:** pnpm 11 makes `blockExoticSubdeps` default-true and migrates non-auth config out of `.npmrc` into `pnpm-workspace.yaml`. See [pnpm 11.0 release notes](https://pnpm.io/blog/releases/11.0).

---

## 2. Files this template requires at root

### `pnpm-workspace.yaml`
```yaml
# Supply-chain hardening. Read by pnpm >= 11.
# Settings live here (not .npmrc) because pnpm 11 no longer reads
# non-auth config from .npmrc.
# Source: https://pnpm.io/blog/releases/11.0

minimumReleaseAge: 4320   # 3 days in minutes — refuses versions <72h old.
                          # Renovate's default, Nesbitt's analysis shows
                          # this catches most observed 2025 npm attacks.
                          # Override per-install only for documented CVE-fixes.

blockExoticSubdeps: true  # Forbids transitive deps from git+ssh / tarball URLs.
                          # Default in pnpm 11 — set explicitly for the audit
                          # trail (ISO 27001 traceability).
```

### `package.json` patches (do not touch existing dependencies)
```jsonc
{
  "packageManager": "pnpm@11.0.0",
  "engines": {
    "node": ">=22",
    "pnpm": ">=11"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```
`only-allow pnpm` makes `npm install` / `yarn install` fail loudly instead of silently producing a wrong lockfile. Cheap, effective.

### `.gitignore` additions
```gitignore
# Wrong package managers — pnpm is the single source of truth.
package-lock.json
yarn.lock
.yarn/
```

### `.nvmrc`
```
22
```
If a higher minor exists in the repo (e.g. `22.11`), keep that — do not downgrade. The constraint is `>=22`.

### `.github/workflows/pnpm-security-gate.yml`
Required status check on `main` and `development`. Skeleton:
```yaml
name: pnpm security gate
on:
  pull_request:
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'pnpm-workspace.yaml'
      - '.npmrc'
      - '.gitignore'
      - 'package-lock.json'
      - 'yarn.lock'
  push:
    branches: [main, development]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Reject foreign lockfiles
        run: |
          for f in package-lock.json yarn.lock; do
            if [[ -f "$f" ]]; then
              echo "::error::$f must not be committed; this project uses pnpm." >&2
              exit 1
            fi
          done

      - name: Reject pnpm settings in .npmrc
        run: |
          if [[ -f .npmrc ]] && grep -E '^\s*(minimum-release-age|min-release-age|minimumReleaseAge)' .npmrc; then
            echo "::error::pnpm 11 does not read these from .npmrc; move to pnpm-workspace.yaml" >&2
            exit 1
          fi

      - name: Require cooldown config
        run: |
          test -f pnpm-workspace.yaml || { echo "::error::pnpm-workspace.yaml missing" >&2; exit 1; }
          grep -qE '^\s*minimumReleaseAge:\s*[0-9]+' pnpm-workspace.yaml \
            || { echo "::error::minimumReleaseAge missing in pnpm-workspace.yaml" >&2; exit 1; }
          grep -qE '^\s*blockExoticSubdeps:\s*true' pnpm-workspace.yaml \
            || { echo "::error::blockExoticSubdeps not enabled" >&2; exit 1; }

      - name: Require packageManager pin
        run: |
          node -e '
            const pm = require("./package.json").packageManager;
            if (!/^pnpm@\d+\.\d+\.\d+$/.test(pm || "")) {
              console.error("::error::packageManager must be exact pnpm@x.y.z, got:", pm);
              process.exit(1);
            }
          '

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Reproducible install
        run: pnpm install --frozen-lockfile

      - name: Audit
        run: pnpm audit --audit-level=moderate
```

Configure this workflow as a **required status check** in the repo's branch protection rules for `main` and `development`. The gate is only meaningful if it blocks merge.

---

## 3. Migration runbook (for existing apps inheriting from this template)

Run in the app's repo, on a feature branch:

```bash
# 1. Sanity: clean state, no uncommitted changes.
git status

# 2. Drop foreign lockfiles and node_modules.
rm -rf node_modules package-lock.json yarn.lock

# 3. Import dep graph from the previous lockfile (no version drift).
#    pnpm import reads package-lock.json/yarn.lock IF still in git history,
#    otherwise from the working tree before deletion. Run BEFORE step 2 if
#    you don't trust your git log to have the old lockfile.
pnpm import

# 4. Frozen install — same result everyone else will get.
pnpm install --frozen-lockfile

# 5. Verify build still passes.
pnpm run build

# 6. Commit lockfile + config files together.
git add pnpm-workspace.yaml pnpm-lock.yaml package.json .gitignore .nvmrc AGENTS.md
git commit -m "chore: migrate to pnpm 11 with supply-chain hardening"
```

Then update everywhere `npm` is invoked — see §4.

---

## 4. Hunt down `npm` invocations

The migration is not complete until these are clean. Run inside the app:

```bash
# Makefile
grep -nE '\bnpm\b' Makefile

# CI workflows
grep -rnE '\bnpm\b' .github/workflows/

# Renovate config
ls renovate.json .github/renovate.json 2>/dev/null

# README and docs
grep -rnE '\bnpm (install|i|ci|run)\b' README.md docs/ 2>/dev/null
```

**Replacement rules:**

| Old | New |
|-----|-----|
| `npm install` | `pnpm install --frozen-lockfile` |
| `npm i` | `pnpm install --frozen-lockfile` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm run <x>` | `pnpm run <x>` |
| `actions/setup-node@v4` with `cache: 'npm'` | `pnpm/action-setup@v4` **before** `setup-node@v4` with `cache: 'pnpm'` |

**Renovate config** (`renovate.json` or `.github/renovate.json`):
```jsonc
{
  "minimumReleaseAge": "3 days",
  "packageRules": [
    { "matchManagers": ["npm"], "minimumReleaseAge": "3 days" }
  ]
}
```
Without this, Renovate opens PRs that the security-gate workflow will reject — wasted CI cycles and contributor friction.

---

## 5. Don'ts

- **Do not** put `minimumReleaseAge` or `blockExoticSubdeps` in `.npmrc`. pnpm 11 ignores them there.
- **Do not** add `engine-strict=true`. The `preinstall: only-allow pnpm` hook handles enforcement more cleanly.
- **Do not** hand-edit `pnpm-lock.yaml`. Use `pnpm import`, `pnpm install`, or `pnpm update`.
- **Do not** use range specifiers in `packageManager` (`pnpm@^11.0.0`, `pnpm@11.x`). Corepack accepts exact versions only.
- **Do not** add `package-lock.json` or `yarn.lock` to the repo. The security gate rejects them.
- **Do not** silently bump the cooldown down (e.g. `minimumReleaseAge: 0`) to make an install pass. If an urgent CVE-fix requires it, document the override in the PR body with the CVE ID and a link to the advisory, and revert the change in the next PR.

---

## 6. Verification checklist

Before marking the migration complete on an app, all of these must be green:

- [ ] `pnpm install --frozen-lockfile` succeeds on a clean clone.
- [ ] `pnpm run build` succeeds.
- [ ] No `package-lock.json` or `yarn.lock` in working tree or staged.
- [ ] `pnpm-workspace.yaml` has `minimumReleaseAge: 4320` and `blockExoticSubdeps: true`.
- [ ] `package.json` has `packageManager: "pnpm@11.0.0"`, `engines.node >=22`, `engines.pnpm >=11`, `scripts.preinstall: "npx only-allow pnpm"`.
- [ ] No `npm` references in `Makefile`, `.github/workflows/`, or README install/dev steps.
- [ ] `pnpm-security-gate` workflow is present and configured as a required status check on `main` and `development`.
- [ ] Renovate config (if used) has `minimumReleaseAge: "3 days"`.

---

## 7. Sources

- [pnpm settings reference](https://pnpm.io/settings)
- [pnpm 11.0 release notes](https://pnpm.io/blog/releases/11.0)
- [pnpm 10.26 release notes (blockExoticSubdeps introduction)](https://pnpm.io/blog/releases/10.26)
- [pnpm v10 → v11 migration guide](https://pnpm.io/migration)
- [pnpm supply chain security](https://pnpm.io/supply-chain-security)
- [Corepack issue #208 — range support closed as not-planned](https://github.com/nodejs/corepack/issues/208)
- [Andrew Nesbitt — package managers need to cool down](https://nesbitt.io/2026/03/04/package-managers-need-to-cool-down.html)
