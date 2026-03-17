<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import PlayIcon from "../components/PlayIcon.vue"
import PauseIcon from "../components/PauseIcon.vue"
import VolumeIcon from "./VolumeIcon.vue"
import LayersIcon from "./LayersIcon.vue"
import DeleteIcon from "./DeleteIcon.vue"
import DownloadIcon from "./DownloadIcon.vue"
import FileStackIcon from "./FileStackIcon.vue"

const { isPlaying, play, pause, volume, setVolume, elapsedTime, song, fetchScratchRadio } = useRadio()

const waveformHeights = computed(() => 
  Array.from({ length: 120 }, () => Math.random() * 36 + 12)
)

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
	console.log(song.value.title)
})

const maxTime = ref(360)
const progressWidth = computed(() => 
  `${(elapsedTime.value / maxTime.value) * 360}`
)
const handleSeek = (event: any) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = x / rect.width
  emit('seek', percentage * maxTime.value)
}
const emit = defineEmits(['seek'])
</script>
<template>
	<div class="flex h-screen flex-col">
		<div class="mx-auto mt-48 flex w-2/5 flex-col gap-4">
			<span class="mx-auto my-auto block text-center text-xs font-light uppercase tracking-widest">Now Playing</span>
			<div class="relative flex max-h-72 items-stretch overflow-hidden rounded-lg border border-slate-100 bg-white shadow-2xl dark:border-none dark:bg-abyssal/80 dark:text-palladian">
				<div class="relative flex flex-1 overflow-hidden flex-col">
					<div class="flex items-center justify-between p-4">
						<button @click="toggleFaves" class="max-w-content hover:text-ember"><FileStackIcon /></button>
						<ColorModeToggle class="hover:text-ember" />
					</div>
					<div class="flex-1 relative">
						<div class="flex w-full h-full flex-col text-center gap-6">
							<div class="flex flex-col gap-2 min-h-16">
								<p class="text-xl font-medium min-w-[20ch]">
									{{ song.title }}
								</p>
								<p class="text-xs uppercase tracking-wider min-w-[35ch]">
									{{ song.artist }}
								</p>
							</div>
							<div class="mx-auto flex w-auto items-center justify-center gap-4 px-8">
								<div class="waveform-container" @click="handleSeek">
									<svg class="waveform-svg" viewBox="0 0 360 48" preserveAspectRatio="none">
										<!-- Background waveform -->
										<g class="waveform-bg">
											<rect v-for="(height, i) in waveformHeights" 
														:key="`bg-${i}`"
														:x="i * 3" 
														:y="(48 - height) / 2" 
														width="2" 
														:height="height"
														rx="1"
														fill="#2A3441" />
										</g>
										
										<!-- Progress mask -->
										<defs>
											<clipPath id="progress-clip">
												<rect :width="progressWidth" height="48" />
											</clipPath>
											<linearGradient id="waveform-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
												<stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
												<stop offset="100%" style="stop-color:#FFB849;stop-opacity:1" />
											</linearGradient>
										</defs>
										
										<!-- Foreground waveform with gradient -->
										<g clip-path="url(#progress-clip)">
											<rect v-for="(height, i) in waveformHeights" 
														:key="`fg-${i}`"
														:x="i * 3" 
														:y="(48 - height) / 2" 
														width="2" 
														:height="height"
														rx="1"
														fill="url(#waveform-gradient)" />
										</g>
									</svg>
								</div>
								<span class="font-mono text-xs tabular-nums text-muted">{{ formattedElapsed }}</span>
							</div>
							<div class="flex items-center justify-center gap-16">
								<div class="flex cursor-pointer items-center justify-center" @click="setVolume(volume === 0 ? 1 : 0)">
									<Transition name="fade" mode="out-in">
										<component :is="VolumeIcon" :key="volume === 0 ? 'muted' : 'unmuted'" class="size-5 transition-colors duration-200" />
									</Transition>
								</div>
								<div class="flex cursor-pointer items-center justify-center">
									<Transition name="fade" mode="out-in">
										<component :is="isPlaying ? PauseIcon : PlayIcon" :key="isPlaying ? 'pause' : 'play'" class="flex size-10 items-center justify-center transition-colors duration-200 hover:text-ember" @click="isPlaying ? pause() : play()" />
									</Transition>
								</div>
								<div @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" class="flex items-center justify-center text-abyssal dark:text-palladian transition-colors duration-200 hover:cursor-pointer hover:text-red-600">
									<Transition name="fade" mode="out-in">
										<PrimeHeartFilled :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" class="size-5 transition-colors duration-200" :class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''" />
									</Transition>
								</div>
							</div>
						</div>
					</div>
					<!--favoritesList-->
					<Transition name="slide-horizontal">
						<div v-if="showFavorites" class="absolute inset-0 z-50 flex flex-col overflow-auto bg-white dark:bg-abyssal">
							<div v-if="favorites.length > 0" class="flex h-full w-full flex-col justify-between">
								<div class="sticky left-0 right-0 top-0 z-30 flex items-start justify-between p-4">
									<div class="flex items-center justify-start gap-2">
										<button @click="toggleFaves">
											<FileStackIcon />
										</button>
										<p>Favorites</p>
									</div>
									<button @click="downloadFavorites" class="flex justify-center items-center p-2">
										<DownloadIcon />
									</button>
								</div>
								<ul class="flex flex-1 flex-col gap-1 overflow-auto px-2">
									<li v-for="(s, i) in favorites" :key="i" class="grid grid-cols-[48px_auto_24px] items-start py-2 pr-2 text-[11px]">
										<span class="flex items-start justify-center opacity-60">0{{ i + 1 }}.</span>
										<span class="inline-block flex-col items-start justify-center text-xs">
											<span class="block font-semibold leading-3">{{ s.title }}</span>
											<span class="opacity-60 dark:opacity-90">{{ s.artist }}</span>
										</span>
										<DeleteIcon @click="removeFromFavorites(s)" class="opacity-40 hover:text-abyssal hover:opacity-100" />
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
				<div class="h-72 w-72">
					<NuxtImg v-if="song.art" :src="song?.art" provider="ipx" class="min-h-72 min-w-72 object-cover transition-transform duration-500" />
					<div v-else class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 50%, #FFB849 100%)">
						<span class="text-6xl font-bold text-white/90">♪</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style>
.waveform-container {
	width: 300px;
	height: 30px;
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
</style>
