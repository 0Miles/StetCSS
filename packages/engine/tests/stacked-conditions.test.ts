import { describe, expect, test } from 'vitest'
import type { MasterCSSManifestModeTrigger } from '@stet-css/schema/manifest'
import { MasterCSS, isUndeclaredModeError } from '../src'
import { cloneManifest } from './helpers/css-tester'

function createCSS(modeTrigger?: MasterCSSManifestModeTrigger, modes?: string[]) {
  const manifest = cloneManifest()
  manifest.settings = { ...manifest.settings, ...(modeTrigger ? { modeTrigger } : {}), ...(modes ? { modes } : {}) }
  manifest.variants = [
    ...(manifest.variants || []),
    { token: '@touch', branches: [{ conditions: ['media(hover:none)'] }, { conditions: ['media(pointer:coarse)'] }] }
  ]
  return MasterCSS.create({ manifest })
}

function texts(css: MasterCSS, className: string) {
  return css.generate(className).map(({ text }) => text)
}

/**
 * #72: a class stacking two conditions of one at-rule (`@sm@dark`, `@sm&dark`, `@sm@md`, a variant
 * twice) used to put them side by side in one query with no `and`, e.g.
 * `@media (width>=52.125rem) (prefers-color-scheme:dark)`. Browsers drop such a rule whole, so the
 * class never applied, and nothing reported it.
 */
describe('stacked conditions form one valid query', () => {
  /**
   * Prevents: a breakpoint and a mode under the default media trigger, in either order and with
   * either `@` or `&`, emitting a query the browser drops, so the dark style at that breakpoint
   * never applies. Also guards that an `or` list and a `not` operand keep their meaning inside the
   * joined query (they are grouped), and that a media type stays first.
   * Reverse-checked: no `and` between operands in `joinConditionNodes` reds every row but the
   * `print` one (plus the other join rows below); no grouping reds only the `,` and `!` rows;
   * no `&` mode extraction reds only the `&` rows here and in the next two tests.
   */
  test.each([
    ['block@sm@dark', '@media (width>=52.125rem) and (prefers-color-scheme:dark){.block\\@sm\\@dark{display:block}}'],
    ['block@dark@sm', '@media (width>=52.125rem) and (prefers-color-scheme:dark){.block\\@dark\\@sm{display:block}}'],
    ['block@sm&dark', '@media (width>=52.125rem) and (prefers-color-scheme:dark){.block\\@sm\\&dark{display:block}}'],
    ['block@dark&sm', '@media (width>=52.125rem) and (prefers-color-scheme:dark){.block\\@dark\\&sm{display:block}}'],
    ['block@md&<lg@dark', '@media (width>=64rem) and (width<80rem) and (prefers-color-scheme:dark){.block\\@md\\&\\<lg\\@dark{display:block}}'],
    ['block@sm,md@dark', '@media ((width>=52.125rem) or (width>=64rem)) and (prefers-color-scheme:dark){.block\\@sm\\,md\\@dark{display:block}}'],
    ['block@!sm@dark', '@media (not (width>=52.125rem)) and (prefers-color-scheme:dark){.block\\@\\!sm\\@dark{display:block}}'],
    ['block@print@dark', '@media print and (prefers-color-scheme:dark){.block\\@print\\@dark{display:block}}']
  ])('media trigger: %s', (className, expected) => {
    expect(texts(createCSS(), className)).toEqual([expected])
  })

  /**
   * Prevents: `@sm&dark` under the class and host triggers compiling `dark` into the media query
   * (`… and dark`) instead of the mode selector that `@sm@dark` gets.
   * Reverse-checked: no `&` mode extraction in `splitModeConjuncts` reds both rows.
   */
  test.each([
    ['class', '@media (width>=52.125rem){.dark .block\\@sm\\&dark{display:block}}'],
    ['host', '@media (width>=52.125rem){:host(.dark) .block\\@sm\\&dark{display:block}}']
  ] as const)('%s trigger: block@sm&dark', (modeTrigger, expected) => {
    expect(texts(createCSS(modeTrigger), 'block@sm&dark')).toEqual([expected])
  })

  /**
   * Prevents: stacked media, container, and supports conditions without a mode hitting the same
   * missing `and` (`@sm@md`, a two-branch variant stacked on itself, two `@container` or
   * `@supports` conditions), and a media type landing after a condition (`(…) and print` is
   * invalid; the type has to lead).
   * Reverse-checked: no `and` reds every row but `@sm@print`; putting the media type last reds
   * only `@sm@print` and `@print@dark` above.
   */
  test.each([
    ['block@sm@md', ['@media (width>=52.125rem) and (width>=64rem){.block\\@sm\\@md{display:block}}']],
    ['block@sm@print', ['@media print and (width>=52.125rem){.block\\@sm\\@print{display:block}}']],
    ['block@touch@touch', [
      '@media (hover:none) and (hover:none){.block\\@touch\\@touch{display:block}}',
      '@media (hover:none) and (pointer:coarse){.block\\@touch\\@touch{display:block}}',
      '@media (pointer:coarse) and (hover:none){.block\\@touch\\@touch{display:block}}',
      '@media (pointer:coarse) and (pointer:coarse){.block\\@touch\\@touch{display:block}}'
    ]],
    ['block@container(w>=10rem)@container(w>=20rem)', ['@container (width>=10rem) and (width>=20rem){.block\\@container\\(w\\>\\=10rem\\)\\@container\\(w\\>\\=20rem\\){display:block}}']],
    ['block@sidebar(w>=10rem)@sidebar(w>=20rem)', ['@container sidebar (width>=10rem) and (width>=20rem){.block\\@sidebar\\(w\\>\\=10rem\\)\\@sidebar\\(w\\>\\=20rem\\){display:block}}']],
    ['block@supports(display:grid)@supports(gap:1px)', ['@supports (display:grid) and (gap:1px){.block\\@supports\\(display\\:grid\\)\\@supports\\(gap\\:1px\\){display:block}}']]
  ])('%s', (className, expected) => {
    expect(texts(createCSS(), className)).toEqual(expected)
  })

  /**
   * Prevents: stacks that no single query can express emitting a valid-looking query with another
   * meaning. `not print and (…)` negates the whole query, so it would apply in light mode on
   * screen; two media types, or two containers that may differ, cannot share one query. The class
   * is invalid instead (before, it emitted a query the browser dropped).
   * Reverse-checked: skipping the lead checks in `joinConditionNodes` reds exactly these rows.
   */
  test.each([
    'block@!print@dark',
    'block@print@screen',
    'block@sidebar(w>=10rem)@main(w>=20rem)',
    'block@sidebar(w>=10rem)@container(w>=20rem)'
  ])('%s yields no rule', (className) => {
    const css = createCSS()
    expect(css.createRule(className)?.valid).toBeFalsy()
    expect(texts(css, className)).toEqual([])
  })

  /**
   * Prevents: a preset mode inside an `&` list slipping past #69's undeclared-mode error and
   * compiling to `… and dark` when the project declares other modes.
   * Reverse-checked: extracting only declared modes from an `&` list reds only this test.
   */
  test('an undeclared preset mode inside an & list throws', () => {
    let error: unknown
    try {
      createCSS('media', ['sepia']).generate('block@sm&dark')
    } catch (caught) {
      error = caught
    }
    expect(isUndeclaredModeError(error)).toBe(true)
  })
})
