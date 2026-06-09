# Analytics Dashboard Migration Guide

## Current State Analysis

**App:** analytics-dashboard (data.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Light gradient background (RGB vars), blue primary palette  
**Tailwind Config:** Extended blue primary palette (50-900)

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
  },
},
```

**globals.css:**
```css
:root {
  --foreground-rgb: 15, 23, 42;
  --background-start-rgb: 241, 245, 249;
  --background-end-rgb: 248, 250, 252;
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
| Primary color | Blue scale | Black (#171717) | **Major change** |
| Text color | RGB var (15,23,42) | #171717 | Simplify |
| Color tokens | Blue scale only | Full semantic palette | Add tokens |
| Chart colors | Not defined | 5-color palette | Add chart vars |
| Shadows | None | 5-level system | Add shadows |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/analytics-dashboard/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/analytics-dashboard/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/analytics-dashboard/globals.css`

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
<div className="bg-slate-100 min-h-screen">
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
    <p className="text-3xl font-bold text-slate-900">$12,345</p>
    <p className="text-sm text-green-600">+12.5%</p>
  </div>
</div>

// After
<div className="bg-canvas-soft min-h-screen">
  <div className="stat-card">
    <p className="stat-label">Revenue</p>
    <p className="stat-value">$12,345</p>
    <p className="stat-change stat-change-positive">+12.5%</p>
  </div>
</div>
```

### Step 4: Update Chart Components

```tsx
// Before - Recharts
<LineChart data={data}>
  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
</LineChart>

// After - Use CSS variables for chart colors
// In your chart component, reference the CSS variables:
// var(--chart-1) = #0070f3
// var(--chart-2) = #171717
// var(--chart-3) = #f5a623
<LineChart data={data}>
  <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} />
</LineChart>
```

### Step 5: Update Date Range Pickers

```tsx
// Before
<div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
  <CalendarIcon className="w-4 h-4 text-slate-400" />
  <span className="text-sm text-slate-700">Last 7 days</span>
</div>

// After
<div className="date-range">
  <CalendarIcon className="w-4 h-4 text-mute" />
  <span className="text-body">Last 7 days</span>
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
| Positive change | #16a34a | #0070f3 | `success` |
| Negative change | #dc2626 | #ee0000 | `error` |
| Chart line 1 | #3b82f6 | #0070f3 | `--chart-1` |
| Chart line 2 | #1e40af | #171717 | `--chart-2` |
| Chart line 3 | #f59e0b | #f5a623 | `--chart-3` |

## Breaking Changes

⚠️ **Primary Color Change:** Blue (#2563eb) → Black (#171717)  
⚠️ **Chart Colors:** Chart line colors change to match new palette

## Testing Checklist

- [ ] Stat cards display properly
- [ ] Charts render with new colors
- [ ] Date range picker is styled correctly
- [ ] Tables have correct borders
- [ ] Positive/negative indicators use correct colors
- [ ] Mobile responsive design works

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
