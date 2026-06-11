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
        // Brand
        primary: {
          DEFAULT: 'var(--cc-primary)',
          foreground: 'var(--cc-on-primary)',
        },
        // Surface
        canvas: {
          DEFAULT: 'var(--cc-canvas)',
          soft: 'var(--cc-canvas-soft)',
          'soft-2': 'var(--cc-canvas-soft-2)',
        },
        // Text
        ink: {
          DEFAULT: 'var(--cc-ink)',
          body: 'var(--cc-body)',
          mute: 'var(--cc-muted)',
        },
        // Border
        hairline: {
          DEFAULT: 'var(--cc-hairline)',
          dark: 'var(--cc-hairline-strong)',
        },
        // Link
        link: {
          DEFAULT: 'var(--cc-link)',
          hover: 'var(--cc-link-deep)',
        },
        // Semantic
        success: {
          DEFAULT: 'var(--cc-success)',
          soft: 'var(--cc-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--cc-warning)',
          soft: 'var(--cc-warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--cc-error)',
          soft: 'var(--cc-error-bg)',
        },
        // Accent
        violet: {
          DEFAULT: 'var(--cc-violet)',
          soft: 'var(--cc-violet-soft)',
        },
        cyan: {
          DEFAULT: 'var(--cc-cyan)',
          soft: 'var(--cc-cyan-soft)',
        },
        // On-primary for dark surfaces
        'on-primary': 'var(--cc-on-primary)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'cc-none': 'var(--cc-radius-none)',
        'cc-xs': 'var(--cc-radius-xs)',
        'cc-sm': 'var(--cc-radius-sm)',
        'cc-md': 'var(--cc-radius-md)',
        'cc-lg': 'var(--cc-radius-lg)',
        'cc-xl': 'var(--cc-radius-xl)',
        'cc-pill-sm': 'var(--cc-radius-pill-sm)',
        'cc-pill': 'var(--cc-radius-pill)',
        'cc-full': 'var(--cc-radius-full)',
      },
      spacing: {
        'cc-xxs': 'var(--cc-xxs)',
        'cc-xs': 'var(--cc-xs)',
        'cc-sm': 'var(--cc-sm)',
        'cc-md': 'var(--cc-md)',
        'cc-lg': 'var(--cc-lg)',
        'cc-xl': 'var(--cc-xl)',
        'cc-2xl': 'var(--cc-2xl)',
        'cc-3xl': 'var(--cc-3xl)',
        'cc-4xl': 'var(--cc-4xl)',
        'cc-5xl': 'var(--cc-5xl)',
        'cc-6xl': 'var(--cc-6xl)',
      },
      boxShadow: {
        'cc-0': 'var(--cc-level0)',
        'cc-1': 'var(--cc-level1)',
        'cc-2': 'var(--cc-level2)',
        'cc-3': 'var(--cc-level3)',
        'cc-4': 'var(--cc-level4)',
        'cc-5': 'var(--cc-level5)',
      },
      fontSize: {
        'display-xl': ['var(--text-display-xl)', { lineHeight: '48px', letterSpacing: '-2.4px' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: '40px', letterSpacing: '-1.28px' }],
        'display-md': ['var(--text-display-md)', { lineHeight: '32px', letterSpacing: '-0.96px' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: '28px', letterSpacing: '-0.6px' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '28px' }],
        'body-md': ['var(--text-body-md)', { lineHeight: '24px' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: '20px', letterSpacing: '-0.28px' }],
        'caption': ['var(--text-caption)', { lineHeight: '16px' }],
      },
      screens: {
        'mobile': {'max': '599px'},
        'tablet': {'min': '600px', 'max': '959px'},
        'desktop': {'min': '960px', 'max': '1199px'},
        'wide': {'min': '1200px', 'max': '1399px'},
        'ultra-wide': {'min': '1400px'},
      },
    },
  },
  plugins: [],
};
export default config;
