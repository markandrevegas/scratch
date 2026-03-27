<script setup lang="ts">
defineProps<{
	hovered: boolean
	liked: boolean
	title?: string
	formattedElapsed: string
	artist?: string
}>()

const emit = defineEmits<{
	(e: "hover", value: boolean): void
	(e: "copy-song"): void
}>()
</script>

<template>
	<div>
		<div class="grid min-h-8 w-full grid-cols-[2rem_1fr_2rem] items-center px-4 pt-8">
			<div class="flex h-8 items-center justify-center">
				<div
					@mouseenter="emit('hover', true)"
					@mouseleave="emit('hover', false)"
					@click="emit('copy-song')"
					class="flex items-center justify-center text-abyssal transition-colors duration-200 hover:cursor-pointer hover:text-red-600 dark:text-palladian"
				>
					<Transition name="fade" mode="out-in">
						<PrimeHeartFilled
							:key="liked ? 'liked' : hovered ? 'hovered' : 'default'"
							class="size-5 transition-colors duration-200"
							:class="liked ? 'text-red-600' : hovered ? 'text-red-400' : ''"
						/>
					</Transition>
				</div>
			</div>
			<div class="flex min-h-8 w-full flex-col items-center justify-center gap-1 text-center">
				<p class="font-medium">{{ title }}</p>
			</div>
			<div class="flex min-h-8 items-center justify-center dark:text-palladian">
				<span class="font-mono text-[12px] tabular-nums">{{ formattedElapsed }}</span>
			</div>
		</div>
		<p class="min-h-8 text-[11px] uppercase text-center">{{ artist }}</p>
	</div>
</template>
