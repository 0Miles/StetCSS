import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS, createManifestWithVariables } from './helpers/css-tester'

function generateText(className: string, css = createDefaultCSS()) {
  css.ensureClassRules(className)
  return css.text
}

/** An instance without a native declaration matcher, which builds no rule for a raw item. */
function createMatcherlessCSS() {
  return StetCSS.create({ manifest: cloneManifest() })
}

describe.concurrent('group items', () => {
  /**
   * Guards (#234): a group item whose value the engine rejects fell back to a raw declaration.
   * `{fg:red,}` emitted `.\{fg\:red\,\}{fg:red,}` and `{fg:red;bg:blue,}` kept `bg:blue,` next to
   * a valid `color`, both dead CSS. An item with an invalid value invalidates the whole group, as
   * an invalid value does a single class (#165, #175), whatever made it invalid: an empty list
   * item, `$()` or an alpha the variable does not take.
   *
   * Reverse check: writing a rejected item as a raw declaration again fails these rows.
   */
  test.each([
    '{fg:red,}',
    '{fg:red;bg:blue,}',
    '{bg:blue,;fg:red}',
    '{fg:red;bg:blue,}:hover',
    '{m:10,}',
    '{fg:red;font-family:a,}',
    '{fg:$(x)}',
    '{bg:neutral-30/50}',
    '{fg:red;{bg:blue,}}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): a function left open inside a group takes the group's closing `}` as an
   * argument, so the group never closes. `{fg:rgb(}` emitted `color:rgb(})`, and
   * `{fg:rgb(1,2,3}` emitted `color:rgb(1,2,3})`.
   *
   * Reverse check: without the check that a group's `{` closes at its own level, these rows fail.
   */
  test.each([
    '{fg:rgb(}',
    '{fg:rgb(1,}',
    '{fg:rgb(1,2,3}',
    '{fg:calc(1+2}',
    '{fg:red;{bg:blue}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): rejecting items for their value must not reject items that match nothing,
   * which a group writes as raw declarations (`{top:48}`, `{flex:col}`), nor complete lists and
   * function arguments.
   */
  test.each([
    ['{top:48}', '@layer utilities{.\\{top\\:48\\}{top:48}}'],
    ['{top:48;left:1}', '@layer utilities{.\\{top\\:48\\;left\\:1\\}{top:48;left:1}}'],
    ['{flex:col}', '@layer utilities{.\\{flex\\:col\\}{flex:col}}'],
    ['{display:flex;foo-bar:1}', '@layer utilities{.\\{display\\:flex\\;foo-bar\\:1\\}{display:flex;foo-bar:1}}'],
    ['{font-family:a,b}', '@layer utilities{.\\{font-family\\:a\\,b\\}{font-family:a,b}}'],
    ['{fg:rgb(1,2,3)}', '@layer utilities{.\\{fg\\:rgb\\(1\\,2\\,3\\)\\}{color:rgb(1,2,3)}}'],
    ['{transition:opacity|.3s,transform|.3s}', '@layer utilities{.\\{transition\\:opacity\\|\\.3s\\,transform\\|\\.3s\\}{transition:opacity 0.3s,transform 0.3s}}']
  ])('%s keeps its rule', (className, text) => {
    expect(generateText(className)).toBe(text)
  })

  /**
   * Guards (#234): empty function arguments the group's own parse must keep rejecting. Item
   * generation never sees parentheses in an item's selector or at-rule state, nor after the
   * group's `}`, and builds no rule for an item it writes raw, so `{fg:red:not(,.a)}` would emit an
   * unconditional `color` and `{fg:red;foo$:rgb(1,2,)}` a dead `foo$:rgb(1,2,)`.
   *
   * Reverse check: skipping the empty-argument check on a group's own parse fails these rows and
   * the matcherless `translate()` row below.
   */
  test.each([
    '{fg:red:not(,.a)}',
    '{fg:red@media(a,)}',
    '{fg:red;bg:blue:is(.a,)}',
    '{fg:red}(1,)',
    '{fg:red;foo$:rgb(1,2,)}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): a group item whose function may hold an empty argument. The group's own parse
   * read `fg:var(--x,)` as a function named `fg:var`, missed the `var()` exemption from #175, and
   * dropped the group although `fg:var(--x,)` alone keeps `color:var(--x,)`; the exemption now
   * reads the function name past the item key. Without a native declaration matcher a raw item
   * still gets the check (`translate(1px,)`).
   *
   * Reverse check: matching the exemption against the whole name before `(` again fails the `var()`
   * and `url()` rows.
   */
  test.each([
    ['{fg:var(--x,)}', '@layer utilities{.\\{fg\\:var\\(--x\\,\\)\\}{color:var(--x,)}}'],
    ['{bg:url(a,)}', '@layer utilities{.\\{bg\\:url\\(a\\,\\)\\}{background-image:url(a,)}}'],
    ['{display:flex;bg:var(--x,)}', '@layer utilities{.\\{display\\:flex\\;bg\\:var\\(--x\\,\\)\\}{display:flex;background-color:var(--x,)}}'],
    ['{font-family:a,var(--x,)}', '@layer utilities{.\\{font-family\\:a\\,var\\(--x\\,\\)\\}{font-family:a,var(--x,)}}']
  ])('%s keeps its rule', (className, text) => {
    expect(generateText(className)).toBe(text)
    expect(generateText(className, createMatcherlessCSS())).toBe(text)
  })

  test('{transform:translate(1px,)} generates no CSS without a native declaration matcher', () => {
    expect(generateText('{transform:translate(1px,)}', createMatcherlessCSS())).toBe('')
  })

  /**
   * Guards (#234): the `var()`/`url()` exemption reaching past an item's value. In a selector or
   * at-rule an opaque name is no function that may take empty arguments, so `{fg:red@env(a,)}`
   * emitted an unconditional `color` and `{fg:red:url(,.a)}` a dead raw declaration; a later item
   * in the same value list (`{fg:a,b:url(,)}`) or a state after another function
   * (`{fg:red:is(.a):url(,)}`) is a selector too.
   *
   * Reverse check: exempting an opaque name wherever it stands in a group item fails these rows.
   */
  test.each([
    '{fg:red@env(a,)}',
    '{fg:red@--x(a,)}',
    '{fg:red:url(,.a)}',
    '{fg:red:var(,.a)}',
    '{fg:a,b:url(,)}',
    '{fg:red:is(.a):url(,)}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): the exemption reaching into a selector that starts with a sign other than `:`
   * or `@`. A class value ends at `>`, `~`, `+`, `*`, `!`, `[`, `_`, a `.` before no digit or a
   * `#` after a value, so `{fg:red>url(,.a)}` emitted an unconditional `color` and
   * `{fg:red#url(,)}` a dead raw declaration, both passing validation, where the base generated
   * nothing.
   *
   * Reverse check: leaving an item's value only on `;`, `:` and `@` again fails these rows.
   */
  test.each([
    '{fg:red>url(,.a)}',
    '{fg:red~url(,.a)}',
    '{fg:red+url(,.a)}',
    '{fg:red.url(,.a)}',
    '{fg:red;bg:blue~var(,.a)}',
    '{fg:red>env(a,)}',
    '{fg:red*url(,)}',
    '{fg:red!url(,)}',
    '{fg:red[url(,)]}',
    '{fg:red#url(,)}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): a hex color or a decimal read as a selector start. A `#` that starts a value
   * and a `.` before a digit stay in the value, so the `var()` after them keeps its empty
   * fallback and the group keeps its rule.
   *
   * Reverse check: leaving an item's value on every `#` and `.` fails these rows.
   */
  test.each([
    ['{bg:#fff|var(--x,)}', '@layer utilities{.\\{bg\\:\\#fff\\|var\\(--x\\,\\)\\}{background:#fff var(--x,)}}'],
    ['{box-shadow:0|0|1px|#000,var(--x,)}', '@layer utilities{.\\{box-shadow\\:0\\|0\\|1px\\|\\#000\\,var\\(--x\\,\\)\\}{box-shadow:0 0 1px #000,var(--x,)}}'],
    ['{transition:opacity|.3s|var(--x,)}', '@layer utilities{.\\{transition\\:opacity\\|\\.3s\\|var\\(--x\\,\\)\\}{transition:opacity 0.3s var(--x,)}}']
  ])('%s keeps its rule', (className, text) => {
    expect(generateText(className)).toBe(text)
  })
})

// Not concurrent: a slow run here must not push the tests above past their timeout.
describe('long classes', () => {
  /**
   * Guards (#234): reading the function name past an item key in linear time. Classes come from
   * untrusted markup and the runtime parses them in the browser; a backtracking search for the
   * last name took 1.2 s on a 30,000-character class where the base took about 6 ms.
   * Trade-off: a wall-clock bound, about twenty times the linear time on a loaded machine, which
   * the quadratic form overshoots several times over at this length.
   *
   * Reverse check: reading the name with `search(/[-\w]*$/)` again fails only this test.
   */
  test('reads the function name of a 50,000-character class in linear time', () => {
    const name = 'a'.repeat(50_000)
    const start = performance.now()
    expect(generateText(`fg:calc(${name}+b(1,))`)).toBe('')
    expect(generateText(`{${name}:b(1,)}`)).toBe('')
    expect(performance.now() - start).toBeLessThan(1_000)
  })

  /**
   * Guards (#234): unnamed parentheses re-reading the name they inherit. Each `(1,)` inside a
   * function with a long name read that whole name again to decide the `var()` exemption, so this
   * 80,000-character class took about 2 s where the base took about 13 ms. The verdict is now
   * decided once where the named function opens.
   * Trade-off: a wall-clock bound, like the test above.
   *
   * Reverse check: deciding the exemption from the inherited name at every `)` again fails only
   * this test.
   */
  test('decides the exemption of a long function name once for its unnamed parentheses', () => {
    const start = performance.now()
    expect(generateText(`fg:calc(${'a'.repeat(40_000)}(${'(1,),'.repeat(8_000)}))`)).toBe('')
    expect(performance.now() - start).toBeLessThan(1_000)
  })
})

describe.concurrent('generateGroupItem', () => {
  /**
   * Guards (#234): an invalid class generated earlier on the same long-lived instance (the
   * runtime, a build) leaving its rejection behind, so a later group drops an item it should write
   * raw. `fg:red,` must not stop `{display:flex;foo-bar:1}` from keeping `foo-bar:1`.
   *
   * Reverse check: not clearing the rejection when `generateGroupItem` starts fails this test.
   */
  test('starts each item without an earlier class\'s rejection', () => {
    const css = createDefaultCSS()
    css.ensureClassRules('fg:red,')
    css.ensureClassRules('{display:flex;foo-bar:1}')
    expect(css.text).toBe('@layer utilities{.\\{display\\:flex\\;foo-bar\\:1\\}{display:flex;foo-bar:1}}')
  })

  /**
   * Guards (#234): an item one candidate rejects for its value while another generates it. With a
   * radius token `0`, `r:0/50%` reads as `0` with an alpha the radius cannot take, but the native
   * `border-radius:0/50%` declaration is valid, so the group keeps it.
   *
   * Reverse check: returning `undefined` whenever a candidate was rejected, even with rules,
   * fails this test and the nested-item test below.
   */
  test('keeps an item that generates rules though a candidate was rejected', () => {
    const css = StetCSS.create({
      manifest: createManifestWithVariables([
        { name: 'radius-0', key: '0', namespace: 'radius', type: 'number', value: '0', numeric: { value: 0, unit: '' } }
      ]),
      nativeDeclarationMatcher: ({ property }) => property === 'border-radius'
    })
    css.ensureClassRules('{r:0/50%}')
    expect(css.utilitiesLayer.text).toBe('@layer utilities{.\\{r\\:0\\/50\\%\\}{border-radius:0/50%}}')
  })

  /**
   * Guards (#234): a nested group's items leaking their rejections into the item that holds it.
   * `{stroke:red/50}@base@component` matches nothing because it names two layers; its own item
   * `stroke:red/50` generates a rule after a color candidate rejects the alpha `50`. That
   * rejection belongs to the inner item, so the outer item is `[]`, not `undefined`.
   * Trade-off: the review also proposed pinning `{fg:blue;{stroke:red/50}@base@component}`, which
   * writes the nested group as a raw declaration; that output is dead CSS, so the test asserts the
   * method's result instead.
   *
   * Reverse check: not restoring the outer rejection after an item fails this test.
   */
  test('keeps a nested item\'s rejection out of the outer item', () => {
    expect(createDefaultCSS().generateGroupItem('{stroke:red/50}@base@component')).toEqual([])
  })
})
