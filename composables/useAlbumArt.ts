// import { ref } from 'vue'
import { useRuntimeConfig } from '#app/nuxt'

let spotifyToken: string | null = null
let tokenExpiry: number | null = null

export function useAlbumArt() {
  const config = useRuntimeConfig()

  // Get Spotify token (server-side)
  const getSpotifyToken = async (): Promise<string> => {
    const now = Date.now()
    if (spotifyToken && tokenExpiry && now < tokenExpiry) return spotifyToken

    const authString = Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')

    const res = await $fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    spotifyToken = res.access_token
    tokenExpiry = now + res.expires_in * 1000 - 5000 // slightly before expiry
    return spotifyToken
  }

  const getAlbumArt = async (artist: string, track: string): Promise<string | null> => {
    if (!artist || !track) return null

    try {
      const token = await getSpotifyToken()

      const query = encodeURIComponent(`track:${track} artist:${artist}`)
      const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`

      const data = await $fetch<any>(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const trackItem = data.tracks?.items?.[0]
      if (trackItem && trackItem.album?.images?.length) {
        // Return largest image
        return trackItem.album.images[0].url
      }

      return null
    } catch (err) {
      console.error('Spotify album art fetch error:', err)
      return null
    }
  }

  return { getAlbumArt }
}
