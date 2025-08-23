<script setup>

</script>

<template>
  <div class="dark:bg-abyssal h-screen flex flex-col items-center justify-start pt-16">
    <ClientOnly>
      <ColorModeToggle />
      <AudioPlayer />
    </ClientOnly>
  </div>
</template>
