import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('code fragments read as classes', () => {
  /**
   * Guards: a text scanner reads code in Markdown or comments (`` `block+` ``, `hidden.length,`,
   * `x.block*2`) as classes, and the engine turned each into a rule: `.block\++` and
   * `.block\**` are invalid CSS, `.hidden\.length\,.length` is a rule nobody wrote, and an empty
   * list item (`hidden.a,,.b`) emitted the bare class, so every element carrying that class
   * matched. A combinator with no compound after it, an empty selector-list item, or a
   * universal selector inside a compound is never a selector, so the class generates nothing.
   *
   * Reverse check: `isSelectorSuffix` in `src/utility.ts` returning `true` at once reddens only
   * these 16 cases.
   */
  test.each([
    'block+',
    'block>',
    'block~',
    'block>_',
    'hidden:hover>',
    'block>+div',
    'block+,.a',
    'block*',
    'block*2',
    'hidden:hover*',
    'block.a,*',
    'hidden.length,',
    'block:hover,',
    'hidden.a,,.b',
    'hidden:is(.a+)',
    '{display:block}+'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: the check above rejecting real selectors. A combinator followed by a compound, a
   * leading combinator in a relative selector, a trailing combinator inside `:of()`, a universal
   * selector that starts a compound, and a complete selector list keep their output.
   *
   * Reverse check: dropping the `:of()` exemption in `isSelectorSuffix` reddens only this test.
   */
  test('selectors that complete keep their rules', () => {
    expect(generateText('block+div')).toBe('@layer utilities{.block\\+div+div{display:block}}')
    expect(generateText('block>*')).toBe('@layer utilities{.block\\>\\*>*{display:block}}')
    expect(generateText('block_*')).toBe('@layer utilities{.block_\\* *{display:block}}')
    expect(generateText('hidden.a,.b')).toBe('@layer utilities{.hidden\\.a\\,\\.b.a,.hidden\\.a\\,\\.b.b{display:none}}')
    expect(generateText('hidden:has(>img)')).toBe('@layer utilities{.hidden\\:has\\(\\>img\\):has(>img){display:none}}')
    expect(generateText('hidden:nth-child(2n+1)')).toBe('@layer utilities{.hidden\\:nth-child\\(2n\\+1\\):nth-child(2n+1){display:none}}')
    expect(generateText('hidden:of(.active>)')).toBe('@layer utilities{.active>.hidden\\:of\\(\\.active\\>\\){display:none}}')
    expect(generateText('hidden[a*=b]')).toBe('@layer utilities{.hidden\\[a\\*\\=b\\][a*=b]{display:none}}')
  })

  /**
   * Guards: a combinator that ends the raw selector before a `:` variant being read as trailing.
   * The variant's selector supplies the compound (`hidden>:custom` → `>div`), so the class keeps
   * its rule.
   *
   * Reverse check: treating a trailing combinator as invalid regardless of `ends` reddens this test
   * and the `hidden>:custom` case in `parser-boundary-parity.test.ts`, which guards the same output.
   */
  test('a combinator a `:` variant completes keeps its rule', () => {
    const manifest = cloneManifest()
    manifest.variants = [...(manifest.variants || []), { token: ':custom', branches: [{ selector: '&div' }] }]
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('hidden>:custom')
    expect(css.text).toBe('@layer utilities{.hidden\\>\\:custom>div{display:none}}')
  })
})
