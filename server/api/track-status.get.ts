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

  return { artist: '', title: rawTitle.trim() }
}

const scoreTrack = (track: any, artist: string, title: string) => {
  const targetArtist = normalize(artist)
  const targetTitle = normalize(title)
  const trackArtist = normalize(track?.artistName || '')
  const trackTitle = normalize(track?.trackName || track?.collectionName || '')
  const genre = normalize(track?.primaryGenreName || '')
  console.log(trackArtist)

  let score = 0
  if (trackArtist === targetArtist) score += 3
  else if (trackArtist.includes(targetArtist) || targetArtist.includes(trackArtist)) score += 2

  if (trackTitle === targetTitle) score += 3
  else if (trackTitle.includes(targetTitle) || targetTitle.includes(trackTitle)) score += 2

  if (trackArtist && trackTitle && score >= 4) score += 1

  const reggaeGenres = ['reggae', 'ska', 'rocksteady', 'dub']
  if (reggaeGenres.some(genreKey => genre.includes(genreKey))) score += 0.5

  return score
}

const fetchItunesJson = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)
  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new Error(`iTunes HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const isJsonLike =
    contentType.includes('application/json') ||
    contentType.includes('text/javascript') ||
    contentType.includes('application/javascript')
  if (!isJsonLike) {
    throw new Error(`iTunes unexpected content-type: ${contentType}`)
  }

  return response.json()
}

const pickBestArtist = (results: any[], artist: string) => {
  const target = normalize(artist)
  let best = results[0]
  let bestScore = -1

  for (const candidate of results) {
    const candidateName = normalize(candidate?.artistName || '')
    let score = 0
    if (candidateName === target) score += 3
    else if (candidateName.includes(target) || target.includes(candidateName)) score += 2
    if (candidate?.artistId) score += 0.5
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }

  return best
}

export default defineEventHandler(async () => {
  const radioStatusUrl = 'http://scratch-radio.ca:8000/status-json.xsl'
  const now = Date.now()

  try {
    const statusRes = await $fetch<{ icestats?: { source?: { title?: string, artist?: string } } }>(radioStatusUrl)
    const source = statusRes.icestats?.source
    const rawArtist = source?.artist?.trim() || ''
    const rawTitle = source?.title?.trim() || ''

    const { artist, title } = rawArtist
      ? { artist: rawArtist, title: rawTitle }
      : splitArtistTitle(rawTitle)

    if (!title || !artist) return { title: title || '', artist: artist || '', art: null }

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
        limit: '25'
      })

      const url = 'https://itunes.apple.com/search?' + params.toString()
      const searchRes = await fetchItunesJson(url)

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

      if (!art) {
        const artistParams = new URLSearchParams({
          term: artist,
          media: 'music',
          entity: 'musicArtist',
          limit: '10'
        })
        const artistUrl = 'https://itunes.apple.com/search?' + artistParams.toString()
        const artistRes = await fetchItunesJson(artistUrl)

        if (artistRes.results && artistRes.results.length > 0) {
          const bestArtist = pickBestArtist(artistRes.results, artist)
          const artistId = bestArtist?.artistId
          if (artistId) {
            const lookupParams = new URLSearchParams({
              id: String(artistId),
              entity: 'album'
            })
            const lookupUrl = 'https://itunes.apple.com/lookup?' + lookupParams.toString()
            const lookupRes = await fetchItunesJson(lookupUrl)
            const albums = Array.isArray(lookupRes?.results) ? lookupRes.results : []
            const albumWithArt = albums.find((item: any) => item?.artworkUrl100 || item?.artworkUrl60)
            if (albumWithArt) {
              const foundArt = albumWithArt.artworkUrl100 || albumWithArt.artworkUrl60
              if (foundArt) {
                art = foundArt.replace(/\d+x\d+bb/, '600x600bb')
              }
            }
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
