import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import stetCSS from '@stet-css/svelte/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    stetCSS(),
  ]
})
