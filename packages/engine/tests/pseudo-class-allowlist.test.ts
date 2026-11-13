import { describe, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import mdnSelectors from 'mdn-data/css/selectors.json' with { type: 'json' }
import { MasterCSS, type NativeCSSDeclarationMatcher } from '../src'
import builtinPseudoClasses from '../src/pseudo-classes'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

/**
 * Stands in for the css-tree matcher that builds pass in: it accepts only
 * these property values, so `flex: col` and `top: 48` fail the native
 * fallback the way css-tree rejects them. Trade-off: css-tree lives in
 * `@stet-css/validator`, above engine, so `packages/validator/tests/test.ts`
 * runs the real matcher on the same classes.
 */
const nativeValues: Record<string, string[]> = {
  'flex-wrap': ['nowrap', 'wrap'],
  'text-wrap': ['pretty', 'wrap'],
  display: ['flex', 'none', 'block'],
  color: ['var(--color-red)'],
  top: ['0']
}
const nativeDeclarationMatcher: NativeCSSDeclarationMatcher = ({ property, value }) =>
  nativeValues[property]?.includes(value) ?? false

function createCSS(manifest = defaultManifest) {
  return MasterCSS.create({ manifest, nativeDeclarationMatcher })
}

function generateText(css: MasterCSS, className: string) {
  return css.generate(className).map((rule) => rule.text).join('')
}

describe('pseudo-class allowlist', () => {
  /**
   * Guards: the builtin list drifting from mdn-data, so a pseudo-class
   * browsers ship (after a mdn-data upgrade) is rejected, or one that only
   * works in `@page` (`:left`) is accepted on an element.
   *
   * Trade-off: reads the private list instead of class output (rule 4), since
   * only the list itself shows a name that mdn-data does not have; a mdn-data
   * upgrade turns it red on purpose.
   *
   * Reverse check: dropping `:xr-overlay` from `src/pseudo-classes.ts` reddens
   * only this test.
   */
  test('equals the single-colon pseudo-classes in mdn-data', () => {
    const pageOnly = new Set([':left', ':right', ':blank'])
    const expected = new Set(Object.keys(mdnSelectors)
      .filter((name) => name.startsWith(':') && !name.startsWith('::'))
      .map((name) => name.replace(/\(\)$/, ''))
      .filter((name) => !pageOnly.has(name)))
    expected.add(':of')

    expect([...builtinPseudoClasses].sort()).toEqual([...expected].sort())
  })

  /**
   * Guards: a value after `:` that is no pseudo-class (`col`, `48`, `foo`)
   * was parsed as one, so `flex:col` shipped `.flex\:col:col{display:flex}`,
   * a rule a browser drops, and the class counted as valid; an unknown name
   * next to a known one must be caught wherever it sits.
   *
   * Reverse check: removing the `valid: false` spread from `flushRaw` in
   * `src/utility.ts` reddens these rows, the fallback rows below and the other
   * assertions of this contract in engine, preset, language-service and
   * validator, and nothing else.
   */
  test.each([
    'flex:col',
    'top:48',
    'block:foo',
    'fg:red:col',
    'flex:col@sm',
    'flex:col:hover',
    'flex:hover:col',
    'flex:col::before'
  ])('%s generates no rule', (className) => {
    expect(generateText(createCSS(), className)).toBe('')
  })

  /**
   * Guards: an allowlist that is too strict drops real pseudo-classes, so
   * `flex:hover` or `hidden:of(.a)` would silently stop styling.
   *
   * Reverse check: dropping `:of` from `src/pseudo-classes.ts` reddens the
   * `hidden:of(.a)` row, the mdn-data equality test and the selector-text
   * recovery tests that write `:of`.
   */
  test.each([
    ['flex:hover', '.flex\\:hover:hover{display:flex}'],
    ['hidden:of(.a)', '.a .hidden\\:of\\(\\.a\\){display:none}']
  ])('%s keeps its output', (className, expected) => {
    expect(generateText(createCSS(), className)).toBe(expected)
  })

  /**
   * Guards: mdn-data does not list prefixed pseudo-classes such as
   * `:-webkit-autofill`, so without the prefix rule they would stop styling.
   *
   * Reverse check: removing the prefix test from `isKnownPseudoClass`
   * reddens only these rows.
   */
  test.each([
    ['hidden:-webkit-autofill', '.hidden\\:-webkit-autofill:-webkit-autofill{display:none}'],
    ['hidden:-moz-focusring', '.hidden\\:-moz-focusring:-moz-focusring{display:none}'],
    ['hidden:-ms-input-placeholder', '.hidden\\:-ms-input-placeholder:-ms-input-placeholder{display:none}']
  ])('%s keeps its vendor-prefixed output', (className, expected) => {
    expect(generateText(createCSS(), className)).toBe(expected)
  })

  /**
   * Guards: builtin selector aliases (`:even`, `:first`) are not CSS names,
   * so checking only the list would drop them; `top:first` is also the
   * accepted counterpart of `top:48` on the same static `top` utility.
   *
   * Reverse check: removing the `selectors` lookup from `isKnownPseudoClass`
   * reddens `hidden:even`, the manifest test below and the alias cases in
   * `parser-boundary-parity.test.ts`; `top:first` stays green because
   * mdn-data also lists `:first`.
   */
  test.each([
    ['hidden:even', '.hidden\\:even:nth-child(2n){display:none}'],
    ['top:first', '.top\\:first:first-child{top:0}']
  ])('%s keeps its alias output', (className, expected) => {
    expect(generateText(createCSS(), className)).toBe(expected)
  })

  /**
   * Guards: `:before` is a legacy single-colon pseudo-element, not a
   * pseudo-class, so checking it would drop `hidden:before`.
   *
   * Reverse check: judging by the single colon instead of the node type
   * reddens only this test.
   */
  test('keeps legacy single-colon pseudo-elements', () => {
    expect(generateText(createCSS(), 'hidden:before')).toBe('.hidden\\:before::before{display:none}')
  })

  /**
   * Guards: pseudo-classes that qualify a pseudo-element, such as WebKit's
   * `:horizontal` on `::-webkit-scrollbar`, are not in mdn-data, so checking
   * them would drop `::scrollbar:horizontal`, which generated valid CSS before.
   *
   * Reverse check: no longer skipping pseudo-classes after a pseudo-element
   * reddens only this test.
   */
  test('leaves pseudo-classes that qualify a pseudo-element unchecked', () => {
    expect(generateText(createCSS(), 'hidden::scrollbar:horizontal'))
      .toBe('.hidden\\:\\:scrollbar\\:horizontal::-webkit-scrollbar:horizontal{display:none}')
  })

  /**
   * Guards: a pattern utility ate the property name and turned the value
   * into a pseudo-class (`flex-wrap:nowrap` gave `flex-wrap:wrap`), and a
   * group kept only that wrong declaration (`{flex:col}` gave
   * `display:flex`). Rejecting the pseudo-class must hand the class back to
   * the native declaration fallback.
   *
   * Reverse check: making the rejection also set `invalidValueSyntax`, which
   * stops `createRules` before the native fallback, reddens only the
   * `flex-wrap:nowrap` and `text-wrap:pretty` rows and their css-tree
   * counterparts in `packages/validator/tests/test.ts`; the group rows go red
   * when the rejection is removed (see above).
   */
  test.each([
    ['flex-wrap:nowrap', '.flex-wrap\\:nowrap{flex-wrap:nowrap}'],
    ['text-wrap:pretty', '.text-wrap\\:pretty{text-wrap:pretty}'],
    ['{flex:col}', '.\\{flex\\:col\\}{flex:col}'],
    ['{text-wrap:pretty}', '.\\{text-wrap\\:pretty\\}{text-wrap:pretty}'],
    ['{top:48}', '.\\{top\\:48\\}{top:48}']
  ])('%s falls back to the native declaration', (className, expected) => {
    expect(generateText(createCSS(), className)).toBe(expected)
  })

  /**
   * Guards: checking inside parentheses would reject selectors the browser
   * itself forgives, such as an unknown pseudo-class inside `:is()`.
   *
   * Reverse check: letting `hasUnknownPseudoClass` recurse into `children`
   * reddens only this test.
   */
  test('leaves pseudo-classes inside parentheses unchecked', () => {
    expect(generateText(createCSS(), 'hidden:is(:foo)')).toBe('.hidden\\:is\\(\\:foo\\):is(:foo){display:none}')
  })

  /**
   * Guards: names a manifest defines are not in mdn-data, so checking only
   * the builtin list would drop every project's custom `:` variant and
   * selector token.
   *
   * Reverse check: checking the whole selector token before custom variants
   * are consumed reddens this test and the custom variants in
   * `parser-boundary-parity.test.ts`.
   */
  test('accepts the manifest\'s own `:` variants and selector tokens', () => {
    const css = createCSS({
      ...defaultManifest,
      variants: [
        ...(defaultManifest.variants || []),
        { token: ':hocus', branches: [{ selector: '&:hover' }, { selector: '&:focus-visible' }] }
      ],
      selectors: {
        ':toggled': [{ type: 'pseudo-class', value: 'checked' }]
      }
    })

    expect(generateText(css, 'hidden:hocus'))
      .toBe('.hidden\\:hocus:hover{display:none}.hidden\\:hocus:focus-visible{display:none}')
    expect(generateText(css, 'hidden:toggled')).toBe('.hidden\\:toggled:checked{display:none}')
  })
})
