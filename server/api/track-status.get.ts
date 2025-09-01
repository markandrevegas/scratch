// server/api/track-status.get.ts
import { defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'
import { useRuntimeConfig } from '#imports'

interface SpotifyImage {
  url: string
  height: number
  width: number
}

// Server-side cache
let spotifyToken: string | null = null
let tokenExpiry: number | null = null

export default defineEventHandler(async () => {
  const playlist = 'http://scratch-radio.ca:8000/status-json.xsl'
  const config = useRuntimeConfig()

  try {
    // 1️⃣ Fetch current radio track
    const res = await $fetch<{ icestats?: { source?: { title?: string } } }>(playlist)
    const currentTitle = res.icestats?.source?.title || ''
    const [artist, title] = currentTitle.split(/\s*-\s*/)

    if (!title || !artist) {
      return { title: title || '', artist: artist || '', art: null }
    }

    // 2️⃣ Get Spotify token (cached)
    const now = Date.now()
    if (!spotifyToken || !tokenExpiry || now >= tokenExpiry) {
      const clientId = config.spotifyClientId
      const clientSecret = config.spotifyClientSecret

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
    console.log(`Searching Spotify for: ${query}`)

    const spotifyRes = await $fetch<{
      tracks?: { items: { album?: { images?: SpotifyImage[] } }[] }
    }>(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`
      }
    })

    const trackItem = spotifyRes.tracks?.items?.[0]
    const art = trackItem?.album?.images?.[0]?.url ?? null

    return { title, artist, art }
  } catch (err: unknown) {
    console.error('Failed to fetch track status:', err)
    return { title: '', artist: '', art: null }
  }
})
