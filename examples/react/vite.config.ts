import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import stetCSS from '@stet-css/vite'

export default defineConfig({
  plugins: [
    react(),
    stetCSS()
  ],
})
