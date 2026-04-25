<script setup lang="ts">
import Archive from '../icons/Archive.vue';
import MoreVertical from '../icons/MoreVertical.vue';

const emit = defineEmits<{
	(e: "toggle-faves"): void
}>()
</script>

<template>
	<div class="flex h-16 w-full items-center justify-between px-4">
		<button class="scale-75">
			<ColorModeToggle />
		</button>
		<div class="w-48">
			<p class="text-center text-sm dark:text-muted">Now Playing</p>
		</div>
		<button @click="emit('toggle-faves')" class="scale-75">
			<Archive />
		</button>
	</div>
</template>
