// server/api/track-status.get.ts
import { defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'

const unsplashAccessKey = process.env.NUXT_UNSPLASH_ACCESS_KEY
const trackCache: Record<string, any> = {}

export default defineEventHandler(async () => {
  const radioStatusUrl = 'http://scratch-radio.ca:8000/status-json.xsl'
  const now = Date.now()

  try {

    const statusRes = await $fetch<{ icestats?: { source?: { title?: string } } }>(radioStatusUrl)
    const currentTitle = statusRes.icestats?.source?.title || ''
    
    const parts = currentTitle.split(/\s*-\s*/)
    const artist = parts[0]?.trim() || ''
    const title = parts[1]?.trim() || ''

    if (!title || !artist) return { title: title || '', artist: artist || '', art: null }

    // check cache first
    const trackKey = `${artist}-${title}`.toLowerCase()
    if (trackCache[trackKey]?.art) return trackCache[trackKey]

    let art: string | null = null

    // itunes search next
    try {
      const searchTerm = `${artist} ${title}`
      console.log(`🔎 iTunes Search (Raw): "${searchTerm}"`)
      
      const searchRes = await $fetch<any>('https://itunes.apple.com/search', {
        params: {
          term: searchTerm,
          media: 'music',
          entity: 'song',
          limit: 1
        },
        timeout: 5000,
        parseResponse: JSON.parse 
      })

      console.log('iTunes Full Response:', JSON.stringify(searchRes, null, 2))

      if (searchRes.results && searchRes.results.length > 0) {

        const track = searchRes.results[0]
        const foundArt = track.artworkUrl100 || track.artworkUrl60 || track.artworkUrl30
        
        if (foundArt) {
          art = foundArt.replace('100x100bb', '600x600bb')
          console.log('art variable is now set to:', art)
        } else {
          console.warn('Match found, but no artwork URLs in the result.')
        }
      } else {
        console.warn('iTunes: No results found in the array.')
      }
    } catch (e: any) {
      console.error('iTunes Error:', e.message)
    }

    // then get unsplash fallback
    if (!art && unsplashAccessKey) {
      console.log('Fetching fallback...')
      try {
        const unsplashRes = await $fetch<any>('https://api.unsplash.com/photos/random', {
          params: {
            query: '70s reggae beach horizon',
            orientation: 'squarish',
            count: 1,
            client_id: unsplashAccessKey
          },
          timeout: 5000
        })

        const imageData = Array.isArray(unsplashRes) ? unsplashRes[0] : unsplashRes
        if (imageData?.urls?.regular) {
          art = imageData.urls.regular + '&auto=format&fit=crop&w=600&h=600&q=80'
          console.log('unsplash was used')
        }
      } catch (e: any) {
        console.error('unsplash error:', e.message)
      }
    }

    // cache the data at last
    const trackData = { artist, title, art, timestamp: now }
    trackCache[trackKey] = trackData
    return trackData

  } catch (err) {
    console.error('global error here!')
    return { title: '', artist: '', art: null }
  }
})