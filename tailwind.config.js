/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: '#131921',
          header: '#232F3E',
          orange: '#FF9900',
          teal: '#00CED1',
          blue: '#0066B2',
          yellow: '#FFC72C',
          red: '#C60C30',
        },
      },
    },
  },
  plugins: [],
};
