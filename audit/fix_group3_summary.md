# Design Fix Group A — Summary

**Agent:** CINAcoin Design Fix Agent 3  
**Date:** 2026-06-13  
**Apps:** website, wallet-explorer, learn, docs-site

---

## 1. Border Radius Token Fixes (All Apps)

### Problem

All radius tokens collapsed to `4px` — every component used the same tiny radius.

### Fix

Updated radius alias tokens in each app's CSS to match DESIGN.md spec:

| Token                 | Before               | After  |
| --------------------- | -------------------- | ------ |
| `--cc-radius-xs`      | 4px (missing or 4px) | 4px    |
| `--cc-radius-sm`      | 4px                  | 6px    |
| `--cc-radius-md`      | 4px                  | 8px    |
| `--cc-radius-lg`      | 4px                  | 12px   |
| `--cc-radius-xl`      | 4px (missing or 4px) | 16px   |
| `--cc-radius-pill-sm` | missing              | 64px   |
| `--cc-radius-pill`    | 4px                  | 100px  |
| `--cc-radius-full`    | missing              | 9999px |

**Files modified:**

- `apps/website/src/app/globals.css`
- `apps/wallet-explorer/src/shared-design-system.css`
- `apps/learn/src/app/globals.css`
- `apps/docs-site/src/css/custom.css`

---

## 2. Button Border-Radius Fixes (All Apps)

### Problem

All buttons used `border-radius: 4px` — flat rectangles instead of the design spec's pill shapes.

### Fix

| Component                               | Before | After                      |
| --------------------------------------- | ------ | -------------------------- |
| `.cc-btn-primary`                       | 4px    | 100px (pill)               |
| `.cc-btn-primary-sm`                    | 4px    | 100px (pill)               |
| `.cc-btn-secondary`                     | 4px    | 100px (pill)               |
| `.cc-btn-secondary-sm`                  | 4px    | 100px (pill)               |
| `.btn-primary` (website)                | 4px    | 100px (pill)               |
| `.btn-secondary` (website)              | 4px    | 100px (pill)               |
| `.btn-pill` (website)                   | 4px    | 100px (pill)               |
| `.btn-sm` (website)                     | 4px    | 100px (pill)               |
| `.cc-nav-cta-signup`                    | 4px    | 6px (sm — nav CTA)         |
| `.cc-nav-cta-login`                     | 4px    | 6px (sm — nav CTA)         |
| `.cc-navbar-link`                       | 4px    | 9999px (full — ghost pill) |
| `.navbar-github-link` (docs)            | 4px    | 6px (sm — nav CTA)         |
| `.landing-btn` (docs)                   | 4px    | 100px (pill)               |
| `.tabs__item` (docs)                    | 4px    | 64px (pill-sm — tab)       |
| `.footer-newsletter-form button` (docs) | 4px    | 100px (pill)               |

---

## 3. Card & Container Border-Radius Fixes

| Component                              | Before | After                       |
| -------------------------------------- | ------ | --------------------------- |
| `.cc-card`                             | 4px    | 8px (md)                    |
| `.cc-card-lg`                          | 4px    | 12px (lg)                   |
| `.card` (website)                      | 4px    | 8px (md)                    |
| `.card-standard` (website)             | 4px    | 8px (md)                    |
| `.card` (docs)                         | 4px    | 8px (md)                    |
| `.landing-card` (docs)                 | 4px    | 8px (md)                    |
| `.cc-badge`                            | 4px    | 9999px (full — pill badge)  |
| `.badge` (wallet-explorer)             | 4px    | 9999px (full)               |
| `.badge` (docs)                        | 4px    | 9999px (full)               |
| `.cc-form-input`                       | 4px    | 6px (sm)                    |
| `.input-standard` (website)            | 4px    | 6px (sm)                    |
| `.search-bar` (wallet-explorer)        | 4px    | 6px (sm)                    |
| `.cc-code-block`                       | 4px    | 8px (md)                    |
| `.prism-code` (docs)                   | 4px    | 8px (md)                    |
| `.theme-admonition` (docs)             | 4px    | 8px (md)                    |
| `table` (docs)                         | 4px    | 8px (md)                    |
| `.pagination-nav__link` (docs)         | 4px    | 8px (md)                    |
| `.footer-newsletter-form input` (docs) | 4px    | 6px (sm)                    |
| `.menu__link` (docs)                   | 4px    | 6px (sm)                    |
| `.table-of-contents__link` (docs)      | 4px    | 6px (sm)                    |
| `.breadcrumbs__link` (docs)            | 4px    | 9999px (full)               |
| `.navbar__item` (docs)                 | 4px    | 9999px (full)               |
| `.colorModeToggle .clean-btn` (docs)   | 4px    | 9999px (full — icon button) |
| `.menu__caret` (docs)                  | 4px    | 9999px (full — icon button) |
| `.theme-back-to-top-button` (docs)     | 4px    | 9999px (full)               |
| `.DocSearch-Button` (docs)             | 4px    | 6px (sm)                    |

---

## 4. Font-Weight 700 Fixes

### Problem

`wallet-explorer` defined `--weight-bold: 700` — design spec caps display weight at 600.

### Fix

- Removed `--weight-bold: 700` from `apps/wallet-explorer/src/shared-design-system.css`
- Fixed `--ifm-font-weight-semibold` from `500` → `600` in `apps/docs-site/src/css/custom.css`
- Verified no other instances of `font-weight: 700` exist across all 4 apps

---

## 5. Website-Specific Fixes

- ✅ All button components now use pill shape (100px)
- ✅ Navbar height already correct at 64px (via `--ifm-navbar-height` in docs-site, implicit in website layout)
- ✅ Nav CTA buttons use 6px (sm) per spec for nav-cta-signup/login

---

## 6. Wallet Explorer-Specific Fixes

- ✅ Removed `--weight-bold: 700` token definition
- ✅ Fixed all radius tokens from 4px → proper values
- ✅ Dark theme canvas values already correct (#0a0a0a)
- ✅ No hardcoded dark theme issues found (uses proper `[data-theme='dark']` selector)

---

## 7. Learn-Specific Fixes

- ✅ Display line-height corrected to exact px values:
  - `text-display-xl`: 1.1 → 48px
  - `text-display-lg`: 1.15 → 40px
  - `text-display-md`: 1.2 → 32px
  - `text-display-sm`: 1.25 → 28px
- ✅ Display letter-spacing corrected:
  - `text-display-sm`: -0.4px → -0.6px
  - `text-display-md`: -0.72px → -0.96px
- ✅ Caption font-weight corrected: `--cc-weight-medium` (500) → `--cc-weight-regular` (400)
- ✅ Caption line-height set to 16px per spec

---

## 8. Docs Site-Specific Fixes

- ✅ Dark canvas corrected from `#000000` → `#0a0a0a`
- ✅ Dark canvas-soft corrected from `#0a0a0a` → `#141414`
- ✅ Dark canvas-soft-2 corrected from `#111111` → `#1e1e1e`
- ✅ `--ifm-global-radius` updated from 4px → 6px
- ✅ `--ifm-font-weight-semibold` updated from 500 → 600

---

## Intentionally Unchanged (4px = xs token)

- `.cc-code` (inline code) — `border-radius: 4px` = `rounded.xs` per spec ✅
- `.cc-code` in wallet-explorer — same, inline code xs ✅
- `--ifm-code-border-radius: 4px` — inline code, correct ✅
- `::-webkit-scrollbar-thumb` — decorative, not a component radius

---

## Files Modified

1. `apps/website/src/app/globals.css` — radius tokens, button/card/input/badge/navbar radii
2. `apps/wallet-explorer/src/shared-design-system.css` — removed 700 weight, radius tokens, all component radii
3. `apps/learn/src/app/globals.css` — radius tokens, display line-height/letter-spacing, caption weight, component radii
4. `apps/docs-site/src/css/custom.css` — dark canvas values, radius tokens, component radii, font-weight fixes
