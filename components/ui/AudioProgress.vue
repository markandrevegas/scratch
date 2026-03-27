<script setup lang="ts">
type Props = {
  value: string | number
  max?: number
}

withDefaults(defineProps<Props>(), {
  max: 360,
})
</script>

<template>
  <progress
    class="progress-bar h-2 w-full appearance-none overflow-hidden rounded-full border-none"
    :value="value"
    :max="max"
  />
</template>