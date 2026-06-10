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
    },
  },
  plugins: [],
};
