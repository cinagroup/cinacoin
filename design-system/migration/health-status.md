# Health Status Migration Guide

## Current State Analysis

**App:** cinacoin-health-status (status.cinacoin.com)  
**Framework:** Next.js 14.2.29  
**Current Theme:** Dark mode (bg-gray-950, text-gray-100)  
**Tailwind Config:** No custom theme extensions  
**CSS Variables:** Custom status colors (operational/degraded/outage/maintenance)

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
  --color-operational: #22c55e;
  --color-degraded: #eab308;
  --color-outage: #ef4444;
  --color-maintenance: #3b82f6;
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
| Status operational | Green (#22c55e) | Blue (#0070f3) | **Change** |
| Status degraded | Yellow (#eab308) | Orange (#f5a623) | Slight change |
| Status outage | Red (#ef4444) | Red (#ee0000) | Slight change |
| Status maintenance | Blue (#3b82f6) | Gray (#888888) | **Change** |
| Font family | Default | Geist/Inter | Add fonts |
| Shadows | None | 5-level system | Add shadows |

## Migration Steps

### Step 1: Update tailwind.config.ts

**File:** `/home/cina/.openclaw/workspace/apps/health-status/tailwind.config.ts`

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

**File:** `/home/cina/.openclaw/workspace/apps/health-status/src/app/globals.css`

**Action:** Replace entire file with content from:  
`/home/cina/.openclaw/workspace/design-system/apps/health-status/globals.css`

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
| `border-gray-800` | `border-hairline` | Borders |
| `bg-green-500` | `status-dot-operational` | Status indicator |
| `bg-yellow-500` | `status-dot-degraded` | Status indicator |
| `bg-red-500` | `status-dot-outage` | Status indicator |
| `bg-blue-500` | `status-dot-maintenance` | Status indicator |

**Example Component Updates:**

```tsx
// Before
<div className="bg-gray-950 text-gray-100 min-h-screen">
  <div className="bg-green-500 text-white px-4 py-3 rounded-lg">
    All Systems Operational
  </div>
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <span className="text-gray-100">API Server</span>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        <span className="text-green-500 text-sm">Operational</span>
      </div>
    </div>
  </div>
</div>

// After
<div className="bg-canvas-soft text-ink min-h-screen">
  <div className="status-banner status-banner-operational">
    All Systems Operational
  </div>
  <div className="service-card">
    <span className="service-name">API Server</span>
    <div className="service-status">
      <span className="status-dot status-dot-operational"></span>
      <span className="text-success">Operational</span>
    </div>
  </div>
</div>
```

### Step 4: Update Uptime Bars

```tsx
// Before
<div className="flex gap-0.5 h-6">
  {days.map((day) => (
    <div
      key={day.date}
      className={`flex-1 rounded-sm min-w-[3px] ${
        day.status === 'operational' ? 'bg-green-500' :
        day.status === 'degraded' ? 'bg-yellow-500' :
        day.status === 'outage' ? 'bg-red-500' :
        'bg-gray-500'
      }`}
    />
  ))}
</div>

// After
<div className="uptime-bar">
  {days.map((day) => (
    <div
      key={day.date}
      className={`uptime-segment uptime-segment-${day.status}`}
    />
  ))}
</div>
```

### Step 5: Update Incident Cards

```tsx
// Before
<div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-3">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-gray-100 font-semibold">API Degraded Performance</h3>
    <span className="text-gray-400 text-sm">2 hours ago</span>
  </div>
  <p className="text-gray-300 text-sm">We are investigating...</p>
</div>

// After
<div className="incident-card">
  <div className="incident-header">
    <h3 className="incident-title">API Degraded Performance</h3>
    <span className="incident-time">2 hours ago</span>
  </div>
  <p className="incident-body">We are investigating...</p>
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
| Operational | #22c55e (green) | #0070f3 (blue) | `--status-operational` |
| Degraded | #eab308 (yellow) | #f5a623 (orange) | `--status-degraded` |
| Outage | #ef4444 (red) | #ee0000 (red) | `--status-outage` |
| Maintenance | #3b82f6 (blue) | #888888 (gray) | `--status-maintenance` |

## Breaking Changes

⚠️ **Major Visual Change:** Dark mode → Light mode  
⚠️ **Status Color Changes:**
- Operational: Green → Blue (matches Vercel style)
- Maintenance: Blue → Gray

## Testing Checklist

- [ ] Status banner displays correctly
- [ ] Status dots show correct colors for each state
- [ ] Service cards render properly
- [ ] Uptime bars show correct segment colors
- [ ] Incident cards are readable
- [ ] Mobile responsive design works
- [ ] Color contrast meets accessibility standards

## Rollback Plan

```bash
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/
```
