export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  // const { query } = getQuery(event)

  return await $fetch('https://api.unsplash.com/search/photos', {
    headers: {
      Authorization: `Client-ID ${config.unsplashAccessKey}`
    },
    query: getQuery(event)
  })
})
