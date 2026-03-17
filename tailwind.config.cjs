/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 10px 35px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
};

