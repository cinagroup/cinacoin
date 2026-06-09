/**
 * CINAcoin Design System — Tailwind CSS Configuration
 *
 * Usage in your project's tailwind.config.js:
 *   const cinacoinPreset = require('@cinacoin/design-system/tailwind.config');
 *   module.exports = {
 *     presets: [cinacoinPreset],
 *     // ...your project overrides
 *   };
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: {
      // Core palette
      ink: '#171717',
      'on-primary': '#ffffff',
      canvas: {
        DEFAULT: '#ffffff',
        soft: '#fafafa',
        'soft-2': '#f5f5f5',
      },
      body: '#4d4d4d',
      mute: '#888888',
      hairline: {
        DEFAULT: '#ebebeb',
        strong: '#a1a1a1',
      },
      link: '#0070f3',

      // Semantic
      success: '#0070f3',
      error: '#ee0000',
      warning: '#f5a623',

      // Accent
      violet: '#7928ca',
      cyan: '#50e3c2',
      'highlight-pink': '#ff0080',

      // Base
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#171717', // ink, not pure black per spec
    },

    borderRadius: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      'pill-sm': '64px',
      pill: '100px',
      full: '9999px',
      none: '0px',
    },

    spacing: {
      0: '0px',
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
      section: '192px',
    },

    fontSize: {
      'display-1': ['4rem', { lineHeight: '1.05', letterSpacing: '-2.4px', fontWeight: '600' }],
      'display-2': ['3rem', { lineHeight: '1.1', letterSpacing: '-1.28px', fontWeight: '600' }],
      'display-3': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.72px', fontWeight: '600' }],
      title: ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.4px', fontWeight: '600' }],
      'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
      body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
      'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      mono: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
    },

    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
    },

    fontFamily: {
      sans: ["'Geist'", "'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
      mono: ["'Geist Mono'", 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },

    boxShadow: {
      0: 'none',
      1: 'none', // Level 1 is border-only
      2: '0 1px 2px rgba(0, 0, 0, 0.04)',
      3: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      4: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      5: '0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
    },

    extend: {
      maxWidth: {
        content: '1200px',
      },
      transitionDuration: {
        color: '150ms',
        transform: '200ms',
        layout: '300ms',
        page: '400ms',
      },
      transitionTimingFunction: {
        default: 'ease',
        layout: 'ease-in-out',
      },
      screens: {
        mobile: { max: '639px' },
        tablet: '640px',
        desktop: '1024px',
      },
    },
  },

  plugins: [
    // Elevation utilities plugin
    function ({ addUtilities }) {
      const elevations = {
        '.elevation-0': { boxShadow: 'none' },
        '.elevation-1': {
          border: '1px solid #ebebeb',
          boxShadow: 'none',
        },
        '.elevation-2': {
          border: '1px solid #ebebeb',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        },
        '.elevation-3': {
          border: '1px solid #ebebeb',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        },
        '.elevation-4': {
          border: '1px solid #ebebeb',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        },
        '.elevation-5': {
          border: '1px solid #ebebeb',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
        },
      };
      addUtilities(elevations);
    },
  ],
};
