import { describe, expect, test } from 'vitest'
import { StetCSS } from '@stet-css/engine'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { compileCSSManifest } from '../src'

const baseManifest = defaultManifestJSON as unknown as StetCSSManifest
const classModes = '@settings { mode-trigger: class; }\n'

describe.concurrent('ampersands that are not nesting selectors', () => {
  /**
   * Guards: nesting replaced every `&` in a nested selector with the parent, so the escaped `\&`
   * of the class `a&b` and an `&` inside an attribute string took the parent too:
   * `.x { .a\&b { … } }` lowered to `.x .a\.xb` and `[data-a="&"]` to `[data-a=\.x]`, rules that
   * match elements the author never wrote. Only the nesting selector takes the parent; a nested
   * selector whose only `&` is escaped or quoted nests as a descendant. The attribute value is
   * serialized as the escaped identifier `\&`, the same value as the quoted string.
   *
   * Reverse check: `combineSelector` in `src/utils/selectors.ts` testing `includes('&')` and
   * replacing with `/&/g` again reddens the `@compose` and `@variant` rows.
   */
  test.each([
    ['an escaped & in a nested class', '.x { .a\\&b { @compose block } }', '.x .a\\&b{display:block}'],
    ['an & in a nested attribute string', '.x { [data-a="&"] { @compose block } }', '.x [data-a=\\&]{display:block}'],
    ['an escaped & under @variant', '.x { @variant dark { &.a\\&b { color: red } } }', '.dark .x.a\\&b{color:red}']
  ])('%s', (_, source, expected) => {
    const { css } = compileCSSManifest(classModes + source, { baseManifest })
    expect(css.trim()).toBe(expected)
  })

  /**
   * Guards: the same replacement in a component rule, which engine applies at runtime:
   * `card { &.a\&b { … } }` emitted `.card.a\.cardb`.
   *
   * Reverse check: `replaceSelectorNesting` in engine `src/utility.ts` replacing with `/&/g` again
   * reddens this test.
   */
  test('a component rule with an escaped &', () => {
    const { manifest } = compileCSSManifest('@components { card { &.a\\&b { color:red } } }', { baseManifest })
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('card')
    expect(css.text).toBe('@layer components{.card.a\\&b{color:red}}')
  })

  /**
   * Guards: a `@custom-variant` selector template. Its escaped `\&` took the outer template when
   * the variant nests (`.p & { &.a\&b { @slot } }` became `.p &.a\.p &b`) and then the selector it
   * wraps, and a template whose only `&` is escaped passed the "must include `&`" check, then
   * wrapped nothing: `.a\&b` applied to `.x` gave `.a\.xb`.
   *
   * Reverse check: `createVariantTemplateBranch` in `src/core.ts` or `replaceSelectorNesting` in
   * `src/utils/selectors.ts` replacing with `/&/g` again reddens the first test; the selector check
   * in `collectVariantTemplateBranches` testing `includes('&')` again reddens the second.
   */
  test('a nested custom variant keeps an escaped & in its selector', () => {
    const { css } = compileCSSManifest(classModes + '@custom-variant foo { .p & { &.a\\&b { @slot; } } } .x { @variant foo { color: red } }', { baseManifest })
    expect(css.trim()).toBe('.p .x.a\\&b{color:red}')
  })

  test('a custom variant selector whose only & is escaped has no nesting selector', () => {
    expect(() => compileCSSManifest('@custom-variant foo { .a\\&b { @slot; } }', { baseManifest }))
      .toThrow('@custom-variant @foo selector value must include "&"')
  })
})
