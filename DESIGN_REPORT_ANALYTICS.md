# Design Report: Analytics Dashboard — Vercel-Style Transformation

**Date:** 2026-06-08  
**Application:** `apps/analytics-dashboard`  
**Design System Reference:** `DESIGN_SYSTEM.md` (Vercel-Inspired)

---

## Summary

Applied the Vercel-style design system to the Cinacoin Analytics Dashboard, transforming it from a single-column marketing-style layout into a developer-platform-grade dashboard with sidebar navigation, structured data presentation, and precise typographic hierarchy.

---

## Changes Made

### 1. Global Styles (`src/app/globals.css`)

**Added Vercel design tokens as CSS variables:**

| Token | Value | Purpose |
|-------|-------|---------|
| `--v-font-sans` | `'Geist', 'Inter', system-ui, sans-serif` | Primary font stack |
| `--v-font-mono` | `'Geist Mono', monospace` | Data, code, labels |
| `--v-weight-regular/medium/semibold` | `400 / 500 / 600` | Font weights |
| `--v-tracking-xl` | `-2.4px` | Display XL negative tracking |
| `--v-tracking-lg` | `-1.28px` | Display LG negative tracking |
| `--v-radius-sm` | `6px` | App-level component radius |
| `--v-radius-md` | `8px` | Card radius |
| `--v-shadow-card` | stacked shadow + inset hairline | Card elevation |

**New component classes:**

- `.v-sidebar` — Fixed left sidebar (240px, white bg, hairline border-right)
- `.v-sidebar-item` — Nav items with 6px radius, active state with 3px black indicator bar
- `.v-main` — Content area offset by sidebar width
- `.v-stat-card` — Stat cards with stacked shadow + inset hairline
- `.v-chart-card` — Chart containers with hairline border
- `.v-table` — Data table with mono uppercase headers, canvas-soft thead
- `.v-btn-primary` / `.v-btn-secondary` — 6px radius buttons (36px height)
- `.v-input` — 6px radius input (40px height)
- `.v-page-header` — Page header with mono breadcrumb

### 2. Layout (`src/app/layout.tsx`)

- Retained Inter + JetBrains Mono fonts (with note to swap for Geist/Geist Mono in production)
- Background set to `var(--cc-canvas-soft)` (#fafafa)
- Text color set to `var(--cc-ink)` (#171717)

### 3. Page (`src/app/page.tsx`)

**Structural changes:**

- **Removed** `SiteHeader` / `SiteFooter` (marketing components)
- **Added** fixed sidebar navigation with sections: Dashboard (Overview, Wallets, Transactions, Chains) and Settings (API Keys, Team)
- **Added** sidebar active state with left indicator bar
- **Replaced** `cc-card` / `cc-card-lg` with `v-stat-card` / `v-chart-card`
- **Added** data table component showing sample transaction data
- **Added** page header with mono breadcrumb trail

**Component mapping (old → new):**

| Old | New | Notes |
|-----|-----|-------|
| `cc-card` (KPIs) | `v-stat-card` | 8px radius, stacked shadow |
| `cc-card-lg` (charts) | `v-chart-card` | hairline border, 8px radius |
| `cc-display-*` | `v-stat-card__value` | 28px/600 for stat values |
| `cc-caption-mono` | `v-stat-card__label` | mono uppercase for labels |
| `cc-btn-secondary-sm` | `v-btn-secondary` | 6px radius |
| `SiteHeader` | `v-sidebar` | Fixed left nav |

---

## Design Spec Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Background `#fafafa` | ✅ | `body { background: var(--cc-canvas-soft) }` |
| Font stack `Geist, Inter, system-ui` | ✅ | `--v-font-sans` variable |
| Display tracking `-2.4px` / `-1.28px` | ✅ | `--v-tracking-xl` / `--v-tracking-lg` |
| 6px radius (app-level) | ✅ | `--v-radius-sm: 6px` on buttons, inputs, sidebar items |
| 8px radius (cards) | ✅ | `--v-radius-md: 8px` on stat/chart cards |
| Sidebar white bg | ✅ | `.v-sidebar { background: var(--cc-canvas) }` |
| Sidebar active 3px bar | ✅ | `::before` pseudo-element, 3px wide |
| Sidebar inactive gray → hover black | ✅ | `color: var(--cc-muted)` → `hover: var(--cc-ink)` |
| Table header canvas-soft + mono uppercase | ✅ | `.v-table thead` + `.v-table th` |
| Table row white bg + hairline divider | ✅ | `.v-table td` |
| Table cell padding 8px 16px | ✅ | `padding: var(--cc-xs) var(--cc-md)` |
| Stat card stacked shadow + inset | ✅ | `--v-shadow-card, --v-shadow-inset` |
| Stat value large 600 | ✅ | `28px / var(--v-weight-semibold)` |
| Stat label small gray | ✅ | `12px mono uppercase / var(--cc-muted)` |
| Chart card white + hairline border | ✅ | `.v-chart-card` |
| Primary button black bg, 6px radius | ✅ | `.v-btn-primary` |
| Secondary button white bg, hairline border, 6px | ✅ | `.v-btn-secondary` |
| Input 6px radius, 40px height | ✅ | `.v-input` |

---

## Typography Scale

| Token | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| Page title | 24px | 600 | -1.28px | `v-page-header__title` |
| Stat value | 28px | 600 | -0.96px | `v-stat-card__value` |
| Chart title | 16px | 600 | — | `v-chart-card__title` |
| Body | 14px | 400 | — | Table cells, descriptions |
| Label (mono) | 12px | 400 | 0.5px | `v-stat-card__label`, breadcrumbs |
| Table header (mono) | 11px | 500 | 0.5px | `.v-table th` |
| Sidebar item | 14px | 500 | — | `.v-sidebar-item` |

---

## Color Usage

| Element | Color | Variable |
|---------|-------|----------|
| Page background | `#fafafa` | `--cc-canvas-soft` |
| Card/sidebar background | `#ffffff` | `--cc-canvas` |
| Primary text | `#171717` | `--cc-ink` |
| Body text | `#4d4d4d` | `--cc-body` |
| Muted text | `#888888` | `--cc-muted` |
| Borders | `#ebebeb` | `--cc-hairline` |
| Links | `#0070f3` | `--cc-link` |
| Active indicator | `#171717` | `--cc-ink` |
| Positive delta | `#0070f3` | `--cc-success` |
| Negative delta | `#ee0000` | `--cc-error` |

---

## Production Notes

1. **Font loading:** The current implementation uses Inter + JetBrains Mono via `next/font/google`. For production, replace with Geist + Geist Mono via `next/font/local`:
   ```tsx
   import localFont from 'next/font/local'
   const geist = localFont({ src: './fonts/GeistVF.woff', variable: '--font-geist' })
   const geistMono = localFont({ src: './fonts/GeistMonoVF.woff', variable: '--font-geist-mono' })
   ```

2. **Responsive:** Sidebar hides below 860px, main content goes full-width.

3. **Navigation state:** Currently client-side only (`useState`). For multi-page, integrate with Next.js router (`usePathname`).

4. **Data table:** Sample data shown for demonstration. Connect to real API endpoint for production.

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | Added Vercel design tokens + component classes |
| `src/app/layout.tsx` | Updated font imports, added Geist note |
| `src/app/page.tsx` | Replaced marketing layout with sidebar dashboard |
