const { colors } = require('../../packages/tokens/colors.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        primaryPressed: colors.primaryPressed,
        onPrimary: colors.onPrimary,
        accent: colors.accent,
        canvas: colors.canvas,
        surface: colors.surface,
        sand: colors.sand,
        ink: colors.text,
        muted: colors.muted,
        line: colors.line,
        success: colors.success,
        danger: colors.danger,
        info: colors.info,
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
