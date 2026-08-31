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
        axon: {
          bg: '#0c0d12',
          card: '#14151e',
          cardBorder: '#232533',
          purple: '#8052ff',
          neon: '#a855f7',
          cyan: '#38bdf8',
          green: '#10b981',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
