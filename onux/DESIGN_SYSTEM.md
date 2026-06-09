# Cinacoin Design System

## Overview
Cinacoin follows the Vercel design system with a custom color palette and typography. This document outlines the core principles, tokens, and component guidelines.

## Color Palette

### Core Colors
- **Ink**: `#171717` - Primary text and UI elements
- **Body**: `#4d4d4d` - Secondary text
- **Muted**: `#888888` - Tertiary text and disabled states
- **Link**: `#0070f3` - Interactive elements and links

### Surface Colors
- **Canvas**: `#ffffff` - Base background
- **Canvas Soft**: `#fafafa` - Primary app background
- **Canvas Soft 2**: `#f5f5f5` - Secondary backgrounds and overlays

### Border Colors
- **Hairline**: `#ebebeb` - Borders and dividers

### Status Colors
- **Success**: `#0070f3` (blue, not green)
- **Error**: `#ee0000`
- **Warning**: `#f5a623`

## Typography

### Font Stack
- **Primary**: Geist, Inter, system-ui
- **Monospace**: Geist Mono, ui-monospace

### Font Weights and Sizes
- **Display**: 600 weight with negative letter-spacing (-2.4px for 48px, -1.28px for 32px)
- **Body**: 400 weight for regular text
- **Button**: 500 weight for button labels

### Loading
All applications load Geist and Geist Mono fonts via `next/font`:
```typescript
import { GeistSans, GeistMono } from 'geist/font';
```

## Components

### Buttons
- **Application-level**: 6px border radius
- **Marketing/Pill**: 100px border radius (pill shape)
- **Font weight**: 500
- **Padding**: Consistent spacing following 4px baseline grid

### Cards
- **Border radius**: 8px (medium) or 12px (large)
- **Shadow**: Stacked shadows with inset hairline
  ```css
  box-shadow: 
    0px 1px 1px rgba(0, 0, 0, 0.02),
    0px 2px 2px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px #ebebeb;
  ```

### Inputs
- **Height**: 40px
- **Border radius**: 6px
- **Focus state**: Black border (`#171717`)

## Layout

### Spacing
- **Baseline grid**: 4px increments
- **Padding/margins**: Multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)

### Max Width
- **Content containers**: ~1400px maximum width

### Header
- **Height**: 64px

## Assets

### Logo
- **Format**: PNG
- **Path**: `/logo.png` (universal across all applications)

### Favicon
- **Format**: ICO
- **Path**: `/favicon.ico` (universal across all applications)

## Implementation

### CSS Variables
All applications import the canonical design tokens:
```css
@import "@cinacoin/design-tokens/css/cinacoin.css";
```

### Token Usage
- Colors: `var(--cc-ink)`, `var(--cc-body)`, `var(--cc-canvas-soft)`, etc.
- Typography: `var(--font-geist-sans)`, `var(--font-geist-mono)`
- Radii: `var(--cc-radius-md)`, `var(--cc-radius-lg)`
- Shadows: `var(--cc-level1)`, `var(--cc-level2)`, `var(--cc-inset-hairline)`

## Compliance
All 7 Cinacoin applications (website, demo, backend-dashboard, analytics-dashboard, cloud-dashboard, health-status, wallet-explorer) are 100% compliant with this design system as of June 8, 2026.