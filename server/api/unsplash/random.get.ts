// server/api/unsplash/random.get.ts
import { defineEventHandler, getQuery } from 'h3'

// let cached: unknown = null
// let lastFetch = 0

export default defineEventHandler(async (event) => {
  /* const now = Date.now()
  if (cached && now - lastFetch < 1000 * 60) {
    return cached
  } */

  const query = getQuery(event)
  const res = await $fetch('https://api.unsplash.com/photos/random', {
    query: { ...query, client_id: process.env.UNSPLASH_ACCESS_KEY },
  })

  // cached = res
  // lastFetch = now
  return res
})
