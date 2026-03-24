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

    const trackKey = `${artist}-${title}`.toLowerCase()
    let art: string | null = null

    // Try iTunes first
    try {
      const searchTerm = `${artist} ${title}`.trim()
      
      const params = new URLSearchParams({
        term: searchTerm,
        media: 'music',
        entity: 'musicTrack',
        limit: '20',
        country: 'US'
      })

      const url = `https://itunes.apple.com/search?${params.toString()}`
      
      const response = await fetch(url)
      const searchRes = await response.json()

      if (searchRes.results && searchRes.results.length > 0) {
        const reggaeGenres = ['reggae', 'ska', 'rocksteady', 'dub']
        let track = searchRes.results.find((t: any) => 
          reggaeGenres.some(genre => 
            t.primaryGenreName?.toLowerCase().includes(genre)
          )
        )
        
        if (!track) {
          track = searchRes.results[0]
        }

        if (track) {
          const foundArt = track.artworkUrl100 || track.artworkUrl60
          
          if (foundArt) {
            art = foundArt.replace('100x100bb', '600x600bb')
            console.log('✓ iTunes art found')
          }
        }
      }
    } catch (e: any) {
      console.error('iTunes Error:', e.message)
    }

    // If iTunes succeeded, cache it and return
    if (art) {
      const trackData = { artist, title, art, timestamp: now }
      trackCache[trackKey] = trackData
      return trackData
    }

    // iTunes failed - check if we already have a cached Unsplash result
    const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours
    const cached = trackCache[trackKey]
    
    if (cached?.art && (now - cached.timestamp) < CACHE_TTL) {
      console.log('Using cached Unsplash art (no iTunes result)')
      return cached
    }

    // No cache - fetch from Unsplash and cache it
    if (unsplashAccessKey) {
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
          console.log('Unsplash fallback used (will be cached)')
        }
      } catch (e: any) {
        console.error('Unsplash error:', e.message)
      }
    }

    // Cache the Unsplash result (or null if both failed)
    const trackData = { artist, title, art, timestamp: now }
    trackCache[trackKey] = trackData
    return trackData

  } catch (err) {
    console.error('Global error:', err)
    return { title: '', artist: '', art: null }
  }
})