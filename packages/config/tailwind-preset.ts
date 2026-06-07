/**
 * Cinacoin 统一 Tailwind CSS Preset
 *
 * 所有项目共享的品牌颜色、字体和命名约定。
 * 主品牌色: #3B82F6 (blue-500)
 */
export const cinacoinPreset = {
  theme: {
    extend: {
      colors: {
        // Cinacoin 品牌色 - 统一的 blue-primary
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // 主品牌色
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // 语义色
        success: { DEFAULT: "#22c55e", dark: "#16a34a" },
        warning: { DEFAULT: "#f59e0b", dark: "#d97706" },
        danger: { DEFAULT: "#ef4444", dark: "#dc2626" },
        info: { DEFAULT: "#3b82f6", dark: "#2563eb" },
        // Dashboard surface colors (light theme default per DESIGN.md)
        // These are overridden per-app via CSS variables in tailwind.config.ts.
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f1f5f9",
          border: "#e2e8f0",
          borderLight: "#e5e7eb",
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
