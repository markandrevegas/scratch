<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import PlayIcon from "../components/icons/PlayIcon.vue"
import PauseIcon from "../components/icons/PauseIcon.vue"
import AudioLines from "../components/icons/AudioLines.vue"

const { isPlaying, play, pause, volume, setVolume, elapsedTime, song, fetchScratchRadio } = useRadio()

const waveformHeights = computed(() => Array.from({ length: 120 }, () => Math.random() * 36 + 12))

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
	<div class="relative flex min-h-screen flex-col px-8 se:justify-center md:px-32">
		<div class="relative flex flex-col-reverse overflow-hidden rounded-lg border border-abyssal/30 bg-white shadow-2xl dark:border-none dark:bg-abyssal/80 dark:text-palladian lg:grid lg:grid-cols-[1fr_288px] landscape:max-h-72">
			<div class="xs:h-72 relative flex flex-col overflow-hidden pb-8 sm:h-72 sm:pb-0">
				<div class="flex items-center justify-between px-2 lg:p-4">
					<button @click="toggleFaves" class="max-w-content scale-75 hover:text-ember"><FileStackIcon /></button>
					<ColorModeToggle class="scale-75 hover:text-ember" />
				</div>
				<div class="relative flex-col sm:top-[-1rem] sm:my-auto sm:items-center sm:justify-center">
					<div class="flex h-full w-full flex-col justify-start gap-2 text-center">
						<div class="flex min-h-12 flex-col gap-1 sm:mb-2">
							<p class="min-w-[20ch] font-medium">
								{{ song.title }}
							</p>
							<p class="min-w-[35ch] text-[11px] uppercase tracking-wider lg:text-[12px]">
								{{ song.artist }}
							</p>
						</div>
						<div class="mx-auto flex w-full max-w-[400px] items-center justify-center gap-3 px-8">
							<progress class="progress-bar h-2 w-full appearance-none overflow-hidden rounded-full border-none bg-abyssal/50" :value="progressWidth" max="360"></progress>
							<span class="min-w-[45px] text-right font-mono text-xs tabular-nums">
								{{ formattedElapsed }}
							</span>
						</div>
						<div class="my-2 flex items-center justify-center gap-16">
							<div class="flex size-10 cursor-pointer items-center justify-center">
								<Transition name="fade" mode="out-in">
									<AudioLines :key="isPlaying ? 'muted' : 'active'" :active="isPlaying" class="transition-colors duration-200" />
								</Transition>
							</div>
							<div class="flex cursor-pointer items-center justify-center">
								<Transition name="fade" mode="out-in">
									<component :is="isPlaying ? PauseIcon : PlayIcon" :key="isPlaying ? 'pause' : 'play'" class="flex items-center justify-center transition-colors duration-200 hover:text-ember" @click="isPlaying ? pause() : play()" />
								</Transition>
							</div>
							<div @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" class="flex items-center justify-center text-abyssal transition-colors duration-200 hover:cursor-pointer hover:text-red-600 dark:text-palladian">
								<Transition name="fade" mode="out-in">
									<PrimeHeartFilled :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" class="size-5 transition-colors duration-200" :class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''" />
								</Transition>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="relative h-[309px] overflow-hidden bg-gray-100 dark:bg-gray-800 sm:h-[510px]">
				<Transition name="fade-slow" appear>
					<NuxtImg v-if="song.art && songArtLoaded" :src="song.art" provider="ipx" class="h-full w-full object-cover transition-transform duration-500 sm:object-center" />
				</Transition>
				<img v-if="song.art" :src="song.art" @load="songArtLoaded = true" class="invisible absolute size-0" />
				<div v-if="!song.art || (song.art && !songArtLoaded)" class="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300" :class="{ 'opacity-0': songArtLoaded }" style="background: linear-gradient(135deg, #ff6b35 0%, #ff8e53 50%, #ffb849 100%)">
					<span class="text-6xl font-bold text-white/90">♪</span>
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
</template>
<style scoped>
.waveform-svg {
	width: 100%;
	height: 100%;
	cursor: pointer;
	transition: opacity 0.2s ease;
}

.waveform-svg:hover {
	opacity: 0.9;
}

.fade-slow-enter-active,
.fade-slow-leave-active {
	transition: opacity 1s ease;
}

.fade-slow-enter-from,
.fade-slow-leave-to {
	opacity: 0;
}
/* Reset default appearance */
.progress-bar {
	-webkit-appearance: none;
	appearance: none;
}

.progress-bar::-webkit-progress-bar {
	height: 4px;
	border-radius: 9999px;
}

/* Foreground (The bar/value) - Chrome, Safari, Edge */
.progress-bar::-webkit-progress-value {
	background: linear-gradient(90deg, #ff6b35 0%, #ffb849 100%);
	border-radius: 9999px;
	transition: width 0.3s ease;
}

/* Foreground (The bar/value) - Firefox */
.progress-bar::-moz-progress-bar {
	background: linear-gradient(90deg, #ff6b35 0%, #ffb849 100%);
	border-radius: 9999px;
}
</style>
