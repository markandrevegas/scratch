import { defineNuxtConfig } from 'nuxt/config';
import tsconfigPaths from 'vite-tsconfig-paths';

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
		baseURL: '/scratch',
		head: {
			link: [
				{ rel: "preconnect", href: "https://api.spotify.com", crossorigin: "" },
				{ rel: "preconnect", href: "https://api.unsplash.com", crossorigin: "" },
				{ rel: "preconnect", href: "http://scratch-radio.ca:8000" },
				{ rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{ rel: "shortcut icon", href: "/favicon.ico" },
				{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
				{ rel: "manifest", href: "/site.webmanifest" }
			],
			meta: [{ name: "apple-mobile-web-app-title", content: "Scratch" }]
		}
	},
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["@/assets/css/tailwind.css"],
	vite: {
		plugins: [tsconfigPaths()],
    server: {
      allowedHosts: ['scratch.local']
    }
	},
	modules: ["@nuxtjs/color-mode", "@nuxtjs/tailwindcss", "@nuxt/fonts", "@nuxt/image", "@nuxt/eslint", "@nuxt/icon"],
	image: {
		providers: {
			placehold: {
				name: "placehold",
				provider: "ipx",
				options: {
					baseURL: "https://placehold.co/48x48"
				}
			}
		},
		domains: ["placehold.co"],
		quality: 80
	},
	runtimeConfig: {
		spotifyClientId: process.env.NUXT_SPOTIFY_CLIENT_ID,
		spotifyClientSecret: process.env.NUXT_SPOTIFY_CLIENT_SECRET,
		unsplashAccessKey: process.env.NUXT_UNSPLASH_ACCESS_KEY,
		public: {
			unsplashBase: "https://api.unsplash.com",
			fonts: {
				selfHosted: false
			}
		}
	},
	fonts: {
		provider: "google",
		assets: {},
		families: [
			{
				name: "Lexend",
				weights: [100, 200, 300, 400, 500, 600, 700]
			}
		]
	},
	nitro: {
		preset: "github-pages",
    prerender: {
      failOnError: false,
			crawlLinks: true
    },
		externals: {
			inline: ["ipx", "ofetch"]
		}
	}
})
