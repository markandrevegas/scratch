<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue"
import { useRadio } from "../composables/useScratchRadio"

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

// see favoritesList
const seeFavoritesList = () => {
  showFavorites.value = !showFavorites.value
  console.log(showFavorites.value)
}

watch(song, async (newSong, oldSong) => {
	liked.value = !!favorites.value.find((s) => s.title === newSong.title && s.artist === newSong.artist && s.liked)
	if ( newSong && oldSong && newSong.title === oldSong.title && newSong.artist === oldSong.artist ) {
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
  const paddedSeconds = seconds.toString().padStart(2, '0')
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
	<div class="h-screen flex flex-col justify-center sm:w-4/5 mx-auto">
    <div class="w-full sm:w-/4/5 mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg h-36 flex relative overflow-visible">
      <div class="w-[64px] h-full flex flex-col items-center justify-between py-4 rounded-l-lg">
        <div>
          <Icon @click="seeFavoritesList" name="jam:menu" class="size-6 text-abyssal dark:text-slate-300" />
        </div>
        <ColorModeToggle />
      </div>
      <div class="absolute top-1/2 left-[64px] h-64 -translate-y-1/2 w-[250px] sm:w-[240px] flex flex-col items-center z-0">
        <NuxtImg v-if="song.art" :src="song?.art"  provider="ipx" class="w-full h-full rounded-lg object-cover object-center shadow-lg relative" />
        <Transition name="fade" mode="out-in">
          <div v-show="showFavorites" class="absolute inset-0 bg-white z-20 rounded-lg flex flex-col overflow-auto"></div>
        </Transition>
      </div>
      <div class="h-full p-4 flex-1 ml-[250px] sm:ml-[240px]">
        <div class="flex justify-between items-start">
          <div>
            <p class="mb-1 text-xs leading-none font-medium text-abyssal dark:text-slate-300">
              {{ song.artist }}
            </p>
            <p class="text-[10px] font-light leading-4 text-abyssal dark:text-slate-300">
              {{ song.title }}
            </p>
          </div>
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

        <div class="flex w-full items-center justify-between gap-4 my-4">
          <progress :value="elapsedTime" max="720" class="progress-bar h-[2px] w-full appearance-none overflow-hidden rounded-full" />
          <span class="text-[10px] leading-none text-slate-600/60 dark:text-slate-300">{{formattedElapsed}}</span>
        </div>
        <div class="flex justify-center items-center gap-8">
          <div class="flex">
            <Transition name="fade" mode="out-in">
              <Icon name="jam:chevrons-left" class="size-4 bg-abyssal dark:bg-slate-300 text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" />
            </Transition>
          </div>
          <div class="flex">
            <Transition name="fade" mode="out-in">
              <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'material-symbols:pause-circle' : 'material-symbols:play-circle'" class="size-6 bg-abyssal dark:bg-slate-300 text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" @click="isPlaying ? pause() : play()" />
            </Transition>
          </div>
          <div class="flex">
            <Transition name="fade" mode="out-in">
              <Icon name="jam:chevrons-right" class="size-4 bg-abyssal dark:bg-slate-300 text-white transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" />
            </Transition>
          </div>
        </div>
      </div>
    </div>
    <div class="hidden h-64 w-72 overflow-y-auto rounded-lg shadow dark:bg-abyssal dark:text-zinc-100">
      <div v-if="favorites.length > 0">
        <div class="px-2 pt-4 pb-3 pl-3 sticky top-0 z-20 flex justify-start items-center gap-2">
          <Icon name="jam-heart" class="size-3" />
          <p class="text-[11px] uppercase tracking-widest font-light">Favorites</p>
        </div>
        <ul class="flex flex-col gap-2">
          <li v-for="(s, i) in favorites" :key="i" class="text-[11px] grid grid-cols-[48px_auto] py-2">
            <span class="flex justify-center items-start opacity-60">0{{ i + 1 }}.</span>
            <span class="inline-block flex-col justify-center items-start">
              <span class="block leading-3 font-semibold">{{ s.title }}</span>
              <span class="opacity-60">{{ s.artist }}</span>
            </span>
          </li>
        </ul>
      </div>
      <div v-else class="h-full flex flex-col gap-2 items-center justify-center opacity-60">
        <Icon name="mdi-light:heart-off" class="size-8" />
        <p class="text-sm">No favorites yet</p>
        <p class="text-xs w-1/2 text-center">Like the song to add to your playlist</p>
      </div>
    </div>
	</div>
</template>
