import { defineConfig } from 'vite'
import masterCSS from '@stet-css/vite'

export default defineConfig({
  plugins: [
    masterCSS()
  ]
})
