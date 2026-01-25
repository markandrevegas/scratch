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
				await navigator.clipboard.writeText(song.value.title + '-' + song.value.artist)
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
	<div class="h-screen flex">
		<div class="mx-auto my-auto flex w-[20rem] items-center justify-center rounded-lg overflow-hidden">
			<div class="aspect-square flex w-full flex-col rounded-lg bg-white shadow-2xl dark:bg-slate-800">
				<div class="relative aspect-square w-full overflow-hidden">
					<div class="absolute top-0 right-0 left-0 z-30 flex items-start justify-between p-4">
						<div class="bg-black/30 rounded-full p-4 leading-1 flex flex-col">
							<p class="text-xs font-medium leading-none">
								{{ song.artist }}
							</p>
							<p class="text-[10px] font-light leading-4">
								{{ song.title }}
							</p>
						</div>
						<div class="flex justify-start items-center gap-4">
							<div class="text-white p-4 bg-black/30 flex items-center justify-center rounded-full transition-colors duration-200 hover:cursor-pointer">
								<ColorModeToggle />
							</div>
							<div @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" class="text-white p-4 bg-black/30 flex items-center justify-center rounded-full transition-colors duration-200 hover:cursor-pointer hover:text-red-600">
								<Transition name="fade" mode="out-in">
									<PrimeHeartFilled
										:key="liked ? 'liked' : hovered ? 'hovered' : 'default'"
										class="size-5 transition-colors duration-200"
										:class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''"
									/>
								</Transition>

							</div>
						</div>
					</div>

					<div class="absolute inset-0 z-10 bg-black/40"></div>
					<div class="absolute z-30 right-0 bottom-0 left-0 text-white">
						<div class="flex w-full flex-col items-center justify-center">
							<p class="mb-1 text-xs font-medium leading-none">
								{{ song.artist }}
							</p>
							<p class="text-[10px] font-light leading-4">
								{{ song.title }}
							</p>
						</div>
						<!--progress-->
						<div class="my-4 flex w-full items-center justify-between gap-4">
							<progress :value="elapsedTime" max="720" class="progress-bar"></progress>
							<span class="text-[10px] leading-none">
								{{ formattedElapsed }}
							</span>
						</div>
						<!--volume and like-->
						<div class="flex items-center justify-center gap-8">
							<div class="flex cursor-pointer" @click="setVolume(volume === 0 ? 1 : 0)">
								<Transition name="fade" mode="out-in">
									<Icon :key="volume === 0 ? 'muted' : 'unmuted'" :name="volume === 0 ? 'material-symbols:volume-mute' : 'material-symbols:volume-up'" class="size-5 transition-colors duration-200 hover:text-blue-500" />
								</Transition>
							</div>

							<div class="flex cursor-pointer">
								<Transition name="fade" mode="out-in">
									<Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'material-symbols:pause-circle' : 'material-symbols:play-circle'" class="size-10 transition-colors duration-200 hover:opacity-80" @click="isPlaying ? pause() : play()" />
								</Transition>
							</div>

							<div class="hidden inline-flex cursor-pointer items-center justify-center transition-colors duration-200" @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong">
								<Transition name="fade" mode="out-in">
									<Icon :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" :name="liked || hovered ? 'jam:heart-f' : 'jam:heart'" :class="['size-5 transition-colors duration-200', liked ? 'text-red-600' : '']" />
								</Transition>
							</div>
						</div>
					</div>
					<Transition name="slide-horizontal">
						<div v-if="showFavorites" class="absolute inset-0 z-50 flex flex-col overflow-auto rounded-lg bg-white text-abyssal dark:bg-slate-900 dark:text-yellow-50/90">
							<div v-if="favorites.length > 0" class="flex h-full flex-col justify-between">
								<div class="sticky top-0 z-20 flex items-center justify-between bg-white px-2 pb-3 pl-3 pt-4 dark:bg-slate-900">
									<p class="text-[11px] font-light uppercase tracking-widest">Favorites</p>
									<Icon name="material-symbols-light:close-small-outline-rounded" class="size-6 cursor-pointer" @click="toggleFaves" />
								</div>
								<ul class="flex flex-1 flex-col gap-1 overflow-auto px-2">
									<li v-for="(s, i) in favorites" :key="i" class="grid grid-cols-[48px_auto_24px] py-2 pr-2 text-[11px]">
										<span class="flex items-start justify-center opacity-60">0{{ i + 1 }}.</span>
										<span class="inline-block flex-col items-start justify-center">
											<span class="block font-semibold leading-3">{{ s.title }}</span>
											<span class="opacity-60 dark:opacity-90">{{ s.artist }}</span>
										</span>
										<Icon name="material-symbols:heart-minus-rounded" class="size-4 cursor-pointer opacity-50 transition-opacity hover:opacity-100" @click="removeFromFavorites(s)" />
									</li>
								</ul>
								<div class="flex items-center gap-1 border-t p-3 dark:border-slate-700">
									<Icon name="line-md:downloading-loop" class="size-4 cursor-pointer opacity-70 hover:opacity-100" @click="downloadFavorites" />
									<span class="cursor-pointer text-[11px] font-light opacity-70 hover:opacity-100" @click="downloadFavorites">Download</span>
								</div>
							</div>
							<div v-else class="flex flex-1 flex-col items-center justify-center gap-2" @click="toggleFaves">
								<Icon name="mdi-light:heart-off" class="size-8" />
								<p class="w-1/2 text-center text-[11px] font-light leading-4">Like the song to add to your playlist</p>
							</div>
						</div>
					</Transition>
					<NuxtImg v-if="song.art" :src="song?.art" provider="ipx" class="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105" />
				</div>

			</div>
		</div>
	</div>
</template>
