/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#af1e23ff',
          800: '#8a1e20ff',
          900: '#54171bff',
          950: '#0e2138',
        },
        marist: {
          primary: '#162e4a',
          navy: '#0e2138',
          royal: '#1d4ed8',
          accent: '#e88024',
          gold: '#f28d23',
          light: '#f0f6fc',
        },
        grm: {
          primary: '#162e4a',
          accent: '#e88024',
          dark: '#0e2138',
          light: '#f0f6fc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
