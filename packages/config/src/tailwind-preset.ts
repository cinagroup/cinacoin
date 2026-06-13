import type { Config } from "tailwindcss";

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
export const cinacoinPreset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vercel gray scale
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
        error: { DEFAULT: "#ee0000", bg: "var(--cc-error-bg)" },
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
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        // Vercel: 0px for marketing, 4px for components
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "4px",
        full: "9999px",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
    },
  },
};

export default cinacoinPreset;
