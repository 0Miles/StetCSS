import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { StetCSS } from '@stet-css/engine'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { compileCSSManifest, compileProjectManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest

function themeCSS(trigger: 'class' | 'host', mode: string) {
  const { manifest } = compileCSSManifest(
    `@settings { mode-trigger: ${trigger}; default-mode: none; }\n@theme ${mode} { --color-x: #000; }`,
    { baseManifest: defaultManifest }
  )
  const css = StetCSS.create({ manifest })
  css.ensureClassRules('fg:x')
  return css.themeLayer.text
}

function compileProjectEntry(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-mode-name-escapes-'))
  try {
    const entryPath = join(root, 'app.css')
    writeFileSync(entryPath, `@import "@stet-css/core";\n${source}`)
    return compileProjectManifest([entryPath]).manifest
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe.concurrent('mode names in mode selectors', () => {
  /**
   * Guards #249: a mode name went into the class selector unescaped, so `@theme a\,b` (mode `a,b`)
   * emitted `.a,b{…}`, two selectors, and the mode's variables reached every `b` element; `.`, `:`
   * and a space changed the selector the same way. The mode selector is one escaped class.
   *
   * Reverse check: dropping `cssEscape` from the class case of `getModeSelectorText` in engine
   * `src/theme-layer.ts` reddens the four rows and the project loader test, from its host case only
   * the `:host()` test; splitting the formatted prelude on spaces in `getThemePrelude`
   * (`src/core.ts`) reddens the space row and the project loader test.
   */
  test.each([
    ['a comma', 'a\\,b', '.a\\,b'],
    ['a dot', 'a\\.b', '.a\\.b'],
    ['a colon', 'a\\:b', '.a\\:b'],
    ['a space', 'a\\ b', '.a\\ b']
  ])('a mode name with %s is one class in the theme layer', (_, mode, selector) => {
    expect(themeCSS('class', mode)).toBe(`@layer theme{${selector}{--color-x:#000}}`)
  })

  test('a mode name with a comma is one class inside :host()', () => {
    expect(themeCSS('host', 'a\\,b')).toBe('@layer theme{:host(.a\\,b){--color-x:#000}}')
  })

  /**
   * Guards #249 for the selector a mode puts in front of a class or a rule: `block@a.b` emitted
   * `.a.b .block\@a\.b` and `@variant a:b` emitted `.a:b .card`, neither matching the mode class.
   *
   * Reverse check: dropping `cssEscape` from `getModeSelector` in engine `src/core.ts` reddens
   * both tests and leaves the theme layer rows green.
   */
  test('a class using a mode whose name has a dot', () => {
    const { manifest } = compileCSSManifest('@settings { mode-trigger: class; }\n@theme a\\.b {}', { baseManifest: defaultManifest })
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('block@a.b')
    expect(css.text).toBe('@layer utilities{.a\\.b .block\\@a\\.b{display:block}}')
  })

  test('@variant of a mode whose name has a colon', () => {
    const { css } = compileCSSManifest('@settings { mode-trigger: class; }\n@theme a\\:b {}\n.card { @variant a:b { color: red; } }', { baseManifest: defaultManifest })
    expect(css.trim()).toBe('.a\\:b .card{color:red}')
  })

  /**
   * Guards #249 on the project loader (CLI, ESLint, `inspect`), which reads `@theme` mode names
   * from the source text before compiling: there `a\ b` split into two words and threw
   * `@theme mode must be a single token`.
   *
   * Reverse check: splitting the prelude source text on every space, without decoding, in
   * `src/theme-prelude.ts` reddens this test and both rows of the next one.
   */
  test('the project loader keeps an escaped space inside a mode name', () => {
    const manifest = compileProjectEntry('@settings { mode-trigger: class; default-mode: none; }\n@theme a\\ b { --color-x: #000; }\n@theme a\\,b {}')
    expect(manifest.settings?.modes).toEqual(['a b', 'a,b'])
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('fg:x')
    expect(css.themeLayer.text).toBe('@layer theme{.a\\ b{--color-x:#000}}')
  })

  /**
   * Guards #249: the project loader decodes escapes in a `@theme` mode name as the compiler does.
   * Its reading decides which preset modes stay (#69), so a loader that kept `dar\k` as written
   * missed that the project declares `dark` and also kept the preset's `light`, which linters and
   * the CLI then accepted while the build rejected it.
   *
   * Reverse check: keeping the backslash of a non-hex escape in `splitThemePreludeSource`
   * (`src/theme-prelude.ts`) reddens only the `dar\k` row; dropping the whitespace that ends a hex
   * escape there reddens only the `\64 ark` row.
   */
  test.each([
    ['a non-hex escape', 'dar\\k'],
    ['a hex escape ended by a space', '\\64 ark']
  ])('a mode name with %s is the declared mode on both paths', (_, mode) => {
    const source = `@theme ${mode} { --color-x: #000; }`
    expect(compileProjectEntry(source).settings?.modes).toEqual(['dark'])
    expect(compileCSSManifest(source, { baseManifest: defaultManifest }).manifest.settings?.modes).toEqual(['dark'])
  })
})
