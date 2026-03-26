<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import PlayRoundedIcon from "../components/icons/PlayRoundedIcon.vue"
import PauseRoundedIcon from "../components/icons/PauseRoundedIcon.vue"
import DotsHorizontalIcon from "./icons/DotsHorizontalIcon.vue"
import AudioProgress from "./ui/AudioProgress.vue"

const { isPlaying, play, pause, volume, setVolume, elapsedTime, song, fetchScratchRadio } = useRadio()

const waveformHeights = computed(() => {
  const bars = 45 // Fewer bars for more horizontal space
  const maxHeight = 34

  return Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1)

    // 1. THE ENVELOPE: Smooth single bunch
    // x * (1 - x) is the base parabola; pow(1.1) keeps it graceful
    const envelope = Math.pow(x * (1 - x), 1.1) * 5.0

    // 2. THE RHYTHM: Subtle "teeth" so it's not a perfectly flat curve
    const pulseFrequency = 8
    const rhythm = 0.75 + Math.pow(Math.abs(Math.cos(x * pulseFrequency)), 2) * 0.25

    // 3. NOISE: Organic variation
    const noise = 0.8 + Math.random() * 0.4

    let amplitude = envelope * rhythm * noise

    // 4. THE FLOOR: 5px minimum
    const finalHeight = Math.max(5, amplitude * maxHeight)
    
    return finalHeight
  })
})

const hovered = ref(false)
// const liked = ref(false)
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

const maxTime = ref(360)
const progressWidth = computed(() => `${(elapsedTime.value / maxTime.value) * 360}`)
const handleSeek = (event: any) => {
	const rect = event.currentTarget.getBoundingClientRect()
	const x = event.clientX - rect.left
	const percentage = x / rect.width
	emit("seek", percentage * maxTime.value)
}
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
		<div class="relative flex w-full max-w-[393px] flex-col items-stretch overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-abyssal/80 se:max-h-[calc(100vh-40px)] h-[603px]">
			<!--colorMode-->
			<div class="flex h-16 w-full items-center justify-between px-4">
				<button><ColorModeToggle /></button>
				<div class="w-48"><p class="text-center text-xs">Now Playing</p></div>
				<button @click="toggleFaves"><PlaylistIcon /></button>
			</div>
			<!--album art-->
			<div class="relative flex aspect-auto h-64 w-full flex-col justify-center">
				<Transition name="fade-slow" appear>
					<NuxtImg v-if="song.art && songArtLoaded" :src="song.art" provider="ipx" class="absolute inset-0 mx-auto my-auto h-48 w-48 rounded-2xl object-cover object-center shadow-2xl shadow-abyssal/80 transition-opacity duration-500" />
				</Transition>
				<img v-if="song.art" :src="song.art" @load="songArtLoaded = true" class="invisible absolute size-0" />
				<div v-if="!song.art || (song.art && !songArtLoaded)" class="absolute inset-0 mx-auto my-auto flex h-48 w-48 items-center justify-center rounded-xl shadow-2xl transition-opacity duration-300" :class="{ 'opacity-0': songArtLoaded }" style="background: linear-gradient(135deg, #ff6b35 0%, #ff8e53 50%, #ffb849 100%)">
					<span class="text-6xl font-bold text-white/90">♪</span>
				</div>
			</div>
			<!--title and favorites-->
			<div class="grid min-h-8 w-full grid-cols-[2rem_1fr_2rem] items-center px-4">
				<div class="flex h-8 items-center justify-center">
					<div @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" class="flex items-center justify-center text-abyssal transition-colors duration-200 hover:cursor-pointer hover:text-red-600 dark:text-palladian">
						<Transition name="fade" mode="out-in">
							<PrimeHeartFilled :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" class="size-5 transition-colors duration-200" :class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''" />
						</Transition>
					</div>
				</div>
				<div class="flex h-8 flex-col items-center justify-center gap-1 text-center">
					<p class="text-sm font-medium">{{ song.title }}</p>
				</div>
				<div class="flex h-8 items-center justify-center">
					<span class="font-mono text-[12px] tabular-nums">{{ formattedElapsed }}</span>
					<!--<button @click="toggleFaves"><DotsHorizontalIcon class="size-6" /></button>-->
				</div>
			</div>
			<p class="text-[11px] uppercase opacity-70 text-center">{{ song.artist }}</p>
			<!--progress and play/pause-->
			<div class="relative min-h-32 w-full max-w-[520px] flex-1 overflow-hidden pt-8">
				<div class="flex h-full w-full flex-col justify-center">
					<!--progressbar-->
					<div class="flex w-full items-center justify-between gap-4 px-4">
						<AudioWaveform :progress-width="progressWidth" :waveform-heights="waveformHeights" :active="isPlaying" />
					</div>
					<!--play/pause-->
					<div class="mt-auto flex w-full flex-1 items-center justify-center gap-8 px-4">
						<div class="flex cursor-pointer items-center justify-center opacity-40">
							<SkipPrevious />
							<!--<Transition name="fade" mode="out-in">
								<AudioLines :key="isPlaying ? 'muted' : 'active'" :active="isPlaying" class="transition-colors duration-200" />
							</Transition>-->
						</div>
						<div class="flex cursor-pointer items-center justify-center">
							<Transition name="fade" mode="out-in">
								<component :is="isPlaying ? PauseRoundedIcon : PlayRoundedIcon" :key="isPlaying ? 'pause' : 'play'" class="flex h-16 w-16 items-center justify-center text-abyssal transition-colors duration-200 hover:text-ember dark:text-palladian" @click="isPlaying ? pause() : play()" />
							</Transition>
						</div>
						<div class="flex cursor-pointer items-center justify-center opacity-40">
							<SkipNext />
						</div>
					</div>
				</div>
			</div>
			<!--favoritesList-->
			<Transition name="slide-horizontal">
				<div v-if="showFavorites" class="absolute inset-0 z-50 flex flex-col overflow-auto bg-white dark:bg-abyssal">
					<div v-if="displayFavorites.length > 0" class="flex h-full w-full flex-col justify-between">
						<div class="sticky left-0 right-0 top-0 z-30 flex items-start justify-between p-4">
							<div class="flex items-center justify-start gap-2">
								<button @click="toggleFaves">
									<FileStackIcon />
								</button>
								<p>Favorites</p>
							</div>
							<button @click="downloadFavorites" class="flex items-center justify-center p-2">
								<DownloadIcon />
							</button>
						</div>
						<ul class="flex flex-1 flex-col gap-1 overflow-auto px-2">
							<li v-for="(s, i) in displayFavorites" :key="i" class="grid grid-cols-[48px_40px_auto_24px] items-center gap-2 py-2 pr-2 text-[11px]">
								<span class="flex items-start justify-center opacity-60">0{{ i + 1 }}.</span>
								<div class="size-10 flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
									<img v-if="s.art" :src="s.art" alt="art" class="h-full w-full object-cover" />
									<div v-else class="flex h-full w-full items-center justify-center opacity-20">
										<Icon name="mdi:music" />
									</div>
								</div>
								<span class="flex flex-col items-start justify-center truncate text-xs">
									<span class="block w-full truncate font-semibold leading-3">{{ s.title }}</span>
									<span class="w-full truncate opacity-60 dark:opacity-90">{{ s.artist }}</span>
								</span>
								<DeleteIcon @click="removeFromFavorites(s)" class="cursor-pointer opacity-40 hover:text-red-500 hover:opacity-100" />
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
.waveform-container {
	width: 300px;
	height: 40px;
	position: relative;
}

.waveform-svg {
	width: 100%;
	height: 100%;
	cursor: pointer;
	transition: opacity 0.2s ease;
}

.waveform-svg:hover {
	opacity: 0.9;
}

.waveform-bg rect {
	transition: fill 0.3s ease;
}

.waveform-svg:hover .waveform-bg rect {
	fill: #5a6578;
}

.fade-slow-enter-active,
.fade-slow-leave-active {
	transition: opacity 1s ease;
}

.fade-slow-enter-from,
.fade-slow-leave-to {
	opacity: 0;
}
</style>
