<script setup lang="ts">
  import { PlaySolid, PauseSolid } from '@iconoir/vue'
  import { onMounted } from 'vue'
  import { useRadio } from '../composables/useScratchRadio'
  const { status, isPlaying, play, pause, song, fetchScratchRadio } = useRadio()

  onMounted(() => {
    fetchScratchRadio()
  })
</script>
<template>
  <div>
    <div class="w-[420px] flex justify-around"></div>
    <div class="grid grid-cols-4 gap-2 w-[420px] p-2 rounded-xl border border-slate-300 mx-auto">
      <div class="col-span-1 rounded-lg bg-sky-500"></div>
      <div class="col-span-2 rounded-lg bg-sky-500">
        <div v-if="status">
          <span>Title: {{ song.title }}</span>
          <br/>
          <span>Artist: {{ song.artist }}</span>
          <p>Listeners: {{ status.icestats?.source?.listeners }}</p>
        </div>
        <PlaySolid v-if="!isPlaying" class="h-[2rem] w-[2rem]" @click="play" />
        <PauseSolid v-if="isPlaying" class="h-[2rem] w-[2rem]" @click="pause" />
      </div>
      <div class="col-span-1 rounded-lg bg-sky-500"></div>
    </div>
  </div>
</template>


