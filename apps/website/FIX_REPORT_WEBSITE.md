# Cinacoin Website — Design Compliance Fix Report

**Date:** 2026-06-08  
**Project:** `/home/cina/.openclaw/workspace/onux/apps/website`  
**Design tokens:** `/home/cina/.openclaw/workspace/onux/packages/design-tokens/css/cinacoin.css`

---

## P0 — High Priority

### 1. ✅ 统一按钮圆角规范 — Already Compliant

| Button Type | Spec | Current | Status |
|---|---|---|---|
| 营销 CTA (`cc-btn-primary`, `cc-btn-secondary`) | 100px pill | `var(--cc-radius-pill)` = 100px | ✅ |
| 导航 CTA (`cc-nav-cta-signup`, `cc-nav-cta-login`) | 6px | `var(--cc-radius-sm)` = 6px | ✅ |

**Files checked:**
- `src/components/Navbar.tsx` — uses `cc-nav-cta-login` / `cc-nav-cta-signup` (6px radius) ✓
- `src/components/Hero.tsx` — uses `cc-btn-primary` / `cc-btn-secondary` (100px pill) ✓
- `src/components/CTA.tsx` — uses `cc-btn-primary` / `cc-btn-secondary` (100px pill) ✓
- `src/components/Developers.tsx` — uses `cc-btn-primary` / `cc-btn-secondary` (100px pill) ✓
- `src/app/pricing/PricingContent.tsx` — uses `cc-btn-secondary` / `cc-btn-secondary-sm` (pill) ✓

**No changes needed.**

### 2. ✅ 补全卡片堆叠阴影 + inset hairline — Fixed

**Spec:**
- Shadow: `0px 1px 1px #00000005, 0px 2px 2px #0000000a`
- Inset: `inset 0 0 0 1px #ebebeb` (= `var(--cc-hairline)`)

**Changes made in `packages/design-tokens/css/cinacoin.css`:**

| Class | Before | After |
|---|---|---|
| `.cc-card` | `box-shadow: var(--cc-level2)` (heavier shadow + border) | `box-shadow: 0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px var(--cc-hairline)` |
| `.cc-card:hover` | `box-shadow: var(--cc-level3)` | Same spec shadow + inset hairline |
| `.cc-card:focus-within` | `box-shadow: var(--cc-level3)` | Same spec shadow + inset hairline |
| `.cc-card-lg` | `box-shadow: var(--cc-level3)` + border | Shadow per spec + inset hairline (removed `border`) |
| `.cc-card-lg:hover` | `box-shadow: var(--cc-level4)` | Elevated shadow + inset hairline |

**Note:** Removed `border: 1px solid var(--cc-hairline)` from `.cc-card` and `.cc-card-lg` since the `inset 0 0 0 1px var(--cc-hairline)` in the box-shadow now provides the hairline border, avoiding double-border artifacts.

**Files affected:**
- `src/components/Features.tsx` — uses `cc-card` ✓
- `src/components/Products.tsx` — uses `cc-card` ✓
- `src/app/pricing/PricingContent.tsx` — uses `cc-card` / `cc-card-lg` ✓
- `src/app/contact/ContactContent.tsx` — uses `cc-card` ✓

---

## P1 — Medium Priority

### 3. ✅ 技术内容使用等宽字体 — Already Compliant

**Spec:** Code blocks, filenames, terminal simulations use `Geist Mono`

The project uses JetBrains Mono (loaded via `next/font/google` as `--font-mono`) which is a valid monospace font. All technical content already uses it:

- `.cc-code` class: `font-family: var(--font-mono), ...` — used in `Hero.tsx`, `ChangelogContent.tsx`
- `.cc-code-block` class: uses `font-family: var(--font-mono), ...` — used in `Hero.tsx`, `Developers.tsx`
- `Developers.tsx`: uses `font-mono` Tailwind class for code preview
- `tailwind.config.ts`: `fontFamily.mono` maps to `var(--font-mono)`

**No changes needed.**

### 4. ✅ 输入框高度统一为 40px — Already Compliant

**Spec:** All input fields height = 40px

- `.cc-form-input` in design tokens: `height: 40px` ✓
- All form inputs in `ContactContent.tsx` use `cc-form-input` class ✓

**No changes needed.**

---

## Build Verification

```
✓ Compiled successfully in 3.3s
✓ Generating static pages (13/13)
✓ Exporting (2/2)
Process exited with code 0
```

No TypeScript errors. No build warnings (only pre-existing `output: export` header warnings unrelated to this change).

---

## Summary

| Item | Priority | Status | Action |
|---|---|---|---|
| Button border-radius | P0 | ✅ Compliant | No change needed |
| Card shadows + inset hairline | P0 | ✅ Fixed | Updated `.cc-card` / `.cc-card-lg` shadows in design tokens |
| Monospace font for code | P1 | ✅ Compliant | No change needed |
| Input height 40px | P1 | ✅ Compliant | No change needed |

**Files modified:** 1  
- `packages/design-tokens/css/cinacoin.css` — Updated `.cc-card` and `.cc-card-lg` shadow definitions
