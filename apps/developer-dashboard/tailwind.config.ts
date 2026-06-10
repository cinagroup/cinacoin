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
        primary: {
          DEFAULT: '#171717',
          foreground: '#ffffff',
        },
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          'soft-2': '#f5f5f5',
        },
        ink: {
          DEFAULT: '#171717',
          body: '#4d4d4d',
          mute: '#888888',
        },
        hairline: {
          DEFAULT: '#ebebeb',
          dark: '#d4d4d4',
        },
        link: {
          DEFAULT: '#0066ff',
          hover: '#0052cc',
        },
        success: {
          DEFAULT: '#00875a',
        },
        warning: {
          DEFAULT: '#ff991f',
        },
        danger: {
          DEFAULT: '#de350b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
