import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import masterCSS from './src/lib/vite.js'

export default defineConfig({
  plugins: [sveltekit(), masterCSS()]
})
