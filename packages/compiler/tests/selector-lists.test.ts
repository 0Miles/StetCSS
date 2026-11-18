import { describe, expect, test } from 'vitest'
import { StetCSS } from '@stet-css/engine'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { compileCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest
const classModes = '@settings { mode-trigger: class; }\n'

describe.concurrent('selector lists in lowered rules', () => {
  /**
   * Guards: a mode or `@variant` wrapper applied to a selector list reached only its first item.
   * `.x, .y { @variant dark { … } }` lowered to `.dark .x,.y` and `@compose hidden:of(.a,.b)@dark`
   * to `.dark .a .card,.b .card`, so the second item matched in every mode. Each item takes the
   * wrapper, and an escaped comma (`.a\,b`) is not a list separator.
   *
   * Reverse check in `src/lower-css-directives.ts`: `combineSelectorWrapper` replacing `&` in the
   * whole list reddens the native, component and escaped rows; prefixing the mode selector to the
   * whole list in `getComposedUtilitySelector` reddens the two `@compose` rows; `splitCSSSelectorList`
   * (`src/utils/selectors.ts`) not skipping a `\` at `index` reddens only the escaped row.
   */
  test.each([
    ['a native rule list under @variant', '.x, .y { @variant dark { color: red; } }', '.dark .x,.dark .y{color:red}'],
    ['an escaped comma in a class', '.a\\,b, .y { @variant dark { color: red; } }', '.dark .a\\,b,.dark .y{color:red}'],
    ['@compose of an :of() list in a mode', '.card { @compose hidden:of(.a,.b)@dark; }', '.dark .a .card,.dark .b .card{display:none}'],
    ['@compose of a top-level list in a mode', '.card { @compose hidden>li,+li@dark; }', '.dark .card>li,.dark .card+li{display:none}']
  ])('%s', (_, source, expected) => {
    const { css } = compileCSSManifest(classModes + source, { baseManifest: defaultManifest })
    expect(css.trim()).toBe(expected)
  })

  test('a component rule list under @variant', () => {
    const { manifest } = compileCSSManifest(classModes + '@components { card { &>li, &+li { @variant dark { color: red; } } } }', { baseManifest: defaultManifest })
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('card')
    expect(css.text).toBe('@layer components{.dark .card>li,.dark .card+li{color:red}}')
  })

  /**
   * Guards: a `:` selector alias whose selector is a list was pasted into the larger selector as
   * text, so `.card:pair` with `:pair` = `>li,+li` lowered to `.card>li,+li`, leaving `+li`
   * unscoped. The selector item expands once per alias item; other items stay as written.
   *
   * Reverse check: pasting the alias text without splitting it in `resolveSelectorAliases`
   * reddens only this test.
   */
  test('a selector alias that is a list expands the item it sits in', () => {
    const baseManifest = {
      ...defaultManifest,
      selectors: {
        ...defaultManifest.selectors,
        ':pair': [
          { type: 'combinator', value: '>' }, { value: 'li' },
          { type: 'separator', value: ',' },
          { type: 'combinator', value: '+' }, { value: 'li' }
        ]
      }
    } as StetCSSManifest
    const { css } = compileCSSManifest('.card { @compose block; &:pair, .z { color: red; } }', { baseManifest })
    expect(css.trim()).toBe('.card{display:block}.card>li,.card+li,.card .z{color:red}')
  })

  /**
   * Guards: a comma inside a comment in a manifest alias's selector text is not a list separator.
   * Alias text comes from the manifest, not from lightningcss, so it can carry a comment:
   * `:pair` = `>li/*,*\/` lowered to `.card>li/*,.card*\/`, copying the host into the comment.
   * Both select the same elements; the generated CSS text is the contract, so this locks the
   * comment as opaque.
   * Reverse check: `splitCSSSelectorList` (`@stet-css/lexer`) not skipping a comment at
   * `index` reddens only this test.
   */
  test('a comment in a selector alias is not split as a list', () => {
    const baseManifest = {
      ...defaultManifest,
      selectors: { ...defaultManifest.selectors, ':pair': [{ value: '>li/*,*/' }] }
    } as StetCSSManifest
    const { css } = compileCSSManifest('.card { @compose block; &:pair { color: red; } }', { baseManifest })
    expect(css.trim()).toBe('.card{display:block}.card>li/*,*/{color:red}')
  })

  /**
   * Guards #186 and #188: a `\` outside a string escapes the character after it, so an escaped
   * colon (`.a\:pair`, `.literal\:first`, and `\3a `, which lightningcss writes as `\:`) is part
   * of the class name, not a `:` selector alias, and an escaped quote opens no string that hides a
   * later alias. lightningcss writes `[data-state="escaped\":first"]` unquoted as
   * `[data-state=escaped\"\:first]`, so a quote escaped inside a string reaches the alias scan as
   * one escaped outside it. The `@compose` host rows are #188's repros: the user's class lost its
   * name (`.literal\:first-child`), or `:last` stayed unexpanded and the browser dropped the rule.
   * Reverse check: `resolveSelectorAliases` not skipping a `\` at `index` (it still skips strings
   * through `skipCSSEscapeStringOrComment`, so `\"` opens one) reddens these four rows and no
   * other compiler test.
   */
  test.each([
    ['a nested rule beside @compose', ".card { @compose block; &.a\\:pair, &.b\\':pair { color: red; } }", ".card{display:block}.card.a\\:pair,.card.b\\'>li{color:red}"],
    ['an escaped colon in a @compose host', '.literal\\:first:first { @compose block; }', '.literal\\:first:first-child{display:block}'],
    ['a hex-escaped colon in a @compose host', '.literal\\3a first:first { @compose block; }', '.literal\\:first:first-child{display:block}'],
    ['an escaped quote inside an attribute string of a @compose host', '[data-state="escaped\\":first"]:last { @compose block; }', '[data-state=escaped\\"\\:first]:last-child{display:block}']
  ])('an escaped colon or quote is not read as a selector alias or a string: %s', (_, source, expected) => {
    const baseManifest = {
      ...defaultManifest,
      selectors: {
        ...defaultManifest.selectors,
        ':pair': [{ type: 'combinator', value: '>' }, { value: 'li' }]
      }
    } as StetCSSManifest
    const { css } = compileCSSManifest(source, { baseManifest })
    expect(css.trim()).toBe(expected)
  })
})
