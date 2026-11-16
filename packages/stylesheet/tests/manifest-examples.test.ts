import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { compileCSSManifestFile } from '@stet-css/compiler'
import { createCSSWithNativeDeclarations } from '@stet-css/validator'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

/**
 * Each fixture is a documented manifest example: `manifest.css` (optional, compiled over the
 * default manifest), `template.html` (the markup using it) and `generated.css` (the rules its
 * `class` attributes must produce).
 */
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/manifest-examples')

function collectFixtureNames() {
  return readdirSync(fixturesDirectory)
    .filter((name) => existsSync(join(fixturesDirectory, name, 'template.html'))
      && existsSync(join(fixturesDirectory, name, 'generated.css')))
    .sort()
}

function loadManifest(fixtureDirectory: string) {
  const manifestSource = join(fixtureDirectory, 'manifest.css')
  if (!existsSync(manifestSource)) return defaultManifest
  return compileCSSManifestFile(manifestSource, { baseManifest: defaultManifest }).manifest
}

function collectClasses(html: string) {
  return [...html.matchAll(/\bclass="([^"]*)"/g)]
    .flatMap(([, value]) => value.split(/\s+/))
    .filter(Boolean)
}

describe.concurrent('manifest example CSS', () => {
  test('finds the fixtures', () => {
    expect(collectFixtureNames()).toHaveLength(16)
  })

  test.each(collectFixtureNames())('%s', (fixtureName) => {
    const fixtureDirectory = join(fixturesDirectory, fixtureName)
    const css = createCSSWithNativeDeclarations(loadManifest(fixtureDirectory))
    for (const className of collectClasses(readFileSync(join(fixtureDirectory, 'template.html'), 'utf-8'))) {
      css.ensureClassRules(className)
    }
    expect(css.text).toBe(readFileSync(join(fixtureDirectory, 'generated.css'), 'utf-8'))
  })
})
