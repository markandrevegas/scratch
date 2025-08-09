import { defineNuxtConfig } from 'nuxt/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/css/tailwind.css'],
  vite: {
    plugins: [tsconfigPaths()],
  },
  modules: [
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@nuxt/icon'
  ],
  fonts: {
    provider: 'google',
    families: [{ name: 'Inter', provider: 'google' }],
    devtools: true,
    defaults: {
      weights: [300, 400, 500, 600],
      styles: ['normal'],
      subsets: ['danish']
    }
  },
  image: {
    quality: 80,
    providers: {
      placehold: {
        name: 'placehold',
        provider: 'ipx',
        options: {
          baseURL: 'https://placehold.co'
        }
      }
    },
    domains: ['placehold.co']
  }
})