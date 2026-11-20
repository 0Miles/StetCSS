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

  describe('a selector alias with :of() in a nested selector', () => {
    const ofNode = (...classes: string[]) => ({
      value: 'of',
      type: 'pseudo-class',
      children: classes.flatMap((name, index) => [
        ...(index ? [{ type: 'separator', value: ',' }] : []),
        { type: 'class', value: name }
      ])
    })
    const baseManifest = {
      ...defaultManifest,
      selectors: {
        ...defaultManifest.selectors,
        ':pair': [
          { type: 'combinator', value: '>' }, { value: 'li' },
          { type: 'separator', value: ',' },
          { type: 'combinator', value: '+' }, { value: 'li' }
        ],
        ':inof': [ofNode('a')],
        ':inofs': [ofNode('a', 'b')],
        ':inofgap': [{
          value: 'of',
          type: 'pseudo-class',
          children: [
            { type: 'class', value: 'a' }, { type: 'separator', value: ',' },
            { type: 'separator', value: ',' }, { type: 'class', value: 'b' }
          ]
        }],
        ':hoverof': [{ type: 'pseudo-class', value: 'hover' }, ofNode('a')],
        ':after-a': [{ value: 'of', type: 'pseudo-class', children: [{ type: 'class', value: 'a' }, { type: 'combinator', value: '+' }] }]
      },
      variants: [
        ...(defaultManifest.variants || []),
        { token: '@hocus', branches: [{ selector: '&:hover,&:focus' }] }
      ]
    } as StetCSSManifest

    /**
     * Guards #235: the alias's selector was pasted at the alias as text, so its `:of()` ancestor
     * landed inside the host's compound: `.card { &:inof { … } }` with `:inof` = `:of(.a)` lowered
     * to `.card.a ` (an element that is both) instead of `.a .card`. The alias reads as it does on
     * a class (`hidden:of(.a)` is `.a .hidden`): each `:of()` item goes before the selector item
     * the alias sits in, keeps its trailing combinator, and the rest of the alias stays at the
     * alias. Inside a functional pseudo-class the alias has no item of its own to prefix, so it
     * stands for any element under the ancestor (`.a *`); the row uses `:not()` because
     * lightningcss already unwraps a one-compound `:is()` before aliases resolve.
     *
     * Reverse check in `src/lower-css-directives.ts`: pasting `generateSelector(nodes, '')` for
     * an `:of()` alias, as before, reddens every row; writing the ancestor at the alias instead
     * of the item start reddens all but the `:not()` row; dropping the `*` body inside parentheses
     * reddens only the `:not()` row.
     */
    test.each([
      ['beside @compose on the parent', '.card { @compose block; &:inof { color: red; } }', '.card{display:block}.a .card{color:red}'],
      ['holding @compose', '.card { &:inof { @compose hidden; } }', '.a .card{display:none}'],
      ['with an :of() list', '.card { @compose block; &:inofs { color: red; } }', '.card{display:block}.a .card,.b .card{color:red}'],
      ['with an :of() list and text after it, in a list', '.card { @compose block; &:inofs:focus, .z { color: red; } }', '.card{display:block}.a .card:focus,.b .card:focus,.card .z{color:red}'],
      ['with a pseudo-class beside :of()', '.card { @compose block; &:hoverof { color: red; } }', '.card{display:block}.a .card:hover{color:red}'],
      ['with an :of() item ending in a combinator', '.card { @compose block; &:after-a { color: red; } }', '.card{display:block}.a+.card{color:red}'],
      ['after a combinator', '.card { @compose block; &>li:inof { color: red; } }', '.card{display:block}.a .card>li{color:red}'],
      ['inside :not()', '.card { @compose block; &:not(:inofs) { color: red; } }', '.card{display:block}.card:not(.a *,.b *){color:red}']
    ])('keeps the ancestor of the selector item: %s', (_, source, expected) => {
      const { css } = compileCSSManifest(source, { baseManifest })
      expect(css.trim()).toBe(expected)
    })

    /**
     * Guards: an alias is an `:of()` alias when any of its items has an ancestor, not only when
     * all do. An empty item (`:of(.a,,.b)`) has none and stands for the bare selector item, so
     * the alias still expands per item instead of being pasted into the host's compound
     * (`.card.a,.card,.card.b`).
     *
     * Reverse check: `items.some(…)` → `items.every(…)` in `getSelectorAliasAncestorItems`
     * reddens only this test.
     */
    test('an :of() list with an empty item', () => {
      const { css } = compileCSSManifest('.card { @compose block; &:inofgap { color: red; } }', { baseManifest })
      expect(css.trim()).toBe('.card{display:block}.a .card,.card,.b .card{color:red}')
    })

    /**
     * Guards (#235 review F1): `:host()` and `::slotted()` take one compound selector, so `.a *`
     * there is invalid and lightningcss drops the whole rule, other list items included:
     * `:host(.a *),.x{…}` left `.x` unstyled. That holds for `:is()` or `:not()` nested inside
     * them too (`:host(:not(.a *))` is dropped). No compound can say "inside `.a`", so inside any
     * function other than `:is()`, `:where()`, `:not()` or `:has()`, at any depth, the alias keeps
     * the text it had before #235.
     *
     * Reverse check in `resolveSelectorAliases`: treating every parenthesis as taking a complex
     * selector reddens all three rows; checking only the innermost parenthesis reddens only the
     * nested `:not()` row.
     */
    test.each([
      [':host() in a list', ':host(:inof), .x { @compose block; }', ':host(.a ),.x{display:block}'],
      ['::slotted() in a list', '.card { @compose block; &::slotted(:inof), .x { color: red; } }', '.card{display:block}.card::slotted(.a ),.card .x{color:red}'],
      [':not() inside :host()', ':host(:not(:inof)), .x { @compose block; }', ':host(:not(.a )),.x{display:block}']
    ])('keeps the alias text where a combinator is invalid: %s', (_, source, expected) => {
      const { css } = compileCSSManifest(source, { baseManifest })
      expect(css.trim()).toBe(expected)
    })

    /**
     * Guards #235 for managed definitions: a component's nested `&:inofs` kept the ancestor
     * inside the component's compound once the engine put the class at `&`.
     * Reverse check: the same paste as above reddens this test.
     */
    test('in a component', () => {
      const { manifest } = compileCSSManifest('@components { card { &:inofs { color: red; } } }', { baseManifest })
      const css = StetCSS.create({ manifest })
      css.ensureClassRules('card')
      expect(css.text).toBe('@layer components{.a .card,.b .card{color:red}}')
    })

    /**
     * Guards: a mode or `@variant` wrapper goes outside the alias's ancestors, as it already does
     * for `@compose hidden:of(.a,.b)@dark` (`.dark .a .card`). Lifting the ancestors only after the
     * wrapper was applied gave `.a .dark .card`, which never matches with the mode class on
     * `<html>`, and puts `:host(.dark)` after another compound under `mode-trigger: host`.
     *
     * Reverse check in `src/lower-css-directives.ts`: dropping the ancestor-only pass at the start
     * of `resolveConfiguredBranches` reddens only the `@variant` row; dropping it on the
     * `@compose` host in `createMergedStyleDefinitions` reddens only the `@compose` row.
     */
    test.each([
      ['@variant inside the alias rule', '.card { @compose block; &:inofs { @variant dark { color: red; } } }', '.card{display:block}.dark .a .card,.dark .b .card{color:red}'],
      ['@compose of a mode utility', '.card { &:inofs { @compose hidden@dark; } }', '.dark .a .card,.dark .b .card{display:none}']
    ])('wraps the ancestors in the mode: %s', (_, source, expected) => {
      const { css } = compileCSSManifest(classModes + source, { baseManifest })
      expect(css.trim()).toBe(expected)
    })

    /**
     * Guards #235's "an alias without `:of()` keeps its output": the pass that places `:of()`
     * ancestors before the wrappers leaves every other alias to the pass after them, so a
     * wrapper that is a list still expands around the alias as written. Resolving `:pair` before
     * the `@hocus` wrapper reorders the items (`.card>li:hover,.card>li:focus,…`).
     *
     * Reverse check: letting the ancestor-only pass in `resolveSelectorAliases` resolve aliases
     * without `:of()` too reddens only this test.
     */
    test('leaves an alias without :of() to resolve after the wrappers', () => {
      const { css } = compileCSSManifest('.card { @compose block; &:pair { @variant hocus { color: red; } } }', { baseManifest })
      expect(css.trim()).toBe('.card{display:block}.card>li:hover,.card+li:hover,.card>li:focus,.card+li:focus{color:red}')
    })
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
