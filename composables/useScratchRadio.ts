import { ref, onMounted, onUnmounted } from 'vue'
// import { useAlbumArt } from './useAlbumArt'

export function useRadio() {

  const song = ref({ title: '', artist: '', art: null as string | null })
  const isPlaying = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const audio = 'http://scratch-radio.ca:8000/stream'
  const audioPlayer = ref<HTMLAudioElement | null>(null)
  let statusInterval: number | null = null

  const setupAudio = () => {
    if (!audioPlayer.value) {
      audioPlayer.value = new Audio(audio)
      audioPlayer.value.preload = 'none'
      audioPlayer.value.crossOrigin = 'anonymous'

      audioPlayer.value.addEventListener('playing', () => isPlaying.value = true)
      audioPlayer.value.addEventListener('pause', () => isPlaying.value = false)
    }
  }

  const play = async () => {
    if (!audioPlayer.value) setupAudio()
    try {
      await audioPlayer.value?.play()
    } catch (err) {
      console.error('Playback blocked or failed:', err)
    }
  }

  const pause = () => {
    if (audioPlayer.value) audioPlayer.value.pause()
  }

  // ← Replace your old fetchScratchRadio with this:
  const fetchScratchRadio = async () => {
    loading.value = true
    try {
      // const data = await $fetch<TrackStatus>('/api/track-status')
      const data = await $fetch<{ title: string; artist: string; art: string | null }>('/api/track-status')
      song.value.title = data.title || ''
      song.value.artist = data.artist || ''
      song.value.art = data.art
      console.log(song.value)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      song.value.art = null
    } finally {
      loading.value = false
    }
  }

  const startStatusUpdates = () => {
    fetchScratchRadio()
    statusInterval = window.setInterval(fetchScratchRadio, 5000)
  }

  const stopStatusUpdates = () => {
    if (statusInterval !== null) clearInterval(statusInterval)
  }

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

  return { song, isPlaying, play, pause, fetchScratchRadio }

}
