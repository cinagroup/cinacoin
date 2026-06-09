# Layout Guidelines — Cinacoin Design System

## Philosophy

Layout is **structured, predictable, and content-first**. We use a 12-column grid with consistent gutters, alternating full-bleed bands and contained sections to create visual rhythm. Whitespace is generous — let the content breathe.

---

## Grid System

### Desktop (≥ 1024px)

- **Columns**: 12
- **Gutters**: 24px (lg)
- **Max width**: 1200px (centered with `margin: 0 auto`)
- **Side padding**: 24px (lg) on viewport edges

### Tablet (640–1023px)

- **Columns**: 8
- **Gutters**: 24px (lg)
- **Max width**: 100%
- **Side padding**: 24px (lg)

### Mobile (< 640px)

- **Columns**: 4
- **Gutters**: 16px (md)
- **Max width**: 100%
- **Side padding**: 16px (md)

---

## Section Patterns

### Contained Section

Content is constrained to max-width 1200px:

```
[  padding  |    content (max 1200px)    |  padding  ]
```

Use for:
- Feature sections
- Card grids
- Form layouts
- Most app pages

### Full-Bleed Band

Background extends edge-to-edge, content is centered:

```
[████████████|    content (max 1200px)    |████████████]
     background color
```

Use for:
- Hero sections
- CTA sections
- Testimonial sections
- Alternating rhythm sections

### Alternating Rhythm

Landing pages alternate between contained and full-bleed sections with different backgrounds:

```
┌─────────────────────────────────────┐
│  Hero (full-bleed, canvas)          │  ← section gap (192px)
├─────────────────────────────────────┤
│         Features (contained)        │  ← section gap (192px)
├─────────────────────────────────────┤
│█████  CTA (full-bleed, canvas-soft) │  ← section gap (192px)
├─────────────────────────────────────┤
│      Testimonials (contained)       │  ← section gap (192px)
├─────────────────────────────────────┤
│█████  Pricing (full-bleed, soft-2)  │
└─────────────────────────────────────┘
```

---

## Spacing

### Vertical Rhythm

| Context | Spacing | Token |
|---|---|---|
| Landing page sections | 192px | `section` |
| App page sections | 48–64px | `3xl`–`4xl` |
| Component groups | 24–32px | `lg`–`xl` |
| Related elements | 8–12px | `xs`–`sm` |
| Inline elements | 4–8px | `xxs`–`xs` |

### Component Padding

| Component | Padding | Token |
|---|---|---|
| Card | 24px | `lg` |
| Button | 0 16px | `md` horizontal |
| Input | 0 12px | `sm` horizontal |
| Section (vertical) | 32–192px | `xl`–`section` |

---

## Breakpoints

| Name | Width | Usage |
|---|---|---|
| Mobile | < 640px | Single column, stacked layout |
| Tablet | 640–1023px | 2-column grids, expanded layout |
| Desktop | ≥ 1024px | Full 12-column grid, sidebar layouts |

### Responsive Behavior

- **Mobile-first**: Start with mobile layout, add complexity at breakpoints.
- **Content reflows**: Cards stack vertically on mobile, grid on desktop.
- **Type scales down**: Display sizes step down on mobile (see Typography guidelines).
- **Spacing compresses**: Section gaps reduce from 192px to 48–64px on mobile.

---

## Common Layouts

### Landing Page

```
┌─────────────────────────────────────┐
│           Hero (centered)           │
│    Display 1 + Body LG + CTA        │
├─────────────────────────────────────┤
│      Feature Grid (3 columns)       │
│    [Card] [Card] [Card]             │
├─────────────────────────────────────┤
│      Testimonial (centered)         │
├─────────────────────────────────────┤
│      Pricing (3 columns)            │
│    [Card] [Card] [Card]             │
├─────────────────────────────────────┤
│           CTA (centered)            │
└─────────────────────────────────────┘
```

### App Page (Dashboard)

```
┌──────┬──────────────────────────────┐
│      │          Header              │
│      ├──────────────────────────────┤
│ Side │                              │
│ bar  │        Main Content          │
│      │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

- Sidebar: 240px fixed width
- Main content: flexible, max-width 1200px
- Header: 64px height, sticky

### Card Grid

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 24px; /* lg */
```

---

## Rules

### ✅ Do

- **Use the 12-column grid** for all layouts
- **Alternate full-bleed and contained sections** on landing pages
- **Maintain 192px section gaps** on landing pages (48–64px on app pages)
- **Center content** with `margin: 0 auto` and `max-width: 1200px`
- **Use consistent gutters** (24px desktop, 16px mobile)
- **Let content breathe** — generous whitespace is a feature, not wasted space

### ❌ Don't

- **Don't mix grid systems** — stick to 12/8/4 columns
- **Don't use fixed widths** for content areas — use max-width + auto margins
- **Don't reduce section gaps below 48px** on app pages
- **Don't center-align entire layouts** — left-align content within centered containers
- **Don't use margins for vertical rhythm between sections** — use padding on the section itself
