import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'scratch.local'
    ]
  }
})
