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
   * Inside `:of()` the list is written before the class, so `hidden:of(.a,)` emitted `.a,` and hid
   * every `.a` element.
   *
   * Reverse check: `hasDanglingCombinator` in `src/utility.ts` returning `false` reddens only the
   * combinator cases here and the `:dk` test; `isSelectorSuffix` returning `true` reddens only
   * the comma and `*` cases; dropping its leading-comma check in `:of()` reddens only
   * `hidden:of(,.a)`.
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
    'hidden:of(.a,)',
    'hidden:of(.a,,.b)',
    'hidden:of(,.a)',
    'hidden>@sm',
    'hidden_>_',
    'hidden>div,',
    '{display:block}+'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: the check above rejecting real selectors. A combinator followed by a compound, a
   * leading combinator in a relative selector, a trailing combinator inside `:of()`, a universal
   * selector that starts a compound, a combinator inside an attribute value, and a complete
   * selector list keep their output.
   *
   * Reverse check: letting `DANGLING_COMBINATOR` also match a combinator before `&`, or skipping
   * the attribute blanking in `hasDanglingCombinator`, reddens only this test.
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
    expect(generateText('hidden[title="a>,b"]')).toBe('@layer utilities{.hidden\\[title\\=\\"a\\>\\,b\\"\\][title="a>,b"]{display:none}}')
  })

  /**
   * Guards: a combinator before a `:` variant whose selector does not complete it. A variant with
   * selector `.dark &` turned `hidden>:dk` into `.dark .hidden\>\:dk>`, invalid CSS. Trade-off: the
   * variant that does complete it (`&div` in `hidden>:custom`) is guarded by
   * `parser-boundary-parity.test.ts`, so it is not repeated here.
   *
   * Reverse check: `hasDanglingCombinator` returning `false` reddens this test among the
   * combinator cases above.
   */
  test('a combinator a `:` variant leaves dangling generates no CSS', () => {
    const manifest = cloneManifest()
    manifest.variants = [...(manifest.variants || []), { token: ':dk', branches: [{ selector: '.dark &' }] }]
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('hidden>:dk')
    expect(css.text).toBe('')
  })
})
