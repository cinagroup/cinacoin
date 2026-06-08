# Final Audit Report — wallet-explorer (wallet.cinacoin.com)

**Audit Date:** 2026-06-08  
**Auditor:** OpenClaw Subagent  
**Scope:** Design compliance against Cinacoin/Vercel design spec

---

## P0 — High Priority

### ✅ Card Stacked Shadow + Inset Hairline
**Status:** PASS  
**File:** `src/app/globals.css`  
**Evidence:**
```css
--vercel-shadow-1: 0px 1px 1px rgba(0, 0, 0, 0.02), 0px 2px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px #ebebeb;
--vercel-shadow-2: 0px 2px 2px rgba(0, 0, 0, 0.04), 0px 8px 8px -8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px #ebebeb;
--vercel-shadow-3: 0px 2px 2px rgba(0, 0, 0, 0.04), 0px 8px 16px -4px rgba(0, 0, 0, 0.04), inset 0 0 0 1px #ebebeb;
```
`.vercel-card` uses `box-shadow: var(--vercel-shadow-1)` with hover `var(--vercel-shadow-2)`. Matches design spec exactly.

### ✅ Technical Content Uses Geist Mono
**Status:** PASS  
**Files:** `src/app/layout.tsx`, `src/app/globals.css`  
**Evidence:**
- `GeistMono` imported from `geist/font/mono` in layout.tsx
- `--vercel-font-mono: var(--font-geist-mono, ...)` defined in globals.css
- Technical content (filter labels, results count, loading messages) uses `.vercel-caption-mono` / `.vercel-code` classes

---

## P1 — Medium Priority

### ✅ Status Color Values
**Status:** PASS (N/A)  
**Note:** Wallet explorer doesn't use operational/degraded/down status colors. Semantic colors are already correct:
```css
--vercel-success: #0070f3;  /* Blue */
--vercel-error: #ee0000;    /* Red */
--vercel-warning: #f5a623;  /* Orange */
```

### ✅ Input Height Unified at 40px
**Status:** PASS  
**File:** `src/app/globals.css`, `src/app/page.tsx`  
**Evidence:**
- `.vercel-input` class defines `height: 40px` in globals.css
- Inline `style={{ height: '36px' }}` override was removed from header search input in page.tsx
- All `<input>` and `<select>` elements use `.vercel-input` class consistently

---

## P2 — Low Priority

### ✅ Button Border-Radius = 6px (not pill)
**Status:** PASS  
**File:** `src/app/globals.css`  
**Evidence:**
```css
--vercel-radius-sm: 6px;

.vercel-btn-primary {
  border-radius: var(--vercel-radius-sm);  /* 6px ✓ */
}
.vercel-btn-secondary {
  border-radius: var(--vercel-radius-sm);  /* 6px ✓ */
}
```
Note: `.vercel-badge` uses `border-radius: 9999px` (pill) which is correct for badges/tags, not buttons.

### ❌ logo.svg References Removed
**Status:** FAIL  
**File:** `src/app/layout.tsx` line 21  
**Issue:**
```ts
icons: { icon: "/wallets/logo.svg" },
```
This references an SVG file at `/wallets/logo.svg`. Given the app's `basePath: "/wallets"`, this resolves to `public/logo.svg`. The file `public/logo.svg` exists (813 bytes).  
**Recommendation:** Change to `icons: { icon: "/favicon.ico" }` or `/logo.png` for consistency with health-status. If SVG is intentional as the site icon, this is acceptable but should be documented.

### ❌ Favicon SVG Reference
**Status:** FAIL  
**Issue:** Same as above — the icon is set to an SVG (`/wallets/logo.svg`). Best practice is to use `.ico` for broadest browser compatibility, with PNG fallback.  
**Recommendation:** Add a proper favicon setup:
```ts
icons: {
  icon: '/favicon.ico',
  apple: '/favicon.png',
},
```
Note: `public/favicon.ico` and `public/favicon.png` do NOT currently exist in wallet-explorer. These need to be added.

---

## Summary

| Priority | Item | Status |
|----------|------|--------|
| P0 | Card shadow + inset hairline | ✅ PASS |
| P0 | Geist Mono for technical content | ✅ PASS |
| P1 | Status color #0070f3 | ✅ PASS |
| P1 | Input height 40px | ✅ PASS |
| P2 | Button radius 6px (not pill) | ✅ PASS |
| P2 | logo.svg removed | ❌ FAIL |
| P2 | Favicon SVG corrected | ❌ FAIL |

**Overall: 5/7 items pass. 2 items require fix.**

### Remaining Action Items
1. **P2 — logo.svg reference:** Change `icons: { icon: "/wallets/logo.svg" }` in `src/app/layout.tsx` to use a non-SVG icon (e.g., `/favicon.ico`).
2. **P2 — Favicon:** Add `favicon.ico` and `favicon.png` to `public/` directory, and update metadata to reference them properly.
