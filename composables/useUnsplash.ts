import { $fetch } from 'ofetch'

export const useUnsplash = () => {
  // --- API calls ---
  const getRandomPhoto = async (params: Record<string, string> = {}) => {
    return await $fetch('/api/unsplash/random', { query: params })
  }

  // --- Helpers ---
  /**
   * Convert a full Unsplash image URL into a relative one for <NuxtImg>
   */
  const formatSrc = (url: string) => {
    return url.replace('https://images.unsplash.com/', '')
  }

  return {
    getRandomPhoto,
    formatSrc
  }
}
