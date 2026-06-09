/**
 * Cinacoin Design System Tailwind CSS Preset
 * Copied from design-system/tailwind-preset.ts for local use
 */

import type { Config } from "tailwindcss";

const cinacoinPreset: Config = {
  content: [],
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
          DEFAULT: '#0070f3',
          hover: '#0051a8',
        },
        error: {
          DEFAULT: '#ee0000',
          light: '#fee2e2',
        },
        success: {
          DEFAULT: '#0070f3',
          light: '#dbeafe',
        },
        warning: {
          DEFAULT: '#f5a623',
          light: '#fef3c7',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '96px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        pill: '100px',
      },
      boxShadow: {
        'cinacoin-1': 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-2': '0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-3': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-4': '0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'cinacoin-5': '0 8px 16px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      letterSpacing: {
        tight: '-0.05em',
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.1', letterSpacing: '-2.4px', fontWeight: '600' }],
        'heading-1': ['36px', { lineHeight: '1.2', letterSpacing: '-1.5px', fontWeight: '600' }],
        'heading-2': ['24px', { lineHeight: '1.3', letterSpacing: '-0.5px', fontWeight: '600' }],
        'heading-3': ['20px', { lineHeight: '1.4', letterSpacing: '-0.25px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        cinacoin: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default cinacoinPreset;
