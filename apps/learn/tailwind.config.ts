import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cc-ink": "var(--cc-ink)",
        "cc-on-primary": "var(--cc-on-primary)",
        "cc-canvas": "var(--cc-canvas)",
        "cc-canvas-soft": "var(--cc-canvas-soft)",
        "cc-canvas-soft-2": "var(--cc-canvas-soft-2)",
        "cc-body": "var(--cc-body)",
        "cc-mute": "var(--cc-mute)",
        "cc-hairline": "var(--cc-hairline)",
        "cc-hairline-strong": "var(--cc-hairline-strong)",
        "cc-link": "var(--cc-link)",
        "cc-success": "var(--cc-success)",
        "cc-error": "var(--cc-error)",
        "cc-warning": "var(--cc-warning)",
        "cc-violet": "var(--cc-violet)",
        "cc-cyan": "var(--cc-cyan)",
        "cc-highlight-pink": "var(--cc-highlight-pink)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      screens: {
        mobile: { max: "599px" },
        tablet: { min: "600px", max: "959px" },
        desktop: { min: "960px", max: "1199px" },
        wide: { min: "1200px", max: "1399px" },
        "ultra-wide": { min: "1400px" },
      },
    },
  },
  plugins: [],
};

export default config;
