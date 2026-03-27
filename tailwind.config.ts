// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.25em'
      },
      colors: {
        palladian: "#EEE9DF",
        abyssal: "#1B2632",
        ember: "#FF6B35",
        warmGlow: "#FFB849",
        slate: "#2A3441"
      },
      screens: {
        se: '360px',
        '12pro': '390px',
        xr: '414px'
      }
    }
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('portrait', '@media (orientation: portrait)')
      addVariant('landscape', '@media (orientation: landscape)')
    }
  ]
}

export default config