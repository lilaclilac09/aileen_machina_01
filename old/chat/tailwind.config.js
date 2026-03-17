/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette matching main site
        neon: {
          cyan: '#00ffff',
          red: '#ff0040',
          purple: '#b000ff',
        },
        metal: {
          dark: '#1a1a1a',
          light: '#2a2a2a',
          accent: '#3a3a3a',
        },
      },
      fontFamily: {
        barlow: ['"Barlow Condensed"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
