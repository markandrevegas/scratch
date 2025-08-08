import { ref, onMounted, onUnmounted } from 'vue'

export function useRadio() {
  const status = ref(null)
  const error = ref(null)
  const loading = ref(false)

  // Keep an actual Audio instance for playback
  const audio = 'http://scratch-radio.ca:8000/stream'
  const playlist = 'http://scratch-radio.ca:8000/status-json.xsl'

  const audioPlayer = ref(null)
  const isPlaying = ref(false)

  const song = ref({ title: '', artist: '' })

  let statusInterval = null
  let lastTitle = null

  // Create audio instance
  const setupAudio = () => {
    if (!audioPlayer.value) {
      audioPlayer.value = new Audio(audio)
      audioPlayer.value.preload = 'none'
      audioPlayer.value.crossOrigin = 'anonymous'

      // Keep isPlaying in sync with actual player
      audioPlayer.value.addEventListener('playing', () => {
        isPlaying.value = true
      })
      audioPlayer.value.addEventListener('pause', () => {
        isPlaying.value = false
      })
    }
  }

  // Play
  const play = async () => {
    if (!audioPlayer.value) setupAudio()
    try {
      await audioPlayer.value.play()
    } catch (err) {
      console.error('Playback blocked or failed:', err)
    }
  }

  // Pause
  const pause = () => {
    if (audioPlayer.value) {
      audioPlayer.value.pause()
    }
  }

  const fetchScratchRadio = async () => {
    loading.value = true
    try {
      const res = await fetch(playlist)
      if (!res.ok) throw new Error('Failed to fetch radio status')
      const data = await res.json()
      status.value = data

      const currentTitle = data.icestats?.source?.title || ''
      if (lastTitle && currentTitle !== lastTitle) {
        console.log('Track changed:', currentTitle)
      }
      lastTitle = currentTitle
      // Split into title and artist
      const [titlePart, artistPart] = currentTitle.split(/\s*-\s*/)
      song.value.title = titlePart || ''
      song.value.artist = artistPart || ''
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Start auto-refresh
  const startStatusUpdates = () => {
    fetchScratchRadio()
    statusInterval = setInterval(fetchScratchRadio, 5000)
  }

  const stopStatusUpdates = () => {
    if (statusInterval) clearInterval(statusInterval)
  }

  // Lifecycle integration (optional if you call manually in component)
  onMounted(() => {
    setupAudio()
    startStatusUpdates()
  })
  onUnmounted(() => {
    stopStatusUpdates()
    if (audioPlayer.value) {
      audioPlayer.value.pause()
      audioPlayer.value = null
    }
  })

  return {
    status,
    error,
    loading,
    audio,
    audioPlayer,
    isPlaying,
    song,
    setupAudio,
    play,
    pause,
    fetchScratchRadio,
    startStatusUpdates,
    stopStatusUpdates
  }
}
