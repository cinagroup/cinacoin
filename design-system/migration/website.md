# Website Migration Guide

## Current State Analysis

**App:** cinacoin-website (cinacoin.com)  
**Framework:** Next.js 14.2.3  
**Current Theme:** Dark mode (background: #171717, foreground: #ffffff)  
**Tailwind Config:** Custom colors and font family defined

### Current Configuration

**tailwind.config.ts:**
```typescript
colors: {
  background: "#171717",
  foreground: "#ffffff",
},
fontFamily: {
  sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-geist-mono)", "monospace"],
}
```

**globals.css:**
```css
:root {
  --background: #171717;
  --foreground: #ffffff;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

### Key Differences from Design System

| Aspect | Current | Design System | Action Required |
|--------|---------|---------------|-----------------|
| Background | Dark (#171717) | Light (#fafafa) | **Major change** |
| Text color | White (#ffffff) | Ink (#171717) | **Major change** |
| Font family | Geist (✓) | Geist (✓) | No change needed |
| Color tokens | Minimal | Full semantic palette | Add tokens |
| Shadows | None | 5-level system | Add shadows |
| Border radius | Default | 6/8/12/100px | Add radii |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/website/tailwind.config.ts`

**Before:**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#171717",
        foreground: "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

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
    extend: {
      // Keep existing font variables if needed
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

### Step 2: Replace globals.css

**File:** `/home/cina/.openclaw/workspace/apps/website/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/website/globals.css`

### Step 3: Update Component Classes

**Color Mapping:**

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `bg-[#171717]` | `bg-canvas-soft` | Page background |
| `bg-background` | `bg-canvas-soft` | Page background |
| `text-white` | `text-ink` | Primary text |
| `text-foreground` | `text-ink` | Primary text |
| `text-gray-300` | `text-body` | Secondary text |
| `text-gray-400` | `text-mute` | Tertiary text |
| `border-gray-800` | `border-hairline` | Borders |

**Example Component Updates:**

```tsx
// Before
<div className="bg-background text-foreground">
  <h1 className="text-white">Welcome</h1>
  <p className="text-gray-300">Description</p>
</div>

// After
<div className="bg-canvas-soft text-ink">
  <h1 className="text-ink">Welcome</h1>
  <p className="text-body">Description</p>
</div>
```

### Step 4: Update Card Components

```tsx
// Before
<div className="bg-black/50 border border-gray-800 rounded-lg p-6">
  Content
</div>

// After
<div className="bg-canvas border border-hairline rounded-md p-6 shadow-cinacoin-1">
  Content
</div>
```

### Step 5: Update Button Components

```tsx
// Before
<button className="bg-white text-black px-4 py-2 rounded-lg">
  Click me
</button>

// After
<button className="btn btn-primary">
  Click me
</button>
```

## Color Mapping Table

| Purpose | Old Value | New Value | New Token |
|---------|-----------|-----------|-----------|
| Page background | #171717 | #fafafa | `canvas-soft` |
| Card background | #000000 | #ffffff | `canvas` |
| Primary text | #ffffff | #171717 | `ink` |
| Secondary text | #d4d4d4 | #4d4d4d | `body` |
| Tertiary text | #737373 | #888888 | `mute` |
| Borders | #262626 | #ebebeb | `hairline` |
| Links | #60a5fa | #0070f3 | `link` |
| Success | #22c55e | #0070f3 | `success` |
| Error | #ef4444 | #ee0000 | `error` |

## Breaking Changes

⚠️ **Major Visual Change:** This migration switches from dark mode to light mode. This is a significant visual change that affects the entire site.

**Recommendations:**
1. Consider adding a dark mode toggle for user preference
2. Update all marketing materials to reflect new light theme
3. Test all pages thoroughly for contrast and readability
4. Consider phased rollout with A/B testing

## Testing Checklist

- [ ] All pages render correctly with light theme
- [ ] Text has sufficient contrast (WCAG AA minimum)
- [ ] Buttons are visible and clickable
- [ ] Links are distinguishable from text
- [ ] Cards and containers have proper borders
- [ ] Shadows render correctly
- [ ] Mobile responsive design still works
- [ ] All interactive elements are accessible

## Rollback Plan

If issues arise, revert these files:
1. `tailwind.config.ts` → Remove preset import
2. `src/app/globals.css` → Restore original dark theme
3. Component files → Revert class name changes

**Git commands:**
```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
