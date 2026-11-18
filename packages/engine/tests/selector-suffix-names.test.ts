import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('names in a selector suffix', () => {
  /**
   * Guards: `_` joins selectors, so `transition:all_.3s,color_1s` (meant as `transition:all|.3s,…`)
   * emitted `.transition… .3s,.transition…color 1s{transition:all}`. A class, id or type selector
   * that starts with a digit or `-digit` is not a CSS identifier, so the browser drops the whole
   * rule and the developer got dead CSS with no warning. The class generates nothing instead.
   *
   * Reverse check: `SELECTOR_IDENTIFIER` in `src/utility.ts` matching every name reddens only
   * these rows except the repro, which the type-selector check below also rejects (`color` after
   * the `,`).
   */
  test.each([
    'transition:all_.3s,color_1s',
    'hidden_.3s',
    'hidden.3s',
    'hidden_1s',
    'hidden_-1a',
    'hidden_-',
    'hidden_.-1',
    'hidden__.3s',
    'hidden:of(.3s)'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: a type selector glued to a compound instead of starting one. After a top-level `,` the
   * item continues the class, so `hidden.a,div` emitted `.hidden\.a\,divdiv`, a class nobody
   * wrote, and `hidden[a]div` emitted `[a]div`, which CSS does not allow inside a compound. A type
   * selector must follow a combinator, as the universal selector must (#165).
   *
   * Reverse check: dropping the type-selector position check in `isSelectorSuffix` reddens only
   * these three rows.
   */
  test.each([
    'hidden.a,div',
    'hidden[a]div',
    'hidden:is(.a)div'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: a top-level list item made only of `_`. The descendant space adds no compound, so
   * `hidden.a,_` emitted `.hidden\.a\,_ {display:none}`, the bare class, and every element
   * carrying it matched, as an empty item did before #165.
   *
   * Reverse check: in `isSelectorSuffix` (`src/utility.ts`), ending without the last-item check
   * outside `:of()` reddens only the three trailing `_` rows here and the trailing-`,` rows of
   * `code-fragment-selectors.test.ts`; skipping the item check at a `,` outside `:of()` reddens
   * only `hidden.a,_,.b` here and `hidden.a,,.b` there.
   */
  test.each([
    'hidden.a,_',
    'hidden_div,_',
    'hidden:hover,_',
    'hidden.a,_,.b'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: the checks above rejecting real selectors. Names starting with a letter, `-letter`
   * or `--`, a BEM `__` name part starting with a digit, a type selector after `_` or at the start
   * of an `:of()` item, an `:of()` item after a leading `_` or starting with `__` (the type
   * selector `__a`) keep their output.
   *
   * Reverse check: each exemption, dropped alone, reddens only its own rows: `-?` or `--` in
   * `SELECTOR_IDENTIFIER` (`hidden_.-a`, `hidden_--a`), the `__` continuation in `hasInvalidName`
   * (`hidden__1`), `!ofList` in the type-selector check (`hidden:of(h1)`, `hidden:of(.a,div)`),
   * the leading-`_` exemption in `:of()` (`hidden:of(_.a)`), and a literal `_` counting as a name
   * character (`hidden:of(__a)`, `hidden:of(.a,__b)`).
   */
  test.each([
    ['hidden_div', '.hidden_div div{display:none}'],
    ['hidden_h1', '.hidden_h1 h1{display:none}'],
    ['hidden_.-a', '.hidden_\\.-a .-a{display:none}'],
    ['hidden_--a', '.hidden_--a --a{display:none}'],
    ['hidden__1', '.hidden__1__1{display:none}'],
    ['hidden:of(h1)', 'h1 .hidden\\:of\\(h1\\){display:none}'],
    ['hidden:of(.a,div)', '.a .hidden\\:of\\(\\.a\\,div\\),div .hidden\\:of\\(\\.a\\,div\\){display:none}'],
    ['hidden:of(_.a)', ' .a .hidden\\:of\\(_\\.a\\){display:none}'],
    ['hidden:of(__a)', '__a .hidden\\:of\\(__a\\){display:none}'],
    ['hidden:of(.a,__b)', '.a .hidden\\:of\\(\\.a\\,__b\\),__b .hidden\\:of\\(\\.a\\,__b\\){display:none}']
  ])('%s keeps its rule', (className, rule) => {
    expect(generateText(className)).toBe(`@layer utilities{${rule}}`)
  })

  /**
   * Guards: the `_`-only item check rejecting an item a `:` variant completes. With the variant
   * `&:hover`, `hidden.a,_:ho` emits `….a:hover,… :hover`, a real selector, so the last item may
   * lack a compound when a `:` variant follows it.
   *
   * Reverse check: dropping `!ends` from the last-item check in `isSelectorSuffix` reddens only
   * this test.
   */
  test('a `_` item a `:` variant completes keeps its rule', () => {
    const manifest = cloneManifest()
    manifest.variants = [...(manifest.variants || []), { token: ':ho', branches: [{ selector: '&:hover' }] }]
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('hidden.a,_:ho')
    expect(css.text).toBe('@layer utilities{.hidden\\.a\\,_\\:ho.a:hover,.hidden\\.a\\,_\\:ho :hover{display:none}}')
  })
})
