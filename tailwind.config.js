/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#f8e9d3',
      },
    },
  },
  plugins: [],
}
