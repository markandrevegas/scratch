import { defineNuxtConfig } from 'nuxt/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Extend the NuxtConfig type
declare module 'nuxt/schema' {
  interface NuxtConfig {
    image?: {
      quality?: number;
      domains?: string[];
      providers?: {
        [key: string]: {
          name: string;
          provider: string;
          options?: {
            baseURL?: string;
            [key: string]: unknown;
          };
        };
      };
    };
  }

  interface NuxtOptions {
    image?: NuxtConfig['image'];
  }
}

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
    '@nuxt/icon',
  ],
  image: {
    quality: 80,
    providers: {
      placehold: {
        name: 'placehold',
        provider: 'ipx',
        options: {
          baseURL: 'https://placehold.co/64x64'
        }
      }
    },
    domains: ['placehold.co']
  }
})
