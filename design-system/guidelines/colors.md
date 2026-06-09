# Color Guidelines — Cinacoin Design System

## Philosophy

Color in the Cinacoin system is **restrained and purposeful**. The foundation is monochrome — black, white, and grays establish hierarchy and structure. Color enters only to signal meaning: interaction, status, or emphasis.

---

## The Palette

### Foundation Colors

These carry 90% of the visual weight:

| Token | Hex | When to Use |
|---|---|---|
| `ink` / `primary` | `#171717` | Headlines, primary buttons, key UI text |
| `body` | `#4d4d4d` | All body copy — never use pure black |
| `mute` | `#888888` | Secondary text, placeholders, captions |
| `canvas` | `#ffffff` | Default page background |
| `canvas-soft` | `#fafafa` | Alternating section backgrounds |
| `canvas-soft-2` | `#f5f5f5` | Deeper section backgrounds, badge fills |
| `hairline` | `#ebebeb` | Default borders and dividers |
| `hairline-strong` | `#a1a1a1` | Focus rings, emphasized borders |

### Interaction Color

| Token | Hex | When to Use |
|---|---|---|
| `link` | `#0070f3` | All interactive links, focus states, active indicators |

This is your **only** interactive color in most contexts. Use it consistently.

### Semantic Colors

| Token | Hex | When to Use |
|---|---|---|
| `success` | `#0070f3` | Success messages, confirmations, positive states |
| `error` | `#ee0000` | Error messages, destructive actions, validation failures |
| `warning` | `#f5a623` | Warning messages, caution states |

### Accent Colors (Use Sparingly)

| Token | Hex | When to Use |
|---|---|---|
| `violet` | `#7928ca` | Feature badges, premium indicators |
| `cyan` | `#50e3c2` | Secondary highlights |
| `highlight-pink` | `#ff0080` | Call-to-action accents, attention-grabbing elements |

---

## Rules

### ✅ Do

- **Use `body` (#4d4d4d) for body text**, never `#000000` or `ink` for long-form reading
- **Reserve `ink` (#171717) for headlines** and primary action text
- **Alternate backgrounds** (`canvas` → `canvas-soft` → `canvas-soft-2`) to create section rhythm
- **Use `link` blue consistently** for all interactive text — don't mix with other colors for links
- **Test contrast** — all text must meet WCAG AA (4.5:1 for body, 3:1 for large text)

### ❌ Don't

- **Never use pure black (#000000)** anywhere in the system
- **Don't use accent colors for UI chrome** — they're for highlights only
- **Don't mix semantic colors** — `error` is always red, `success` is always blue
- **Don't create new colors** without adding them to the token system first
- **Don't use colored backgrounds for large areas** unless it's a full-bleed band using canvas variants

---

## Patterns

### Text on Backgrounds

| Background | Text Color | Notes |
|---|---|---|
| `canvas` (#ffffff) | `body` (#4d4d4d) | Default reading |
| `canvas` (#ffffff) | `ink` (#171717) | Headlines only |
| `canvas-soft` (#fafafa) | `body` (#4d4d4d) | Section text |
| `ink` (#171717) | `on-primary` (#ffffff) | Inverted sections, primary buttons |
| `link` (#0070f3) | `on-primary` (#ffffff) | Active states, focus indicators |

### Border Usage

- **Default**: `1px solid #ebebeb` (hairline)
- **Hover/Emphasis**: `1px solid #a1a1a1` (hairline-strong)
- **Focus**: `2px solid #0070f3` (link) with 3px offset ring

### Opacity vs. New Colors

When you need a "lighter" version of a color:
- **Don't** create a new hex value
- **Do** use the existing token with opacity (e.g., `rgba(0, 112, 243, 0.1)` for focus rings)
