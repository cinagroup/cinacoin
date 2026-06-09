# Cinacoin Design System — Tailwind CSS Configuration

Vercel-style design tokens for the Cinacoin project, fully integrated with Tailwind CSS.

## Installation

### 1. Install dependencies

```bash
npm install tailwindcss postcss autoprefixer
# or
pnpm add tailwindcss postcss autoprefixer
```

### 2. Copy configuration files

```
design-system/
├── tailwind/
│   └── tailwind.config.ts    → your project root tailwind.config.ts
├── css/
│   ├── variables.css          → import in your global CSS
│   ├── utilities.css          → import after Tailwind directives
│   └── fonts.css              → import first (font-face declarations)
└── postcss/
    └── postcss.config.js      → your project root postcss.config.js
```

### 3. Set up your global CSS (`app/globals.css`)

```css
@import '../design-system/css/fonts.css';
@import '../design-system/css/variables.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@import '../design-system/css/utilities.css';
```

### 4. Reference the Tailwind config in `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";
import config from "./design-system/tailwind/tailwind.config";
export default config;
```

Or merge into your existing config:

```ts
import baseConfig from "./design-system/tailwind/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // your additional paths
  ],
};
```

## Token Naming Conventions

### Colors
- **Semantic names**: `ink`, `body`, `mute`, `canvas`, `link`, `error`, `warning`, `violet`, `cyan`
- **Variants**: `-soft` (light bg), `-deep` (dark variant)
- **Usage in Tailwind**: `text-ink`, `bg-canvas-soft`, `border-hairline`

### Typography
- **Display**: `display-xl` (48px) → `display-sm` (20px) — headings, hero text
- **Body**: `body-lg` (18px) → `body-sm` (14px) — content text
- **UI**: `caption` (12px), `code` (13px mono), `button-md/lg`
- **Usage in Tailwind**: `text-display-xl`, `text-body-md-strong`

### Spacing (4px base grid)
| Token | Value | Tailwind class |
|-------|-------|---------------|
| `xxs` | 4px | `p-xxs`, `m-xxs` |
| `xs` | 8px | `p-xs`, `gap-xs` |
| `sm` | 12px | `p-sm` |
| `md` | 16px | `p-md` |
| `lg` | 24px | `p-lg` |
| `xl` | 32px | `p-xl` |
| `section` | 192px | `py-section` |

### Shadows
- `shadow-level-0` — none (flat)
- `shadow-level-1` — inset border only (cards at rest)
- `shadow-level-2` — subtle lift (buttons)
- `shadow-level-3` — medium elevation (dropdowns)
- `shadow-level-4` — high elevation (modals)
- `shadow-level-5` — highest elevation (popovers, tooltips)

### Border Radius
- `rounded-xs` (4px) → `rounded-xl` (16px)
- `rounded-pill-sm` (64px), `rounded-pill` (100px), `rounded-full` (9999px)

## Override Relationship with Tailwind Defaults

All tokens are in `theme.extend`, so they **add to** (not replace) Tailwind's defaults:

- Default Tailwind colors still work (`text-red-500`, `bg-blue-200`)
- Custom tokens take semantic names (`text-ink`, `bg-canvas`)
- If a name collides (e.g., `rounded-full`), the custom value overrides
- Default spacing scale is preserved; custom tokens add named sizes

## Usage Examples

```tsx
// Hero heading
<h1 className="text-display-xl text-ink tracking-tightest">
  Build faster with Cinacoin
</h1>

// Card with shadow
<div className="bg-canvas rounded-lg shadow-level-2 p-lg">
  <p className="text-body-md text-body">Card content</p>
</div>

// Button
<button className="bg-primary text-on-primary rounded-md px-md py-xs text-button-md
                    hover:bg-link transition-colors">
  Get Started
</button>

// Gradient text
<span className="gradient-develop bg-clip-text text-transparent text-display-md">
  Develop
</span>

// Code block
<code className="text-code bg-canvas-soft-2 rounded-sm px-xs py-xxs">
  npm install cinacoin
</code>
```

## Fonts

This system uses **Geist** (sans) and **Geist Mono** (monospace) — Vercel's custom typefaces.

- `fonts.css` loads them via jsDelivr CDN
- For Next.js, prefer `next/font/google` (see comment in `fonts.css`)
- Fallback stack: `Inter → system-ui → -apple-system → sans-serif`
