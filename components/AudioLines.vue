<template>
	<div class="cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center" role="button" tabindex="0">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 10v3" />

			<Motion
				is="path"
				v-for="(path, index) in paths"
				:key="path"
				:ref="el => setTarget(el, index)"
				:d="path"
				transform-origin="0 12"
			/>

			<path d="M22 10v3" />
		</svg>
	</div>
</template>

<script setup lang="ts">
	import { MotionComponent as Motion, useMotion } from "@vueuse/motion"
import { watch, reactive } from "vue"

const props = defineProps<{
  active: boolean
}>()

const paths = ["M6 6v11", "M10 3v18", "M14 8v7", "M18 5v13"]

const duration = [1500, 1000, 800, 1500]
const scaleY = [
  [1.5, 0.5, 1.5, 1],
  [1.3, 0.2, 1.2, 1],
  [1.2, 0.1, 1.2, 1],
  [1.2, 0.1, 1.2, 1]
]

const motionInstances = reactive<any[]>([])

const variants = {
  normal: { scaleY: 1 },
  animate: (i: number) => ({
    scaleY: scaleY[i],
    transition: {
      duration: duration[i],
      repeat: Infinity,
      repeatType: "reverse",
      ease: "linear"
    }
  })
}

const setTarget = (el: any, index: number) => {
  if (!el || motionInstances[index]) return

  motionInstances[index] = useMotion(el as SVGPathElement, {
    initial: variants.normal
  })
}


watch(
  () => props.active,
  (active) => {
    motionInstances.forEach((instance, i) => {
      instance.apply(active ? variants.animate(i) : variants.normal)
    })
  }
)

</script>
