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
        abyssal: "#1B2632"
      },
    }
  },
  plugins: []
}

export default config