import type { AstroIntegration } from 'astro'
import vitePlugin from '@stet-css/vite'
import type { IntegrationOptions } from './options'

export default function masterCSS(options: IntegrationOptions = {}): AstroIntegration {
  return {
    name: '@stet-css/astro',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [vitePlugin(options, { name: '@stet-css/astro' }) as never]
          }
        })
      }
    },
  }
}
