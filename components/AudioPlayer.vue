<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'
  // import { useUnsplash } from '../composables/useUnsplash'
  import { useAlbumArt } from '../composables/useAlbumArt'
  const { status, isPlaying, play, pause, song, fetchScratchRadio } = useRadio()
  // const { getRandomPhoto } = useUnsplash()
  // const { getAlbumArt } = useAlbumArt()

  // const artist = 'Cher'
  // const track = 'Believe'
  // const albumArt = ref<string | null>(null)
  // Fetch photos
  // const random = await getRandomPhoto({ orientation: 'landscape' })
  // const albumArt = ref<string | null>(null)
  // const search = await searchPhotos('mountains', { per_page: 6 })

  onMounted(async () => {
    fetchScratchRadio()
    // albumArt.value = await getAlbumArt(artist, track)
    // console.log(albumArt.value)
  })
</script>
<template>
  <div>
    <div class="font-sans grid grid-cols-4 w-[420px] my-24 h-16 mx-auto align-center gap-4">
      <div class="flex justify-center items-center">
        <NuxtImg v-if="status && song.art" provider="ipx" :src="song.art" class="w-full h-full rounded-lg shadow" />
        <NuxtImg v-else src="64x64" provider="placehold" height="64" width="64" class="w-full h-full rounded-lg shadow" />
      </div>
      <div class="col-span-2 rounded-lg flex flex-col justify-center items-start">
        
        <div v-if="status" class="flex flex-col justify-center gap-1">
          <p class="text-sm font-semibold text-abyssal dark:text-slate-200 leading-none">{{ song.artist }}</p>
          <p class="text-xs font-medium text-cyan-800 opacity-60 dark:text-slate-300 leading-4">{{ song.title }}</p>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
      <div class="flex items-center justify-center">
        <div class="h-12 w-12 bg-abyssal dark:bg-slate-100 text-white dark:text-abyssal hover:text-abyssal dark:hover:text-slate-200 rounded-full flex items-center justify-center dark:hover:bg-abyssal hover:cursor-pointer duration-500" @click="isPlaying ? pause() : play()">
          <Transition name="fade" mode="out-in">
            <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4"  />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>


