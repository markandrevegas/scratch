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
    <div class="shadow-lg border border-slate-100 grid grid-cols-4 rounded-l-lg">
      <div class="flex justify-center items-center w-full">
        <NuxtImg v-if="song.art" provider="ipx" :src="song.art" class="h-32 w-32 rounded-l-lg shadow" />
        <NuxtImg v-else src="48x48" provider="placehold" class="w-full h-full rounded-l-lg shadow" />
      </div>
      <div class="col-span-3 rounded-lg flex justify-start items-start">
        <div class="flex flex-col justify-between h-full w-full pt-4 pr-4 pb-2 pl-4 gap-2">
          <div>
            <p class="text-sm font-semibold text-abyssal dark:text-slate-200 mb-[2px]">{{ song.title }}</p>
            <p class="text-xs font-medium text-slate-600 opacity-60 dark:text-slate-300 leading-none">{{ song.artist }}</p>
          </div>
          <div class="w-full flex justify-between items-center">
            <progress :value="elapsedTime" max="3600" class="progress-bar w-5/6 h-[2px] rounded-full overflow-hidden appearance-none" />
            <span class="text-xs text-slate-600/60">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="h-8 w-full grid grid-cols-4 text-abyssal hover:text-abyssal dark:hover:text-slate-200 rounded-full flex items-center justify-between hover:cursor-pointer duration-500" @click="isPlaying ? pause() : play()">
            <Transition name="fade" mode="out-in">
              <Icon name="jam:refresh-reverse" class="h-4 w-4"  />
            </Transition>
            <div class="col-span-2 flex justify-center">
              <Transition name="fade" mode="out-in">
                <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'clarity:pause-solid' : 'clarity:play-solid'" class="h-4 w-4"  />
              </Transition>
            </div>
            <div class="flex justify-end">
              <Transition name="fade" mode="out-in">
                <Icon name="jam:heart" class="h-4 w-4"  />
              </Transition>
            </div>
          </div>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
    </div>
  </div>
</template>


