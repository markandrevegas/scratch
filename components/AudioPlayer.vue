<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"

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
// Load favorites from localStorage on mount
if (typeof window !== "undefined") {
	const stored = localStorage.getItem("favorites")
	if (stored) favorites.value = JSON.parse(stored)
}
// Load liked songs from localStorage
const likedSongs = ref<Song[]>([])
if (typeof window !== "undefined") {
	const storedLiked = localStorage.getItem("likedSongs")
	if (storedLiked) likedSongs.value = JSON.parse(storedLiked)
}

// add song to favorites
const copySong = async () => {
	try {
		// Check if navigator and navigator.clipboard exist before trying to use them
		if (navigator && navigator.clipboard) {
			await navigator.clipboard.writeText(`${song.value.title} - ${song.value.artist}`)
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
			type: "application/json",
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
	<div class="mx-auto flex h-screen flex-col justify-center sm:w-4/5">
		<div class="relative mx-auto flex h-36 w-full overflow-visible rounded-lg bg-white shadow-lg dark:bg-slate-800 sm:w-4/5 md:w-3/5 xl:w-2/5">
			<div class="flex h-full w-[64px] flex-col items-center justify-between rounded-l-lg py-4">
				<div>
					<Icon name="jam:menu" class="size-6" @click="toggleFaves" />
				</div>
				<ColorModeToggle />
			</div>
			<div class="absolute left-[64px] top-1/2 z-0 flex h-64 w-[250px] -translate-y-1/2 flex-col items-center sm:w-[240px] shadow-2xl overflow-hidden">
				<NuxtImg v-if="song.art" :src="song?.art" provider="ipx" class="relative h-full w-full rounded-lg bg-white object-cover object-center shadow-lg" />
				<Transition name="slide-horizontal">
					<div v-if="showFavorites" class="absolute inset-0 z-20 flex flex-col overflow-auto rounded-lg bg-white text-abyssal dark:bg-abyssal dark:text-yellow-50/90">
						<div v-if="favorites.length > 0" class="h-full flex flex-col justify-between">
							<div class="sticky top-0 z-20 flex items-center justify-between px-2 pb-3 pl-3 pt-4">
								<p class="text-[11px] font-light uppercase tracking-widest">Favorites</p>
								<Icon name="material-symbols-light:close-small-outline-rounded" class="size-5" @click="toggleFaves" />
							</div>
							<ul class="flex-1 overflow-auto flex flex-col gap-1 px-2">
								<li v-for="(s, i) in favorites" :key="i" class="grid grid-cols-[48px_auto_24px] py-2 pr-2 text-[11px]">
									<span class="flex items-start justify-center opacity-60">0{{ i + 1 }}.</span>
									<span class="inline-block flex-col items-start justify-center">
										<span class="block font-semibold leading-3">{{ s.title }}</span>
										<span class="opacity-60 dark:opacity-90">{{ s.artist }}</span>
									</span>
									<Icon name="material-symbols:heart-minus-rounded opacity-50 hover:opacity-100 transition-opacity duration-500 hover:cursor-pointer" class="size-4" @click="removeFromFavorites(s)" />
								</li>
							</ul>
              <div class="p-3 dark:bg-abyssal flex items-center gap-1">
                <Icon name="line-md:downloading-loop" class="size-4 hover:cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-500" @click="downloadFavorites" />
                <span class="text-[11px] font-light hover:cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-500" @click="downloadFavorites">Download</span>
              </div>
						</div>
						<div v-else class="flex flex-1 flex-col items-center justify-center gap-2" @click="toggleFaves">
							<Icon name="mdi-light:heart-off" class="size-8" />
							<p class="w-1/2 text-center text-[11px] leading-4 font-light">Like the song to add to your playlist</p>
						</div>
					</div>
				</Transition>
			</div>
			<div class="ml-[250px] h-full flex-1 p-4 sm:ml-[240px]">
				<div class="flex items-start justify-between">
					<div>
						<p class="mb-1 text-xs font-medium leading-none">
							{{ song.artist }}
						</p>
						<p class="text-[10px] font-light leading-4">
							{{ song.title }}
						</p>
					</div>
					<div class="inline-flex items-center justify-center transition-colors duration-200" :class="hovered ? 'text-red-600' : 'text-abyssal'" @mouseenter="hovered = true" @mouseleave="hovered = false">
						<Transition name="fade" mode="out-in">
							<Icon :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" :name="liked || hovered ? 'jam:heart-f' : 'jam:heart'" :class="['h-4 w-4 transition-colors duration-200', liked ? 'text-red-600' : hovered ? 'text-abyssal hover:text-red-600 dark:text-yellow-50/90' : 'text-abyssal dark:text-yellow-50/90']" @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" />
						</Transition>
					</div>
				</div>
				<div class="my-4 flex w-full items-center justify-between gap-4">
					<progress :value="elapsedTime" max="60" class="progress-bar h-[2px] w-full appearance-none overflow-hidden rounded-full" />
					<span class="text-[10px] leading-none">{{ formattedElapsed }}</span>
				</div>
				<div class="flex items-center justify-center gap-8">
					<div class="flex" @click="setVolume(volume === 0 ? 1 : 0)">
						<Transition name="fade" mode="out-in">
							<Icon :key="volume === 0 ? 'muted' : 'unmuted'" :name="volume === 0 ? 'material-symbols:volume-mute' : 'material-symbols:volume-up'" class="size-4 bg-abyssal text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:bg-yellow-50/100 dark:hover:text-yellow-50/90" />
						</Transition>
					</div>
					<div class="flex">
						<Transition name="fade" mode="out-in">
							<Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'material-symbols:pause-circle' : 'material-symbols:play-circle'" class="size-8 bg-abyssal text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:bg-yellow-50/90 dark:hover:text-yellow-50/100" @click="isPlaying ? pause() : play()" />
						</Transition>
					</div>
					<div class="flex">
						<Transition name="fade" mode="out-in">
							<Icon name="jam:chevrons-right" class="size-4 bg-abyssal text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:bg-yellow-50/90 dark:hover:text-yellow-50/90" />
						</Transition>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
