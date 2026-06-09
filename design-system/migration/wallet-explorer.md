# Wallet Explorer Migration Guide

## Current State Analysis

**App:** cinacoin-wallet-explorer (wallet.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Dark mode (bg-gray-950, text-gray-100)  
**Tailwind Config:** No custom theme extensions  
**CSS Variables:** Custom primary/success/warning/error colors

### Current Configuration

**tailwind.config.ts:**
```typescript
theme: {
  extend: {},
},
```

**globals.css:**
```css
:root {
  --color-primary: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error: #ef4444;
}

body {
  @apply bg-gray-950 text-gray-100;
}
```

### Key Differences from Design System

| Aspect | Current | Design System | Action Required |
|--------|---------|---------------|-----------------|
| Background | Dark (gray-950) | Light (#fafafa) | **Major change** |
| Text color | Light (gray-100) | Dark (#171717) | **Major change** |
| Color tokens | 4 semantic vars | Full palette | Add tokens |
| Font family | Default | Geist/Inter | Add fonts |
| Shadows | None | 5-level system | Add shadows |
| Monospace | Not defined | Geist Mono | Add for hashes |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/wallet-explorer/tailwind.config.ts`

**After:**
```typescript
import type { Config } from "tailwindcss";
import cinacoinPreset from "@cinacoin/design-system/tailwind-preset";

const config: Config = {
  presets: [cinacoinPreset],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

### Step 2: Replace globals.css

**File:** `/home/cina/.openclaw/workspace/apps/wallet-explorer/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/wallet-explorer/globals.css`

### Step 3: Update Component Classes

**Color Mapping:**

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `bg-gray-950` | `bg-canvas-soft` | Page background |
| `bg-gray-900` | `bg-canvas` | Card backgrounds |
| `bg-gray-800` | `bg-canvas-soft-2` | Nested areas |
| `text-gray-100` | `text-ink` | Primary text |
| `text-gray-300` | `text-body` | Secondary text |
| `text-gray-400` | `text-mute` | Tertiary text |
| `text-gray-500` | `text-mute` | Tertiary text |
| `border-gray-800` | `border-hairline` | Borders |
| `border-gray-700` | `border-hairline` | Borders |

**Example Component Updates:**

```tsx
// Before
<div className="bg-gray-950 text-gray-100">
  <h1 className="text-xl font-bold">Wallet</h1>
  <p className="text-gray-300">Address: <code className="bg-gray-800 px-2 py-1 rounded">0x1234...</code></p>
</div>

// After
<div className="bg-canvas-soft text-ink">
  <h1 className="text-xl font-bold text-ink">Wallet</h1>
  <p className="text-body">Address: <code className="mono">0x1234...</code></p>
</div>
```

### Step 4: Update Search Components

```tsx
// Before
<input className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-lg px-4 py-3" />

// After
<input className="search-bar" />
```

### Step 5: Update Transaction Cards

```tsx
// Before
<div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
  <div className="flex justify-between">
    <span className="text-gray-400">Amount</span>
    <span className="text-green-400 font-mono">+1.5 ETH</span>
  </div>
</div>

// After
<div className="tx-card">
  <div className="detail-row">
    <span className="detail-label">Amount</span>
    <span className="detail-value amount amount-positive">+1.5 ETH</span>
  </div>
</div>
```

## Color Mapping Table

| Purpose | Old Value | New Value | New Token |
|---------|-----------|-----------|-----------|
| Page background | #030712 (gray-950) | #fafafa | `canvas-soft` |
| Card background | #111827 (gray-900) | #ffffff | `canvas` |
| Nested areas | #1f2937 (gray-800) | #f5f5f5 | `canvas-soft-2` |
| Primary text | #f3f4f6 (gray-100) | #171717 | `ink` |
| Secondary text | #d1d5db (gray-300) | #4d4d4d | `body` |
| Tertiary text | #9ca3af (gray-400) | #888888 | `mute` |
| Borders | #1f2937 (gray-800) | #ebebeb | `hairline` |
| Links | #3b82f6 | #0070f3 | `link` |
| Success/Positive | #22c55e | #0070f3 | `success` |
| Warning | #eab308 | #f5a623 | `warning` |
| Error/Negative | #ef4444 | #ee0000 | `error` |

## Breaking Changes

⚠️ **Major Visual Change:** Dark mode → Light mode. This is a complete visual overhaul.

**Impact:**
- All backgrounds become light
- All text becomes dark
- Addresses/hashes now use monospace with light background
- Transaction amounts use new color scheme

## Testing Checklist

- [ ] Search bar is visible and functional
- [ ] Transaction cards display properly
- [ ] Address hashes are readable in monospace
- [ ] Positive/negative amounts have correct colors
- [ ] Tables have correct borders
- [ ] Mobile responsive design works
- [ ] Long addresses truncate properly

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
