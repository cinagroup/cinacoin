# Typography Guidelines — Cinacoin Design System

## Philosophy

Typography **is** the UI in this design system. We don't rely on decoration, icons, or color to create hierarchy — we use type size, weight, and spacing. Large display type with tight negative letter-spacing creates the signature Vercel aesthetic.

---

## Font Stacks

### Primary: Display & Body

```css
font-family: Geist, Inter, system-ui, -apple-system, sans-serif;
```

Used for:
- All headlines (Display 1–3, Title)
- Body text (all sizes)
- UI labels and buttons
- Navigation

### Monospace: Code & Technical

```css
font-family: Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

Used for:
- Code snippets and blocks
- API endpoints and technical references
- Technical tags and badges
- Terminal/CLI output

**Never** use mono for general UI text, headlines, or body copy.

---

## Weight Scale

| Weight | Token | Usage |
|---|---|---|
| 400 | `regular` | Body text, descriptions, default |
| 500 | `medium` | Labels, navigation, buttons, secondary headings |
| 600 | `semibold` | Headlines, CTAs — **this is the ceiling** |

### The 600 Ceiling

**Never use font-weight 700 or higher.** This is a hard rule. The system is designed around a maximum weight of 600 (semibold). If something feels like it needs more weight, increase size instead.

---

## Type Scale

| Level | Size | Line Height | Weight | Letter-Spacing | Usage |
|---|---|---|---|---|---|
| Display 1 | 64px (4rem) | 1.05 | 600 | -2.4px | Hero headlines |
| Display 2 | 48px (3rem) | 1.1 | 600 | -1.28px | Section headlines |
| Display 3 | 32px (2rem) | 1.15 | 600 | -0.72px | Sub-section headlines |
| Title | 24px (1.5rem) | 1.25 | 600 | -0.4px | Card titles, page titles |
| Body LG | 18px (1.125rem) | 1.6 | 400 | 0 | Lead paragraphs |
| Body | 16px (1rem) | 1.6 | 400 | 0 | Default body text |
| Body SM | 14px (0.875rem) | 1.5 | 400 | 0 | Secondary text, buttons, inputs |
| Caption | 12px (0.75rem) | 1.4 | 500 | 0 | Labels, metadata, badges |
| Mono | 14px (0.875rem) | 1.5 | 400 | 0 | Code, technical tags |

---

## Negative Letter-Spacing

The signature look comes from tight tracking on large type:

| Size | Tracking | Percentage |
|---|---|---|
| 64px | -2.4px | -5% |
| 48px | -1.28px | -4% |
| 32px | -0.72px | -3% |
| 24px | -0.4px | -2% |
| ≤16px | 0 (normal) | 0% |

### Why Negative Tracking?

Large type with normal tracking feels loose and amateur. Tight tracking creates density and visual impact. The larger the type, the tighter the tracking.

---

## Hierarchy Patterns

### Landing Page Hero

```
Display 1 (64px, 600, -2.4px) — Main headline
Body LG (18px, 400) — Subtitle or description
```

### Section Header

```
Display 2 (48px, 600, -1.28px) — Section title
Body (16px, 400) — Section description
```

### Card

```
Title (24px, 600, -0.4px) — Card title
Body SM (14px, 400) — Card description
Caption (12px, 500) — Metadata or label
```

### Inline Code

```
Body text with `mono` (14px, 400) for technical terms.
```

---

## Rules

### ✅ Do

- **Use the exact type scale** — don't invent new sizes
- **Apply negative letter-spacing** to all display type (≥24px)
- **Use weight 400 for body text** — never 500 or 600 for long-form reading
- **Use weight 500 for labels and buttons** — it provides enough emphasis without heaviness
- **Use weight 600 for headlines only** — and remember, this is the ceiling
- **Alternate type sizes by at least 2 levels** — don't jump from 16px to 18px; go from 16px to 24px or larger

### ❌ Don't

- **Never use font-weight 700+** — this is non-negotiable
- **Don't use mono font for non-code content**
- **Don't mix font families** within the same context (e.g., don't use Inter for headlines and Geist for body)
- **Don't use italic** unless it's for a specific callout or quote (the system doesn't rely on italic for emphasis)
- **Don't center-align long paragraphs** — left-align for readability
- **Don't use all-caps for headlines** — the type scale and weight handle emphasis

---

## Responsive Behavior

On mobile (< 640px):
- Display 1: 48px (steps down to Display 2)
- Display 2: 32px (steps down to Display 3)
- Display 3: 24px (steps down to Title)
- All other sizes remain the same

Line heights and letter-spacing adjust proportionally.
