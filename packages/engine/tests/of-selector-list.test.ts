import { describe, expect, test } from 'vitest'
import UtilityType from '@stet-css/schema/utility-type'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent(':of() selector lists', () => {
  /**
   * Guards: `:of()` with several selectors wrote its list in front of the class unchanged, so the
   * comma split it out of the rule: `hidden:of(.a,.b)` emitted `.a,.b .hidden…` and hid every `.a`
   * element whether or not it carried the class. Each item is an ancestor condition of its own, as
   * plain CSS writes it (`.a X,.b X`), so each keeps its own specificity and trailing combinator.
   *
   * Reverse check: joining the `:of()` items back into one prefix in `src/utils/generate-selector.ts`
   * reddens only this test and the `:of()` list rows in `parser-parity.test.ts`.
   */
  test.each([
    ['hidden:of(.a,.b)', '.a .hidden\\:of\\(\\.a\\,\\.b\\),.b .hidden\\:of\\(\\.a\\,\\.b\\){display:none}'],
    ['hidden:hover:of(.a,.b)', '.a .hidden\\:hover\\:of\\(\\.a\\,\\.b\\):hover,.b .hidden\\:hover\\:of\\(\\.a\\,\\.b\\):hover{display:none}'],
    ['hidden:of(.a,.b):hover', '.a .hidden\\:of\\(\\.a\\,\\.b\\)\\:hover:hover,.b .hidden\\:of\\(\\.a\\,\\.b\\)\\:hover:hover{display:none}'],
    ['hidden:of(.a>,.b)', '.a>.hidden\\:of\\(\\.a\\>\\,\\.b\\),.b .hidden\\:of\\(\\.a\\>\\,\\.b\\){display:none}'],
    ['hidden:of(.a,.b)>li,+li', '.a .hidden\\:of\\(\\.a\\,\\.b\\)\\>li\\,\\+li>li,.a .hidden\\:of\\(\\.a\\,\\.b\\)\\>li\\,\\+li+li,.b .hidden\\:of\\(\\.a\\,\\.b\\)\\>li\\,\\+li>li,.b .hidden\\:of\\(\\.a\\,\\.b\\)\\>li\\,\\+li+li{display:none}'],
    ['hidden:of(.a,.b):of(.c)', '.a.c .hidden\\:of\\(\\.a\\,\\.b\\)\\:of\\(\\.c\\),.b.c .hidden\\:of\\(\\.a\\,\\.b\\)\\:of\\(\\.c\\){display:none}'],
    ['hidden:of(:is(.a,.b))', ':is(.a,.b) .hidden\\:of\\(\\:is\\(\\.a\\,\\.b\\)\\){display:none}']
  ])('%s scopes the class under each item', (className, rule) => {
    expect(generateText(className)).toBe(`@layer utilities{${rule}}`)
  })

  /**
   * Guards: a `:` variant or a nested utility rule applied after the selector became a list.
   * Its `&` was replaced with the whole list text, so the variant reached only the item it
   * touched: `&:hover` gave `.a X,.b X:hover` (`.a X` matched without hover) and `.dark &` gave
   * `.dark .a X,.b X` (`.b X` matched in every mode). The same held for a top-level list
   * (`hidden>li,+li:ho`) and for a static rule selector (`&:hover`) over either list. Each item
   * takes the variant, and an escaped comma in the class name is not a list separator.
   *
   * Reverse check: `replaceSelectorNesting` in `src/utility.ts` replacing `&` in the whole list
   * reddens only the six rows here; dropping the escape skip in its `splitSelectorList` reddens
   * only the `link>li,+li` row.
   */
  test.each([
    ['hidden:of(.a,.b):ho', '.a .hidden\\:of\\(\\.a\\,\\.b\\)\\:ho:hover,.b .hidden\\:of\\(\\.a\\,\\.b\\)\\:ho:hover{display:none}'],
    ['hidden:of(.a,.b):dk', '.dark .a .hidden\\:of\\(\\.a\\,\\.b\\)\\:dk,.dark .b .hidden\\:of\\(\\.a\\,\\.b\\)\\:dk{display:none}'],
    ['hidden>li,+li:ho', '.hidden\\>li\\,\\+li\\:ho>li:hover,.hidden\\>li\\,\\+li\\:ho+li:hover{display:none}'],
    ['hidden>li,+li:dk', '.dark .hidden\\>li\\,\\+li\\:dk>li,.dark .hidden\\>li\\,\\+li\\:dk+li{display:none}'],
    ['link:of(.a,.b)', '.a .link\\:of\\(\\.a\\,\\.b\\):hover,.b .link\\:of\\(\\.a\\,\\.b\\):hover{color:red}'],
    ['link>li,+li', '.link\\>li\\,\\+li>li:hover,.link\\>li\\,\\+li+li:hover{color:red}']
  ])('%s applies the variant to each item', (className, rule) => {
    const manifest = cloneManifest()
    manifest.variants = [
      ...(manifest.variants || []),
      { token: ':ho', branches: [{ selector: '&:hover' }] },
      { token: ':dk', branches: [{ selector: '.dark &' }] }
    ]
    manifest.utilities = [...(manifest.utilities || []), {
      id: '.link',
      name: 'link',
      type: UtilityType.Semantic,
      emit: { type: 'static', rules: [{ selector: '&:hover', declarations: { color: 'red' } }] },
      matchers: [{ type: 'static', name: 'link' }]
    }]
    const css = StetCSS.create({ manifest })
    css.ensureClassRules(className)
    expect(css.text).toBe(`@layer utilities{${rule}}`)
  })
})
