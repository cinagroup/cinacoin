# Final Audit Report — health-status (status.cinacoin.com)

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
.cc-card {
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.02), 0px 2px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px #ebebeb !important;
}
.cc-card:hover {
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.04), 0px 8px 8px -8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px #ebebeb !important;
}
```
Matches design spec exactly.

### ✅ Technical Content Uses Geist Mono
**Status:** PASS  
**Files:** `src/app/layout.tsx`, `src/app/globals.css`  
**Evidence:**
- `GeistMono` imported from `geist/font/mono` in layout.tsx
- `--font-mono: var(--font-geist-mono, ...)` defined in globals.css
- Technical content (response times, uptime, last check, errors) uses `.cc-code` / `.cc-caption-mono` classes which inherit monospace font

---

## P1 — Medium Priority

### ✅ Status Color Values (success: #0070f3)
**Status:** PASS  
**File:** `src/app/globals.css`  
**Evidence:**
```css
--status-operational: #0070f3;       /* Blue, not green */
--status-operational-soft: #d3e5ff;
--status-operational-deep: #0761d1;
```
Dark theme also updated:
```css
--status-operational: #3291ff;
--status-operational-soft: #001a3a;
--status-operational-deep: #0070f3;
```

### ✅ Input Height Unified at 40px
**Status:** PASS (N/A)  
**Note:** health-status has no search input. Form inputs (language selector) use `.cc-form-input-sm` from design tokens which already specifies `height: 40px`. No overrides found.

---

## P2 — Low Priority

### ❌ Button Border-Radius = 6px (not pill)
**Status:** FAIL  
**File:** `packages/design-tokens/css/cinacoin.css`  
**Issue:** All button classes use `border-radius: var(--cc-radius-pill)` (100px) instead of `var(--cc-radius-sm)` (6px):
```css
.cc-btn-primary    { border-radius: var(--cc-radius-pill); }  /* line 221 */
.cc-btn-primary-sm { border-radius: var(--cc-radius-pill); }  /* line 234 */
.cc-btn-secondary  { border-radius: var(--cc-radius-pill); }  /* line 247 */
.cc-btn-secondary-sm { border-radius: var(--cc-radius-pill); } /* line 260 */
```
**Impact:** Buttons appear as pills instead of the Vercel-standard 6px rounded rectangle.  
**Fix Required:** Change `var(--cc-radius-pill)` → `var(--cc-radius-sm)` in all four button classes.

### ✅ logo.svg References Removed
**Status:** PASS  
**Evidence:** `grep -rn "logo.svg" src/` returns zero matches. All references use `/logo.png`.

### ✅ Favicon SVG Reference Corrected
**Status:** PASS  
**File:** `src/app/layout.tsx`  
**Evidence:**
```ts
icons: {
  icon: '/favicon.ico',
  apple: '/favicon.png',
},
```
No SVG favicon reference. Both `/favicon.ico` and `/favicon.png` exist in `public/`.

---

## Summary

| Priority | Item | Status |
|----------|------|--------|
| P0 | Card shadow + inset hairline | ✅ PASS |
| P0 | Geist Mono for technical content | ✅ PASS |
| P1 | Status color #0070f3 | ✅ PASS |
| P1 | Input height 40px | ✅ PASS |
| P2 | Button radius 6px (not pill) | ❌ FAIL |
| P2 | logo.svg removed | ✅ PASS |
| P2 | Favicon SVG corrected | ✅ PASS |

**Overall: 6/7 items pass. 1 item requires fix.**

### Remaining Action Item
1. **P2 — Button radius:** Update `packages/design-tokens/css/cinacoin.css` lines 221, 234, 247, 260 — change `border-radius: var(--cc-radius-pill)` to `border-radius: var(--cc-radius-sm)` for all `.cc-btn-*` classes.
