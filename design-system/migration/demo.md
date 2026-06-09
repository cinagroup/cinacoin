# Demo Migration Guide

## Current State Analysis

**App:** cinacoin-demo (demo.cinacoin.com)  
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

**File:** `/home/cina/.openclaw/workspace/apps/demo/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/demo/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/demo/globals.css`

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
  <h1 className="text-white text-4xl font-bold">Demo</h1>
  <p className="text-gray-300">Showcase</p>
  <button className="bg-white text-black px-6 py-3 rounded-full">
    Get Started
  </button>
</div>

// After
<div className="bg-canvas-soft text-ink">
  <h1 className="text-ink text-display">Demo</h1>
  <p className="text-body">Showcase</p>
  <button className="btn-cta">
    Get Started
  </button>
</div>
```

### Step 4: Update Feature Cards

```tsx
// Before
<div className="bg-black/50 border border-gray-800 rounded-xl p-8">
  <h3 className="text-white text-xl font-semibold mb-2">Feature</h3>
  <p className="text-gray-400">Description</p>
</div>

// After
<div className="card-feature">
  <h3 className="text-ink text-xl font-semibold mb-2">Feature</h3>
  <p className="text-body">Description</p>
</div>
```

### Step 5: Update Code Blocks

```tsx
// Before
<pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm font-mono text-gray-300">
  npm install @cinacoin/ui
</pre>

// After
<div className="code-block">
  npm install @cinacoin/ui
</div>
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

## Breaking Changes

⚠️ **Major Visual Change:** Dark mode → Light mode

## Testing Checklist

- [ ] All demo pages render correctly
- [ ] Feature cards display properly
- [ ] Code blocks are readable
- [ ] CTA buttons have pill shape
- [ ] Mobile responsive design works

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
