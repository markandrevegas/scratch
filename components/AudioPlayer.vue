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
    <div class="grid grid-cols-4 gap-2 w-[420px] p-2 h-24 mx-auto">
      <div class="rounded-lg bg-sky-500">
        <NuxtImg v-if="song.image" :src="song.image" alt="Song Cover" width="64" height="64" class="h-16 w-16 rounded-lg object-cover" />
        <NuxtImg v-else provider="placehold" src="64x64" alt="Default Cover" width="64" height="64" class="h-16 w-16 rounded-lg object-cover" />
      </div>
      <div class="col-span-2 rounded-lg text-xs flex flex-col justify-center items-start">
        <div v-if="status">
          <span class="uppercase font-inter font-bold">{{ song.title }}</span>
          <br/>
          <span class="text-slate-400">{{ song.artist }}</span>
          <!-- <p>Listeners: {{ status.icestats?.source?.listeners }}</p> -->
        </div>
      </div>
      <div class="rounded-full border border-slate-400">
        <span v-if="!isPlaying" @click="play">Play</span>
        <span v-if="isPlaying" @click="pause">Pause</span>
      </div>
    </div>
  </div>
</template>


