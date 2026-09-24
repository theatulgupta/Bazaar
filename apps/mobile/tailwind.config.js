const { colors } = require('../../packages/tokens/colors.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
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
        pill: '999px',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        sans: ['Manrope_500Medium'],
      },
    },
  },
  plugins: [],
};
