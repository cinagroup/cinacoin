/**
 * Cinacoin × Vercel Design System — Tailwind CSS Preset
 *
 * Aligned with Vercel design guidelines:
 * - Dark mode first (pure black #000000 backgrounds)
 * - White + black + gray scale, minimal accent (#0070F3)
 * - Geist Sans + Geist Mono fonts
 * - 4px border-radius for components, 0px for marketing pages
 * - Semi-transparent borders (1px)
 * - 300ms eased transitions
 */

import type { Config } from "tailwindcss";

const cinacoinPreset: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // COLORS - Vercel-style semantic palette (dark-first)
      // ═══════════════════════════════════════════════════════════════
      colors: {
        gray: {
          100: "#F7F7F7",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Semantic tokens mapping to CSS variables (dark-first)
        ink: "var(--cc-ink)",
        body: "var(--cc-body)",
        muted: "var(--cc-muted)",
        canvas: {
          DEFAULT: "var(--cc-canvas)",
          soft: "var(--cc-canvas-soft)",
          soft2: "var(--cc-canvas-soft-2)",
        },
        hairline: {
          DEFAULT: "var(--cc-hairline)",
          strong: "var(--cc-hairline-strong)",
        },
        // Link / accent color — the ONE allowed accent
        link: { DEFAULT: "#0070f3", deep: "#0761d1", bgSoft: "var(--cc-link-bg-soft)" },
        // Semantic status colors
        success: { DEFAULT: "#0070f3", bg: "var(--cc-success-bg)" },
        warning: { DEFAULT: "#f5a623", bg: "var(--cc-warning-bg)" },
        danger: { DEFAULT: "#ee0000", bg: "var(--cc-error-bg)" },
        error: { DEFAULT: "#ee0000", bg: "var(--cc-error-bg)", light: "var(--cc-error-bg)" },
        info: { DEFAULT: "#0070f3", bg: "var(--cc-info-bg)" },
        // Selection
        selection: { bg: "var(--cc-selection-bg)", fg: "var(--cc-selection-fg)" },
        // Gradient stops (hero mesh gradient — use sparingly)
        gradient: {
          developStart: "#007cf0",
          developEnd: "#00dfd8",
          previewStart: "#7928ca",
          previewEnd: "#ff0080",
          shipStart: "#ff4d4d",
          shipEnd: "#f9cb28",
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // SPACING - 4px base system
      // ═══════════════════════════════════════════════════════════════
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '96px',
      },

      // ═══════════════════════════════════════════════════════════════
      // BORDER RADIUS - 4px for components
      // ═══════════════════════════════════════════════════════════════
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        md: '4px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
        full: '9999px',
      },

      // ═══════════════════════════════════════════════════════════════
      // BOX SHADOWS - Stacked + inset hairline
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        'cinacoin-1': 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-2': '0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-3': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-4': '0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
      },

      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },

      letterSpacing: {
        tight: '-0.05em',
      },

      fontSize: {
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-2.4px', fontWeight: '600' }],
        'heading-1': ['36px', { lineHeight: '1.2', letterSpacing: '-1.5px', fontWeight: '600' }],
        'heading-2': ['24px', { lineHeight: '1.3', letterSpacing: '-0.5px', fontWeight: '600' }],
        'heading-3': ['20px', { lineHeight: '1.4', letterSpacing: '-0.25px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '500' }],
      },

      // ═══════════════════════════════════════════════════════════════
      // BREAKPOINTS - Design spec (600/960/1200)
      // ═══════════════════════════════════════════════════════════════
      screens: {
        'mobile': {'max': '599px'},
        'tablet': {'min': '600px', 'max': '959px'},
        'desktop': {'min': '960px', 'max': '1199px'},
        'wide': {'min': '1200px', 'max': '1399px'},
        'ultra-wide': {'min': '1400px'},
      },

      // ═══════════════════════════════════════════════════════════════
      // TRANSITIONS - 300ms ease-out
      // ═══════════════════════════════════════════════════════════════
      transitionDuration: {
        DEFAULT: '300ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'ease-out',
        'cinacoin': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
};

export default cinacoinPreset;
