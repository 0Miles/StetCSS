import { describe, expect, test } from 'vitest'
import { MasterCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'

/**
 * Every stacked multi-branch variant multiplies the rules a class expands to. A class stacking 14
 * two-branch `@touch` variants used to expand to 16384 rules and take minutes in `generate()`, stalling
 * the build and the runtime. A class expanding past 4096 branches is invalid instead: no CSS, no
 * exception, like any other invalid class.
 */
describe.concurrent('variant branch limit', () => {
  const createCSS = () => {
    const manifest = cloneManifest()
    manifest.variants = [
      ...(manifest.variants || []),
      { token: '@touch', branches: [{ conditions: ['media(hover:none)'] }, { conditions: ['media(pointer:coarse)'] }] },
      { token: ':hocus', branches: [{ selector: '&:hover' }, { selector: '&:focus-visible' }] }
    ]
    return MasterCSS.create({ manifest })
  }

  /**
   * Guards the original stall: classes past the limit, whether the branches come from condition or
   * selector variants or both, return no rules quickly instead of expanding. Reverse check: raising
   * `MAX_STATE_BRANCHES` in `src/utility.ts` to 1 << 20 turns only this test red.
   */
  test('classes expanding past 4096 branches generate nothing within a second', () => {
    const css = createCSS()
    const classNames = [
      'block' + '@touch'.repeat(13),
      'block' + '@touch'.repeat(14),
      'block' + ':hocus'.repeat(14),
      'block' + ':hocus'.repeat(7) + '@touch'.repeat(7)
    ]

    for (const className of classNames) {
      const start = performance.now()
      expect(css.createRule(className)?.valid).toBeFalsy()
      expect(css.generate(className)).toEqual([])
      expect(performance.now() - start).toBeLessThan(1000)
    }
  })

  /**
   * Guards the boundary from the valid side: exactly 4096 branches still produce the class's first
   * rule, and a small stack still emits every branch. Reverse check: `MAX_STATE_BRANCHES` set to 4095
   * turns only this test red.
   */
  test('classes within 4096 branches keep their CSS', () => {
    const css = createCSS()

    expect(css.createRule('block' + '@touch'.repeat(12))?.text).toContain('.block' + '\\@touch'.repeat(12) + '{display:block}')
    const rules = css.generate('block@touch@touch')
    expect(rules).toHaveLength(4)
    for (const { text } of rules) expect(text).toContain('.block\\@touch\\@touch{display:block}')
  })
})
