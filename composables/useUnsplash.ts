import { $fetch } from "ofetch"

export const useUnsplash = () => {
	// --- API calls ---
	const getRandomPhoto = async (params: Record<string, string> = {}) => {
		return await $fetch("/api/unsplash/random", { query: params })
	}

	return {
		getRandomPhoto
	}
}
