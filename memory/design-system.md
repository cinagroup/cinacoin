# Cinacoin Design System — Vercel-Inspired

> Source: Feishu wiki, shared by 叶海涛 2026-06-05
> Version: alpha

## Colors
- **primary/ink**: `#171717`
- **on-primary**: `#ffffff`
- **body**: `#4d4d4d`
- **mute**: `#888888`
- **hairline**: `#ebebeb`
- **hairline-strong**: `#a1a1a1`
- **canvas**: `#ffffff`
- **canvas-soft**: `#fafafa`
- **canvas-soft-2**: `#f5f5f5`
- **link**: `#0070f3`
- **success**: `#0070f3`
- **error**: `#ee0000`
- **warning**: `#f5a623`

## Typography
- **display-xl**: 48px / 600 / -2.4px tracking
- **display-lg**: 32px / 600 / -1.28px tracking
- **display-md**: 24px / 600 / -0.96px tracking
- **display-sm**: 20px / 600 / -0.6px tracking
- **body-lg**: 18px / 400
- **body-md**: 16px / 400
- **body-sm**: 14px / 400 / -0.28px tracking
- **caption**: 12px / 400
- **caption-mono**: 12px / 400 (Geist Mono)
- **code**: 13px / 400 (Geist Mono)
- **button-md**: 14px / 500
- **button-lg**: 16px / 500

## Border Radius
- **none**: 0px
- **xs**: 4px
- **sm**: 6px (nav buttons, form inputs)
- **md**: 8px (cards, marketing cards)
- **lg**: 12px (larger cards, pricing)
- **xl**: 16px (largest card chrome)
- **pill-sm**: 64px (tab-ghost pills)
- **pill**: 100px (marketing CTAs)
- **full**: 9999px (circular)

## Shadows (Stacked)
- **Level 1**: `inset 0 0 0 1px #00000014`
- **Level 2**: `0 1px 1px #00000005, 0 2px 2px #0000000a` + inset
- **Level 3**: `0 2px 2px #0000000a, 0 8px 8px -8px #0000000a` + inset
- **Level 4**: `0 2px 2px #0000000a, 0 8px 16px -4px #0000000a` + inset
- **Level 5**: `0 1px 1px #00000005, 0 8px 16px -4px #0000000a, 0 24px 32px -8px #0000000f` + inset

## Key Rules
- font-weight 600 max for display (no 700/800)
- Sentence-case headlines with negative tracking
- Pill 100px for marketing CTAs, 6px for nav buttons
- CSS variables for all colors
- No hard-coded gray values
- Mesh gradient at hero scale only

## Logo
- Same logo.png across all apps (md5: fdc75cd9)
- h-8 w-8 rounded-lg in navbars
- h-7 w-7 rounded-lg in compact navbars

## Sites
- demo: demo.cinacoin.com
- website: cinacoin.com
- health-status: status.cinacoin.com
- backend-dashboard: dash.cinacoin.com
- demo-react: react.cinacoin.com
