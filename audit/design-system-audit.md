# Design System Audit Report

**Date**: 2026-06-13  
**Package**: `@cinacoin/design-tokens` v0.2.0  
**Scope**: CSS variables, component classes, fonts, theme completeness, app imports

---

## 1. CSS Variable Completeness

### ✅ Spacing System (4px grid)
All spacing variables defined in `cinacoin.css`:
- `--cc-xxs: 4px` through `--cc-section: 192px`
- Scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 96, 128, 192

### ✅ Radius Variables
- `--cc-radius-none: 0px`
- `--cc-radius-xs: 4px`, `--cc-radius-sm: 6px`, `--cc-radius-md: 8px`
- `--cc-radius-lg: 12px`, `--cc-radius-xl: 16px`
- `--cc-radius-pill-sm: 64px`, `--cc-radius-pill: 100px`, `--cc-radius-full: 9999px`

### ✅ Shadow System (level0–level5)
All defined in both dark and light themes:
- `--cc-level0: none`
- `--cc-level1` through `--cc-level5` (increasing complexity)

### ⚠️ Missing Variable Definitions in cinacoin.css
`cinacoin.css` **uses** but **does not define** these variables (expects consumer to provide):
- `--text-display-xl/lg/md/sm`, `--text-body-lg/md/sm`, `--text-caption`
- `--weight-regular`, `--weight-medium`, `--weight-semibold`
- `--font-geist-sans`, `--font-geist-mono`

**Impact**: Apps importing `cinacoin.css` must define these typography/font variables themselves or utilities will fail silently.

---

## 2. Color System

### ✅ Dark Theme (default)
- Complete: `--cc-primary`, `--cc-on-primary`, `--cc-ink`, `--cc-body`, `--cc-muted`
- Canvas: `--cc-canvas`, `--cc-canvas-soft`, `--cc-canvas-soft-2`
- Hairline: `--cc-hairline`, `--cc-hairline-strong`
- Semantic: `--cc-success`, `--cc-error`, `--cc-warning` + bg variants
- Link: `--cc-link`, `--cc-link-deep`, `--cc-link-bg-soft`
- Gradient: `--cc-gradient-develop-*`, `--cc-gradient-preview-*`, `--cc-gradient-ship-*`

### ✅ Light Theme (`[data-theme='light']`)
All dark theme variables have light counterparts with appropriate values.

### ✅ Selection Colors
`--cc-selection-bg`, `--cc-selection-fg` defined for both themes.

---

## 3. Component Classes

### ✅ Buttons
- `.cc-btn-primary` (pill, 48px height)
- `.cc-btn-primary-sm` (pill, 32px height)
- `.cc-btn-secondary` (pill, 48px height)
- `.cc-btn-secondary-sm` (pill, 32px height)
- `.cc-nav-cta-signup`, `.cc-nav-cta-login` (smaller, 28px height)

### ✅ Cards
- `.cc-card` (md radius, level1 shadow)
- `.cc-card-lg` (lg radius, level2 shadow)
- `.cc-card-soft` (soft background + border)
- `.cc-card-featured` (primary bg, inverse text)

### ✅ Badge
- `.cc-badge` (full radius, caption text)

### ✅ Navigation
- `.cc-navbar` (sticky, 64px height)
- `.cc-navbar-link` (pill radius)
- `.cc-footer`, `.cc-footer-heading`, `.cc-footer-link`

### ✅ Forms
- `.cc-form-input` (40px height)
- `.cc-form-input-sm` (32px height)
- `textarea.cc-form-input` (auto height, min 80px)
- `select.cc-form-input` (custom dropdown arrow)

### ✅ Typography Utilities
- `.cc-display-xl/lg/md/sm` (responsive sizes)
- `.cc-body-lg/md/md-strong/sm/sm-strong`
- `.cc-caption`, `.cc-caption-mono`, `.cc-code`
- `.cc-button-lg`, `.cc-button-md`

### ✅ Other
- `.cc-container` (max-width 1200px/1400px)
- `.cc-code-block`, `.cc-icon-button`, `.cc-tab-ghost`
- `.cc-mesh-gradient`, `.cc-mesh-gradient-strong`
- `.cc-skip-link`, `.sr-only`
- `.animate-fade-in`, `.animate-pulse-dot`

---

## 4. Font Files

### ✅ Font Assets Present
Located in `packages/design-tokens/assets/`:
- `Geist-Regular.woff2`
- `Geist-Medium.woff2`
- `Geist-SemiBold.woff2`
- `GeistMono-Regular.woff2`

### ❌ No @font-face in Design Tokens
`cinacoin.css` does **not** include `@font-face` declarations. Each app must declare fonts independently.

**Current font declarations**:
- `demo-react/src/index.css` — ✅ has @font-face + `--font-geist-*` vars
- `demo-vue/src/fonts.css` — ✅ has @font-face + `--font-geist-*` vars
- `analytics-dashboard`, `learn`, `website` — define `--font-geist-*` vars but no @font-face (rely on next/font or external)
- `shared-design-system.css` — defines `--font-sans`/`--font-mono` but no @font-face

**Recommendation**: Add a `fonts.css` file to the design-tokens package with @font-face declarations, or document that apps must use `next/font` or equivalent.

---

## 5. App Import Analysis

### ✅ Apps Using `@cinacoin/design-tokens/css/cinacoin.css`
| App | Import Method |
|-----|---------------|
| `analytics-dashboard` | `@import '@cinacoin/design-tokens/css/cinacoin.css'` |
| `demo-dapp-react` | `@import '@cinacoin/design-tokens/css/cinacoin.css'` |
| `demo-react` | `@import '@cinacoin/design-tokens/css/cinacoin.css'` |
| `developer-dashboard` | `@import '@cinacoin/design-tokens/css/cinacoin.css'` |
| `learn` | `@import '@cinacoin/design-tokens/css/cinacoin.css'` |

### ⚠️ Apps Using `shared-design-system.css` Only (No design-tokens import)
| App | Notes |
|-----|-------|
| `backend-dashboard` | Uses local `shared-design-system.css` |
| `cloud-dashboard` | Uses local `shared-design-system.css` |
| `demo` | Uses local `shared-design-system.css` |
| `health-status` | Uses local `shared-design-system.css` |
| `unified-dashboard` | Uses local `shared-design-system.css` |
| `wallet-explorer` | Uses local `shared-design-system.css` |

These apps have their own copy of variables/components but miss out on design-tokens updates.

### ❌ Apps With No Design System Import
| App | Reason |
|-----|--------|
| `demo-flutter` | Flutter app — uses Dart, not CSS |
| `project-registry-api` | Backend API — no frontend |
| `wallet-explorer-api` | Backend API — no frontend |
| `docs-site` | Docusaurus — has its own theme |

### ⚠️ Apps With Inline Design Systems (No Central Import)
| App | Issue |
|-----|-------|
| `website` | Full inline variables in `globals.css` (light theme only), no `@import` |
| `farcaster-app` | Full inline variables with `--cc-*` prefix, no `@import` |

---

## 6. Duplication Issues

### ⚠️ `shared-design-system.css` vs `cinacoin.css`
`apps/shared-design-system.css` is a **near-complete duplicate** of `cinacoin.css`:
- Defines same `--cc-*` variables (via `--color-*` → `--cc-*` aliases)
- Defines same `.cc-*` component classes
- Adds its own `--text-*`, `--weight-*`, `--shadow-level-*` variables

**Problem**: Changes to `cinacoin.css` don't propagate to apps using `shared-design-system.css`.

### ⚠️ `cinacoin-components.css` Duplication
`packages/design-tokens/cinacoin-components.css` duplicates `cinacoin.css` components with `@layer` directives and `@tailwind` directives. This file appears to be a Tailwind-specific variant but is not referenced in `package.json` exports.

---

## 7. Summary of Issues

### 🔴 Critical
1. **Typography variables not defined in cinacoin.css** — Apps must define `--text-*`, `--weight-*`, `--font-geist-*` themselves or component classes break.

### 🟡 Moderate
2. **No centralized @font-face** — Font loading is inconsistent across apps.
3. **shared-design-system.css drift** — 6 apps use a local copy that can diverge from the canonical design-tokens.
4. **website and farcaster-app** — Have full inline design systems, not using the package at all.
5. **cinacoin-components.css** — Undocumented duplicate; not in package exports.

### 🟢 Minor
6. **Inconsistent button heights** — `cinacoin.css` uses 48px/32px; `shared-design-system.css` uses 40px/32px.
7. **Transition durations differ** — `cinacoin.css` uses `0.3s`; `shared-design-system.css` uses `150ms/200ms`.

---

## 8. Recommendations

### Immediate
1. **Add typography variables to cinacoin.css** — Define `--text-*`, `--weight-*`, `--font-geist-*` in `:root` so apps don't need to.
2. **Add fonts.css** — Create `packages/design-tokens/css/fonts.css` with @font-face declarations; export in package.json.

### Short-term
3. **Migrate shared-design-system.css apps** — Replace local imports with `@import '@cinacoin/design-tokens/css/cinacoin.css'` in:
   - backend-dashboard
   - cloud-dashboard
   - demo
   - health-status
   - unified-dashboard
   - wallet-explorer
4. **Migrate website and farcaster-app** — Replace inline variables with design-tokens import.

### Long-term
5. **Remove cinacoin-components.css** — Or document its purpose and add to exports.
6. **Add visual regression tests** — Catch drift between apps.
7. **Create migration guide** — Document how to adopt the canonical design-tokens.

---

## 9. Verification Commands

```bash
# Check which apps import design-tokens
grep -r "@cinacoin/design-tokens" apps/*/package.json

# Find apps with shared-design-system.css
grep -r "shared-design-system" apps/*/src/app/globals.css

# Find apps with no design system
for app in apps/*/; do
  grep -q "design-tokens\|shared-design-system" "$app/src/"*.css "$app/src/app/"*.css 2>/dev/null || echo "NO_IMPORT: $(basename $app)"
done
```

---

**Audit completed**: 2026-06-13T11:50:00Z  
**Auditor**: OpenClaw Subagent (style-audit-design-system)
