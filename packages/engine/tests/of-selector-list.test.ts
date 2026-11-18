import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

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
})
