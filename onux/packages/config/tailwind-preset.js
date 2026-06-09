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
                // Dashboard 暗色主题
                surface: {
                    DEFAULT: "#12141c",
                    hover: "#1a1d28",
                    border: "#1e2130",
                    borderLight: "#2a2d3e",
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
//# sourceMappingURL=tailwind-preset.js.map