# Fix Group 4 Summary — Dashboard Apps (Group B)

**Agent:** CINAcoin 设计修复 Agent 4  
**Date:** 2026-06-13  
**Scope:** All 6 Dashboard applications

---

## Files Modified

### 1. `packages/design-tokens/css/cinacoin.css` (Canonical tokens — affects developer-dashboard + all apps importing it)

| Fix                  | Before                                                                               | After                                                              |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Radius tokens        | xs:2px, sm:4px, md:4px, lg:4px, xl:4px, pill-sm:4px, pill:4px                        | xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill-sm:64px, pill:100px |
| Button border-radius | `var(--cc-radius-sm)` (4px)                                                          | `var(--cc-radius-pill)` (100px)                                    |
| Buttons fixed        | `.cc-btn-primary`, `.cc-btn-primary-sm`, `.cc-btn-secondary`, `.cc-btn-secondary-sm` | All now use pill shape                                             |

### 2. `apps/cloud-dashboard/src/shared-design-system.css`

| Fix                  | Before                                                                               | After              |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| Button border-radius | `6px` hardcoded                                                                      | `100px` (pill)     |
| Weight token         | `--weight-bold: 700` defined                                                         | Removed            |
| Buttons fixed        | `.cc-btn-primary`, `.cc-btn-primary-sm`, `.cc-btn-secondary`, `.cc-btn-secondary-sm` | All now pill shape |

### 3. `apps/backend-dashboard/src/shared-design-system.css`

| Fix                  | Before                                                                               | After                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Radius aliases       | sm:6px, md:8px, lg:12px, pill:100px (partial set)                                    | Full set: xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill-sm:64px, pill:100px, full:9999px |
| Weight token         | `--weight-bold: 700` defined                                                         | Removed                                                                                   |
| Button border-radius | `var(--cc-radius-sm)` (6px)                                                          | `var(--cc-radius-pill)` (100px)                                                           |
| Buttons fixed        | `.cc-btn-primary`, `.cc-btn-primary-sm`, `.cc-btn-secondary`, `.cc-btn-secondary-sm` | All now pill shape                                                                        |

### 4. `apps/analytics-dashboard/src/shared-design-system.css`

| Fix           | Notes                                                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius tokens | Inherits from canonical `cinacoin.css` — fixed at source                                                                                                                                                                           |
| Typography    | Already uses canonical `cinacoin.css` responsive scale which resolves to correct values at desktop: display-xl 48px/600/-2.4px, display-lg 32px/600/-1.28px, body-md 16px/400, body-sm 14px/400/-0.28px. No local overrides found. |
| Buttons       | Inherits from canonical `cinacoin.css` — fixed at source                                                                                                                                                                           |

### 5. `apps/unified-dashboard/src/shared-design-system.css`

| Fix                  | Before                                                                               | After                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Radius aliases       | sm:4px, md:4px, lg:4px, pill:4px (all collapsed!)                                    | Full set: xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill-sm:64px, pill:100px, full:9999px |
| Weight token         | `--weight-bold: 700` defined                                                         | Removed                                                                                   |
| Button border-radius | `var(--cc-radius-sm)` (4px)                                                          | `var(--cc-radius-pill)` (100px)                                                           |
| Buttons fixed        | `.cc-btn-primary`, `.cc-btn-primary-sm`, `.cc-btn-secondary`, `.cc-btn-secondary-sm` | All now pill shape                                                                        |

### 6. `apps/health-status/src/shared-design-system.css`

| Fix                  | Before                                                                               | After                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Radius aliases       | sm:4px, md:4px, lg:4px, pill:4px (all collapsed!)                                    | Full set: xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill-sm:64px, pill:100px, full:9999px |
| Weight token         | `--weight-bold: 700` defined                                                         | Removed                                                                                   |
| Button border-radius | `4px` hardcoded                                                                      | `100px` (pill)                                                                            |
| Buttons fixed        | `.cc-btn-primary`, `.cc-btn-primary-sm`, `.cc-btn-secondary`, `.cc-btn-secondary-sm` | All now pill shape                                                                        |

### 7. `apps/developer-dashboard`

No local changes needed — uses `@import '@cinacoin/design-tokens/css/cinacoin.css'` directly. All fixes applied via canonical token update (#1 above).

---

## Summary of Changes by Issue

| Issue                         | Apps Affected                          | Status                                                                    |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| **圆角坍塌** (all 4px)        | All 6 dashboards                       | ✅ Fixed — canonical tokens + local aliases corrected                     |
| **按钮形状** (6px/4px → pill) | All 6 dashboards                       | ✅ Fixed — all CTA buttons now `border-radius: 100px`                     |
| **字重 700**                  | cloud, backend, unified, health-status | ✅ Fixed — `--weight-bold: 700` removed                                   |
| **Analytics 字号偏移**        | analytics-dashboard                    | ✅ Verified — uses canonical responsive scale, already correct at desktop |
| **Unified 未使用 700**        | unified-dashboard                      | ✅ Fixed — `--weight-bold: 700` removed                                   |
| **Health Status 圆角**        | health-status                          | ✅ Fixed — radius aliases corrected from 4px to proper scale              |

---

## Notes

- The canonical `cinacoin.css` is the single source of truth for `developer-dashboard` and `analytics-dashboard`. Fixing it once propagates to both.
- The `cloud-dashboard` had the most complete local radius set (sm:6, md:8, lg:12, pill:100) but still had hardcoded 6px on buttons.
- The `unified-dashboard` and `health-status` were the worst offenders with all radius tokens collapsed to 4px.
- No typography scale overrides were found in any dashboard's local globals.css — they all inherit from canonical tokens.
