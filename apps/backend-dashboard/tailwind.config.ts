import type { Config } from "tailwindcss";
import { cinacoinPreset } from "../../packages/config/tailwind-preset";

const config: Config = {
  presets: [cinacoinPreset],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: "var(--cc-bg, #0a0c10)",
          surface: "var(--cc-surface, #12141c)",
          surfaceHover: "var(--cc-surface-hover, #1a1d28)",
          border: "var(--cc-border, #1e2130)",
          borderLight: "var(--cc-border-light, #2a2d3e)",
          muted: "var(--cc-muted, #6b7280)",
          mutedLight: "var(--cc-muted-light, #9ca3af)",
          text: "var(--cc-text, #f9fafb)",
          textSecondary: "var(--cc-text-secondary, #d1d5db)",
          danger: "var(--cc-danger, #ef4444)",
          warning: "var(--cc-warning, #f59e0b)",
          success: "var(--cc-success, #22c55e)",
          info: "var(--cc-info, #3b82f6)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
