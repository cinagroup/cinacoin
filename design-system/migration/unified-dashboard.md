# Unified Dashboard Migration Guide

## Current State Analysis

**App:** cinacoin-unified-dashboard (app.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Light gradient background (RGB vars), blue primary palette  
**Tailwind Config:** Extended blue primary palette (50-950)

### Current Configuration

**tailwind.config.ts:**
```typescript
colors: {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
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
| Primary color | Blue scale | Black (#171717) | **Major change** |
| Text color | RGB var (15,23,42) | #171717 | Simplify |
| Color tokens | Blue scale only | Full semantic palette | Add tokens |
| Shadows | None | 5-level system | Add shadows |
| Border radius | Default | 6/8/12/100px | Add radii |
| Font family | Not defined | Geist/Inter | Add fonts |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/unified-dashboard/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/unified-dashboard/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/unified-dashboard/globals.css`

### Step 3: Update Component Classes

**Color Mapping:**

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `bg-primary-600` | `bg-primary` | Primary buttons |
| `bg-primary-50` | `bg-canvas-soft` | Light backgrounds |
| `text-primary-600` | `text-link` | Link-colored text |
| `text-primary-700` | `text-ink` | Dark text |
| `text-slate-900` | `text-ink` | Primary text |
| `text-slate-600` | `text-body` | Secondary text |
| `text-slate-400` | `text-mute` | Tertiary text |
| `border-slate-200` | `border-hairline` | Borders |
| `border-primary-200` | `border-hairline` | Borders |

**Example Component Updates:**

```tsx
// Before
<div className="bg-slate-50">
  <h1 className="text-slate-900">Dashboard</h1>
  <p className="text-slate-600">Welcome back</p>
  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg">
    Action
  </button>
</div>

// After
<div className="bg-canvas-soft">
  <h1 className="text-ink">Dashboard</h1>
  <p className="text-body">Welcome back</p>
  <button className="btn btn-primary">
    Action
  </button>
</div>
```

### Step 4: Update Card Components

```tsx
// Before
<div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
  Content
</div>

// After
<div className="card">
  Content
</div>
```

### Step 5: Update Stat Components

```tsx
// Before
<div className="bg-white rounded-lg p-4">
  <p className="text-sm text-slate-500">Total Users</p>
  <p className="text-2xl font-bold text-slate-900">1,234</p>
</div>

// After
<div className="stat-card">
  <p className="stat-label">Total Users</p>
  <p className="stat-value">1,234</p>
</div>
```

## Color Mapping Table

| Purpose | Old Value | New Value | New Token |
|---------|-----------|-----------|-----------|
| Page background | Gradient slate | #fafafa | `canvas-soft` |
| Card background | white | #ffffff | `canvas` |
| Primary buttons | #2563eb | #171717 | `primary` |
| Primary text | rgb(15,23,42) | #171717 | `ink` |
| Secondary text | #475569 | #4d4d4d | `body` |
| Tertiary text | #94a3b8 | #888888 | `mute` |
| Borders | #e2e8f0 | #ebebeb | `hairline` |
| Links | #2563eb | #0070f3 | `link` |
| Success | #22c55e | #0070f3 | `success` |
| Error | #ef4444 | #ee0000 | `error` |

## Breaking Changes

⚠️ **Primary Color Change:** The primary brand color changes from blue (#2563eb) to black (#171717). Blue is now used only for links and success states.

**Impact:**
- All primary buttons become black
- Navigation highlights change from blue to black
- Active states change color

## Testing Checklist

- [ ] Sidebar navigation renders correctly
- [ ] All stat cards display properly
- [ ] Tables have correct borders and hover states
- [ ] Charts still render with proper colors
- [ ] Forms have correct input styling
- [ ] Badges show correct colors
- [ ] Mobile responsive design works
- [ ] All interactive elements are accessible

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
