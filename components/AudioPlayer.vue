<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import NowPlaying from "./ui/NowPlaying.vue"
import AlbumArt from "./ui/AlbumArt.vue"
import AlbumTitle from "./ui/AlbumTitle.vue"
import AudioControls from "./ui/AudioControls.vue"

const { isPlaying, play, pause, volume, setVolume, elapsedTime, song, fetchScratchRadio } = useRadio()

const waveformHeights = computed(() => {
  const bars = 45
  const maxHeight = 34

  return Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1)
    const envelope = Math.pow(x * (1 - x), 1.1) * 5.0

    const pulseFrequency = 8
    const rhythm = 0.75 + Math.pow(Math.abs(Math.cos(x * pulseFrequency)), 2) * 0.25

    const noise = 0.8 + Math.random() * 0.4
    let amplitude = envelope * rhythm * noise

    const finalHeight = Math.max(5, amplitude * maxHeight)
    return finalHeight
  })
})

const hovered = ref(false)
const liked = computed({
	get: () => {
		if (!song.value) return false
		return favorites.value.some((s) => s.title === song.value.title && s.artist === song.value.artist && s.liked)
	},
	set: (val: boolean) => {
		if (!song.value) return
		const songInFavorites = favorites.value.find((s) => s.title === song.value.title && s.artist === song.value.artist)
		if (songInFavorites) {
			songInFavorites.liked = val
		} else if (val) {
			// Only add if liking a new song
			favorites.value.push({ ...song.value, liked: true })
		}
		localStorage.setItem("favorites", JSON.stringify(favorites.value))
	}
})

interface Song {
	title: string
	artist: string
	art?: string | null
	liked?: boolean
}
const showFavorites = ref(false)
const favorites = ref<Song[]>([])
// Load favorites and likedSongs from localStorage on mount
if (typeof window !== "undefined") {
	const likedSongs = ref<Song[]>([])
	const stored = localStorage.getItem("favorites")
	if (stored) favorites.value = JSON.parse(stored)
	const storedLiked = localStorage.getItem("likedSongs")
	if (storedLiked) likedSongs.value = JSON.parse(storedLiked)
}
// add song to favorites
const copySong = async () => {
	try {
		// Check if navigator and navigator.clipboard exist before trying to use them
		if (navigator && navigator.clipboard) {
			await navigator.clipboard.writeText(song.value.title + "-" + song.value.artist)
		} else {
			// Provide a fallback or log a message if clipboard access isn't available
			console.warn("Clipboard API not available. Skipping copy operation.")
		}

		// Find the song in favorites
		let favSong = favorites.value.find((s) => s.title === song.value.title && s.artist === song.value.artist)
		if (!favSong) {
			// Add new song
			favSong = { ...song.value, liked: true }
			favorites.value.push(favSong)
		} else {
			// Mark existing song as liked
			favSong.liked = true
		}

		if (typeof window !== "undefined") {
			localStorage.setItem("favorites", JSON.stringify(favorites.value))
		}
	} catch (err) {
		console.error("Failed to copy:", err)
	}
}
// remove from favorites
const removeFromFavorites = (targetSong: Song) => {
	if (!targetSong) return

	// Find the index of the song in favorites
	const index = favorites.value.findIndex((s) => s.title === targetSong.title && s.artist === targetSong.artist)

	if (index !== -1) {
		favorites.value.splice(index, 1) // remove it
		if (typeof window !== "undefined") {
			localStorage.setItem("favorites", JSON.stringify(favorites.value))
		}

		// If the current song matches the removed one, update liked state
		if (song.value && song.value.title === targetSong.title && song.value.artist === targetSong.artist) {
			liked.value = false
		}
	}
}
const downloadFavorites = () => {
	try {
		const favoritesData = localStorage.getItem("favorites")
		if (!favoritesData) {
			console.warn("No favorites found in localStorage.")
			return
		}
		const jsonBlob = new Blob([JSON.stringify(JSON.parse(favoritesData), null, 2)], {
			type: "application/json"
		})
		const url = URL.createObjectURL(jsonBlob)
		const a = document.createElement("a")
		a.href = url
		a.download = "favorites.json"
		a.click()
		URL.revokeObjectURL(url)
	} catch (err) {
		console.error("Failed to download favorites:", err)
	}
}
// see favoritesList
const toggleFaves = () => {
	showFavorites.value = !showFavorites.value
}
watch(song, async (newSong, oldSong) => {
	liked.value = !!favorites.value.find((s) => s.title === newSong.title && s.artist === newSong.artist && s.liked)
	if (newSong && oldSong && newSong.title === oldSong.title && newSong.artist === oldSong.artist) {
		return
	}
})
watch(
	favorites,
	(newVal) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("favorites", JSON.stringify(newVal))
		}
	},
	{ deep: true }
)

const formattedElapsed = computed(() => {
	const totalSeconds = elapsedTime.value || 0
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	const paddedSeconds = seconds.toString().padStart(2, "0")
	return `${minutes}:${paddedSeconds}`
})

onMounted(async () => {
	fetchScratchRadio()
	if (song.value) {
		liked.value = !!favorites.value.find((s) => s.title === song.value.title && s.artist === song.value.artist && s.liked)
	}
})

const maxTime = ref(600)
const progressWidth = computed(() => `${(elapsedTime.value / maxTime.value) * 360}`)
const emit = defineEmits(["seek"])

const songArtLoaded = ref(false)
watch(
	() => song.value?.art,
	() => {
		songArtLoaded.value = false
	}
)
const displayFavorites = computed(() => {
	return [...favorites.value].reverse()
})
</script>
<template>
	<div class="flex flex-col justify-center h-screen bg-gray-100 p-8 dark:bg-gray-900">
		<div class="relative flex w-full max-w-[393px] mx-auto flex-col items-stretch overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-abyssal/80 h-[616px]">
			<!--colorMode-->
			<NowPlaying @toggle-faves="toggleFaves" />
			<!--album art-->
			<AlbumArt :song-art="song.art" :song-art-loaded="songArtLoaded" @art-loaded="songArtLoaded = true" />
			<!--title and favorites-->
			<AlbumTitle :hovered="hovered" :liked="liked" :title="song.title" :formatted-elapsed="formattedElapsed" :artist="song.artist" @hover="hovered = $event" @copy-song="copySong" />
			<!--progress and play/pause-->
			<div class="relative w-full max-w-[520px] flex-1 overflow-hidden pt-8">
				<div class="flex h-full w-full flex-col justify-center">
					<!--progressbar-->
					<AudioWaveform :progress-width="progressWidth" :waveform-heights="waveformHeights" :active="isPlaying" />
					<!--play/pause-->
					<AudioControls :is-playing="isPlaying" @toggle-play="isPlaying ? pause() : play()" />
				</div>
			</div>
			<!--favoritesList-->
			<Transition name="slide-horizontal">
				<div v-if="showFavorites" class="absolute inset-0 z-50 flex flex-col overflow-auto bg-white dark:bg-abyssal">
					<div v-if="displayFavorites.length > 0" class="flex h-full w-full flex-col justify-between">
						<div class="sticky left-0 right-0 top-0 z-30 flex items-start justify-between p-4">
							<div class="flex items-center justify-start gap-2">
								<p class="text-sm">Favorites</p>
								<button @click="downloadFavorites" class="flex items-center justify-center p-2">
								<DownloadIcon />
							</button>
							</div>
							<button @click="toggleFaves">
								<XIcon class="scale-75" />
							</button>
						</div>
						<ul class="flex flex-1 flex-col gap-1 overflow-auto px-4">
							<li v-for="(s, i) in displayFavorites" :key="i" class="grid grid-cols-[40px_auto_24px] items-start gap-2 py-2 text-[11px]">
								<div class="flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
									<img v-if="s.art" :src="s.art" alt="art" class="h-full w-full object-cover" />
									<div v-else class="flex h-full w-full items-center justify-center opacity-20">
										<Icon name="mdi:music" />
									</div>
								</div>
								<span class="flex flex-col gap-1 items-start justify-center truncate text-sm pt-1 pl-2">
									<span class="block w-full truncate font-medium leading-3">{{ s.title }}</span>
									<span class="w-full text-xs font-light truncate dark:opacity-90">{{ s.artist }}</span>
								</span>
								<DeleteIcon @click="removeFromFavorites(s)" class="cursor-pointer hover:text-red-500 scale-75" />
							</li>
						</ul>
					</div>
					<div v-else class="flex flex-1 flex-col items-center justify-center gap-2" @click="toggleFaves">
						<Icon name="mdi-light:heart-off" class="size-8" />
						<p class="w-1/2 text-center text-[11px] font-light leading-4">Like the song to add to your playlist</p>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>
<style scoped>


</style>
