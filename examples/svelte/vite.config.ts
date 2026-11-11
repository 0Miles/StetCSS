import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import masterCSS from '@stet-css/svelte/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    masterCSS(),
  ]
})
