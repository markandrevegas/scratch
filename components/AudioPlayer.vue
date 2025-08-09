<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'
  const { status, isPlaying, play, pause, song, fetchScratchRadio } = useRadio()

  onMounted(() => {
    fetchScratchRadio()
  })
</script>
<template>
  <div>
    <div class="grid grid-cols-4 w-[420px] h-24 mx-auto align-center">
      <div class="flex justify-center items-center">
        <NuxtImg v-if="song.image" :src="song.image" alt="Song Cover" width="64" height="64" class="h-16 w-16 rounded-lg object-cover" />
        <NuxtImg v-else provider="placehold" src="64x64" alt="Default Cover" :width=64 :height=64 class="rounded-lg object-cover" />
      </div>
      <div class="col-span-2 rounded-lg text-xs flex flex-col justify-center items-start">
        
        <div v-if="status">
          <span class="uppercase font-inter font-bold">{{ song.title }}</span>
          <br/>
          <span class="text-slate-400">{{ song.artist }}</span>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
      <div class="flex items-center justify-center">
        <div class="h-16 w-16 rounded-full border border-slate-300 flex items-center justify-center hover:cursor-pointer">
          <Transition name="fade" mode="out-in">
            <Icon :key="isPlaying ? 'pause' : 'play'" :name="isPlaying ? 'fad:pause' : 'fad:play'" class="h-[1.5rem] w-[1.5rem] transition-opacity duration-300 hover:opacity-80" @click="isPlaying ? pause() : play()" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>


