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
        'rtsc-red': '#ff3e3e',
        'rtsc-orange': '#ff9f3e',
        'rtsc-green': '#3eff3e',
        'rtsc-blue': '#3e9fff',
      }
    },
  },
  plugins: [],
}
