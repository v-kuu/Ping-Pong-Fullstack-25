module.exports = {
  content: [
    "./src/**/*.{ts,tsx,tsx}",
    "./components/**/*.{ts,tsx}",
    "./islands/**/*.{ts,tsx}",
    "./assets/**/*.css",
  ],
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  daisyui: {
    themes: ["light", "dark"],
  },
};
