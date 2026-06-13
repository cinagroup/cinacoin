/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        farcaster: {
          purple: '#855DCD',
          teal: '#0052FF',
        },
      },
      screens: {
        'mobile': {'max': '599px'},
        'tablet': {'min': '600px', 'max': '959px'},
        'desktop': {'min': '960px', 'max': '1199px'},
        'wide': {'min': '1200px', 'max': '1399px'},
        'ultra-wide': {'min': '1400px'},
      },
      borderRadius: {
        'sm': '4px',
        'md': '4px',
        'lg': '4px',
        'xl': '4px',
        '2xl': '4px',
      },
    },
  },
  plugins: [],
};
