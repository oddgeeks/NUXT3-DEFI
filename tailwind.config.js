const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: "class",
  theme: {
    container: {
      center: true,
      screens: {
        lg: "1092px",
      },
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
      },
    },
    extend: {
      backgroundImage: {
        "dashed-pattern": `linear-gradient( to right, #E9EDF4 33%, rgba(255, 255, 255, 0) 0%);`,
        "dashed-pattern-dark": `linear-gradient( to right, #1e293b 33%, rgba(255, 255, 255, 0) 0%);`,
      },
      spacing: {
        5.5: "25px", // wrong? 22px
        6.25: "25px",
        6.5: "26px",
        7.5: "30px",
      },
      borderRadius: {
        5: "20px",
        5.5: "25px",
        10: "40px",
        7.5: "30px",
      },
      fontFamily: {
        sans: ["Source Code Pro", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        red: {
          alert: "#EB5757",
        },
        gray: {
          850: "#161E2D",
          950: "#111827",
        },
        slate: {
          150: "#E9EDF4",
          750: "#2A3850",
        },
        yellow: {
          DEFAULT: "#F2C94C",
        },
      },
      animation: {
        "reverse-spin": "reverse-spin 1s linear infinite",
      },
      keyframes: {
        "reverse-spin": {
          from: {
            transform: "rotate(360deg)",
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
  ],
};
