import { expect, test } from 'vitest'
import {
  createMasterCSSManifestEntryPattern,
  findCSSImportStatements,
  hasMasterCSSManifestEntrypoint,
  parseCSSImportSource
} from '../src'

test.concurrent('finds top-level CSS imports without splitting quoted semicolons', () => {
  const source = [
    '@import url("@stet-css/core") layer(theme);',
    '.x { content: "@import url(\\"ignored\\");" }',
    '@import "./a;b.css";'
  ].join('\n')
  const imports = findCSSImportStatements(source)

  expect(imports.map((item) => item.statement)).toEqual([
    '@import url("@stet-css/core") layer(theme);',
    '@import "./a;b.css";'
  ])
  expect(imports.map((item) => parseCSSImportSource(item.statement))).toEqual(['@stet-css/core', './a;b.css'])
})

/**
 * Prevents: a stylesheet marked only with the removed `@master entry;` counting as an entry again.
 * Entries are recognised by the `@stet-css/core` import alone; `@master` at-rules are rejected by
 * the compiler instead, which is why the detection helpers assert `false` for it on purpose.
 * Reverse check: matching `@master entry;` in `createMasterCSSManifestEntryPattern` again turns
 * only this test red.
 */
test.concurrent('matches only the @stet-css/core import as a Master CSS manifest entrypoint', () => {
  const pattern = createMasterCSSManifestEntryPattern()

  expect(pattern.test('@import "@stet-css/core";')).toBe(true)
  expect(pattern.test('@master entry;')).toBe(false)
  expect(hasMasterCSSManifestEntrypoint('@master entry;\n.a{}')).toBe(false)
  expect(hasMasterCSSManifestEntrypoint('@import url("@stet-css/core");\n.a{}')).toBe(true)
})
