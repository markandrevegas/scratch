import { ref } from 'vue'

export function useRadio() {
  const status = ref(null)
  const error = ref(null)
  const loading = ref(false)

  // Keep an actual Audio instance for playback
  const audioUrl = 'http://scratch-radio.ca:8000/stream'
  const audioPlayer = ref(null)
  const isPlaying = ref(false)

  const playlistUrl = 'http://scratch-radio.ca:8000/status-json.xsl'

  // Setup audio instance
  const setupAudio = () => {
    if (!audioPlayer.value) {
      audioPlayer.value = new Audio(audioUrl)
      audioPlayer.value.preload = 'none'
      audioPlayer.value.crossOrigin = 'anonymous'
    }
  }

  // Play audio (must be triggered by a click)
  const play = async () => {
    if (!audioPlayer.value) setupAudio()
    try {
      await audioPlayer.value.play()
      isPlaying.value = true
    } catch (err) {
      console.error('Playback blocked or failed:', err)
    }
  }

  // Pause audio
  const pause = () => {
    if (audioPlayer.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
    }
  }

  // Fetch playlist/status JSON
  const fetchScratchRadio = async () => {
    loading.value = true
    try {
      const res = await fetch(playlistUrl)
      if (!res.ok) throw new Error('Failed to fetch radio status')
      const data = await res.json()
      status.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    status,
    error,
    loading,
    audioUrl,
    audioPlayer,
    isPlaying,
    setupAudio,
    play,
    pause,
    fetchScratchRadio
  }
}
