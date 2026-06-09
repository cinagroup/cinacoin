# Cinacoin Design System — Vercel Style Specification

> A monochrome-first, typography-driven design system inspired by Vercel's design language. Built for clarity, precision, and developer-facing aesthetics.

---

## 1. Core Principles

1. **Monochrome Foundation** — Black, white, and grays carry the hierarchy. Color is used sparingly as accent.
2. **Typography as UI** — Large display type, tight negative letter-spacing, and clear weight hierarchy (400 → 500 → 600 max).
3. **Restrained Color** — One primary blue for interaction. Semantic colors for status only. No decorative gradients.
4. **Depth via Shadow + Hairline** — Cards use inset borders + stacked shadows. No flat floating elements.
5. **4px Grid** — All spacing is a multiple of 4px. No exceptions.
6. **Performance Aesthetic** — Minimal decoration, generous whitespace, content-first layout.

---

## 2. Color

### 2.1 Core Palette

| Token | Value | Usage |
|---|---|---|
| `primary` / `ink` | `#171717` | Headlines, primary text, primary buttons |
| `on-primary` | `#ffffff` | Text on primary backgrounds |
| `canvas` | `#ffffff` | Page background |
| `canvas-soft` | `#fafafa` | Subtle section backgrounds |
| `canvas-soft-2` | `#f5f5f5` | Slightly deeper section backgrounds |
| `body` | `#4d4d4d` | Body text |
| `mute` | `#888888` | Muted/secondary text |
| `hairline` | `#ebebeb` | Default borders, dividers |
| `hairline-strong` | `#a1a1a1` | Emphasized borders |
| `link` | `#0070f3` | Interactive links, focus states |

### 2.2 Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `success` | `#0070f3` | Success states, confirmations |
| `error` | `#ee0000` | Errors, destructive actions |
| `warning` | `#f5a623` | Warnings, caution states |

### 2.3 Accent Colors

| Token | Value | Usage |
|---|---|---|
| `violet` | `#7928ca` | Feature highlights, badges |
| `cyan` | `#50e3c2` | Secondary accents |
| `highlight-pink` | `#ff0080` | Call-to-action highlights |

### 2.4 Rules

- **Body text** always uses `body` (#4d4d4d), never pure black on white.
- **Headlines** use `ink` (#171717).
- **Links** use `link` (#0070f3) with underline on hover only.
- **Borders** default to `hairline` (#ebebeb). Use `hairline-strong` only for focus or emphasis.
- **Backgrounds** alternate between `canvas`, `canvas-soft`, and `canvas-soft-2` to create section rhythm.

---

## 3. Typography

### 3.1 Font Stack

| Role | Stack |
|---|---|
| Display / Body | `Geist, Inter, system-ui, -apple-system, sans-serif` |
| Mono | `Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace` |

Mono is reserved for code snippets, technical tags, and API references only.

### 3.2 Weight Scale

| Weight | Usage |
|---|---|
| 400 (Regular) | Body text, descriptions |
| 500 (Medium) | Labels, navigation, secondary headings |
| 600 (Semibold) | Headlines, CTAs — **this is the ceiling** |

Never use weight 700+ in this system.

### 3.3 Display Letter-Spacing

| Size | Letter-Spacing |
|---|---|
| 48px | -2.4px (-5%) |
| 32px | -1.28px (-4%) |
| 24px | -0.72px (-3%) |
| 20px | -0.4px (-2%) |
| ≤16px | 0 (normal) |

### 3.4 Type Scale

| Level | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| Display 1 | 64px / 4rem | 1.05 | 600 | Hero headlines |
| Display 2 | 48px / 3rem | 1.1 | 600 | Section headlines |
| Display 3 | 32px / 2rem | 1.15 | 600 | Sub-section headlines |
| Title | 24px / 1.5rem | 1.25 | 600 | Card titles, page titles |
| Body LG | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs |
| Body | 16px / 1rem | 1.6 | 400 | Default body text |
| Body SM | 14px / 0.875rem | 1.5 | 400 | Secondary text |
| Caption | 12px / 0.75rem | 1.4 | 500 | Labels, metadata |
| Mono | 14px / 0.875rem | 1.5 | 400 | Code, technical tags |

---

## 4. Spacing

### 4.1 Base Unit

**4px** — all spacing values are multiples of 4.

### 4.2 Scale

| Token | Value | Usage |
|---|---|---|
| `xxs` | 4px | Micro gaps (icon-to-text) |
| `xs` | 8px | Tight spacing (tag padding, inline gaps) |
| `sm` | 12px | Compact padding (input padding-y) |
| `md` | 16px | Default padding (card padding, section gutters) |
| `lg` | 24px | Component spacing |
| `xl` | 32px | Section padding top/bottom |
| `2xl` | 40px | Larger section gaps |
| `3xl` | 48px | Major section separation |
| `4xl` | 64px | Page-level spacing |
| `5xl` | 96px | Hero spacing |
| `section` | 192px | Full section breaks (landing pages) |

### 4.3 Rules

- Component internal padding: `md` (16px) default.
- Gap between related elements: `xs` to `sm` (8–12px).
- Gap between unrelated groups: `lg` to `xl` (24–32px).
- Section vertical rhythm: `section` (192px) for landing, `3xl`–`4xl` for app pages.

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Tags, badges, small chips |
| `sm` | 6px | Buttons, inputs |
| `md` | 8px | Cards, small containers |
| `lg` | 12px | Large cards, modals |
| `xl` | 16px | Feature sections |
| `pill-sm` | 64px | Small pill badges |
| `pill` | 100px | Navigation pills, tabs |
| `full` | 9999px | Avatars, circular elements |

---

## 6. Shadows & Elevation

All elevated elements combine a **drop shadow** with an **inset 1px border** (`hairline`). This creates the signature Vercel "crisp card" look.

### 6.1 Elevation Levels

| Level | Name | Drop Shadow | Inset Border | Usage |
|---|---|---|---|---|
| 0 | None | — | — | Full-bleed bands, edge-to-edge sections |
| 1 | Default Card | — | `1px solid #ebebeb` | Default cards, list items |
| 2 | Subtle | `0 1px 2px rgba(0,0,0,0.04)` | `1px solid #ebebeb` | Template cards, hover states |
| 3 | Soft | `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | `1px solid #ebebeb` | Feature cards |
| 4 | Float | `0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | `1px solid #ebebeb` | Pricing cards, popovers |
| 5 | Modal | `0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)` | `1px solid #ebebeb` | Dialogs, modals, drawers |

### 6.2 Rules

- Every card ≥ Level 1 includes the inset hairline border.
- Shadow opacity is kept low (0.04–0.12) to maintain subtlety.
- No colored shadows.
- Hover transitions: elevate one level over 200ms ease.

---

## 7. Layout

### 7.1 Grid

- Max content width: **1200px** (centered with `auto` margins).
- Gutters: **24px** (lg).
- Columns: 12-column grid for desktop, 4-column for mobile.

### 7.2 Breakpoints

| Name | Width | Columns |
|---|---|---|
| Mobile | < 640px | 4 |
| Tablet | 640–1023px | 8 |
| Desktop | ≥ 1024px | 12 |

### 7.3 Section Pattern

Landing pages alternate between:
- **Full-bleed bands** — edge-to-edge background color (canvas-soft / canvas-soft-2), content centered.
- **Contained sections** — max-width 1200px, no background.

Vertical rhythm between sections: `section` (192px).

---

## 8. Components (Key Patterns)

### 8.1 Button

| Variant | Background | Text | Border | Radius |
|---|---|---|---|---|
| Primary | `#171717` | `#ffffff` | — | `sm` (6px) |
| Secondary | `#ffffff` | `#171717` | `1px solid #ebebeb` | `sm` (6px) |
| Ghost | transparent | `#171717` | — | `sm` (6px) |
| Danger | `#ee0000` | `#ffffff` | — | `sm` (6px) |

- Height: 40px (default), 32px (sm), 48px (lg).
- Padding: 0 16px (default).
- Font: 14px, weight 500.
- Transition: all 150ms ease.

### 8.2 Card

- Background: `#ffffff`.
- Border: `1px solid #ebebeb` (Level 1 minimum).
- Radius: `md` (8px) default, `lg` (12px) for feature cards.
- Padding: `lg` (24px).
- Hover: elevate to Level 2, transition 200ms.

### 8.3 Input

- Height: 40px.
- Border: `1px solid #ebebeb`.
- Radius: `sm` (6px).
- Padding: 0 12px.
- Focus: border-color `#0070f3`, ring `0 0 0 3px rgba(0,112,243,0.1)`.
- Font: 14px, weight 400.

### 8.4 Badge / Tag

- Background: `#f5f5f5` (canvas-soft-2).
- Text: `#4d4d4d` (body).
- Radius: `xs` (4px) or `pill-sm` (64px).
- Padding: 2px 8px.
- Font: 12px, weight 500.

---

## 9. Motion

| Property | Duration | Easing |
|---|---|---|
| Color / opacity | 150ms | ease |
| Transform / shadow | 200ms | ease |
| Layout (width/height) | 300ms | ease-in-out |
| Page transitions | 400ms | ease-in-out |

- Prefer `transform` and `opacity` for animations (GPU-accelerated).
- No bouncy or spring animations. Keep it professional.

---

## 10. Iconography

- Use **outline** icons, 1.5px stroke.
- Default size: 20px.
- Small: 16px, Large: 24px.
- Color: inherit from parent text color.
- Recommended library: Phosphor Icons or Lucide.

---

## 11. Do's and Don'ts

### ✅ Do

- Use the monochrome palette as your foundation
- Alternate section backgrounds for rhythm
- Keep font weight ≤ 600
- Use inset borders on all elevated cards
- Maintain 4px grid alignment
- Use `body` (#4d4d4d) for body text, not pure black

### ❌ Don't

- Use font weight 700+
- Use colored shadows
- Mix rounded and sharp corners inconsistently
- Use pure black (#000000) anywhere
- Add decorative gradients or illustrations
- Skip the inset border on cards
- Use mono font for non-code content
