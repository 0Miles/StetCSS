import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readBuiltCSS, runFixtureScript } from './helpers/next-build'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/static-build')

/**
 * Guards #57: the CSS is computed from the project's files, so a class used only in a Server
 * Component reaches the CSS asset however the bundler orders its server and client work.
 * Reverse check: removing the Turbopack generated CSS rule turns the Turbopack case red; not
 * writing `.stet/next.css` from the entry loader leaves webpack's CSS asset empty.
 */
describe('static build e2e', () => {
  it.each([
    ['Turbopack', 'build'],
    ['webpack', 'build:webpack']
  ])('%s emits Server Component and Client Component classes into the CSS asset', (_, script) => {
    runFixtureScript(fixtureDir, script)

    const css = readBuiltCSS(join(fixtureDir, '.next/static'))

    expect(css).toContain('.w\\:123px{width:123px}')
    expect(css).toContain('.h\\:77px{height:77px}')
    expect(css).toContain('@layer base')
  })
})
