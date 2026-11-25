import { describe, expect, test } from 'vitest'
import { StetCSS } from '@stet-css/engine'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { compileCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest
const baseManifest = {
  ...defaultManifest,
  selectors: {
    ...defaultManifest.selectors,
    ':pair': [
      { type: 'combinator', value: '>' }, { value: 'li' },
      { type: 'separator', value: ',' },
      { type: 'combinator', value: '+' }, { value: 'li' }
    ],
    ':inofs': [{
      value: 'of',
      type: 'pseudo-class',
      children: [{ type: 'class', value: 'a' }, { type: 'separator', value: ',' }, { type: 'class', value: 'b' }]
    }]
  }
} as StetCSSManifest

function classCSS(variant: string) {
  const { manifest } = compileCSSManifest(`@custom-variant foo { ${variant} { @slot } }`, { baseManifest })
  const css = StetCSS.create({ manifest })
  css.ensureClassRules('block@foo')
  return css.text
}

function composeCSS(variant: string) {
  const { css } = compileCSSManifest(`@custom-variant foo { ${variant} { @slot } } .card { @compose block@foo; }`, { baseManifest })
  return css.trim()
}

describe.concurrent('selector aliases in a @custom-variant selector', () => {
  /**
   * Guards #247: a class using a `@custom-variant` kept the variant selector's `:` aliases as
   * written, so `block@foo` with `&:first` generated `.block\@foo:first`, a selector the browser
   * drops, while `@compose block@foo` expanded the same alias to `:first-child`. Both paths now
   * read one selector, with every alias expanded the way it is on a class: several aliases in one
   * compound, an `:of()` alias placing its ancestors before the class, and an alias that is a
   * list expanding the item once per alias item, except inside a function, where no selector
   * item of its own exists to expand and its text stays in the argument. Each row holds the class
   * and the `@compose` output side by side, so the two paths cannot drift apart again.
   *
   * Reverse check in `src/stet-css-manifest.ts`: keeping the written `selector` in
   * `compileVariantBranch` reddens the class side of every row; the `@compose` side stays green,
   * since lowering resolves aliases on its own. In `src/utils/resolve-selector-aliases.ts`,
   * splitting a list alias inside parentheses too reddens only the row inside a function.
   */
  test.each([
    ['one alias', '&:first', '@layer utilities{.block\\@foo:first-child{display:block}}', '.card:first-child{display:block}'],
    ['several aliases in one compound', '&:first:even', '@layer utilities{.block\\@foo:first-child:nth-child(2n){display:block}}', '.card:first-child:nth-child(2n){display:block}'],
    ['a pseudo-class and a pseudo-element alias', '&:rtl::scrollbar', '@layer utilities{.block\\@foo:dir(rtl)::-webkit-scrollbar{display:block}}', '.card:dir(rtl)::-webkit-scrollbar{display:block}'],
    ['an :of() alias', '&:inofs', '@layer utilities{.a .block\\@foo,.b .block\\@foo{display:block}}', '.a .card,.b .card{display:block}'],
    ['an alias that is a list', '&:pair', '@layer utilities{.block\\@foo>li,.block\\@foo+li{display:block}}', '.card>li,.card+li{display:block}'],
    ['an alias that is a list inside a function', '&:not(:pair)', '@layer utilities{.block\\@foo:not(>li,+li){display:block}}', '.card:not(>li,+li){display:block}'],
    ['a selector list of aliases', '&:first, &:last', '@layer utilities{.block\\@foo:first-child{display:block}.block\\@foo:last-child{display:block}}', '.card:first-child{display:block}.card:last-child{display:block}']
  ])('%s', (_, variant, expectedClass, expectedCompose) => {
    expect(classCSS(variant)).toBe(expectedClass)
    expect(composeCSS(variant)).toBe(expectedCompose)
  })

  /**
   * Guards #247's one intended `@compose` output change: an `:of()` alias in the variant selector
   * is expanded when the variant is compiled, so a mode applied after the variant wraps the
   * alias's ancestors, as #235 settled for an `:of()` alias on the rule's own selector. It was
   * expanded only after the mode, giving `.a .dark .card`, which never matches with the mode
   * class on `<html>`.
   *
   * Reverse check: the same `compileVariantBranch` change as above reddens only this test among
   * the `@compose` assertions.
   */
  test('a mode after the variant wraps the :of() ancestors under @compose', () => {
    const { css } = compileCSSManifest('@settings { mode-trigger: class; }\n@custom-variant foo { &:inofs { @slot } } .card { @compose block@foo@dark; }', { baseManifest })
    expect(css.trim()).toBe('.dark .a .card,.dark .b .card{display:block}')
  })
})
