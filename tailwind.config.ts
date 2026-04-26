import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "#e8edf4",
          100: "#c5d1e4",
          200: "#9eb3d1",
          300: "#7795be",
          400: "#5a7eb0",
          500: "#3d67a2",
          600: "#2e5494",
          700: "#1B3A5C",
          800: "#132b46",
          900: "#0b1c30",
        },
        gold: {
          50:  "#fdf8ed",
          100: "#f9edd0",
          200: "#f3d9a0",
          300: "#ecc46f",
          400: "#e6b249",
          500: "#C9A84C",
          600: "#b8903a",
          700: "#9a742a",
          800: "#7c5c1f",
          900: "#5e4415",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
