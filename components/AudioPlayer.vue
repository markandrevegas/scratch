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
	<div>
		<div class="grid h-32 w-96 grid-cols-3 rounded-lg shadow-lg dark:bg-abyssal">
			<div class="col-span-1 h-32">
				<NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="h-full w-full rounded-l-lg object-cover shadow" />
				<NuxtImg v-else-if="unsplashImage" :src="unsplashImage" class="h-full w-full rounded-l-lg object-cover shadow" />
			</div>
			<div class="col-span-2 flex items-start justify-start rounded-lg">
				<div class="flex h-full w-full flex-col justify-between gap-2 pb-2 pl-4 pr-4 pt-4">
					<div class="flex items-start justify-between">
						<div>
							<p class="mb-[6px] text-xs leading-3 font-semibold text-abyssal dark:text-slate-300">
								{{ song.title }}
							</p>
							<p class="text-[11px] leading-none text-abyssal opacity-70 dark:text-slate-300">
								{{ song.artist }}
							</p>
						</div>
						<ColorModeToggle />
					</div>
					<div class="flex w-full items-center justify-between">
						<progress :value="elapsedTime" max="720" class="progress-bar h-[2px] w-5/6 appearance-none overflow-hidden rounded-full" />
						<span class="text-xs leading-none text-slate-600/60 dark:text-slate-300">{{ formatTime(elapsedTime) }}</span>
					</div>
					<div class="grid h-8 w-full grid-cols-4 items-center justify-between rounded-full text-abyssal duration-500 hover:cursor-pointer hover:text-abyssal dark:text-slate-300 dark:hover:text-slate-200">
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
		</div>
    <ul>
  <li v-for="(s, i) in favorites" :key="i">
    {{ s.title }} - {{ s.artist }}
  </li>
</ul>
	</div>
</template>
