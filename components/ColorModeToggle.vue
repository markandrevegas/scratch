<template>
	<button :class="isDark ? 'bg-transparent' : 'bg-transparent'" @click="toggle">
		<span v-if="isDark">
			<!-- Sun icon -->
			<SunIcon />
		</span>
		<span v-else>
			<MoonIcon />
		</span>
	</button>
</template>

<script setup lang="ts">
import { computed } from "vue"

import { useColorMode } from "@vueuse/core"

const colorMode = useColorMode()
const toggle = () => {
	colorMode.value = colorMode.value === "dark" ? "light" : "dark"
	console.log("Color mode set to:", colorMode.value)
}

const isDark = computed(() => colorMode.value === "dark")
</script>
