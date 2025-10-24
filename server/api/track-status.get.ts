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
  const playlist = 'http://scratch-radio.ca:8000/status-json.xsl'

  try {
    // 1️⃣ Fetch current radio track
    const res = await $fetch<{ icestats?: { source?: { title?: string } } }>(playlist)
    const currentTitle = res.icestats?.source?.title || ''
    const [artist, title] = currentTitle.split(/\s*-\s*/)
    const now = Date.now()
    if (!title || !artist) {
      return { title: title || '', artist: artist || '', art: null }
    }
    const trackKey = `${artist}-${title}`
    // Return cached track art if still valid
    const cached = trackCache[trackKey]
    if (cached && now - cached.timestamp < TRACK_CACHE_DURATION) {
      return cached
    }

    // 2️⃣ Get Spotify token (cached)
    if (!spotifyToken || !tokenExpiry || now >= tokenExpiry) {
      const clientId = spotifyClientId
      const clientSecret = spotifyClientSecret

      if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials')
      }

      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      const tokenRes = await $fetch<{ access_token: string; expires_in: number }>(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        }
      )

      spotifyToken = tokenRes.access_token
      tokenExpiry = now + tokenRes.expires_in * 1000 - 5000
    }

    // 3️⃣ Search Spotify for track album art
    const query = encodeURIComponent(`track:${title} artist:${artist}`)

    const spotifyRes = await $fetch<{
      tracks?: { items: { album?: { images?: SpotifyImage[] } }[] }
    }>(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`
      }
    })

    const trackItem = spotifyRes.tracks?.items?.[0]
    let art = trackItem?.album?.images?.[0]?.url ?? null
    if (!art && unsplashAccessKey) {
      const unsplashKey = `unsplash-${trackKey}`
      const unsplashCached = trackCache[unsplashKey]
      if (unsplashCached) {
        art = unsplashCached.art
      } else {
        try {
          const unsplashRes = await $fetch<UnsplashResponse[]>(
            `https://api.unsplash.com/photos/random?query=${encodeURIComponent('70s reggae')}&count=1&orientation=landscape&content_filter=high&client_id=${unsplashAccessKey}`
          )
          art = unsplashRes[0]?.urls?.regular ?? null
          // Cache Unsplash art permanently for this track
          trackCache[unsplashKey] = { artist, title, art, timestamp: now }
        } catch (err) {
          console.error('Unsplash fallback failed:', err)
        }
      }
    }
    // Cache final track info
    const trackData: TrackCacheItem = { artist, title, art, timestamp: now }
    trackCache[trackKey] = trackData
    // Cache result
    return trackData
  } catch (err: unknown) {
    console.error('Failed to fetch track status:', err)
    return { title: '', artist: '', art: null }
  }
})
