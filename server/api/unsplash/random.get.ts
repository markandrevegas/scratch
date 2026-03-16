import { defineEventHandler } from 'h3'
const UNSPLASH_KEY = process.env.NUXT_UNSPLASH_ACCESS_KEY
const unsplashBase = process.env.NUXT_UNSPLASH_BASE || 'https://api.unsplash.com'

export default defineEventHandler(async () => {
	const params = new URLSearchParams({
		query: 'beach horizon', 
		orientation: 'squarish',
		content_filter: 'high',
		count: '1'
	})

	const res = await fetch(unsplashBase + '/photos/random?' + params.toString(), {
		headers: {
			Authorization: 'Client-ID ' + UNSPLASH_KEY
		}
	})

	if (!res.ok) {
		const errorText = await res.text()
		throw new Error('Unsplash fetch failed: ' + res.status + ' ' + errorText)
	}

	const data = await res.json()
	return data
})