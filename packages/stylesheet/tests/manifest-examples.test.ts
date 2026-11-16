import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { compileCSSManifestFile } from '@stet-css/compiler'
import { extractHTMLClasses } from '@stet-css/source'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import { renderCompiledManifestCSS } from '../src/render'

/**
 * Each fixture is a documented manifest example: `manifest.css` (optional, compiled over the
 * default manifest), `template.html` (the markup using it) and `generated.css` (the rules its
 * classes must produce through the stylesheet renderer).
 *
 * Guards: CSS generated for the documented manifest examples drifts from the published output.
 */
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/manifest-examples')
const fixtureNames = readdirSync(fixturesDirectory).sort()

function loadManifest(fixtureDirectory: string) {
  const manifestSource = join(fixtureDirectory, 'manifest.css')
  if (!existsSync(manifestSource)) return defaultManifest
  return compileCSSManifestFile(manifestSource, { baseManifest: defaultManifest }).manifest
}

describe('manifest example CSS', () => {
  test('finds the fixtures', () => {
    expect(fixtureNames.length).toBeGreaterThan(0)
  })

  test.each(fixtureNames)('%s', (fixtureName) => {
    const fixtureDirectory = join(fixturesDirectory, fixtureName)
    const templatePath = join(fixtureDirectory, 'template.html')
    const { css } = renderCompiledManifestCSS({
      manifest: loadManifest(fixtureDirectory),
      classNames: extractHTMLClasses(templatePath, readFileSync(templatePath, 'utf-8'))
    })
    expect(css).toBe(readFileSync(join(fixtureDirectory, 'generated.css'), 'utf-8'))
  })
})
