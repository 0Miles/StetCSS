import baseVite, { type PluginOptions } from '@stet-css/vite'
import type { Plugin } from 'vite'

export const SVELTEKIT_SSR_EXTERNAL = ['@stet-css/server']

function SvelteKitServerExternalPlugin(): Plugin {
  return {
    name: 'master-css:svelte-kit-server-external',
    config() {
      return {
        ssr: {
          external: SVELTEKIT_SSR_EXTERNAL
        },
        build: {
          rollupOptions: {
            external: SVELTEKIT_SSR_EXTERNAL
          }
        }
      }
    }
  }
}

export default function masterCSS(options: PluginOptions = {}): Plugin[] {
  return [
    SvelteKitServerExternalPlugin(),
    ...baseVite({
      mode: 'progressive',
      ...options
    })
  ]
}
