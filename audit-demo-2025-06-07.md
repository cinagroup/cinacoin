# 3-Round Deep Audit Report: demo.cinacoin.com + react.cinacoin.com

**Date:** 2025-06-07 UTC  
**Scope:** `/onux/apps/demo/` (Next.js) + `/onux/apps/demo-react/` (Vite/React)  
**Design Source:** `/design-guidelines/DESIGN.md`

---

## Build Status

| App | Command | Status |
|---|---|---|
| `cinacoin-demo` (Next.js) | `pnpm --filter cinacoin-demo build` | ✅ **SUCCESS** — 15/15 static pages, 102 kB shared JS |
| `cinacoin-demo-react` (Vite) | `pnpm --filter cinacoin-demo-react build` | ✅ **SUCCESS** — 6.16s build, chunk warning (473 kB + 617 kB core) |

---

## ROUND 1: DESIGN.md + Accessibility

### 1.1 Design Token Compliance

**✅ Token System — Excellent**
- Both apps correctly import `@cinacoin/design-tokens/css/cinacoin.css`
- All CSS variables (`--cc-*`) match DESIGN.md exactly — colors, spacing, radius, typography, elevation levels
- Light + dark themes both implemented with full variable sets

**⚠️ Hardcoded Colors (Minor)**
- `app/tokens/page.tsx:69` — Sparkline SVG uses hardcoded `#34d399` / `#f87171` instead of `var(--cc-success)` / `var(--cc-error)`
- `app/layout.tsx` — `themeColor` meta uses `#0a0a0a` / `#fafafa` (acceptable as meta tags can't use CSS vars)
- `Card.tsx:56` — `mask` CSS uses `#fff` (technically mask compositing, not a brand color)

**⚠️ Chain/Brand Data Colors (Expected — Not a Bug)**
- All chain badge colors (`#627EEA`, `#8247E5`, etc.) are brand colors for blockchains, NOT design system deviations — these are data, not UI theme. Acceptable.

**⚠️ Social Provider Logos (AuthPage.tsx — demo-react)**
- Google (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`), Discord (`#5865F2`), Facebook (`#1877F2`) use their official brand colors in SVG fills. These are third-party brand colors, not design system violations.

### 1.2 Typography Compliance

**✅ demo-react — Excellent compliance**
- Uses `.cc-display-xl`, `.cc-display-lg`, `.cc-display-sm`, `.cc-body-lg`, `.cc-body-md`, `.cc-caption-mono` classes
- Typography scales match DESIGN.md at all breakpoints (32→40→48px for display-xl)

**✅ demo — Manual but correct values**
- `app/page.tsx:418` — Hero h1: `text-[48px] font-[600] leading-[48px] tracking-[-2.4px]` ✅ matches display-xl
- `app/page.tsx:703` — Section h2: `text-[32px] font-[600] tracking-[-1.28px] leading-[40px]` ✅ matches display-lg
- `app/page.tsx:727` — Subsection h2: `text-[24px] font-[600] tracking-[-0.96px] leading-[32px]` ✅ matches display-md
- ⚠️ Uses inline Tailwind values instead of `.cc-display-*` classes — functionally identical but less maintainable

**⚠️ Sentence-case + Period-terminated Headlines (Mixed)**
- DESIGN.md: "Headlines like 'Build and deploy on the AI Cloud.' end with a deliberate period"
- demo `app/page.tsx:418`: "The open-source wallet connection toolkit." ✅ period-terminated
- demo-react `HomePage.tsx:90`: "Connect any wallet, on any chain." ✅ period-terminated
- demo-react `HomePage.tsx:205`: "Everything you need." ✅ period-terminated
- demo-react `HomePage.tsx:228`: "16 chains supported." ✅ period-terminated
- ⚠️ demo-react `SwapPage.tsx:141`: "Swap tokens" — ❌ missing period
- ⚠️ demo-react `AuthPage.tsx:83`: "Authentication" — ❌ missing period
- ⚠️ demo-react `MultiChainPage.tsx:35`: "16 chains, one SDK" — ❌ missing period

### 1.3 Mesh Gradient

**✅ Both apps correctly implement `.cc-mesh-gradient` / `.cc-mesh-gradient-strong`**
- Used only at hero scale as atmospheric backdrop
- No miniaturization to icons or single-color reduction
- Properly wrapped in `aria-hidden="true"` with `pointer-events-none`

### 1.4 Stacked Shadows

**✅ Excellent compliance**
- Both apps use `shadow-[var(--cc-levelN)]` for elevation
- `app/page.tsx` uses explicit shadow values that match cc-level3/4 tokens
- No heavy single-drop-shadows detected

### 1.5 Elevation Levels

**✅ Cards use Level 2-4 as specified**
- `cc-card` → Level 2 default, Level 3 hover
- `cc-card-lg` → Level 3 default, Level 4 hover
- `cc-card-featured` → Level 4 default, Level 5 hover
- Modal/dropdown use Level 5 shadow

### 1.6 Accessibility

#### ✅ Strengths
- **Skip links** — Both apps implement skip-to-main-content links (`demo: layout.tsx`, `demo-react: SiteHeader.tsx`)
- **`<main id="main-content">`** — Present in all demo-react pages
- **`aria-label`** on sections — Comprehensive in both apps
- **`aria-current="page"`** on active nav links — Both apps
- **`aria-expanded`**, **`aria-haspopup`** on dropdowns — ChainSelector, Header language selector
- **`role="dialog"`, `aria-modal="true"`** on WalletModal
- **`role="listbox"`, `role="option"`, `aria-selected`** on dropdowns
- **`role="tablist"`, `role="tab"`, `aria-selected`** on AuthPage tabs
- **`role="status"`, `role="alert"`, `aria-live="polite"`** on status indicators
- **`role="progressbar"`, `aria-valuenow`** on auth progress
- **`aria-hidden="true"`** on decorative elements (particles, mesh gradient)
- **Focus-visible rings** — Global CSS rule in cinacoin.css for all interactive elements
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` in cinacoin.css

#### ⚠️ Issues Found

1. **demo — `app/page.tsx`**: Hero CTA buttons have no `aria-label`. The button text is descriptive ("Connect Wallet") but the secondary CTAs ("Try Swap Demo →", "Multi-Chain →") could benefit from `aria-label` for screen readers that strip punctuation.

2. **demo — `TokenInput.tsx`**: The `<input>` element has no `aria-label` or `id`/`htmlFor` connection.

3. **demo — `app/swap/page.tsx`**: The `TokenSelector` dropdown button has no `aria-label` or `aria-expanded`.

4. **demo-react — `SwapPage.tsx` TokenSelector**: The `onSelect` buttons have `aria-selected={false}` hardcoded — this should reflect actual selection state.

5. **demo-react — no `prefers-reduced-motion` in its own CSS**. The design tokens file has it, but demo-react's `index.css` doesn't include it directly (it does import cinacoin.css though, so it's inherited ✅).

6. **demo — no `lang` attribute on `<html>` when i18n switches to Chinese**. The `I18nProvider` sets `document.documentElement.lang` but only for `en`/`zh` — this is ✅ actually working.

7. **demo — `app/page.tsx:798`**: Dark CTA section uses `text-[var(--on-primary)]` — this is a **bug**. Should be `text-[var(--cc-on-primary)]`. The variable `--cc-on-primary` works fine, but `--on-primary` is undefined, causing text to fall back to inherit color on dark backgrounds.

### 1.7 Border Radius Compliance

**✅ Pill shape (100px)** for marketing CTAs in both apps
**✅ 6px radius** for form inputs and small buttons
**✅ 8px (md)** for cards
**✅ 12px (lg)** for larger cards
**✅ Full (9999px)** for nav links and avatar circles

---

## ROUND 2: Content + UX

### 2.1 Content Quality

**✅ demo — Rich, well-structured content**
- Hero: Clear value proposition with period-terminated headline
- 9 feature cards with descriptive text
- Stats bar (64 packages, 16 chains, 30+ wallets, $0 cost, 100% open source)
- 16-chain showcase
- Connection history section
- CTA section with dark band polarity flip
- Demo disclaimer with persistent dismiss state

**✅ demo-react — Clean, focused content**
- Hero with clear messaging
- Connected wallet state card
- Stats in card format
- 6 feature cards
- 16-chain showcase in grid
- Auth page with comparison table (Cinacoin vs Cinacoin)
- Code examples

### 2.2 Navigation UX

**✅ demo Header** — Full nav with 11 links, mobile hamburger, theme toggle, language selector, connect wallet CTA. `aria-expanded` on mobile menu. Active link highlighting.

**✅ demo-react SiteHeader** — Minimal nav (Swap, Multi-Chain, Auth), wallet connection state, disconnect button. Uses `cc-navbar` primitives.

**⚠️ Issues:**
1. **demo Header** — 11 nav items in desktop nav creates horizontal overflow on medium screens (~1024-1200px). No scroll or overflow handling.
2. **demo-react** — No mobile hamburger menu; nav items just stack or overflow on small screens.
3. **demo-react** — No language selector or theme toggle (demo has both).

### 2.3 Form UX

**✅ TokenInput** — Good input validation (decimal only), MAX button, balance display
**✅ ChainSelector** — Keyboard navigation (ArrowUp/Down, Escape, Enter), focus trap, outside click close
**✅ Swap slippage selector** — Radio-group pattern with `role="radio"` and `aria-checked`

**⚠️ Issues:**
1. **demo-react SwapPage** — Uses `<input type="number">` which allows `e` (scientific notation). Should use `type="text"` with `inputMode="decimal"` like demo.
2. **demo-react AuthPage** — Social login buttons don't have `aria-describedby` linking to loading state.
3. **demo TokenSelector dropdown** — No keyboard navigation (no Arrow keys, no Escape handling, no focus trap). The ChainSelector has full keyboard nav; TokenSelector is a plain click-only dropdown.

### 2.4 Error States

**✅ Both apps** handle error states well:
- Wallet connection errors with descriptive messages
- Swap failures with transaction step rollback
- Auth step errors with recovery buttons
- Demo disclaimer for simulated data

**⚠️ Issues:**
1. **demo `app/swap/page.tsx`** — When swap fails, the error toast is shown but the TxProgress component still shows the active step with spinner (not updated to error state in all code paths).
2. **demo-react WalletModal** — Error state doesn't show the actual error message from context (shows generic "Something went wrong" instead of the specific error).

### 2.5 Loading States

**✅ Both apps** — Comprehensive loading states with spinners, progress indicators, skeleton placeholders
**✅ demo** — `TxProgress` component with step-by-step transaction visualization
**✅ demo** — Backend status widget with health check indicators

### 2.6 Dark Mode

**✅ demo** — Full dark mode with theme toggle, persisted in localStorage
**⚠️ demo-react** — Uses `[data-theme='dark']` CSS variables but has no theme toggle UI. Dark mode only works if `data-theme="dark"` is set externally.
**⚠️ demo `app/page.tsx:798`** — Bug: `text-[var(--on-primary)]` should be `text-[var(--cc-on-primary)]` (see R1.7 above)

---

## ROUND 3: Performance + Build

### 3.1 Build Performance

| Metric | demo (Next.js) | demo-react (Vite) |
|---|---|---|
| Build time | ~30s | 6.16s |
| Output size | 15 pages, ~1.2 MB total | ~1.8 MB total assets |
| Largest chunk | 103 kB (First Load JS) | 617 kB (core-Bx3tr7mm.js) |

### 3.2 JS Bundle Analysis

**✅ demo (Next.js) — Well-optimized**
- First Load JS: 102 kB shared + per-page (3.78-10.8 kB)
- All pages statically prerendered (○)
- No SSR/streaming overhead for demo pages
- Largest page: `/auth` at 10.8 kB

**⚠️ demo-react (Vite) — Bundle size issues**
- **CRITICAL**: `core-Bx3tr7mm.js` at **617 kB** (177 kB gzipped) — exceeds 500 kB warning
- `index-CdOD3--D.js` at **473 kB** (144 kB gzipped) — near the limit
- `w3m-modal-OpdQNWaw.js` at **169 kB** (35 kB gzipped) — Cinacoin modal is large
- Vite explicitly warns: "Some chunks are larger than 500 kB after minification"

**Root cause of large bundles:**
- `@walletconnect/ethereum-provider` is a heavy dependency
- `viem` (Ethereum library) adds significant weight
- No code splitting configured (`manualChunks` not set in vite.config)
- `react-router-dom` lazy loading is present but doesn't help with the core/property chunks

### 3.3 CSS Bundle

**✅ demo** — Tailwind + cinacoin.css, well-optimized
**✅ demo-react** — Tailwind + cinacoin.css + Google Fonts (Inter)
**⚠️ demo-react** — Imports Inter from Google Fonts via `@import url()` which is a render-blocking network request. Should use `next/font` equivalent or self-host.

### 3.4 Image Optimization

**✅ demo** — Uses Next.js `<Image>` component for logo
**✅ demo-react** — No images (uses SVG icons and emoji)
**⚠️ demo** — Header logo uses plain `<img>` instead of `<Image>` component (misses automatic optimization)

### 3.5 Network Performance

**⚠️ demo-react** — Google Fonts `@import` is render-blocking
**⚠️ demo** — Font loading via `next/font/google` (Inter, JetBrains_Mono) — ✅ optimal
**✅ Both** — No unnecessary external API calls on initial render
**✅ Both** — localStorage for persistence (no network)

### 3.6 Code Quality

**✅ Both apps** — TypeScript throughout
**✅ Both apps** — React hooks best practices (useCallback, useMemo, proper deps)
**✅ Both apps** — Proper cleanup in useEffect return functions
**⚠️ demo `app/page.tsx`** — `PARTICLES` array is defined but empty; the `.map()` renders nothing. Dead code.
**⚠️ demo `app/swap/page.tsx`** — `quoteAbortRef` is set but the cleanup uses `cancelled` flag instead of the AbortController — inconsistent abort pattern.
**⚠️ demo-react `WalletModal.tsx`** — 470+ lines in a single component. Should be split into sub-components (wallet list, connecting state, success state, error state).
**⚠️ demo `app/page.tsx`** — 800+ lines in single component. Should be extracted into section components.

---

## Critical Issues Summary (Priority-ordered)

| # | Severity | App | Issue | Fix |
|---|---|---|---|---|
| 1 | 🔴 P0 | demo | `text-[var(--on-primary)]` → undefined CSS variable, text invisible on dark CTA band | Change to `text-[var(--cc-on-primary)]` |
| 2 | 🟡 P1 | demo-react | JS bundles 617 kB + 473 kB (exceed 500 kB warning) | Configure `manualChunks` in vite.config |
| 3 | 🟡 P1 | demo-react | No theme toggle UI — dark mode non-functional for end users | Add theme toggle button |
| 4 | 🟡 P1 | demo | TokenSelector dropdown has zero keyboard accessibility | Add Arrow keys, Escape, focus trap |
| 5 | 🟡 P1 | demo-react | `input type="number"` allows scientific notation in swap amount | Change to `type="text" inputMode="decimal"` |
| 6 | 🟢 P2 | demo-react | Headlines missing period termination (3 instances) | Add periods to match DESIGN.md voice |
| 7 | 🟢 P2 | demo-react | Header overflows on tablet without hamburger menu | Add mobile nav collapse |
| 8 | 🟢 P2 | demo-react | Google Fonts `@import` is render-blocking | Self-host or use font preload |
| 9 | 🟢 P2 | demo | Hero CTA buttons lack `aria-label` | Add descriptive `aria-label` |
| 10 | 🟢 P2 | Both | Large page components (470-800+ lines) | Extract into section sub-components |
| 11 | 🟢 P2 | demo-react | WalletModal error state shows generic message, not actual error | Display `ctxError` in error state |
| 12 | 🟢 P2 | demo | Empty `PARTICLES` array — dead code | Remove or populate |

---

## What's Working Well

1. **Design system token usage** — Near-perfect adherence to cinacoin.css tokens across both apps
2. **Accessibility foundation** — Skip links, ARIA roles, focus-visible rings, reduced motion — all present
3. **Stacked shadows** — Correct implementation per DESIGN.md elevation spec
4. **Mesh gradient** — Properly constrained to hero scale only
5. **Typography scale** — Correct font weights (600 display ceiling), negative tracking, sentence-case
6. **Pill shapes** — Marketing CTAs use 100px radius, nav uses 6px — correct dual-scale
7. **i18n** — Full en/zh support with locale persistence
8. **Dark theme tokens** — Complete variable set for dark mode
9. **Demo disclaimer** — Clear simulated-data warnings with persistent dismiss
10. **Build passing** — Both apps build cleanly with zero errors
