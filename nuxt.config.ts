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
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://api.spotify.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://api.unsplash.com', crossorigin: '' },
        { rel: 'preconnect', href: 'http://scratch-radio.ca:8000' },
      ],
    },
  },
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
    providers: {
      placehold: {
        name: 'placehold',
        provider: 'ipx',
        options: {
          baseURL: 'https://placehold.co/48x48'
        }
      }
    },
    domains: ['placehold.co'],
    quality: 80
  },
  runtimeConfig: {
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
    public: {
      lastfmApiKey: process.env.LASTFM_API_KEY,
      unsplashBase: 'https://api.unsplash.com',
      fonts: {
        selfHosted: false // Forces Google-hosted <link> injection
      }
    }
  },
  fonts: {
    provider: 'google',
    assets: {},
    families: [
      {
        name: 'Lexend',
        weights: [100, 200, 300, 400, 500, 600, 700]
      }
    ]
  }
})
