/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./assets/main.js",
      "./index.html",
  ],
  theme: {
      extend: {
          fontFamily: {
            instrumentSerif: ["'Instrument Serif'", "serif"],
            interDisplay: ["'Inter Display'", "serif"],
        }
    },
  },
  plugins: [],
}
