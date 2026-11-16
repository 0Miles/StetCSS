import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'astro'
import type { AstroIntegration } from 'astro'
import { cleanFixture, readFiles } from './fixture-helpers'
import masterCSS from '../src'

const root = fileURLToPath(new URL('./fixtures/static-build/', import.meta.url))
const outDir = join(root, 'dist')

/** A server adapter that only builds, so the fixture can hold a `prerender = false` page. */
const stubAdapter: AstroIntegration = {
  name: 'stub-adapter',
  hooks: {
    'astro:config:done': ({ setAdapter }) => {
      setAdapter({
        name: 'stub-adapter',
        serverEntrypoint: join(root, 'stub-server.mjs'),
        exports: ['handler'],
        supportedAstroFeatures: {
          serverOutput: 'stable',
          hybridOutput: 'stable',
          staticOutput: 'stable',
          sharpImageService: 'stable'
        }
      })
    }
  }
}


beforeAll(async () => {
  rmSync(outDir, { recursive: true, force: true })
  await build({
    root,
    outDir,
    logLevel: 'error',
    telemetry: false,
    build: { inlineStylesheets: 'never' },
    adapter: stubAdapter,
    integrations: [masterCSS()]
  } as Parameters<typeof build>[0])
}, 180_000)

afterAll(() => cleanFixture(root, outDir))

/**
 * Guards what this package exists for: `masterCSS()` with no options must give an Astro
 * build static CSS holding the classes of prerendered pages, on-demand pages (including a
 * class picked at request time) and server islands, with no runtime left in the HTML. Before
 * #54 the default was progressive: classes reached the page only through the middleware and
 * the browser runtime, so a build without them shipped unstyled pages. Replaces tests that
 * only inspected the hook's arguments (testing.md rules 2 and 4).
 * Reverse check: registering no Vite plugin in `src/core.ts` turns the CSS test red here.
 */
describe('Astro build with masterCSS()', () => {
  it('puts the classes of every page kind into the built CSS', () => {
    const css = readFiles(join(outDir, 'client'), '.css').join('\n')

    expect(css).toContain('.fg\\:crimson{')
    expect(css).toContain('.bg\\:plum{')
    expect(css).toContain('.bg\\:gold{')
    expect(css).toContain('.fg\\:teal{')
    expect(css).not.toContain('@utilities')
  })

  it('leaves no runtime or rendered style in the HTML', () => {
    const html = readFiles(join(outDir, 'client'), '.html').join('\n')

    expect(html).toContain('Prerendered')
    expect(html).toMatch(/<link rel="stylesheet" href="\/_astro\/[^"]+\.css"/)
    expect(html).not.toMatch(/id=["']stet-css/)
    expect(html).not.toContain('<script')
  })
})
