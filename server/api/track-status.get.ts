// server/api/track-status.get.ts
import { useAlbumArt } from '~/composables/useAlbumArt'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const playlist = 'http://scratch-radio.ca:8000/status-json.xsl'
  const res = await fetch(playlist)
  if (!res.ok) throw new Error('Failed to fetch radio status')
  const data = await res.json()

  const currentTitle = data.icestats?.source?.title || ''
  const [title, artist] = currentTitle.split(/\s*-\s*/)
  let art: string | null = null

  if (title && artist) {
    const { getAlbumArt } = useAlbumArt()
    art = await getAlbumArt(artist, title)
  }

  return {
    title: title || null,
    artist: artist || null,
    art
  }
})
