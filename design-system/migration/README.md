# Cinacoin Design System Migration Guide

Welcome to the Cinacoin Design System migration documentation. This guide will help you transition all Cinacoin applications to the new Vercel-style design system.

## 📋 Overview

The Cinacoin Design System provides a unified, modern, and consistent visual language across all Cinacoin applications. It's inspired by Vercel's design principles: clean, minimal, and professional.

### Key Features

- **Light Theme**: Clean, professional appearance with excellent readability
- **Semantic Color Tokens**: Consistent color usage across all applications
- **Typography System**: Geist font family with proper hierarchy
- **Spacing System**: 4px base unit for consistent spacing
- **Shadow System**: 5-level elevation system with subtle depth
- **Component Patterns**: Reusable CSS classes for common UI elements

## 🎯 Migration Priority

We recommend migrating applications in the following order based on user impact and complexity:

### Phase 1: High Impact (Week 1-2)

1. **website** (cinacoin.com)
   - Primary user-facing application
   - Highest visibility
   - Simple marketing pages
   - **Estimated time**: 2-3 days

2. **unified-dashboard** (app.cinacoin.com)
   - Main user dashboard
   - High user engagement
   - **Estimated time**: 3-4 days

### Phase 2: Medium Impact (Week 3-4)

3. **backend-dashboard** (backend.cinacoin.com)
   - Internal admin tool
   - Lower user count but critical functionality
   - **Estimated time**: 2-3 days

4. **wallet-explorer** (wallet.cinacoin.com)
   - Blockchain explorer
   - Technical users
   - **Estimated time**: 2-3 days

### Phase 3: Supporting Apps (Week 5-6)

5. **cloud-dashboard** (cloud.cinacoin.com)
   - Infrastructure management
   - **Estimated time**: 2-3 days

6. **analytics-dashboard** (data.cinacoin.com)
   - Data visualization
   - Chart color updates needed
   - **Estimated time**: 3-4 days

### Phase 4: Utility Apps (Week 7)

7. **health-status** (status.cinacoin.com)
   - Status page
   - Simple component set
   - **Estimated time**: 1-2 days

8. **demo** (demo.cinacoin.com)
   - Demo/showcase site
   - **Estimated time**: 1-2 days

## 🚀 Quick Start

### Step 1: Install Dependencies

Add the design system package to your application:

```bash
# In your app directory
npm install --save-dev @cinacoin/design-system
```

### Step 2: Update Tailwind Configuration

Replace your `tailwind.config.ts` with the preset:

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
  // Add app-specific overrides here
};

export default config;
```

### Step 3: Replace Global Styles

Replace your `src/app/globals.css` with the appropriate file from:

```
design-system/apps/{app-name}/globals.css
```

### Step 4: Update Component Classes

Use the migration guide for your specific app to update component classes. Each guide includes:

- Current state analysis
- Color mapping tables
- Code examples (before/after)
- Testing checklist

## 📚 Design Tokens

### Colors

#### Primary Colors
```css
--color-primary: #171717;        /* 墨黑 - Main brand color */
--color-on-primary: #ffffff;     /* Text on primary backgrounds */
```

#### Canvas (Backgrounds)
```css
--color-canvas: #ffffff;         /* Pure white cards */
--color-canvas-soft: #fafafa;    /* Page background (98% white) */
--color-canvas-soft-2: #f5f5f5;  /* Nested areas (95% white) */
```

#### Text Colors
```css
--color-ink: #171717;            /* Primary text */
--color-body: #4d4d4d;           /* Secondary text */
--color-mute: #888888;           /* Tertiary text */
```

#### Borders
```css
--color-hairline: #ebebeb;       /* 1px dividers */
```

#### Semantic Colors
```css
--color-link: #0070f3;           /* Links and interactive elements */
--color-error: #ee0000;          /* Error states */
--color-success: #0070f3;        /* Success states */
--color-warning: #f5a623;        /* Warning states */
```

### Typography

#### Font Families
```css
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

#### Font Sizes
- Display: 48px (letter-spacing: -2.4px)
- Heading 1: 36px (letter-spacing: -1.5px)
- Heading 2: 24px (letter-spacing: -0.5px)
- Heading 3: 20px (letter-spacing: -0.25px)
- Body: 14px (line-height: 1.5)
- Body Small: 12px
- Caption: 11px

### Spacing

Based on 4px unit:
- xxs: 4px
- xs: 8px
- sm: 12px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 40px
- 3xl: 48px
- 4xl: 64px
- 5xl: 96px

### Border Radius

```css
--radius-sm: 6px;    /* Buttons, inputs */
--radius-md: 8px;    /* Cards */
--radius-lg: 12px;   /* Large cards, pricing */
--radius-pill: 100px; /* Marketing CTAs */
```

### Shadows

5-level elevation system:

```css
/* Level 1: Subtle inset border */
box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);

/* Level 2: Subtle drop + inset */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 
            inset 0 0 0 1px rgba(0, 0, 0, 0.08);

/* Level 3: Soft stack + inset (feature cards) */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04),
            0 4px 8px rgba(0, 0, 0, 0.04),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08);

/* Level 4: Float stack + inset (pricing cards) */
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04),
            0 8px 16px rgba(0, 0, 0, 0.04),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08);

/* Level 5: Modal shadow + inset */
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08),
            0 16px 32px rgba(0, 0, 0, 0.08),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08);
```

## 🎨 Common Component Patterns

### Buttons

```tsx
{/* Primary button */}
<button className="btn btn-primary">Save</button>

{/* Secondary button */}
<button className="btn btn-secondary">Cancel</button>

{/* Danger button (admin only) */}
<button className="btn btn-danger">Delete</button>

{/* Marketing CTA */}
<button className="btn-cta">Get Started</button>
```

### Cards

```tsx
{/* Standard card */}
<div className="card">
  Content
</div>

{/* Feature card */}
<div className="card-feature">
  Feature content
</div>

{/* Pricing card */}
<div className="card-pricing">
  Pricing content
</div>

{/* Stat card (dashboards) */}
<div className="stat-card">
  <p className="stat-label">Total Users</p>
  <p className="stat-value">1,234</p>
</div>
```

### Inputs

```tsx
{/* Standard input */}
<input className="input" type="text" />

{/* Search bar */}
<input className="search-bar" type="search" />
```

### Tables

```tsx
<table className="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Item</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

### Badges

```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
```

## ❓ Frequently Asked Questions

### Q: Why are we switching from dark mode to light mode?

**A:** The Vercel-style design system emphasizes clarity, professionalism, and readability. Light mode is the industry standard for SaaS applications and provides better contrast for data-heavy interfaces. Dark mode may be added as a user preference in the future.

### Q: Will this break existing functionality?

**A:** No. This is a visual-only migration. All functionality remains the same. However, thorough testing is required to ensure all UI elements render correctly.

### Q: What if I need to keep some custom colors?

**A:** You can extend the preset in your `tailwind.config.ts`:

```typescript
const config: Config = {
  presets: [cinacoinPreset],
  theme: {
    extend: {
      colors: {
        'custom-brand': '#ff0000',
      },
    },
  },
};
```

### Q: Do I need to update all components at once?

**A:** No. You can migrate incrementally:
1. Start with the global styles (background, text colors)
2. Update high-visibility components (buttons, cards)
3. Migrate remaining components over time

### Q: What about dark mode support?

**A:** Dark mode is not included in the initial release. It may be added in a future update using CSS custom properties and the `dark:` Tailwind prefix.

### Q: How do I handle charts and data visualizations?

**A:** Use the CSS custom properties defined in the globals.css:

```tsx
<Line stroke="var(--chart-1)" />
<Line stroke="var(--chart-2)" />
```

### Q: Can I use the design system in new applications?

**A:** Yes! Use the preset and globals.css as a starting point for any new Cinacoin application.

## 🔄 Rollback Plan

If you encounter critical issues, you can quickly rollback:

### Immediate Rollback

```bash
# Revert all changes
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- src/app/globals.css
git checkout HEAD -- src/

# Rebuild
npm run build
```

### Partial Rollback

If only specific components have issues:

```bash
# Revert specific file
git checkout HEAD -- src/components/ProblemComponent.tsx

# Rebuild
npm run build
```

### Rollback Checklist

- [ ] Verify the issue is related to the design system migration
- [ ] Check if a quick fix is possible (CSS class typo, etc.)
- [ ] If critical, rollback immediately
- [ ] Document the issue for future reference
- [ ] Test the rollback in staging before production

## 🧪 Testing Checklist

Before deploying any migration:

### Visual Testing
- [ ] All pages render without errors
- [ ] Text is readable with proper contrast
- [ ] Buttons are visible and clickable
- [ ] Cards have proper borders and shadows
- [ ] Links are distinguishable
- [ ] Icons and images display correctly

### Functional Testing
- [ ] All interactive elements work (buttons, inputs, links)
- [ ] Forms submit correctly
- [ ] Navigation works as expected
- [ ] Modals and dropdowns function properly
- [ ] Tables sort and paginate correctly

### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Accessibility Testing
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Screen readers can navigate the page

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## 📞 Support

If you encounter issues during migration:

1. Check the specific app migration guide
2. Review the FAQ section
3. Check the Cinacoin Design System GitHub issues
4. Contact the design system team

## 📝 Migration Progress

Track migration progress for each application:

| Application | Status | Start Date | Completion Date | Notes |
|-------------|--------|------------|-----------------|-------|
| website | ⏳ Pending | - | - | Phase 1 |
| unified-dashboard | ⏳ Pending | - | - | Phase 1 |
| backend-dashboard | ⏳ Pending | - | - | Phase 2 |
| wallet-explorer | ⏳ Pending | - | - | Phase 2 |
| cloud-dashboard | ⏳ Pending | - | - | Phase 3 |
| analytics-dashboard | ⏳ Pending | - | - | Phase 3 |
| health-status | ⏳ Pending | - | - | Phase 4 |
| demo | ⏳ Pending | - | - | Phase 4 |

## 🎉 Success Criteria

A successful migration means:

✅ All applications use the design system preset  
✅ Consistent visual language across all apps  
✅ No functional regressions  
✅ All tests pass  
✅ Positive user feedback  
✅ Improved maintainability  

---

**Last Updated**: 2026-06-09  
**Version**: 1.0.0  
**Maintained by**: Cinacoin Design Team
