import { defineEventHandler } from 'h3'
const UNSPLASH_KEY = process.env.NUXT_UNSPLASH_ACCESS_KEY
const unsplashBase = process.env.NUXT_UNSPLASH_BASE || 'https://api.unsplash.com'

export default defineEventHandler(async () => {
	// Always use a fixed query for Unsplash
	const params = new URLSearchParams({
		query: "reggae concert indoors", 
		orientation: "squarish",
		content_filter: "high",
		count: "1"
	})

	// Use Authorization header with runtime config
	const res = await fetch(`${unsplashBase}/photos/random?${params.toString()}`, {
		headers: {
			Authorization: `Client-ID ${UNSPLASH_KEY}`
		}
	})

	if (!res.ok) {
		const errorText = await res.text()
		throw new Error(`Unsplash fetch failed: ${res.status} ${errorText}`)
	}

	const data = await res.json()
	return data
})
