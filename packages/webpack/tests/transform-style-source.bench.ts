import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bench, describe } from 'vitest'
import { transformStyleSource } from '../src/utils/transform-style-source'

/**
 * What one CSS module costs the webpack style loader once the project has been compiled (#202): a
 * CSS Module with `@compose`, and a page stylesheet with `@reference "./globals.css"`. Before #202
 * every transform compiled the project manifest, the entries' emitted globals and the referenced
 * entry again; now they come from file-stamp caches, and entry discovery still lists the project's
 * directories on every transform. Numbers are evidence, not a gate.
 */
const root = mkdtempSync(join(tmpdir(), 'stet-css-webpack-style-bench-'))
mkdirSync(join(root, 'src'), { recursive: true })
writeFileSync(join(root, 'src/globals.css'), [
  '@import "@stet-css/core";',
  '@components { brand { background-color: #123456; } }',
  '.global-section { padding-block: var(--spacing-5xl); }'
].join('\n'))
// A project saved a while ago: caches skip files modified in the last two seconds.
const savedAt = new Date(Date.now() - 10_000)
utimesSync(join(root, 'src/globals.css'), savedAt, savedAt)

const benchOptions = {
  time: 1000,
  warmupTime: 200
}

describe('webpack style CSS transform, one CSS module', () => {
  let index = 0
  bench('CSS Module with @compose', async () => {
    index++
    await transformStyleSource(join(root, `src/m${index}.module.css`), `.m${index} { @compose inline-flex brand; color: white; }`, { projectDir: root })
  }, benchOptions)

  bench('stylesheet with @reference "./globals.css"', async () => {
    index++
    await transformStyleSource(join(root, `src/p${index}.css`), `@reference "./globals.css"; .p${index} { @compose py:5xl; }`, { projectDir: root })
  }, benchOptions)
})
