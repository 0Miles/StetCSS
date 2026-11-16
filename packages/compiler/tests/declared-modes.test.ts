import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { StetCSS } from '@stet-css/engine'
import { compileProjectManifest } from '../src'

function compileEntry(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-declared-modes-'))
  try {
    const entryPath = join(root, 'app.css')
    writeFileSync(entryPath, `@import "@stet-css/core";\n${source}`)
    return compileProjectManifest([entryPath]).manifest
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/**
 * Prevents (#69): the project-loader path (ESLint, CLI, `inspect`), which inlines `@stet-css/core`
 * and with it the preset's `@theme light` / `@theme dark`, counting those as declared modes. A
 * project that declares only `@theme sepia {}` then got light, dark and sepia there while build
 * plugins got sepia alone, so `fg:red@dark` was valid in the linter and rejected by the build.
 * Preset modes stay implicit: they exist only while the project declares none of its own, and a
 * mode the project declares itself (`@theme dark {}`) is kept.
 * Reverse-checked: dropping the `implicitModes` filter in `normalizeDirectiveInput`, or collecting
 * package `@theme` names into the own-mode set in `resolveCSSImportGraph`, reds the three rows that
 * declare modes.
 */
test.each([
  ['custom mode only', '@theme sepia {}', ['sepia']],
  ['dark only', '@theme dark { --color-x: #000; }', ['dark']],
  ['light and custom', '@theme light {}\n@theme sepia {}', ['light', 'sepia']],
  ['no modes (preset light and dark)', '@theme { --color-x: #000; }', ['light', 'dark']]
])('the project loader keeps only declared modes: %s', (_, source, modes) => {
  const manifest = compileEntry(source)

  expect(manifest.settings?.modes && [...manifest.settings.modes].sort()).toEqual(modes && [...modes].sort())
  if (modes && !modes.includes('dark')) {
    expect(() => StetCSS.create({ manifest }).generate('fg:red@dark')).toThrow('mode "dark"')
  }
})
