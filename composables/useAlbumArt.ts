export function useAlbumArt() {
  const config = useRuntimeConfig()

  const getAlbumArt = async (artist: string, track: string) => {
    if (!artist || !track) return null

    try {
      const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${config.public.lastfmApiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`

      const data = await $fetch<any>(url)

      // Try to grab album image if available
      const images = data?.track?.album?.image
      if (images && images.length > 0) {
        // Last.fm usually has small, medium, large, extralarge
        return images.find((img: any) => img.size === 'extralarge')?.['#text'] || images.pop()['#text']
      }

      return null
    } catch (err) {
      console.error('Error fetching album art:', err)
      return null
    }
  }

  return { getAlbumArt }
}
