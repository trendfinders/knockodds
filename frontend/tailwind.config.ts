import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#CC0000', dark: '#A30000', light: '#E53935' },
        dark: { DEFAULT: '#111111', light: '#1C1C1C', lighter: '#2A2A2A' },
        surface: { DEFAULT: '#FFFFFF', alt: '#F7F7F7', muted: '#EEEEEE' },
        accent: { DEFAULT: '#CC0000', gold: '#F5A623' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
