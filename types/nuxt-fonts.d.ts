// types/nuxt-fonts.d.ts
import type { ModuleOptions as FontsModuleOptions } from "@nuxt/fonts"

declare module "nuxt/schema" {
	interface NuxtConfig {
		fonts?: FontsModuleOptions
	}

	interface NuxtOptions {
		fonts?: FontsModuleOptions
	}
}

export {}
