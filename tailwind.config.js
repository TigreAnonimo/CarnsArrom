/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#8B1E24",
          hover: "#6F161B",
          light: "#FDF2F2",
          border: "#F5D0D2",
        },
      },
    },
  },
  plugins: [],
};
