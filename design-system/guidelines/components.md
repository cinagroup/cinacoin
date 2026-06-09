# Component Guidelines — Cinacoin Design System

## Philosophy

Components are **restrained, consistent, and functional**. Every component follows the same visual language: monochrome foundation, hairline borders, subtle shadows, and clear hierarchy. No component should "pop" through decoration — it should pop through clarity.

---

## Core Components

### Button

#### Variants

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `#171717` (ink) | `#ffffff` (on-primary) | — | Main CTA, form submit |
| Secondary | `#ffffff` (canvas) | `#171717` (ink) | `1px solid #ebebeb` | Secondary actions |
| Ghost | transparent | `#171717` (ink) | — | Tertiary actions, toolbars |
| Danger | `#ee0000` (error) | `#ffffff` (on-primary) | — | Destructive actions |

#### Sizes

| Size | Height | Padding | Font Size |
|---|---|---|---|
| Small | 32px | 0 12px | 14px |
| Default | 40px | 0 16px | 14px |
| Large | 48px | 0 20px | 16px |

#### Properties

- **Border radius**: `sm` (6px)
- **Font weight**: 500 (medium)
- **Transition**: `all 150ms ease`
- **Hover (Primary)**: lighten to `#2a2a2a`
- **Hover (Secondary)**: background `#fafafa` (canvas-soft)
- **Focus**: ring `0 0 0 3px rgba(0, 112, 243, 0.1)`, border `#0070f3`
- **Disabled**: opacity 0.5, cursor not-allowed

#### Usage

```
[Primary Button]  [Secondary Button]  [Ghost Button]
```

- **One primary button per view** — don't compete for attention
- **Group related actions**: primary + secondary, never two primaries
- **Danger buttons** require confirmation for destructive actions

---

### Card

#### Elevation Levels

| Level | Shadow | Usage |
|---|---|---|
| 1 (Default) | `inset 0 0 0 1px #ebebeb` | List items, simple cards |
| 2 (Subtle) | Level 1 + `0 1px 2px rgba(0,0,0,0.04)` | Template cards, hover |
| 3 (Soft) | Level 1 + `0 2px 8px rgba(0,0,0,0.06)` | Feature cards |
| 4 (Float) | Level 1 + `0 4px 16px rgba(0,0,0,0.08)` | Pricing cards, popovers |

#### Properties

- **Background**: `#ffffff` (canvas)
- **Border radius**: `md` (8px) default, `lg` (12px) for feature cards
- **Padding**: `lg` (24px)
- **Hover**: elevate one level, transition 200ms ease

#### Variants

**Default Card**
```
┌─────────────────────────┐
│  Title (24px, 600)      │
│  Description (14px)     │
│  [Action]               │
└─────────────────────────┘
```

**Feature Card** (Level 3, 12px radius)
```
┌─────────────────────────┐
│  [Icon]                 │
│  Title (24px, 600)      │
│  Description (16px)     │
│  [Link →]               │
└─────────────────────────┘
```

**Pricing Card** (Level 4, centered)
```
┌─────────────────────────┐
│  Plan Name (24px, 600)  │
│  Price (48px, 600)      │
│  Features list          │
│  [CTA Button]           │
└─────────────────────────┘
```

---

### Input

#### Properties

- **Height**: 40px (default), 32px (small)
- **Border**: `1px solid #ebebeb`
- **Border radius**: `sm` (6px)
- **Padding**: 0 12px
- **Font**: 14px, weight 400
- **Placeholder**: `#888888` (mute)
- **Focus**: border `#0070f3`, ring `0 0 0 3px rgba(0, 112, 243, 0.1)`
- **Error**: border `#ee0000`, ring `0 0 0 3px rgba(238, 0, 0, 0.1)`
- **Disabled**: background `#fafafa`, opacity 0.6

#### Variants

**Text Input**
```
┌─────────────────────────┐
│  Placeholder or value   │
└─────────────────────────┘
```

**With Label**
```
Label (14px, 500)
┌─────────────────────────┐
│  Placeholder or value   │
└─────────────────────────┘
```

**With Error**
```
Label (14px, 500)
┌─────────────────────────┐
│  Value                  │  ← red border
└─────────────────────────┘
Error message (12px, error)
```

---

### Badge / Tag

#### Properties

- **Background**: `#f5f5f5` (canvas-soft-2)
- **Text**: `#4d4d4d` (body)
- **Border radius**: `xs` (4px) or `pill-sm` (64px)
- **Padding**: 2px 8px
- **Font**: 12px, weight 500

#### Variants

**Default**
```
[ Badge ]
```

**Success**
```
Background: rgba(0, 112, 243, 0.1)
Text: #0070f3
```

**Error**
```
Background: rgba(238, 0, 0, 0.1)
Text: #ee0000
```

**Warning**
```
Background: rgba(245, 166, 35, 0.1)
Text: #f5a623
```

---

### Modal / Dialog

#### Properties

- **Shadow**: Level 5 (modal)
- **Border radius**: `lg` (12px)
- **Padding**: `xl` (32px)
- **Max width**: 480px (default), 640px (large)
- **Backdrop**: `rgba(0, 0, 0, 0.5)` with backdrop-filter `blur(4px)`

#### Structure

```
┌─────────────────────────────────┐
│  Title (24px, 600)          [×] │
│                                 │
│  Body text (16px, 400)          │
│                                 │
│         [Secondary] [Primary]   │
└─────────────────────────────────┘
```

---

## Component Patterns

### Form Layout

```
Label (14px, 500)
[Input field                    ]
Helper text (12px, mute)

[  ] Checkbox label (14px)

[Primary Button]  [Ghost Button]
```

- **Spacing between fields**: 16px (md)
- **Spacing between field and helper**: 4px (xxs)
- **Spacing before submit**: 24px (lg)

### Card Grid

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 24px;
```

### Navigation Bar

```
┌─────────────────────────────────────────┐
│  Logo    [Link] [Link] [Link]  [Button] │
└─────────────────────────────────────────┘
```

- **Height**: 64px
- **Background**: `#ffffff` with `1px solid #ebebeb` bottom border
- **Position**: sticky top

---

## Rules

### ✅ Do

- **Follow the elevation system** — every card uses the correct shadow level
- **Include inset hairline borders** on all elevated elements
- **Use consistent padding** — 24px for cards, 16px for buttons
- **Provide focus states** — all interactive elements need visible focus
- **Use the correct button variant** — one primary per view, secondary for others
- **Test hover states** — cards elevate, buttons lighten/darken

### ❌ Don't

- **Don't skip the inset border** — it's what makes the system "crisp"
- **Don't mix button variants** in the same action group (no two primaries)
- **Don't use colored shadows** — shadows are always neutral
- **Don't create custom components** without checking if a standard one exists
- **Don't remove focus rings** — accessibility is non-negotiable
- **Don't use different border radii** for the same component type
