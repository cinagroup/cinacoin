# Contributing to Cinacoin

Thank you for your interest in contributing to Cinacoin! We welcome contributions from everyone — whether you're fixing a typo, adding a new chain adapter, or building a core feature.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Commit Message Conventions](#-commit-message-conventions)
- [Pull Request Process](#-pull-request-process)
- [Testing Guidelines](#-testing-guidelines)
- [Code Style](#-code-style)
- [Release Process](#-release-process)
- [Issue Triage](#-issue-triage)

---

## 🤝 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, inclusive, and constructive. Harassment of any kind will not be tolerated.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | ≥ 18 (LTS recommended) | Core SDK runtime |
| [pnpm](https://pnpm.io/) | ≥ 9.15 | Package manager |
| [Rust](https://rustup.rs/) | ≥ 1.70 | Relay server, bundler, Rust packages |
| [Git](https://git-scm.com/) | Latest | Version control |

> **Tip:** Use [Volta](https://volta.sh/) or [fnm](https://github.com/Schniz/fnm) for automatic Node version management.

### Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cinacoin.git
cd cinacoin

# 2. Add upstream remote
git remote add upstream https://github.com/cinagroup/Cinacoin.git
git fetch upstream

# 3. Install all workspace dependencies
pnpm install

# 4. Build everything
pnpm run build

# 5. Start the demo app
pnpm run dev --filter=demo
# → http://localhost:3000
```

---

## 🔄 Development Workflow

### Branching Strategy

| Branch | Purpose | Example |
|--------|---------|---------|
| `main` | Stable, always deployable | — |
| `feat/*` | New features | `feat/solana-wallet-adapter` |
| `fix/*` | Bug fixes | `fix/race-condition-relay` |
| `docs/*` | Documentation | `docs/update-quick-start` |
| `chore/*` | Maintenance, CI, tooling | `chore/update-vitest` |

### Workflow Steps

1. **Sync with upstream:** `git pull upstream main`
2. **Create your branch:** `git checkout -b feat/your-feature`
3. **Make changes** following the code style guidelines below
4. **Write tests** for new functionality
5. **Run the full CI suite:** `pnpm run ci`
6. **Commit** with Conventional Commits (see below)
7. **Add a changeset** for package changes: `pnpm changeset`
8. **Push** and open a PR against `main`

---

## 📝 Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for automated changelogs and semantic versioning via [Changesets](https://github.com/changesets/changesets).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) — no logic change |
| `refactor` | Code restructuring — no feature or bug fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Tooling, CI, dependencies, maintenance |
| `build` | Build system or external dependency changes |
| `ci` | CI/CD configuration changes |

### Examples

```
feat(adapter-solana): add Phantom wallet EIP-6963 discovery
fix(core-sdk): resolve race condition in relay transport
docs: update API reference for SessionManager
test(relay-server): add roundtrip tests for ChaCha20-Poly1305
chore(deps): update viem to 2.21.0
refactor(react): extract useWalletCapabilities hook from provider
```

### Breaking Changes

Append `!` to the type or include `BREAKING CHANGE:` in the footer:

```
feat(core-sdk)!: change SignClient constructor signature

BREAKING CHANGE: SignClient now requires projectId as the first argument.
```

---

## 🔀 Pull Request Process

### Before Opening a PR

1. **Rebase on `main`:** `git rebase upstream/main`
2. **Run CI:** `pnpm run ci` (build + lint + typecheck + test)
3. **Add changeset:** `pnpm changeset` (for user-facing changes)
4. **Test in demo app** if changes affect UI

### PR Checklist

- [ ] Description explains **what** changed and **why**
- [ ] Related issues linked (`Fixes #123`)
- [ ] Code follows project style (lint, format, typecheck pass)
- [ ] Tests added or updated
- [ ] Demo app works with changes (if applicable)
- [ ] Documentation updated (if API/usage changes)
- [ ] Changeset included (if version bump needed)
- [ ] No unrelated changes in the diff

### Review

- PRs require **at least one maintainer approval**
- Address review feedback promptly
- Stale PRs (> 14 days inactive) may be closed
- Maintainers may squash-merge or rebase-merge

---

## 🧪 Testing Guidelines

### TypeScript (Vitest)

```bash
# All tests
pnpm run test

# Single package
pnpm run test --filter=@cinacoin/core-sdk

# Watch mode
cd packages/core-sdk && pnpm run test --watch

# Coverage
cd packages/core-sdk && pnpm run test --coverage
```

**Test structure:**

```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from '../src/module.js';

describe('module', () => {
  it('should handle specific case', () => {
    const result = functionName(input);
    expect(result).toEqual(expected);
  });
});
```

**What to test:**
- Public API functions and methods
- Edge cases (empty inputs, error states, boundaries)
- Crypto roundtrips (encrypt → decrypt → verify)
- React hooks (use `@testing-library/react`)

### Rust Packages

```bash
cd packages/relay-server
cargo test              # All tests
cargo test --lib        # Unit tests only
cargo clippy -- -D warnings  # Lint checks
cargo fmt --check       # Format verification
```

**Crypto changes require roundtrip tests:**
1. Generate keypair → derive shared secret → encrypt → decrypt → verify
2. Test with wrong key → verify decryption fails
3. Test deterministic operations (topic derivation, serialization)

### E2E Tests (Playwright)

```bash
npx playwright install    # First time only
npx playwright test       # Run all E2E tests
npx playwright test --ui  # Run with UI
```

### CI Pipeline

```bash
pnpm run ci  # build + lint + typecheck + test
```

---

## 🎨 Code Style

### TypeScript

- **ESLint + Prettier** configured per-package
- **Formatting:** 2-space indent, single quotes, semicolons, trailing commas
- **Imports:** ES modules with `.js` extension for `@noble` packages
- **Naming:** `camelCase` functions/variables, `PascalCase` types/classes, `UPPER_SNAKE_CASE` constants
- **Types:** Prefer explicit types over `any`. Use `unknown` before `any`.
- **Comments:** JSDoc for public APIs. Explain *why*, not *what*.

```bash
pnpm run format          # Format all files
pnpm run format:check    # Check without modifying
pnpm run lint            # ESLint
pnpm run lint:fix        # Auto-fix
```

### Rust

- **`cargo fmt`** — standard Rust style
- **`cargo clippy`** — no warnings allowed
- **`///`** for public API docs, `//` for implementation notes

### Documentation

- Markdown under `docs/`
- `kebab-case` filenames
- Code examples must be tested
- Run `pnpm run docs:build` to verify docs site builds cleanly

---

## 🚢 Release Process

We use [Changesets](https://github.com/changesets/changesets) with [Semantic Versioning 2.0.0](https://semver.org/):

| Bump | Format | When |
|------|--------|------|
| Patch | `x.y.Z` | Bug fixes, no API changes |
| Minor | `x.Y.0` | New backward-compatible features |
| Major | `X.0.0` | Breaking changes |

### For Contributors

Include a changeset with any PR affecting published packages:

```bash
pnpm changeset
```

Follow the prompts to select packages and bump type. Docs-only and CI-only changes don't need changesets.

### Maintainer Release Steps

1. `pnpm changeset version` — consume changesets, bump versions
2. Commit version bump to `main`
3. Create tag: `git tag -a v1.1.0 -m "Release v1.1.0"`
4. Push: `git push origin v1.1.0`
5. GitHub Actions automatically:
   - Builds and tests
   - Publishes packages to npm
   - Creates GitHub Release with changelog
   - Deploys documentation to Cloudflare Pages

---

## 🔍 Issue Triage

### Labels

| Label | Meaning |
|-------|---------|
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `docs` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `security` | Security-related |
| `question` | Further information requested |

### Triage Process

1. **New issues** are reviewed weekly by maintainers
2. **Labels** are applied based on content
3. **Severity** is assessed:
   - 🔴 Critical — blocks core functionality, no workaround
   - 🟡 Major — significant issue, workaround exists
   - 🟢 Minor — cosmetic or edge case
4. **Assignment** to appropriate maintainer or marked `good first issue`
5. **Stale issues** (> 30 days inactive) receive a reminder, then may be closed

### Bug Report Priority

- 🔴 **Same-day response** — core functionality blocked
- 🟡 **48-hour response** — workaround exists
- 🟢 **Weekly review** — cosmetic or edge case

### Feature Request Process

1. Review for alignment with project roadmap
2. Assess scope and complexity
3. Mark as `enhancement` with priority label
4. If accepted, create tracking issue or add to roadmap
5. Community implementation encouraged

---

## 📎 Quick Reference

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/cinacoin.git && cd cinacoin
pnpm install && pnpm run build

# Full CI pipeline
pnpm run ci

# Single package workflow
pnpm run build --filter=@cinacoin/react
pnpm run test --filter=@cinacoin/react
pnpm run lint --filter=@cinacoin/react

# Changeset for version bumps
pnpm changeset

# Run the demo app
pnpm run dev --filter=demo
```

---

Thank you for contributing to Cinacoin! 🚀
