import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bench, describe } from 'vitest'
import stetCSSStyleCSSLoader from '../src/style-css-loader'

/**
 * What one CSS module costs the style loader once the project has been compiled (#202): a CSS
 * Module with `@compose`, and a page stylesheet with `@reference "./globals.css"`. Before #202 every
 * transform compiled the project manifest, the entries' emitted globals and the referenced entry
 * again (about 200 ms and 290 ms on an M3 Max); now they come from file-stamp caches, and entry
 * discovery still lists the project's directories on every transform.
 * Numbers are evidence, not a gate.
 */
const root = mkdtempSync(join(tmpdir(), 'stet-css-next-style-bench-'))
mkdirSync(join(root, 'app'), { recursive: true })
writeFileSync(join(root, 'app/globals.css'), [
  '@import "@stet-css/core";',
  '@components { brand { background-color: #123456; } }',
  '.global-section { padding-block: var(--spacing-5xl); }'
].join('\n'))
// A project saved a while ago: caches skip files modified in the last two seconds.
const savedAt = new Date(Date.now() - 10_000)
utimesSync(join(root, 'app/globals.css'), savedAt, savedAt)

function runStyleCSSLoader(resourcePath: string, source: string) {
  return new Promise<string>((resolve, reject) => {
    stetCSSStyleCSSLoader.call({
      resourcePath,
      getOptions: () => ({ outputPath: join(root, '.stet/next.css'), projectDir: root }),
      addDependency: () => {},
      async: () => (error, content) => error ? reject(error) : resolve(content || '')
    }, source)
  })
}

const benchOptions = {
  time: 1000,
  warmupTime: 200
}

describe('Next style CSS loader, one CSS module', () => {
  let index = 0
  bench('CSS Module with @compose', async () => {
    index++
    await runStyleCSSLoader(join(root, `app/m${index}.module.css`), `.m${index} { @compose inline-flex brand; color: white; }`)
  }, benchOptions)

  bench('stylesheet with @reference "./globals.css"', async () => {
    index++
    await runStyleCSSLoader(join(root, `app/p${index}.css`), `@reference "./globals.css"; .p${index} { @compose py:5xl; }`)
  }, benchOptions)
})
