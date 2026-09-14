/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e17',
          darker: '#06090e',
          card: '#111726',
          border: '#1e293b',
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          green: '#10b981',
          red: '#f43f5e',
          orange: '#f97316',
          yellow: '#eab308',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
