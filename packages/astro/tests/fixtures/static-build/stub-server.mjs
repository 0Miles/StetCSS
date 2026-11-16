import { App } from 'astro/app'

export function createExports(manifest) {
  const app = new App(manifest)
  return { handler: (request) => app.render(request) }
}
