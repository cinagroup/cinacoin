import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Vercel Design System Colors
      colors: {
        'vercel-primary': '#171717',
        'vercel-on-primary': '#ffffff',
        'vercel-ink': '#171717',
        'vercel-body': '#4d4d4d',
        'vercel-mute': '#888888',
        'vercel-hairline': '#ebebeb',
        'vercel-canvas': '#ffffff',
        'vercel-canvas-soft': '#fafafa',
        'vercel-link': '#0070f3',
      },
      // Vercel Design System Border Radius
      borderRadius: {
        'vercel-sm': '6px',
        'vercel-md': '8px',
        'vercel-lg': '12px',
      },
      // Vercel Design System Font Family
      fontFamily: {
        'vercel-sans': ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'vercel-mono': ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      // Vercel Design System Shadows
      boxShadow: {
        'vercel-1': '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
        'vercel-2': '0px 2px 2px rgba(0, 0, 0, 0.06), 0px 8px 8px -8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
        'vercel-3': '0px 2px 2px rgba(0, 0, 0, 0.06), 0px 8px 16px -4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
      },
    },
  },
  plugins: [],
};

export default config;
