# Cloud Dashboard Migration Guide

## Current State Analysis

**App:** cloud-dashboard (cloud.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Light gradient background (RGB vars), sky-blue primary palette  
**Tailwind Config:** Extended sky-blue primary palette (50-900)

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
  background: linear-gradient(to bottom right,
    rgb(var(--background-start-rgb)),
    rgb(var(--background-end-rgb))
  );
  min-height: 100vh;
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
| Font family | Not defined | Geist/Inter | Add fonts |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/cloud-dashboard/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/cloud-dashboard/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/cloud-dashboard/globals.css`

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
<div className="bg-slate-50 min-h-screen">
  <h1 className="text-slate-900 text-2xl font-bold">Cloud Instances</h1>
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <span className="text-green-500">●</span>
    <span className="text-slate-900">instance-01</span>
  </div>
</div>

// After
<div className="bg-canvas-soft min-h-screen">
  <h1 className="text-ink text-2xl font-bold">Cloud Instances</h1>
  <div className="resource-card">
    <span className="status-dot status-running"></span>
    <span className="text-ink">instance-01</span>
  </div>
</div>
```

### Step 4: Update Resource Cards

```tsx
// Before
<div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-green-500"></div>
    <span className="font-medium text-slate-900">server-01</span>
  </div>
  <p className="text-sm text-slate-500 mt-1">Running • 2 vCPU • 4GB RAM</p>
</div>

// After
<div className="resource-card">
  <div className="flex items-center gap-2">
    <span className="status-dot status-running"></span>
    <span className="text-ink font-medium">server-01</span>
  </div>
  <p className="text-body text-sm mt-1">Running • 2 vCPU • 4GB RAM</p>
</div>
```

### Step 5: Update Code Blocks

```tsx
// Before
<pre className="bg-slate-100 border border-slate-200 rounded p-3 text-sm font-mono text-slate-800">
  $ docker ps
</pre>

// After
<div className="code-block">
  $ docker ps
</div>
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
| Status running | #22c55e | #0070f3 | `success` |
| Status stopped | #94a3b8 | #888888 | `mute` |
| Status error | #ef4444 | #ee0000 | `error` |

## Breaking Changes

⚠️ **Primary Color Change:** Sky-blue (#0284c7) → Black (#171717)

## Testing Checklist

- [ ] Instance cards display properly
- [ ] Status dots show correct colors
- [ ] Code blocks are readable
- [ ] Terminal output is styled correctly
- [ ] Resource tables have correct borders
- [ ] Mobile responsive design works

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
