<script setup>
import { onMounted } from 'vue'

const { status, isPlaying, play, pause, fetchScratchRadio } = useRadio()

onMounted(() => {
  fetchScratchRadio()
})
</script>

<template>
  <div>
    <h1>Scratch Radio</h1>

    <div>
      <button v-if="!isPlaying" @click="play">Play</button>
      <button v-else @click="pause">Pause</button>
    </div>

    <div v-if="status">
      <p>Now Playing: {{ status.icestats?.source?.title }}</p>
      <p>Listeners: {{ status.icestats?.source?.listeners }}</p>
    </div>
  </div>
</template>
