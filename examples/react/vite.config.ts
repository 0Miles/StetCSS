import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import masterCSS from '@stet-css/vite'

export default defineConfig({
  plugins: [
    react(),
    masterCSS()
  ],
})
