<script setup lang="ts">
defineProps<{
	songArt?: string | null
	songArtLoaded: boolean
}>()

const emit = defineEmits<{
	(e: "art-loaded"): void
}>()
</script>

<template>
	<div class="relative flex aspect-auto min-h-64 w-full justify-center">
		<Transition name="fade-slow" appear>
			<NuxtImg
				v-if="songArt && songArtLoaded"
				:src="songArt"
				provider="ipx"
				class="absolute inset-0 mx-auto my-auto h-64 w-64 rounded-2xl object-cover object-center shadow.md shadow-abyssal/80 transition-opacity duration-500"
			/>
		</Transition>
		<img v-if="songArt" :src="songArt" @load="emit('art-loaded')" class="invisible absolute size-0">
		<div v-if="!songArt || (songArt && !songArtLoaded)" class="absolute inset-0 mx-auto my-auto flex h-64 w-64 items-center justify-center rounded-xl shadow.md transition-opacity duration-300" :class="{ 'opacity-0': songArtLoaded }" style="background: linear-gradient(135deg, #ff6b35 0%, #ff8e53 50%, #ffb849 100%)">
			<span class="text-6xl font-bold text-white/90">♪</span>
		</div>
	</div>
</template>
