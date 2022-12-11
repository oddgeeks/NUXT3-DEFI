import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        gray: {
          850: "#161E2D"
        },
        slate: {
          750: "#2A3850"
        }
      },
      fontFamily: {
        sans: ["Source Code Pro", ...defaultTheme.fontFamily.sans]
      }
    }
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
  ]
}
