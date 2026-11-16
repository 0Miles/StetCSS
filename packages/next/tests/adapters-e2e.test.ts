import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readBuiltCSS, runFixtureScript } from './helpers/next-build'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/adapters')

describe('custom adapters e2e', () => {
  /**
   * Guards that `withMasterCSS(config, { adapters })` reaches the CSS of a webpack build: Next
   * evaluates the config again in its build worker, and the loaders must get the adapters from
   * there, or every class only the adapters find is left out.
   * Reverse check: leaving `adapters` out of the webpack style loader options in
   * `src/index.ts` turns only this test red.
   */
  it('webpack emits the classes custom adapters find', () => {
    runFixtureScript(fixtureDir, 'build:webpack')

    const css = readBuiltCSS(join(fixtureDir, '.next/static'))

    expect(css).toContain('.m\\:13px{margin:13px}')
    expect(css).toContain('.w\\:123px{width:123px}')
  })

  /**
   * Guards that a Turbopack build with custom adapters stops with the reason instead of
   * shipping CSS without the adapters' classes: Turbopack's loader options are JSON.
   * Reverse check: dropping the `process.env.TURBOPACK` check in `src/index.ts` turns this
   * test (the build passes without the adapters' classes) and the unit one red.
   */
  it('Turbopack stops with the reason', () => {
    expect(() => runFixtureScript(fixtureDir, 'build'))
      .toThrow('[@stet-css/next] Custom adapters need webpack')
  })
})
