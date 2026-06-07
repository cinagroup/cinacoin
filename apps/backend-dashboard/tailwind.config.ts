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
          bg: "var(--cc-bg, #fafafa)",
          surface: "var(--cc-surface, #ffffff)",
          surfaceHover: "var(--cc-surface-hover, #f1f5f9)",
          border: "var(--cc-border, #e2e8f0)",
          borderLight: "var(--cc-border-light, #e5e7eb)",
          muted: "var(--cc-muted, #888888)",
          mutedLight: "var(--cc-muted-light, #9ca3af)",
          text: "var(--cc-text, #171717)",
          textSecondary: "var(--cc-text-secondary, #475569)",
          danger: "var(--cc-danger, #ee0000)",
          warning: "var(--cc-warning, #f5a623)",
          success: "var(--cc-success, #0070f3)",
          info: "var(--cc-info, #3b82f6)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
