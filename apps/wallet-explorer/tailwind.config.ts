import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cina: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#b9dffc",
          300: "#7cc6f9",
          400: "#36a8f3",
          500: "#0c8ee8",
          600: "#0070cc",
          700: "#0059a3",
          800: "#004b87",
          900: "#003f70",
          950: "#002647",
        },
      },
    },
  },
  plugins: [],
};

export default config;
