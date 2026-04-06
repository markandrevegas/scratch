// server/api/track-status.get.ts
import { defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'

const unsplashAccessKey = process.env.NUXT_UNSPLASH_ACCESS_KEY
const trackCache: Record<string, any> = {}
const CACHE_TTL = 1000 * 60 * 60 * 24

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const splitArtistTitle = (rawTitle: string) => {
  const separators = [' - ', ' – ', ' — ', ' / ', ' | ', ' ~ ']
  for (const sep of separators) {
    const idx = rawTitle.indexOf(sep)
    if (idx > -1) {
      const artist = rawTitle.slice(0, idx).trim()
      const title = rawTitle.slice(idx + sep.length).trim()
      return { artist, title }
    }
  }

  const parts = rawTitle.split(/\s*-\s*/)
  if (parts.length > 1) {
    const artist = parts[0]?.trim() || ''
    const title = parts.slice(1).join(' - ').trim()
    return { artist, title }
  }

  const fallback = rawTitle.trim()
  // If we can't split, treat the whole string as artist.
  return { artist: fallback, title: '' }
}

const scoreTrack = (track: any, artist: string, title: string) => {
  const targetArtist = normalize(artist)
  const targetTitle = normalize(title)
  const trackArtist = normalize(track?.artistName || '')
  const trackTitle = normalize(track?.trackName || track?.collectionName || '')
  const genre = normalize(track?.primaryGenreName || '')

  let score = 0
  if (trackArtist === targetArtist) score += 3
  else if (trackArtist.includes(targetArtist) || targetArtist.includes(trackArtist)) score += 2

  if (targetTitle) {
    if (trackTitle === targetTitle) score += 3
    else if (trackTitle.includes(targetTitle) || targetTitle.includes(trackTitle)) score += 2
  }

  if (trackArtist && (trackTitle || !targetTitle) && score >= 4) score += 1

  const reggaeGenres = ['reggae', 'ska', 'rocksteady', 'dub']
  if (reggaeGenres.some(genreKey => genre.includes(genreKey))) score += 0.5

  return score
}

export default defineEventHandler(async () => {
  const radioStatusUrl = 'http://scratch-radio.ca:8000/status-json.xsl'
  const now = Date.now()

  try {
    const statusRes = await $fetch<{ icestats?: { source?: { title?: string } } }>(radioStatusUrl)
    const currentTitle = statusRes.icestats?.source?.title || ''
    const { artist, title } = splitArtistTitle(currentTitle)

    if (!artist) return { title: title || '', artist: artist || '', art: null }

    const trackKey = `${artist}-${title}`.toLowerCase()
    let art: string | null = null
    const cached = trackCache[trackKey]
    if (cached?.art && (now - cached.timestamp) < CACHE_TTL) {
      return cached
    }

    // we try itunes for album art
    try {
      const searchTerm = `${artist} ${title}`.trim()
      
      const params = new URLSearchParams({
        term: searchTerm,
        media: 'music',
        entity: 'musicTrack',
        limit: '20',
        country: 'US'
      })

      const url = 'https://itunes.apple.com/search?' + params.toString()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`iTunes HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`iTunes unexpected content-type: ${contentType}`)
      }

      const searchRes = await response.json()

      if (searchRes.results && searchRes.results.length > 0) {
        let bestTrack = searchRes.results[0]
        let bestScore = -1

        for (const candidate of searchRes.results) {
          const candidateScore = scoreTrack(candidate, artist, title)
          if (candidateScore > bestScore) {
            bestScore = candidateScore
            bestTrack = candidate
          }
        }
        
        if (bestTrack) {
          const foundArt =
            bestTrack.artworkUrl100 ||
            bestTrack.artworkUrl60 ||
            bestTrack.artworkUrl30
          if (foundArt) {
            art = foundArt.replace(/\d+x\d+bb/, '600x600bb')
            // console.log('art found')
          }
        }
      }
    } catch (e: any) {
      console.error('iTunes Error:', e.message)
    }

    // if no itunes art cache then return
    if (art) {
      const trackData = { artist, title, art, timestamp: now }
      trackCache[trackKey] = trackData
      return trackData
    }

    // if no unsplash in cache then fetch one
    if (unsplashAccessKey) {
      try {
        const unsplashRes = await $fetch<any>('https://api.unsplash.com/photos/random', {
          params: {
            query: '70s reggae concert',
            orientation: 'squarish',
            count: 1,
            client_id: unsplashAccessKey
          },
          timeout: 5000
        })

        const imageData = Array.isArray(unsplashRes) ? unsplashRes[0] : unsplashRes
        if (imageData?.urls?.regular) {
          art = imageData.urls.regular + '&auto=format&fit=crop&w=600&h=600&q=80'
          // console.log('unsplash fallback used (will be cached)')
        }
      } catch (e: any) {
        console.error('unsplash error here:', e.message)
      }
    }

    // Ccache what we get from unsplash
    const trackData = { artist, title, art, timestamp: now }
    trackCache[trackKey] = trackData
    return trackData

  } catch (err) {
    console.error('Global error:', err)
    return { title: '', artist: '', art: null }
  }
})
