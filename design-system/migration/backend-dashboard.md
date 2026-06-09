# Backend Dashboard Migration Guide

## Current State Analysis

**App:** cinacoin-backend-dashboard (backend.cinacoin.com / dash.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Light gradient background (RGB vars), sky-blue primary palette  
**Tailwind Config:** Extended sky-blue primary palette (50-950)

### Current Configuration

**tailwind.config.ts:**
```typescript
colors: {
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
},
```

**globals.css:**
```css
:root {
  --foreground-rgb: 15, 23, 42;
  --background-start-rgb: 248, 250, 252;
  --background-end-rgb: 241, 245, 249;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(to bottom, transparent, rgb(var(--background-end-rgb)))
    rgb(var(--background-start-rgb));
}
```

### Key Differences from Design System

| Aspect | Current | Design System | Action Required |
|--------|---------|---------------|-----------------|
| Background | Gradient (slate tones) | Flat #fafafa | Simplify |
| Primary color | Sky-blue scale | Black (#171717) | **Major change** |
| Text color | RGB var (15,23,42) | #171717 | Simplify |
| Color tokens | Sky-blue scale only | Full semantic palette | Add tokens |
| Shadows | None | 5-level system | Add shadows |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/backend-dashboard/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/backend-dashboard/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/backend-dashboard/globals.css`

### Step 3: Update Component Classes

**Color Mapping:**

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `bg-primary-600` | `bg-primary` | Primary buttons |
| `bg-primary-50` | `bg-canvas-soft` | Light backgrounds |
| `text-primary-600` | `text-link` | Link-colored text |
| `text-slate-900` | `text-ink` | Primary text |
| `text-slate-600` | `text-body` | Secondary text |
| `text-slate-400` | `text-mute` | Tertiary text |
| `border-slate-200` | `border-hairline` | Borders |

**Example Component Updates:**

```tsx
// Before
<div className="bg-slate-50">
  <h1 className="text-slate-900">Admin Panel</h1>
  <button className="bg-primary-600 text-white px-4 py-2 rounded">
    Save
  </button>
  <button className="bg-red-600 text-white px-4 py-2 rounded">
    Delete
  </button>
</div>

// After
<div className="bg-canvas-soft">
  <h1 className="text-ink">Admin Panel</h1>
  <button className="btn btn-primary">
    Save
  </button>
  <button className="btn btn-danger">
    Delete
  </button>
</div>
```

### Step 4: Update Table Components

```tsx
// Before
<table className="min-w-full bg-white border border-slate-200 rounded-lg">
  <thead className="bg-slate-50">
    <tr>
      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-slate-200">
      <td className="px-4 py-2 text-sm text-slate-900">John</td>
    </tr>
  </tbody>
</table>

// After
<table className="table">
  <thead>
    <tr>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
    </tr>
  </tbody>
</table>
```

## Color Mapping Table

| Purpose | Old Value | New Value | New Token |
|---------|-----------|-----------|-----------|
| Page background | Gradient slate | #fafafa | `canvas-soft` |
| Card background | white | #ffffff | `canvas` |
| Primary buttons | #0284c7 | #171717 | `primary` |
| Primary text | rgb(15,23,42) | #171717 | `ink` |
| Secondary text | #475569 | #4d4d4d | `body` |
| Tertiary text | #94a3b8 | #888888 | `mute` |
| Borders | #e2e8f0 | #ebebeb | `hairline` |
| Links | #0284c7 | #0070f3 | `link` |
| Danger | #dc2626 | #ee0000 | `error` |

## Breaking Changes

⚠️ **Primary Color Change:** Sky-blue (#0284c7) → Black (#171717)

## Testing Checklist

- [ ] Admin sidebar renders correctly
- [ ] All tables display properly
- [ ] Form inputs have correct styling
- [ ] Danger buttons are red
- [ ] Badges show correct status colors
- [ ] Mobile responsive design works

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
