# Cinacoin Website — Final Design Compliance Audit

**Date:** 2026-06-08  
**Project:** `/home/cina/.openclaw/workspace/onux/apps/website`  
**Design System:** `packages/design-tokens/css/cinacoin.css`

---

## Summary

| Priority | Pass | Fail | Partial |
|----------|------|------|---------|
| P0       | 2    | 0    | 0       |
| P1       | 1    | 0    | 1       |
| P2       | 0    | 3    | 0       |
| **Total**| **3**| **3**| **1**   |

---

## P0 — High Priority

### ✅ Card stacking shadow + inset hairline — PASS

All card primitives include proper stacking shadows with inset hairline:

| Class | Shadow | Inset Hairline |
|-------|--------|----------------|
| `.cc-card` | `0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04)` | `inset 0 0 0 1px var(--cc-hairline)` |
| `.cc-card-lg` | `0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.06)` | `inset 0 0 0 1px var(--cc-hairline)` |
| `.cc-card-featured` | `var(--cc-level4)` (includes inset hairline) | via token |

Dark theme variants also correctly use `rgba(255,255,255,0.06)` for inset hairline.

### ✅ Button border-radius unified — PASS

| Context | Class | Radius | Value |
|---------|-------|--------|-------|
| Marketing CTA | `.cc-btn-primary` | `var(--cc-radius-pill)` | **100px** |
| Marketing CTA sm | `.cc-btn-primary-sm` | `var(--cc-radius-pill)` | **100px** |
| Secondary | `.cc-btn-secondary` | `var(--cc-radius-pill)` | **100px** |
| Secondary sm | `.cc-btn-secondary-sm` | `var(--cc-radius-pill)` | **100px** |
| Nav CTA signup | `.cc-nav-cta-signup` | `var(--cc-radius-sm)` | **6px** |
| Nav CTA login | `.cc-nav-cta-login` | `var(--cc-radius-sm)` | **6px** |

Marketing buttons = 100px pill ✅ · Navigation buttons = 6px ✅

---

## P1 — Medium Priority

### ⚠️ Technical content uses Geist Mono monospace — PARTIAL

**Expected:** Geist Mono  
**Actual:** JetBrains Mono (loaded via `next/font/google` as `--font-mono`)

The monospace font stack is:
```css
var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, monospace
```

Used in: `.cc-code`, `.cc-caption-mono`, `.cc-code-block`, `.cc-footer-heading`, and `font-mono` Tailwind utility in `Developers.tsx`.

**Verdict:** Monospace font IS applied to technical content, but uses JetBrains Mono instead of Geist Mono. Functionally equivalent; visually different.

### ✅ Input height unified to 40px — PASS

| Class | Height |
|-------|--------|
| `.cc-form-input` | **40px** |
| `.cc-form-input-sm` | 32px (intentional small variant) |

Primary input height = 40px ✅

---

## P2 — Low Priority

### ❌ Geist font loaded via next/font — FAIL

**File:** `src/app/layout.tsx`

```tsx
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
```

**Issue:** Geist is referenced in the CSS body font-family:
```css
font-family: Geist, var(--font-inter), Inter, system-ui, ...
```

But Geist is **never loaded** via `next/font` or any `<link>` tag. It will silently fall through to Inter. The CSS declares it as the primary font but the font file is never fetched.

**Fix needed:** Either:
1. Load Geist via `next/font/google` (if available) or `next/font/local`, or
2. Remove `Geist` from the CSS font-family stack to avoid confusion.

### ❌ Navigation link border-radius corrected to 6px — FAIL

**File:** `packages/design-tokens/css/cinacoin.css`

```css
.cc-navbar-link {
  ...
  border-radius: var(--cc-radius-full);  /* = 9999px (pill) */
}
```

**Expected:** `var(--cc-radius-sm)` = **6px**  
**Actual:** `var(--cc-radius-full)` = **9999px** (full pill)

Navigation links are rendering as pills instead of subtle rounded rectangles.

**Fix needed:** Change `.cc-navbar-link` border-radius to `var(--cc-radius-sm)`.

### ❌ `_headers` logo.svg reference removed — FAIL

**File:** `public/_headers` (line 25-26)

```
/logo.svg
  Cache-Control: public, max-age=86400
```

**Issue:** The `/logo.svg` cache header block still exists, but **no `logo.svg` file exists** in `public/`. This is a dead reference that should be cleaned up.

The same stale reference also exists in `out/_headers` (build output).

**Fix needed:** Remove the `/logo.svg` block from `public/_headers`.

---

## Action Items

| # | Priority | Issue | File | Fix |
|---|----------|-------|------|-----|
| 1 | P1 | Use Geist Mono instead of JetBrains Mono | `layout.tsx` + `cinacoin.css` | Replace `JetBrains_Mono` import with Geist Mono (or accept JetBrains Mono as equivalent) |
| 2 | P2 | Geist font not loaded via next/font | `layout.tsx` | Add Geist font import or remove from CSS stack |
| 3 | P2 | Nav link radius is 9999px, should be 6px | `cinacoin.css` `.cc-navbar-link` | Change `border-radius` to `var(--cc-radius-sm)` |
| 4 | P2 | Dead `logo.svg` reference in _headers | `public/_headers` | Remove `/logo.svg` cache block |

---

## Conclusion

**P0 items are fully resolved** — card shadows and button radii comply with the design spec.

**3 of 7 audit items pass**, 1 partial, 3 fail. The remaining failures are all P2 (low priority) and one P1 (font choice). No blocking issues remain for launch, but the nav link radius and _headers cleanup are quick wins.
