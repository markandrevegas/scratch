<script setup>

</script>

<template>
  <div class="dark:bg-abyssal h-screen flex flex-col items-center justify-center">
    <ClientOnly>
      <ColorModeToggle />
      <AudioPlayer />
    </ClientOnly>
  </div>
</template>
