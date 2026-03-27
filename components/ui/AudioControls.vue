<script setup lang="ts">
import PlayRoundedIcon from "../icons/PlayRoundedIcon.vue"
import PauseRoundedIcon from "../icons/PauseRoundedIcon.vue"

defineProps<{
	isPlaying: boolean
}>()

const emit = defineEmits<{
	(e: "toggle-play"): void
}>()
</script>

<template>
	<div class="mt-auto flex w-full flex-1 items-center justify-center gap-8 px-4">
		<div class="flex cursor-pointer items-center justify-center opacity-40">
			<SkipPrevious />
		</div>
		<div class="flex cursor-pointer items-center justify-center">
			<Transition name="fade" mode="out-in">
				<component
					:is="isPlaying ? PauseRoundedIcon : PlayRoundedIcon"
					:key="isPlaying ? 'pause' : 'play'"
					class="flex h-16 w-16 items-center justify-center transition-colors duration-200 dark:text-palladian"
					:class="isPlaying ? 'text-abyssal/70' : 'text-abyssal'"
					@click="emit('toggle-play')"
				/>
			</Transition>
		</div>
		<div class="flex cursor-pointer items-center justify-center opacity-40">
			<SkipNext />
		</div>
	</div>
</template>
