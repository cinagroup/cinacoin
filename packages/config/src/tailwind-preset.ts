import type { Config } from "tailwindcss";

/**
 * Cinacoin 统一 Tailwind CSS Preset
 *
 * 所有项目共享的品牌颜色、字体和命名约定。
 * 对齐 DESIGN.md 语义色：primary=#171717 (ink), success=#0070f3, error=#ee0000.
 * Brand blue (#3B82F6) 保留为 accent / link 色（不是 primary CTA 色）。
 */
export const cinacoinPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Primary ink — the single CTA / text color per DESIGN.md
        ink: {
          DEFAULT: "#171717",
          soft: "#4d4d4d",
          mute: "#888888",
        },
        // Canvas surfaces per DESIGN.md
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#fafafa",
          soft2: "#f5f5f5",
        },
        // Hairline borders per DESIGN.md
        hairline: {
          DEFAULT: "#ebebeb",
          strong: "#a1a1a1",
        },
        // Cinacoin 品牌色 — accent / link blue (not primary CTA)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Semantic colors aligned with DESIGN.md
        success: { DEFAULT: "#0070f3", dark: "#0761d1" },
        warning: { DEFAULT: "#f5a623", soft: "#ffefcf", dark: "#ab570a" },
        danger: { DEFAULT: "#ee0000", soft: "#f7d4d6", dark: "#c50000" },
        info: { DEFAULT: "#0070f3", dark: "#0761d1" },
        // Link colors per DESIGN.md
        link: { DEFAULT: "#0070f3", deep: "#0761d1", bgSoft: "#d3e5ff" },
        // Accent palette per DESIGN.md
        violet: { DEFAULT: "#7928ca", soft: "#d8ccf1", deep: "#4c2889" },
        cyan: { DEFAULT: "#50e3c2", soft: "#aaffec", deep: "#29bc9b" },
        highlight: { pink: "#ff0080", magenta: "#eb367f" },
        // Selection per DESIGN.md
        selection: { bg: "#171717", fg: "#f2f2f2" },
        // Gradient stops (hero mesh gradient per DESIGN.md)
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
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
};

export default cinacoinPreset;
