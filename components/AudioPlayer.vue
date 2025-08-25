<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'
  import { useUnsplash } from '../composables/useUnsplash'

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

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const copySong = async () => {
    if (liked.value) return
    try {
      await navigator.clipboard.writeText(`${song.value.title} - ${song.value.artist}`)
      liked.value = true
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  watch(song, () => {
    liked.value = false
  })

  onMounted(async () => {
    fetchScratchRadio()
    try {
      const photo = await getRandomPhoto({ query: '70s reggae' })
      unsplashImage.value = photo.urls?.small || null
      // console.log('Unsplash image fetched:', unsplashImage.value)
    } catch (e) {
      console.error('Unsplash fallback failed', e)
    }
  })
</script>
<template>
  <div>
    <div class="shadow-lg grid grid-cols-3 rounded-lg dark:bg-abyssal h-32 w-96">
      <div class="col-span-1 h-32">
        <NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="h-full w-full rounded-l-lg shadow object-cover" />
        <NuxtImg v-else-if="unsplashImage" :src="unsplashImage" class="h-full w-full rounded-l-lg shadow object-cover" />
      </div>
      <div class="col-span-2 rounded-lg flex justify-start items-start">
        <div class="flex flex-col justify-between h-full w-full pt-4 pr-4 pb-2 pl-4 gap-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-semibold text-abyssal dark:text-slate-300 mb-[2px]">{{ song.title }}</p>
              <p class="text-[11px] font-light text-abyssal dark:text-slate-300 leading-none">{{ song.artist }}</p>
            </div>
            <ColorModeToggle />
          </div>
          <div class="w-full flex justify-between items-center">
            <progress :value="elapsedTime" max="720" class="progress-bar w-5/6 h-[2px] rounded-full overflow-hidden appearance-none" />
            <span class="leading-none text-xs text-slate-600/60 dark:text-slate-300">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="h-8 w-full grid grid-cols-4 text-abyssal dark:text-slate-300 hover:text-abyssal dark:hover:text-slate-200 rounded-full flex items-center justify-between hover:cursor-pointer duration-500">
            <Transition name="fade" mode="out-in">
              <Icon name="jam:refresh-reverse" class="h-4 w-4 text-abyssal hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60 transition-colors duration-200" @click="refresh" />
            </Transition>
            <div class="col-span-2 flex justify-center">
              <Transition name="fade" mode="out-in">
                <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4 hover:text-abyssal hover:opacity-50 dark:hover:text-slate-300/60 transition-colors duration-200" @click="isPlaying ? pause() : play()" />
              </Transition>
            </div>
            <div class="flex justify-end">
              <div class="inline-flex items-center justify-center transition-colors duration-200" :class="hovered ? 'text-red-600' : 'text-abyssal'" @mouseenter="hovered = true" @mouseleave="hovered = false">
              <Transition name="fade" mode="out-in">
                <Icon
                  :key="liked ? 'liked' : hovered ? 'hovered' : 'default'"
                  :name="liked ? 'jam:heart-f' : hovered ? 'jam:heart-f' : 'jam:heart'"
                  :class="[
                    'h-4 w-4',
                    liked
                      ? 'text-red-600'
                      : hovered
                        ? 'text-abyssal hover:text-red-600 dark:text-slate-200'
                        : 'text-abyssal dark:text-slate-200'
                  ]"
                  @mouseenter="hovered = true"
                  @mouseleave="hovered = false"
                  @click="copySong"
                />
              </Transition>

              </div>
            </div>
          </div>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
    </div>
  </div>
</template>


