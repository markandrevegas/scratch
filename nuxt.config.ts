// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // css: ['~/assets/css/tailwind.css'],
  tailwindcss: {
    configPath: 'tailwind.config.ts',
    cssPath: '~/assets/css/main.css',
    exposeConfig: true,
    viewer: true
  },
  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/test-utils'
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
})