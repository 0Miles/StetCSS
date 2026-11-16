import { render } from '@stet-css/server'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'

// Nuxt loads this Nitro plugin by path. Typing only the hook it uses keeps
// nitropack, which Nuxt provides, out of the published types: declaring it as
// a peer re-hoists unrelated packages in bun.lock.
interface NitroRenderResponse {
  body?: unknown
  headers?: Record<string, string | undefined>
}

interface NitroApp {
  hooks: {
    hook(name: 'render:response', handler: (response: NitroRenderResponse) => void | Promise<void>): unknown
  }
}

export default ((nitro: NitroApp) => {
  nitro.hooks.hook('render:response', async (response) => {
    if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
      const { html } = render(response.body, manifest, { hydrationManifest: 'inject' })
      response.body = html
    }
  })
})
