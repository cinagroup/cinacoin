import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0d0d1a",
          card: "#1a1a2e",
          hover: "#252542",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a0a0b0",
          muted: "#6b6b80",
        },
        accent: {
          blue: "#4a9eff",
          purple: "#7c3aed",
          green: "#10b981",
          yellow: "#f59e0b",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
