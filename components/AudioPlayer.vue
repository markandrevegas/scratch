<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import PlayIcon from "../components/PlayIcon.vue"
import PauseIcon from "../components/PauseIcon.vue"
import VolumeIcon from "./VolumeIcon.vue"
import AudioLines from "./AudioLines.vue"
import LayersIcon from "./LayersIcon.vue"
import DeleteIcon from "./DeleteIcon.vue"
import DownloadIcon from "./DownloadIcon.vue"

const { isPlaying, play, pause, volume, setVolume, elapsedTime, song, fetchScratchRadio } = useRadio()

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
</script>
<template>
	<div class="flex h-screen">
		<div class="mx-auto my-auto flex w-[24rem] items-center justify-center overflow-hidden rounded-lg">
			<div class="flex aspect-square w-full flex-col rounded-lg bg-abyssal/70 shadow-2xl">
				<div class="relative aspect-square w-full overflow-hidden">
					<div class="absolute left-0 right-0 top-0 z-30 flex items-start justify-between px-2 py-3">
						<div class="flex min-h-[3rem] min-w-max grid-cols-3 gap-2 rounded-full bg-black/50 p-2 text-yellow-50/90">
							<div class="col-span-2 rounded-full bg-black/50 p-2 text-yellow-50/90" @click="toggleFaves">
								<LayersIcon />
							</div>
							<div class="col-span-1 flex flex-col pr-3">
								<p class="text-[12px] font-medium">
									{{ song.artist }}
								</p>
								<p class="relative top-[-2px] text-[11px] font-light">
									{{ song.title }}
								</p>
							</div>
						</div>
						<div class="flex items-start justify-start gap-2">
							<div class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/70" @click="setVolume(volume === 0 ? 1 : 0)">
								<Transition name="fade" mode="out-in">
									<component :is="VolumeIcon" :key="volume === 0 ? 'muted' : 'unmuted'" class="size-5 text-palladian transition-colors duration-200" />
								</Transition>
							</div>
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-200 hover:cursor-pointer">
								<ColorModeToggle />
							</div>
							<div @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-200 hover:cursor-pointer hover:text-red-600">
								<Transition name="fade" mode="out-in">
									<PrimeHeartFilled :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" class="size-5 transition-colors duration-200" :class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''" />
								</Transition>
							</div>
						</div>
					</div>

					<div class="absolute inset-0 z-10 bg-black/10"></div>
					<div class="absolute bottom-[2rem] left-0 right-0 z-30 text-white">
						<!--play + progress + audio-->
						<div class="flex items-center justify-between px-4">
							<div class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/70">
								<Transition name="fade" mode="out-in">
									<component :is="isPlaying ? PauseIcon : PlayIcon" :key="isPlaying ? 'pause' : 'play'" class="flex size-8 items-center justify-center transition-colors duration-200 hover:opacity-80" @click="isPlaying ? pause() : play()" />
								</Transition>
							</div>
							<div class="mx-auto flex h-8 w-auto items-center justify-center gap-4 rounded-full bg-black/50 px-8">
								<progress :value="elapsedTime" max="360" class="progress-bar"></progress>
								<span class="text-xs">{{ formattedElapsed }}</span>
							</div>
							<div class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 transition-colors duration-200">
								<Transition name="fade" mode="out-in">
									<AudioLines :active="isPlaying" />
								</Transition>
							</div>
						</div>
					</div>
					<Transition name="slide-horizontal">
						<div v-if="showFavorites" class="absolute inset-0 z-50 flex flex-col overflow-auto rounded-lg bg-white text-abyssal dark:bg-slate-900 dark:text-yellow-50/90">
							<div v-if="favorites.length > 0" class="flex h-full w-full flex-col justify-between">
								<div class="sticky left-0 right-0 top-0 z-30 flex items-start justify-between px-2 py-3">
									<div class="flex min-h-[3rem] min-w-[12rem] items-start justify-start gap-2 rounded-full bg-black/50 p-2 text-yellow-50/90">
										<div class="rounded-full bg-black/50 p-2 text-yellow-50/90" @click="toggleFaves">
											<LayersIcon />
										</div>
										<div class="flex flex-col">
											<p class="text-[12px] font-medium">Favorites</p>
											<p class="relative top-[-2px] text-[9px] font-light">Hits from the 70s</p>
										</div>
									</div>
									<div class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-yellow-50/90">
										<DownloadIcon @click="downloadFavorites" />
									</div>
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
					<NuxtImg v-if="song.art" :src="song?.art" provider="ipx" class="h-full w-full object-cover object-center transition-transform duration-500" />
				</div>
			</div>
		</div>
	</div>
</template>
