/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc6fc',
          400: '#36a9f9',
          500: '#0c8eeb',
          600: '#016fc9',
          700: '#0158a3',
          800: '#054a86',
          900: '#0a3e6f',
          950: '#062547',
        },
        dark: {
          50: '#f6f8f9',
          100: '#edf0f2',
          200: '#d6dce0',
          300: '#b3bfc7',
          400: '#889aa6',
          500: '#6a7d8b',
          600: '#576875',
          700: '#495662',
          800: '#404b54',
          900: '#1e293b',
          950: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
