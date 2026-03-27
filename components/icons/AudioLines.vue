<template>
  <div class="flex items-center justify-center" role="presentation">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 10v3" />
      <Motion 
        is="path" 
        v-for="(path, index) in paths" 
        :key="index" 
        :ref="(el) => (targets[index] = el)" 
        :d="path" 
        style="transform-origin: bottom" 
      />
      <path d="M22 10v3" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { MotionComponent as Motion, useMotion } from "@vueuse/motion"
import { watch, onMounted, ref } from "vue"

const props = defineProps<{
  active: boolean
}>()

const paths = ["M6 6v11", "M10 3v18", "M14 8v7", "M18 5v13"]
const durations = [1500, 1000, 800, 1500]
const scaleYSteps = [1.5, 1.8, 1.4, 1.6]

// 1. Store raw elements in a non-reactive or simple ref array
const targets = ref<any[]>([])
// 2. Motion instances don't need to be reactive themselves to work
let motionInstances: any[] = []

const updateAnimation = () => {
  motionInstances.forEach((instance, i) => {
    if (!instance) return
    
    if (props.active) {
      instance.apply({
        scaleY: [1, scaleYSteps[i], 0.5, 1],
        transition: {
          duration: durations[i],
          repeat: Infinity,
          ease: "linear"
        }
      })
    } else {
      instance.apply({ scaleY: 1 })
    }
  })
}

onMounted(() => {
  // Initialize instances only once after mount
  targets.value.forEach((el, i) => {
    if (el) {
      motionInstances[i] = useMotion(el, {
        initial: { scaleY: 1 }
      })
    }
  })
  
  // Set initial state
  updateAnimation()
})

// 3. Watch the prop to trigger the animation
watch(() => props.active, () => {
  updateAnimation()
})
</script>