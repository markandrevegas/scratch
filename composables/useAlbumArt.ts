// composables/useAlbumArt.ts
// import { useRuntimeConfig } from '#app'

// Spotify token caching
let spotifyToken: string | null = null
let tokenExpiry: number | null = null

interface SpotifyAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface SpotifyAlbum {
  images: SpotifyImage[]
}

interface SpotifyTrack {
  album: SpotifyAlbum
}

interface SpotifyTracksResponse {
  tracks: {
    items: SpotifyTrack[]
  }
}

export function useAlbumArt() {
  const config = useRuntimeConfig()

  // Server-only: fetch Spotify token
  const getSpotifyToken = async (): Promise<string> => {
    const now = Date.now()
    if (spotifyToken && tokenExpiry && now < tokenExpiry) return spotifyToken

    // Ensure we are server-side
    if (!import.meta.server) {
      throw new Error('Spotify token fetch must be done server-side')
    }

    // btoa works in server context via Buffer
    const authString = Buffer.from(
      `${config.spotifyClientId}:${config.spotifyClientSecret}`
    ).toString('base64')

    const res = await $fetch<SpotifyAuthResponse>('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    spotifyToken = res.access_token
    tokenExpiry = now + res.expires_in * 1000 - 5000
    return spotifyToken
  }

  // Fetch album art for a given artist + track
  const getAlbumArt = async (artist: string, track: string): Promise<string | null> => {
    if (!artist || !track) return null

    try {
      const token = await getSpotifyToken()

      const query = encodeURIComponent(`track:${track} artist:${artist}`)
      const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`

      const data = await $fetch<SpotifyTracksResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const trackItem = data.tracks?.items?.[0]
      return trackItem?.album?.images?.[0]?.url ?? null
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Spotify album art fetch error:', err.message)
      } else {
        console.error('Spotify album art fetch error:', String(err))
      }
      return null
    }
  }

  return { getAlbumArt }
}
