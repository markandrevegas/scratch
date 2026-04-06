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
        palladian: "#E9EDF3",
        abyssal: "#0E1218",
        ember: "#FF6B35",
        warmGlow: "#FFB849",
        slate: "#151B24",
        slate2: "#1C2431",
        muted: "#B7C0CD",
        muted2: "#8A96A6"
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
