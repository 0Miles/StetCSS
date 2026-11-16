import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readBuiltCSS, readBuiltJavaScript, runFixtureScript } from './helpers/next-build'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const playgroundDir = join(packageDir, 'playground')

describe('playground', () => {
  /** Guards the default setup: no options, generated CSS in the CSS asset, no runtime shipped. */
  it('serves the generated CSS as a static asset without the runtime', () => {
    runFixtureScript(playgroundDir)

    const nextDir = join(playgroundDir, '.next')
    const css = readBuiltCSS(join(nextDir, 'static'))
    const clientSource = readBuiltJavaScript(join(nextDir, 'static/chunks'))

    expect(css).toContain('.fg\\:primary{color:var(--color-primary)}')
    expect(css).toContain('#0070f3')
    expect(css).toContain('.font\\:heavy{')
    expect(clientSource.includes('__MASTER_CSS_NEXT_RUNTIME__')).toBe(false)
    expect(clientSource.includes('loadHydrationManifest')).toBe(false)
  })
})
