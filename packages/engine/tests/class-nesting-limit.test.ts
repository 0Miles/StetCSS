import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

/**
 * Classes can come from untrusted markup. Parsing nested brackets recurses, so a class nested a few
 * thousand levels deep used to throw `RangeError` out of `generate()`, failing the whole build or
 * stopping the runtime observer. Classes nested deeper than 64 brackets are invalid instead: no CSS,
 * no exception, like any other invalid class.
 */
describe.concurrent('class nesting limit', () => {
  const nested = (open: string, inner: string, close: string, depth: number) => open.repeat(depth) + inner + close.repeat(depth)
  const forms = [
    {
      name: 'calc(',
      className: (depth: number) => `width:${nested('calc(', '1px+2px', ')', depth)}`,
      declaration: (depth: number) => `{width:${nested('calc(', '1px + 2px', ')', depth)}}`
    },
    {
      name: ':is(',
      className: (depth: number) => `block${nested(':is(', '.a', ')', depth)}`,
      declaration: (depth: number) => `${nested(':is(', '.a', ')', depth)}{display:block}`
    },
    {
      name: '@media(',
      className: (depth: number) => `block@media${nested('(', 'width>1px', ')', depth)}`,
      declaration: () => '@media (width>1px){'
    }
  ]

  /**
   * Guards the boundary on both sides: a class at exactly 64 levels is valid and keeps its CSS, one
   * level deeper is dropped, through both `generate()` and `createRule()`. Reverse check:
   * `MAX_CLASS_NESTING` in `src/utils/exceeds-class-nesting.ts` set to 63 or 65 turns only these 3
   * boundary tests red.
   */
  test.each(forms)('$name nested 64 levels generates CSS and 65 levels generates none', ({ className, declaration }) => {
    const css = createDefaultCSS()

    const rules = css.generate(className(64))
    expect(rules).toHaveLength(1)
    expect(rules[0].text).toContain(declaration(64))
    expect(css.generate(className(65))).toEqual([])
    expect(css.createRule(className(65))).toBeUndefined()
  })

  /**
   * Guards the original crash: thousands of levels returned no CSS instead of throwing `RangeError`.
   * Reverse check: removing the depth guard from `createRule` turns only this test and the 3 boundary
   * tests red; removing it from `createRules` also turns the mismatched-closer test red.
   */
  test('classes nested thousands of levels deep generate nothing and do not throw', () => {
    const css = createDefaultCSS()
    const classNames = [
      ...forms.map(({ className }) => className(5000)),
      `w:${nested('var(--x,', '1px', ')', 10000)}`,
      `block${nested(':is(', '.a', ')', 10000)}`,
      nested('{', 'block', '}', 5000)
    ]

    for (const className of classNames) {
      expect(css.generate(className)).toEqual([])
      expect(css.createRule(className)).toBeUndefined()
    }
  })

  /**
   * Guards against a bypass: the engine's parsers only unwind at the closer that matches the opener,
   * so a stray `]` after every `calc(` must not lower the count, or `calc(]` repeated thousands of
   * times nests the parser thousands of levels and throws again. Reverse check: letting any closer
   * lower the depth turns only this test red.
   */
  test('mismatched closers do not lower the nesting depth', () => {
    const css = createDefaultCSS()
    const classNames = [
      `width:${nested('calc(]', '1px', ')', 5000)}`,
      `w:${nested('var(--x,]', '1px', ')', 5000)}`,
      `block${nested(':is(]', '.a', ')', 5000)}`,
      `block@media${nested('(]', 'width>1px', ')', 5000)}`
    ]

    for (const className of classNames) {
      expect(css.generate(className)).toEqual([])
    }
  })

  /**
   * Guards against over-counting: brackets inside a quoted string are text, not nesting, so a quoted
   * value with many brackets keeps its CSS. Reverse check: counting brackets inside quotes turns only
   * this test red.
   */
  test('brackets inside quotes do not count toward the limit', () => {
    const css = createDefaultCSS()
    const text = '('.repeat(70)

    const rules = css.generate(`content:'${text}'`)
    expect(rules).toHaveLength(1)
    expect(rules[0].text).toContain(`{content:'${text}'}`)
  })
})
