<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'
  import { useUnsplash } from '../composables/useUnsplash'
  const { status, isPlaying, play, pause, song, fetchScratchRadio } = useRadio()
  const { getRandomPhoto } = useUnsplash()


  // Fetch photos
  const random = await getRandomPhoto({ orientation: 'landscape' })
  // const search = await searchPhotos('mountains', { per_page: 6 })
  onMounted(() => {
    fetchScratchRadio()
    // console.log(random.urls)
  })
</script>
<template>
  <div>
    <div class="font-sans grid grid-cols-4 w-[420px] h-16 mx-auto align-center gap-4">
      <div class="flex justify-center items-center">
        <NuxtImg provider="ipx" :src="random.urls.thumb" class="w-full h-full rounded-lg shadow" />
      </div>
      <div class="col-span-2 rounded-lg flex flex-col justify-center items-start">
        
        <div v-if="status" class="flex flex-col justify-center gap-1">
          <p class="text-sm font-semibold text-abyssal dark:text-slate-200 leading-none">{{ song.artist }}</p>
          <p class="text-xs font-medium text-cyan-800 opacity-60 dark:text-slate-300 leading-4">{{ song.title }}</p>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
      <div class="flex items-center justify-center">
        <div class="h-12 w-12 text-cyan-800 hover:text-white rounded-full flex items-center justify-center hover:cursor-pointer duration-500">
          <Transition name="fade" mode="out-in">
            <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4" @click="isPlaying ? pause() : play()" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>


