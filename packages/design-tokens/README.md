# @cinacoin/design-tokens

Vercel-inspired design token system for Cinacoin UI. Single source of truth for colors, typography, spacing, shadows, and more.

## Installation

```bash
pnpm add @cinacoin/design-tokens
```

## Usage

### Direct Token Access

```typescript
import { colors, typography, spacing, shadows } from '@cinacoin/design-tokens';

// Colors
const primary = colors.primary; // '#171717'
const canvas = colors.canvas;   // '#ffffff'

// Typography
const heading = typography.displayXl;
// {
//   fontFamily: 'Geist, Inter, system-ui, -apple-system, sans-serif',
//   fontSize: '48px',
//   fontWeight: 600,
//   lineHeight: '48px',
//   letterSpacing: '-2.4px',
// }

// Spacing
const gap = spacing.lg; // '24px'

// Shadows
const cardShadow = shadows.level3;
// '0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a, 0 0 0 1px #00000014 inset'
```

### CSS Variables

```typescript
import { generateCSSVariables } from '@cinacoin/design-tokens';

// Generate CSS with custom prefix
const css = generateCSSVariables({ prefix: 'cc' });
// :root {
//   --cc-color-primary: #171717;
//   --cc-color-canvas: #ffffff;
//   --cc-spacing-lg: 24px;
//   ...
// }

// Inject into document
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
```

### Pre-generated CSS

```typescript
import { cssVariables, cssTheme } from '@cinacoin/design-tokens';

// Default prefix 'cinacoin'
document.head.insertAdjacentHTML('beforeend', `<style>${cssVariables}</style>`);

// With light + dark theme support
document.head.insertAdjacentHTML('beforeend', `<style>${cssTheme}</style>`);
```

### CSS-in-JS

```typescript
import { generateCSSVariableMap } from '@cinacoin/design-tokens';

const vars = generateCSSVariableMap({ prefix: 'cc' });
// {
//   '--cc-color-primary': '#171717',
//   '--cc-spacing-lg': '24px',
//   ...
// }

// Use with styled-components / emotion
const Button = styled.button`
  background: ${vars['--cc-color-primary']};
  padding: ${vars['--cc-spacing-md']};
`;
```

## Token Categories

### Colors

- **Brand**: `primary`, `onPrimary`
- **Surface**: `canvas`, `canvasSoft`, `canvasSoft2`
- **Text**: `ink`, `body`, `mute`
- **Border**: `hairline`, `hairlineStrong`
- **Link**: `link`, `linkDeep`, `linkBgSoft`
- **Semantic**: `success`, `error`, `errorSoft`, `errorDeep`, `warning`, `warningSoft`, `warningDeep`
- **Accent**: `violet`, `cyan`, `highlightPink`
- **Gradient**: `gradientDevelopStart`, `gradientDevelopEnd`, `gradientPreviewStart`, `gradientPreviewEnd`, `gradientShipStart`, `gradientShipEnd`

### Typography

- **Display**: `displayXl`, `displayLg`, `displayMd`, `displaySm`
- **Body**: `bodyLg`, `bodyMd`, `bodyMdStrong`, `bodySm`, `bodySmStrong`
- **Caption**: `caption`, `captionMono`
- **Code**: `code`
- **Button**: `buttonMd`, `buttonLg`

### Spacing

`xxs` (4px) → `xs` (8px) → `sm` (12px) → `md` (16px) → `lg` (24px) → `xl` (32px) → `2xl` (40px) → `3xl` (48px) → `4xl` (64px) → `5xl` (96px) → `6xl` (128px) → `section` (192px)

### Rounded

`none` (0px) → `xs` (4px) → `sm` (6px) → `md` (8px) → `lg` (12px) → `xl` (16px) → `pillSm` (64px) → `pill` (100px) → `full` (9999px)

### Shadows

Vercel-style stacked shadows (never a single heavy drop):

- `level0`: Flat (no shadow)
- `level1`: Inset hairline only
- `level2`: Subtle elevation with inset hairline
- `level3`: Medium elevation (feature cards)
- `level4`: Float elevation (pricing cards, callouts)
- `level5`: Modal/toast elevation

## API Reference

### `generateCSSVariables(options?)`

Generate CSS custom property declarations.

**Options:**
- `prefix?: string` — CSS variable prefix (default: `'cinacoin'`)
- `selector?: string` — CSS selector (default: `':root'`)
- `expandTypography?: boolean` — Expand typography into individual properties (default: `false`)
- `includeGradients?: boolean` — Include gradient tokens (default: `true`)
- `includeFontFamily?: boolean` — Include font-family tokens (default: `true`)

### `generateCSSTheme(options?)`

Generate CSS with light + dark theme support.

### `generateCSSVariableMap(options?)`

Generate a JavaScript object mapping CSS variable names to values.

## Design Philosophy

- **Vercel-inspired**: Stark black-and-ink duotone on near-white canvas
- **Stacked shadows**: Multiple small offsets layered for natural light (never a single heavy drop)
- **Subtle elevation**: Cards sit on the page, held by hairline + soft glow
- **Geometric sans**: Geist/Inter for headlines, monospace for technical labels
- **Mesh gradients**: Multi-color gradients (cyan/blue/magenta/amber) for hero decoration

## License

MIT
