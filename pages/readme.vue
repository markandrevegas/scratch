<script setup lang="ts">
import { ref, onMounted } from "vue"
import { marked } from "marked"
import DOMPurify from "dompurify"

// Reactive variable for Markdown content
const markdownContent = ref<string>("Loading README...")

// Client-only fetch
onMounted(async () => {
	try {
		// Fetch the README.md from the public folder
		const response = await fetch("/README.md")
		if (!response.ok) throw new Error(`Failed to fetch README.md: ${response.status}`)

		const text = await response.text()
		const rawHtml = await marked.parse(text)
		// Use marked.parse() and await to get string
		// Sanitize before rendering
		markdownContent.value = DOMPurify.sanitize(rawHtml)
	} catch (err: unknown) {
		console.error("Failed to load README.md", err)
		markdownContent.value = "<p>Failed to load README.md</p>"
	}
})
</script>

<template>
	<div class="prose mx-auto p-4">
		<!-- Render HTML safely -->
		<div v-html="markdownContent" />
	</div>
</template>

<style scoped>
/* Optional styling for Markdown content */
.prose img {
	max-width: 100%;
	height: auto;
}
</style>
