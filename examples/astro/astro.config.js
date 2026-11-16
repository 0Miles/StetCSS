import { defineConfig } from 'astro/config'
import stetCSS from '@stet-css/astro'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  trailingSlash: 'never',
  integrations: [
    sitemap(),
    stetCSS()
  ]
})
