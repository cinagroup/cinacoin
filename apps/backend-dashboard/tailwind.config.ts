import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: "#0a0c10",
          surface: "#12141c",
          surfaceHover: "#1a1d28",
          border: "#1e2130",
          borderLight: "#2a2d3e",
          primary: "#6366f1",
          primaryLight: "#818cf8",
          primaryDark: "#4f46e5",
          success: "#34d399",
          successDark: "#059669",
          warning: "#fbbf24",
          warningDark: "#d97706",
          danger: "#f87171",
          dangerDark: "#dc2626",
          muted: "#6b7280",
          mutedLight: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};

export default config;
