import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

function generateText(className: string, css = createDefaultCSS()) {
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('attribute selector case flags', () => {
  /**
   * Guards: a class cannot hold the space before an attribute selector's case flag, so authors
   * write `_` for it as everywhere else, but the engine kept `_` inside brackets as written:
   * `block[data-x="a"_i]` emitted `[data-x="a"_i]`, which the browser drops with the whole rule.
   * Native CSS reads the flag (`i` or `s`, in any case) after a quoted value as `[data-x="a" i]`.
   *
   * Reverse check: skipping the flag rewrite in `src/utils/parse-selector.ts` reddens only this
   * test and the variant test below.
   */
  test.each([
    ['block[data-x="a"_i]', '@layer utilities{.block\\[data-x\\=\\"a\\"_i\\][data-x="a" i]{display:block}}'],
    ['block[data-x="a"_s]', '@layer utilities{.block\\[data-x\\=\\"a\\"_s\\][data-x="a" s]{display:block}}'],
    ['block[data-x=\'a\'_i]', '@layer utilities{.block\\[data-x\\=\\\'a\\\'_i\\][data-x=\'a\' i]{display:block}}'],
    ['block[data-x="a"_I]', '@layer utilities{.block\\[data-x\\=\\"a\\"_I\\][data-x="a" I]{display:block}}'],
    ['block[data-x^="a"_i]:hover', '@layer utilities{.block\\[data-x\\^\\=\\"a\\"_i\\]\\:hover[data-x^="a" i]:hover{display:block}}'],
    ['block:has([data-x="a"_s])', '@layer utilities{.block\\:has\\(\\[data-x\\=\\"a\\"_s\\]\\):has([data-x="a" s]){display:block}}']
  ])('%s emits the flag after a space', (className, expected) => {
    expect(generateText(className)).toBe(expected)
  })

  /**
   * Guards: a `:` variant before the attribute selector composes the selector template and parses
   * it again; that second parse must keep the flag's space.
   *
   * Reverse check: skipping the flag rewrite in `src/utils/parse-selector.ts` reddens this test
   * and the one above.
   */
  test('keeps the flag when a variant composes the selector', () => {
    const manifest = cloneManifest()
    manifest.variants = [...(manifest.variants || []), { token: ':dk', branches: [{ selector: '.dark &' }] }]
    expect(generateText('block:dk[data-x="a"_i]', StetCSS.create({ manifest })))
      .toBe('@layer utilities{.dark .block\\:dk\\[data-x\\=\\"a\\"_i\\][data-x="a" i]{display:block}}')
  })

  /**
   * Guards: the flag rewrite reaching other `_` inside brackets. A `_` inside the quoted value is
   * part of the string; after an unquoted value `a_i` is one identifier, as native CSS reads
   * `[data-x=a_i]`; `_` in a name, or before anything but a lone `i` or `s` at the end, is no flag.
   *
   * Reverse check: matching the flag after an unquoted value, or a `_` flag anywhere in the
   * brackets, reddens only this test.
   */
  test.each([
    ['block[data-x="a_i"]', '[data-x="a_i"]'],
    ['block[data-x="a"_x]', '[data-x="a"_x]'],
    ['block[data-x="a"_is]', '[data-x="a"_is]'],
    ['block[data-x="a"__i]', '[data-x="a"__i]'],
    ['block[data-x=a_i]', '[data-x=a_i]'],
    ['block[data_x="a"]', '[data_x="a"]'],
    ['block[data-x="a\\"_i"]', '[data-x="a\\"_i"]']
  ])('%s keeps every `_` as written', (className, selector) => {
    expect(generateText(className)).toContain(`${selector}{display:block}`)
  })
})
