<script setup lang="ts">
  import { onMounted, onUnmounted, watch } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'

  const { isPlaying, play, pause, elapsedTime, song, fetchScratchRadio } = useRadio()

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  let interval: number | null = null

  watch(isPlaying, (playing) => {
    if (playing) {
      if (!interval) {
        interval = window.setInterval(() => {
          elapsedTime.value++
        }, 1000)
      }
    } else {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
  })
  onMounted(async () => {
    fetchScratchRadio()
  })
  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })
</script>
<template>
  <div>
    <div class="h-32 shadow-lg border border-slate-100 grid grid-cols-3 rounded-l-lg">
      <div class="flex justify-center items-center w-32">
        <NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="w-full h-full rounded-l-lg shadow" />
        <NuxtImg v-else src="64x64" provider="placehold" class="w-full h-full rounded-l-lg shadow" />
      </div>
      <div class="col-span-2 rounded-lg flex justify-start items-start">
        <div class="flex flex-col justify-center pt-6 pl-2 w-full">
          <p class="text-sm font-semibold text-abyssal dark:text-slate-200 leading-none">{{ song.title }}</p>
          <p class="text-xs font-medium text-cyan-800 opacity-60 dark:text-slate-300 leading-4">{{ song.artist }}</p>
          <div class="w-full flex items-center gap-4">
            <progress :value="elapsedTime" max="3600" class="w-4/5 h-[2px] rounded-full overflow-hidden appearance-none bg-sky-200" />
            <p class="text-xs text-cyan-800/60">{{ formatTime(elapsedTime) }}</p>
          </div>
          <!-- <progress :value="elapsedTime" max="3600" class="h-2 bg-sky-300" /> -->
          <!-- <div class="mt-4 h-[3px] w-full bg-[#dad9d3]"></div> -->
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
        <div class="hidden h-12 w-12 bg-abyssal dark:bg-slate-100 text-white dark:text-abyssal hover:text-abyssal dark:hover:text-slate-200 rounded-full flex items-center justify-center dark:hover:bg-abyssal hover:cursor-pointer duration-500" @click="isPlaying ? pause() : play()">
          <Transition name="fade" mode="out-in">
            <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4"  />
          </Transition>
        </div>
      </div>
    </div>
    <div class="font-sans grid grid-cols-4 w-[420px] my-24 h-16 mx-auto align-center gap-4">
      <div class="flex justify-center items-center">
        <NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="w-full h-full rounded-lg shadow" />
        <NuxtImg v-else src="64x64" provider="placehold" height="64" width="64" class="w-full h-full rounded-lg shadow" />
      </div>
      <div class="col-span-2 rounded-lg flex flex-col justify-center items-start">
        <div class="flex flex-col justify-center gap-1">
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


