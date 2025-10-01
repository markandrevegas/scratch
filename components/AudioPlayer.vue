<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"
import { useUnsplash } from "../composables/useUnsplash"

const { getRandomPhoto } = useUnsplash()
export interface UnsplashImage {
	id: string
	description: string | null
	alt_description: string | null
	urls: {
		raw: string
		full: string
		regular: string
		small: string
		thumb: string
	}
	user: {
		name: string
		username: string
		portfolio_url: string | null
	}
	links: {
		html: string
		download: string
	}
}
const unsplashImage = ref<UnsplashImage | null>(null)

const { isPlaying, play, pause, elapsedTime, song, fetchScratchRadio } = useRadio()

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

watch(song, async (newSong) => {
	liked.value = !!favorites.value.find((s) => s.title === newSong.title && s.artist === newSong.artist && s.liked)
	if (newSong && !newSong.art) {
		try {
			unsplashImage.value = await getRandomPhoto({ query: newSong.artist || newSong.title })
			if (unsplashImage.value) {
				newSong.art = unsplashImage.value.urls.regular
			}
		} catch (err) {
			console.error("Failed to fetch Unsplash image:", err)
		}
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

onMounted(async () => {
	fetchScratchRadio()
	if (song.value) {
		liked.value = !!favorites.value.find((s) => s.title === song.value.title && s.artist === song.value.artist && s.liked)
	}
})
</script>
<template>
	<div class="flex gap-4">
    <div class="h-96 w-72 mx-auto flex flex-col rounded-t-lg">
      <div class="h-72 relative flex flex-col justify-center items-center rounded-t-lg overflow-hidden">
        <div class="absolute h-full w-full flex justify-center items-center overflow-hidden">
          <NuxtImg v-if="song.art" :src="song?.art || unsplashImage?.urls?.regular" provider="ipx" class="h-full w-full rounded-t-lg object-cover object-top" />
        </div>
      </div>
      <div class="h-32 shadow-lg rounded-b-lg flex flex-col justify-center gap-4 dark:bg-abyssal">
        <div class="text-center px-4">
          <p class="mb-[6px] text-xs leading-3 font-semibold text-abyssal dark:text-slate-300">
            {{ song.title }}
          </p>
          <p class="text-[11px] leading-none text-abyssal opacity-70 dark:text-slate-300">
            {{ song.artist }}
          </p>
        </div>
        <div class="flex w-3/4 mx-auto items-center justify-between">
          <progress :value="elapsedTime" max="720" class="progress-bar h-[2px] w-full appearance-none overflow-hidden rounded-full" />
          <!-- <span class="text-xs leading-none text-slate-600/60 dark:text-slate-300">{{ formatTime(elapsedTime) }}</span> -->
        </div>
        <div class="grid h-8 w-3/4 mx-auto grid-cols-4 items-center justify-between rounded-full text-abyssal duration-500 hover:cursor-pointer hover:text-abyssal dark:text-slate-300 dark:hover:text-slate-200">
          <ColorModeToggle />
          <div class="col-span-2 flex justify-center">
            <Transition name="fade" mode="out-in">
              <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4 transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" @click="isPlaying ? pause() : play()" />
            </Transition>
          </div>
          <div class="flex justify-end">
            <div class="inline-flex items-center justify-center transition-colors duration-200" :class="hovered ? 'text-red-600' : 'text-abyssal'" @mouseenter="hovered = true" @mouseleave="hovered = false">
              <Transition name="fade" mode="out-in">
                <Icon
                  :key="liked ? 'liked' : hovered ? 'hovered' : 'default'"
                  :name="liked || hovered ? 'jam:heart-f' : 'jam:heart'"
                  :class="[
                    'h-4 w-4 transition-colors duration-200',
                    liked ? 'text-red-600' : hovered ? 'text-abyssal hover:text-red-600 dark:text-slate-200' : 'text-abyssal dark:text-slate-200'
                  ]"
                  @mouseenter="hovered = true"
                  @mouseleave="hovered = false"
                  @click="copySong"
                />
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="h-96 w-72 dark:bg-abyssal dark:text-zinc-100">
      <div v-if="favorites.length > 0" class="">
        <div class="px-2 pt-4 pb-3 pl-3 sticky top-0 z-20 flex justify-start items-center gap-2">
          <Icon name="jam-heart" class="size-3" />
          <p class="text-[11px] uppercase tracking-widest font-light">Favorites</p>
        </div>
        <ul class="flex flex-col gap-2">
          <li v-for="(s, i) in favorites" :key="i" class="text-[11px] grid grid-cols-[48px_auto] py-2">
            <span class="flex justify-center items-start">0{{ i + 1 }}.</span>
            <span class="inline-block flex-col justify-center items-start">
              <span class="block leading-3 font-semibold">{{ s.title }}</span>
              <span>{{ s.artist }}</span>
            </span>
          </li>
        </ul>
      </div>
      <div v-else class="h-full flex flex-col gap-2 items-center justify-center rounded-lg bg-gray-100">
        <Icon name="mdi-light:heart-off" class="size-8 text-abyssal opacity-60" />
        <p class="text-abyssal text-sm">No favorites yet</p>
        <p class="text-abyssal opacity-60 text-xs w-1/2 text-center">Like the song to add to your playlist</p>
      </div>
    </div>
	</div>
</template>
