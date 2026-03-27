<!-- components/ui/AudioWaveform.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useMotion } from "@vueuse/motion"
type Props = {
	progressWidth: string | number
	waveformHeights: number[]
	active: boolean
}

const props = defineProps<Props>()
const clipWidth = computed(() => Number(props.progressWidth) || 0)

const bgTargets = ref<any[]>([])
const fgTargets = ref<any[]>([])
let bgMotionInstances: any[] = []
let fgMotionInstances: any[] = []

const scaleYSteps = computed(() => {
	const maxHeight = 42
	return props.waveformHeights.map((h, i) => {
		const normalized = h / maxHeight
		const wobble = (i % 7) * 0.02
		return 1 + normalized * 0.9 + wobble
	})
})

const durations = computed(() => {
	return props.waveformHeights.map((_, i) => 600 + (i % 9) * 90)
})

const updateAnimation = () => {
  const run = props.active
  const staggerDelay = 60

  bgMotionInstances.forEach((instance, i) => {
    if (!instance) return
    if (run) {
      instance.apply({
        scaleY: [1, scaleYSteps.value[i], 0.6, 1],
        transition: {
          duration: durations.value[i],
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * staggerDelay // This creates the "wave"
        }
      })
    } else {
      instance.apply({ scaleY: 1 })
    }
  })

  fgMotionInstances.forEach((instance, i) => {
    if (!instance) return
    if (run) {
      instance.apply({
        scaleY: [1, scaleYSteps.value[i], 0.6, 1],
        transition: {
          duration: durations.value[i],
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * staggerDelay
        }
      })
    } else {
      instance.apply({ scaleY: 1 })
    }
  })
}

onMounted(() => {
	nextTick(() => {
		bgMotionInstances = []
		fgMotionInstances = []

		bgTargets.value.forEach((el, i) => {
			if (!el) return
				bgMotionInstances[i] = useMotion(el as any, { initial: { scaleY: 1 } })
		})
		fgTargets.value.forEach((el, i) => {
			if (!el) return
				fgMotionInstances[i] = useMotion(el as any, { initial: { scaleY: 1 } })
		})
		updateAnimation()
	})
})
watch(
	() => props.active,
	() => {
		updateAnimation()
	},
)
</script>

<template>
	<div class="flex w-full items-center justify-between gap-4 px-4">
		<div class="waveform-container mx-auto">
			<svg class="waveform-svg" viewBox="0 0 360 40" preserveAspectRatio="none">
				<defs>
					<clipPath id="progress-clip">
						<rect :width="clipWidth" height="40" x="0" y="0" />
					</clipPath>
				</defs>

				<g>
					<rect
						v-for="(height, i) in waveformHeights"
						:key="`bg-${i}`"
						:x="i * 8"
						:y="(40 - height) / 2"
						width="4"
						:height="height"
						rx="2"
						class="waveform-bar bar-bg"
						:ref="(el) => { if (el) bgTargets[i] = el }"
					/>
				</g>

				<g clip-path="url(#progress-clip)">
					<rect
						v-for="(height, i) in waveformHeights"
						:key="`fg-${i}`"
						:x="i * 8"
						:y="(40 - height) / 2"
						width="4"
						:height="height"
						rx="2"
						class="waveform-bar bar-fg"
						:ref="(el) => { if (el) fgTargets[i] = el }"
					/>
				</g>
			</svg>
		</div>
	</div>
</template>