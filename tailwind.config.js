/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d32f2f',
      },
      fontFamily: {
        'arial': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}