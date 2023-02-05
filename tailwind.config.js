const defaultTheme = require("tailwindcss/defaultTheme");

const colors = {
  primary: "#16A34A",
  primaryHover: "#19B853"
}

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
        "navigation-pattern": `linear-gradient(270deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%);`,
        "navigation-pattern-left": `linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%);`,
        "navigation-pattern-dark": `linear-gradient(270deg, #111827 0%, rgba(17, 24, 39, 0) 100%);`,
        "navigation-pattern-dark-left": `linear-gradient(90deg, #111827 0%, rgba(17, 24, 39, 0) 100%);`,
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
        orange: {
          400: '#EC974F',
        },
        yellow: {
          DEFAULT: "#F2C94C",
        },
        green: {
          300: colors.primaryHover,
          400: colors.primary,
        },
        primary:{
          hover: colors.primaryHover,
          DEFAULT: colors.primary,
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
