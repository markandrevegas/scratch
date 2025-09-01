import { defineEventHandler, getQuery } from 'h3'
const UNSPLASH_KEY = process.env.NUXT_UNSPLASH_ACCESS_KEY
const unsplashBase = process.env.NUXT_UNSPLASH_BASE || 'https://api.unsplash.com'

export default defineEventHandler(async (event) => {
  // const config = useRuntimeConfig() as RuntimeConfig
  const query = getQuery(event)

  // Convert all query values to strings
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)]))
  )

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
