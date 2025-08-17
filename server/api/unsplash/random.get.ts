import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const res = await $fetch('https://api.unsplash.com/photos/random', {
    query: {
      ...query,
      client_id: process.env.UNSPLASH_ACCESS_KEY
    }
  })

  return res
})
