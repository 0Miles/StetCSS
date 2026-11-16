import { describe, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import { MasterCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'

/**
 * Every stacked multi-branch variant multiplies the rules a class expands to. A class stacking 14
 * two-branch `@touch` variants used to expand to 16384 rules and take minutes in `generate()`, stalling
 * the build and the runtime. A class expanding past 4096 branches is invalid instead: no CSS, no
 * exception, like any other invalid class. Classes within the limit resolve their branches once, so
 * even 4096 rules generate in well under a second. The tests run one at a time because they time
 * synchronous work, which a concurrent sibling would stall.
 */
describe('variant branch limit', () => {
  const createCSS = (settings?: MasterCSSManifest['settings']) => {
    const manifest = cloneManifest()
    if (settings) manifest.settings = { ...(manifest.settings || {}), ...settings }
    manifest.variants = [
      ...(manifest.variants || []),
      { token: '@touch', branches: [{ conditions: ['media(hover:none)'] }, { conditions: ['media(pointer:coarse)'] }] },
      { token: ':hocus', branches: [{ selector: '&:hover' }, { selector: '&:focus-visible' }] }
    ]
    return MasterCSS.create({ manifest })
  }

  /**
   * Guards the original stall: classes past the limit, whether the branches come from condition or
   * selector variants or both, return no rules quickly instead of expanding: the branches are
   * counted before any is built. Reverse check: raising `MAX_STATE_BRANCHES` in `src/utility.ts` to
   * 1 << 20, or letting an over-limit `resolveStateBranches` return the `[{ key: '' }]` fallback,
   * turns only this test red. The `@touch&dark` rows (#72) guard the count against `&` lists: the
   * variant only resolves once the mode is split out, so counting the raw `touch&dark` token would
   * let these expand; counting the unsplit tokens turns only this test red.
   */
  test('classes expanding past 4096 branches generate nothing within a second', () => {
    const css = createCSS()
    const classNames = [
      'block' + '@touch'.repeat(13),
      'block' + '@touch'.repeat(14),
      'block' + ':hocus'.repeat(13),
      'block' + ':hocus'.repeat(7) + '@touch'.repeat(7),
      'block' + ':hocus'.repeat(12) + '@touch',
      'block' + '@touch&dark'.repeat(13),
      'block' + ':hocus'.repeat(12) + '@touch&dark'
    ]

    for (const className of classNames) {
      const start = performance.now()
      expect(css.createRule(className)?.valid).toBeFalsy()
      expect(css.generate(className)).toEqual([])
      expect(performance.now() - start).toBeLessThan(1000)
    }
  })

  /**
   * Guards the boundary from the valid side: exactly 4096 branches still produce the class's rule
   * with every branch counted, and a small stack still emits every branch. Reverse check:
   * `MAX_STATE_BRANCHES` set to 4095 turns only this test and the 4096-rule timing test red.
   */
  test('classes within 4096 branches keep their CSS', () => {
    const css = createCSS()

    const rule = css.createRule('block' + '@touch'.repeat(12))
    expect(rule?.branchCount).toBe(4096)
    expect(rule?.text).toContain('.block' + '\\@touch'.repeat(12) + '{display:block}')
    const rules = css.generate('block@touch@touch')
    expect(rules).toHaveLength(4)
    for (const { text } of rules) expect(text).toContain('.block\\@touch\\@touch{display:block}')
  })

  /**
   * Guards the stall inside the limit: every branch used to resolve all the class's branches again,
   * so 1024 rules took over 6 seconds and 4096 took minutes. Reverse check: passing no resolved
   * branches to the per-branch rules in `src/core.ts` turns only this test red (at the 1024-rule step).
   */
  test('classes with up to 4096 branches generate every rule quickly', () => {
    const css = createCSS()

    let start = performance.now()
    expect(css.generate('block' + '@touch'.repeat(10))).toHaveLength(1024)
    expect(performance.now() - start).toBeLessThan(3000)

    start = performance.now()
    const rules = css.generate('block' + '@touch'.repeat(12))
    expect(performance.now() - start).toBeLessThan(10000)
    expect(rules).toHaveLength(4096)
    expect(new Set(rules.map(({ text }) => text)).size).toBe(4096)
  })

  /**
   * The rules of one class share its resolved branches. Guards against one rule changing a shared
   * branch: with `modeTrigger: 'media'` each rule adds `prefers-color-scheme` to its conditions, and
   * generating the class again must not add it a second time. Reverse check: pushing the mode
   * condition into the shared branch's `media` list in `src/utility.ts` turns only this test red.
   */
  test('generating a multi-branch class again leaves its rules unchanged', () => {
    const css = createCSS({ modeTrigger: 'media', modes: ['light', 'dark'] })
    const className = 'fg:red:hocus@touch@dark'

    const first = css.generate(className).map(({ text }) => text)
    css.ensureClassRules(className)
    const again = css.generate(className).map(({ text }) => text)

    expect(first).toHaveLength(4)
    expect(again).toEqual(first)
    for (const text of again) expect(text.match(/prefers-color-scheme:dark/g)).toHaveLength(1)
  })
})
