<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
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

const { isPlaying, play, pause, refresh, elapsedTime, song, fetchScratchRadio } = useRadio()

const hovered = ref(false)
const liked = ref(false)

interface Song {
  title: string
  artist: string
  art?: string | null
}

const favorites = ref<Song[]>([])
// Load favorites from localStorage on mount
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('favorites')
  if (stored) favorites.value = JSON.parse(stored)
}

function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0")
	return `${m}:${s}`
}
// copy song to clipboard and mark as liked
// add song to favorites
const copySong = async () => {
	if (liked.value) return
	try {
		await navigator.clipboard.writeText(`${song.value.title} - ${song.value.artist}`)
		liked.value = true
    // Avoid duplicates in favorites
    const exists = favorites.value.find(
      (s) => s.title === song.value.title && s.artist === song.value.artist
    )
    if (!exists) {
      favorites.value.push({ ...song.value })
      console.log(favorites)
    }
	} catch (err) {
		console.error("Failed to copy:", err)
	}
}
// Watch song likes and reset liked state
watch(song, () => {
	liked.value = false
})
// Watch favorites and persist them
watch(
  favorites,
  (newVal) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(newVal))
    }
  },
  { deep: true }
)

onMounted(async () => {
	fetchScratchRadio()
	try {
		const photo = await getRandomPhoto({ query: "70s reggae" })
		unsplashImage.value = photo.urls?.small || null
	} catch (e) {
		console.error("Unsplash fallback failed", e)
	}
})
</script>
<template>
	<div class="flex justify-center items-start gap-4">
    <div class="w-72 h-96 mx-auto flex flex-col rounded-t-lg">
      <div class="h-48 relative flex flex-col justify-center items-center rounded-t-lg overflow-hidden">
        <div class="absolute h-full w-full flex justify-center items-center overflow-hidden">
          <NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="h-full w-full rounded-t-lg object-cover" />
          <NuxtImg v-else-if="unsplashImage" :src="unsplashImage" class="h-full w-full rounded-t-lg object-cover" />
        </div>
        <div class="absolute inset-0 bg-black/40"></div>
      </div>
      <div class="h-32 shadow-lg rounded-b-lg flex flex-col justify-center gap-4">
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
          <Transition name="fade" mode="out-in">
            <Icon name="jam:refresh-reverse" class="h-4 w-4 text-abyssal transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" @click="refresh" />
          </Transition>
          <div class="col-span-2 flex justify-center">
            <Transition name="fade" mode="out-in">
              <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4 transition-colors duration-200 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60" @click="isPlaying ? pause() : play()" />
            </Transition>
          </div>
          <div class="flex justify-end">
            <div class="inline-flex items-center justify-center transition-colors duration-200" :class="hovered ? 'text-red-600' : 'text-abyssal'" @mouseenter="hovered = true" @mouseleave="hovered = false">
              <Transition name="fade" mode="out-in">
                <Icon :key="liked ? 'liked' : hovered ? 'hovered' : 'default'" :name="liked ? 'jam:heart-f' : hovered ? 'jam:heart-f' : 'jam:heart'" :class="['h-4 w-4', liked ? 'text-red-600' : hovered ? 'text-abyssal hover:text-red-600 dark:text-slate-200' : 'text-abyssal dark:text-slate-200']" @mouseenter="hovered = true" @mouseleave="hovered = false" @click="copySong" />
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ul class="flex flex-col gap-2 max-h-96 overflow-y-auto">
      <li v-for="(s, i) in favorites" :key="i" class="text-[11px] grid grid-cols-[48px_auto] py-2">
        <span class="flex justify-center items-center">0{{ i + 1 }}.</span>
        <span class="inline-block flex-col justify-center items-center">
          <span class="block text-abyssal leading-3 font-semibold">{{ s.title }}</span>
          <span class="text-abyssal opacity-70">{{ s.artist }}</span>
        </span>
      </li>
    </ul>
	</div>
</template>
