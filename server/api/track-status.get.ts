// server/api/track-status.get.ts
import { defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'

const spotifyClientId = process.env.NUXT_SPOTIFY_CLIENT_ID
const spotifyClientSecret = process.env.NUXT_SPOTIFY_CLIENT_SECRET
const unsplashAccessKey = process.env.NUXT_UNSPLASH_ACCESS_KEY

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface UnsplashResponse {
  urls: { regular: string }
  user: { name: string }
}

// Server-side cache
let spotifyToken: string | null = null
let tokenExpiry: number | null = null
// 2️⃣ Track art cache
interface TrackCacheItem {
  artist: string
  title: string
  art: string | null
  timestamp: number
}
const trackCache: Record<string, TrackCacheItem> = {}
const TRACK_CACHE_DURATION = 10_000 // 10 seconds

export default defineEventHandler(async () => {
  const radioStatusUrl = 'http://scratch-radio.ca:8000/status-json.xsl'
  const now = Date.now()

  try {
    // current track fetching
    const res = await $fetch<{ icestats?: { source?: { title?: string } } }>(radioStatusUrl)
    const currentTitle = res.icestats?.source?.title || ''
    const [artist, title] = currentTitle.split(/\s*-\s*/).map(s => s.trim())
    const now = Date.now()
    if (!title || !artist) {
      return { title: title || '', artist: artist || '', art: null }
    }

    const trackKey = (artist + '-' + title).toLowerCase()
    if (trackCache[trackKey] && trackCache[trackKey].art) {
      return trackCache[trackKey]
    }

    let art: string | null = null

    if (spotifyClientId && spotifyClientSecret) {
      try {
        // use spotify token cache
        if (!spotifyToken || !tokenExpiry || now >= tokenExpiry) {
          const authString = Buffer.from(spotifyClientId + ':' + spotifyClientSecret).toString('base64')
          const tokenRes = await $fetch<{ access_token: string; expires_in: number }>(
            'https://accounts.spotify.com/api/token',
            {
              method: 'POST',
              headers: {
                Authorization: 'Basic ' + authString,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: 'grant_type=client_credentials'
            }
          )
          spotifyToken = tokenRes.access_token
          tokenExpiry = now + tokenRes.expires_in * 1000 - 5000
        }

        // search spotify for track album art
        const query = encodeURIComponent('track:' + title + ' artist:' + artist)
        const spotifyRes = await $fetch<{
          tracks?: { items: { album?: { images?: SpotifyImage[] } }[] }
        }>('https://api.spotify.com/v1/search?q=$' + query + '&type=track&limit=1', {
          headers: { Authorization: 'Bearer ' + spotifyToken }
        })

        const track = spotifyRes.tracks?.items?.[0]
        art = track?.album?.images?.[0]?.url ?? null
        
      } catch (spotifyErr) {
        spotifyToken = null
      }
    }

    if (!art && unsplashAccessKey) {
      try {
        const unsplashRes = await $fetch<UnsplashResponse[]>(
          'https://api.unsplash.com/photos/random?query=' + encodeURIComponent('70s reggae') + '&count=1&client_id=' + unsplashAccessKey
        )
        art = unsplashRes[0]?.urls?.regular ?? null
      } catch (err) {
        console.error('Unsplash fallback failed:', err)
      }
    }

    const trackData: TrackCacheItem = { artist, title, art, timestamp: now }
    trackCache[trackKey] = trackData

    return trackData

  } catch (err: unknown) {
    console.error('Failed to fetch track status:', err)
    return { title: '', artist: '', art: null }
  }
})