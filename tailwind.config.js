/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2e7d32",
        secondary: "#607463",
        background: "#f7f9f5",
        text: "#1b1f23",
        textSecondary: "#607463",
        textTertiary: "#90a4ae",
        border: "#eef1ee",
        borderLight: "#e0e0e0",
      },
    },
  },
  plugins: [],
};
