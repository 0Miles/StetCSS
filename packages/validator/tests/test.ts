import { test, it, expect } from 'vitest'
import { createCSSWithNativeDeclarations, generateValidRules, isClassValid, validate } from '../src'
import defaultManifest from '../src/default-manifest'
import expectClassWithErrors from './utils/expect-class-with-errors'
import expectClassWithoutErrors from './utils/expect-class-without-errors'
import expectClassInvalid from './utils/expect-class-invalid'
import expectClassValid from './utils/expect-class-valid'

it('validate an invalid CSS property value', () => {
  expectClassWithErrors('text-align:asdf')
  expectClassInvalid('text-align:asdf')
})

it('validate valid classes', () => {
  expectClassWithoutErrors('text-center')
  expectClassWithoutErrors('font:.75rem@media(print)')
  expectClassWithoutErrors('mt:var(--top)')
  expectClassWithoutErrors('right:max(0px,calc(50%-45.3125rem))')
  expectClassWithoutErrors('{text-wrap:pretty}')
  expectClassWithoutErrors('{content:\'\';block}::after@light')
  expect(validate('bg:light-dark(#333b3c,#efefec)').errors).toEqual([])
  expectClassValid('text-center')
  expectClassValid('font:.75rem@media(print)')
  expectClassValid('mt:var(--top)')
  expectClassValid('right:max(0px,calc(50%-45.3125rem))')
  expectClassValid('{text-wrap:pretty}')
  expectClassValid('{content:\'\';block}::after@light')
})

it('create rules by class', () => {
  expect(generateValidRules('text-center')).toHaveLength(1)
  expect(generateValidRules('text:cente')).toHaveLength(0)
})

it('validates native CSS declarations through css-tree fallback', () => {
  expect(generateValidRules('float:left')[0]?.text).toBe('.float\\:left{float:left}')
  expect(generateValidRules('display:block')[0]?.text).toBe('.display\\:block{display:block}')
  expect(generateValidRules('field-sizing:content')[0]?.text).toBe('.field-sizing\\:content{field-sizing:content}')
  expect(generateValidRules('transition-behavior:allow-discrete')[0]?.text)
    .toBe('.transition-behavior\\:allow-discrete{transition-behavior:allow-discrete}')
  expect(generateValidRules('view-transition-name:hero')[0]?.text)
    .toBe('.view-transition-name\\:hero{view-transition-name:hero}')
  expect(generateValidRules('color:oklch(63.7%|0.237|25.331)')[0]?.text)
    .toBe('.color\\:oklch\\(63\\.7\\%\\|0\\.237\\|25\\.331\\){color:oklch(63.7% 0.237 25.331)}')
  expect(generateValidRules('--foo:123')[0]?.text).toContain('{--foo:123}')
  expect(generateValidRules('flex-wrap:nowrap')[0]?.text).toBe('.flex-wrap\\:nowrap{flex-wrap:nowrap}')
  expect(generateValidRules('text-wrap:pretty')[0]?.text).toBe('.text-wrap\\:pretty{text-wrap:pretty}')

  expect(generateValidRules('$foo:123')).toHaveLength(0)
  expect(generateValidRules('mt:$(top)')).toHaveLength(0)
  expect(generateValidRules('made-up:left')).toHaveLength(0)
  expect(generateValidRules('float:banana')).toHaveLength(0)
  expect(generateValidRules('display:banana')).toHaveLength(0)
  expect(generateValidRules('d:banana')).toHaveLength(0)
})

/**
 * Guards: static CSS emits invalid native declarations such as
 * `.display\:banana{display:banana}` when the css-tree matcher regresses.
 * `generateValidRules` re-validates its rules afterwards, so the css-tree fallback
 * test above stays green even with a matcher that accepts everything; this runs
 * the instance the stylesheet, scanner and CLI build CSS with.
 *
 * Reverse check: making `cssTreeNativeDeclarationMatcher` in
 * `src/native-declaration.ts` return `true` reddens all three rows.
 */
it.each(['display:banana', 'float:banana', 'made-up:left'])('keeps %s out of the generated CSS', (className) => {
  const css = createCSSWithNativeDeclarations(defaultManifest)
  css.ensureClassRules(className)
  expect(css.text).toBe('')
})

/**
 * Guards: lint and builds counted `flex:col` as valid because its value parsed
 * as the pseudo-class `:col`. This runs the real css-tree matcher the build
 * plugins and lint use, which the engine tests only imitate.
 *
 * Reverse check: removing the `valid: false` spread from `flushRaw` in
 * `packages/engine/src/utility.ts` and rebuilding reddens all five rows and
 * the `flex-wrap:nowrap` row of the css-tree fallback test.
 */
it.each(['flex:col', 'top:48', 'block:foo', 'fg:red:col', 'flex:col@sm'])('rejects %s, whose value parses as an unknown pseudo-class', (className) => {
  expectClassInvalid(className)
})

/**
 * Guards #81: scanner-served build CSS dropped a whole group when one
 * declaration was invalid, while runtime and native CSS drop only that
 * declaration. The scanner inserts exactly these rules, so the text is its
 * build output.
 *
 * Reverse check: making `getValidGroupDeclarations` return `undefined` in
 * `generate-valid-rules.ts` reddens the five rows of this test only.
 */
it.each([
  ['{display:banana;bg:red}', '.\\{display\\:banana\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{flex:col;bg:red}', '.\\{flex\\:col\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{top:48;bg:red}', '.\\{top\\:48\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{made-up:x;bg:red;fg:blue}', '.\\{made-up\\:x\\;bg\\:red\\;fg\\:blue\\}{background-color:var(--color-red);color:var(--color-blue)}'],
  ['{text-align:asdf;bg:red}:hover@sm', '@media (width>=52.125rem){.\\{text-align\\:asdf\\;bg\\:red\\}\\:hover\\@sm:hover{background-color:var(--color-red)}}']
])('drops only the invalid declaration of group %s', (className, text) => {
  expect(generateValidRules(className).map((rule) => rule.text)).toEqual([text])
})

/**
 * Guards #81: keeping a group's valid declarations for the build must not
 * hide the invalid one from lint and ESLint, which report through `validate()`.
 *
 * Reverse check: making `validate()` skip a rule's errors when it is a group
 * reddens only this test.
 */
it('still reports the invalid declaration of a group', () => {
  expect(validate('{display:banana;bg:red}').errors.map(({ message }) => message))
    .toEqual(['Invalid value for `display` property'])
})

/**
 * Guards #81: a group with no valid declaration left must emit nothing, not
 * an empty `{}` rule, and stay out of the scanner's valid classes.
 *
 * Reverse check: returning the empty declaration object from
 * `getValidGroupDeclarations` reddens only this test.
 */
it('drops a group whose declarations are all invalid', () => {
  expect(generateValidRules('{display:banana;top:48}')).toHaveLength(0)
})

/**
 * Guards #81's scope: only groups drop single declarations; a utility's
 * declarations all come from one value, so a bad value drops the class.
 * `grid-cols:banana` emits a valid `display:grid` next to an invalid
 * `grid-template-columns` and must not build as a bare `display:grid`.
 *
 * Reverse check: removing the group check from `getValidGroupDeclarations`
 * reddens only this test.
 */
it('drops a non-group rule with one invalid declaration whole', () => {
  expect(generateValidRules('grid-cols:banana')).toHaveLength(0)
})

it('fairly irregular classes can be ignored very well', () => {
  expect(generateValidRules('shadow:rgba(45,43,37,0.05)|0|-1|0|0|inset,rgba(15,14,12,')).toHaveLength(0)
})

/**
 * Prevents (#69): `validate()` and `isClassValid()` throwing on a class that names a mode the
 * project did not declare, which crashed ESLint `no-invalid-classes` and editor hovers instead
 * of reporting the class. They report it as an unmatched class carrying the engine's message.
 * Reverse-checked: removing the catch in `validate.ts` reds the `validate` assertion; removing
 * the catch in `is-class-valid.ts` reds the `isClassValid` assertion.
 */
it('reports a class using an undeclared mode instead of throwing', () => {
  const css = createCSSWithNativeDeclarations({ ...defaultManifest, settings: { modes: ['sepia'] } })

  expect(validate('fg:red@dark', css)).toEqual({
    matched: false,
    errors: [expect.objectContaining({ class: 'fg:red@dark', rawMessage: 'UndeclaredMode', message: expect.stringContaining('mode "dark"') })]
  })
  expect(isClassValid('fg:red@dark', css)).toBe(false)
})

/**
 * Guards #164: static builds dropped native declarations that browsers ship
 * but css-tree 3.2.1 rejects, with no warning, while the runtime kept them.
 * The text is the scanner's build output; the empty `validate()` errors keep
 * lint and the editor from flagging the classes the build now emits.
 * Reverse-checked: `validateDeclaration` in `src/validate-css.ts` calling
 * `lexer.matchProperty` directly again reds all four rows.
 */
it.each([
  ['container-type:scroll-state', '.container-type\\:scroll-state{container-type:scroll-state}'],
  ['container-type:size|scroll-state', '.container-type\\:size\\|scroll-state{container-type:size scroll-state}'],
  ['background-image:image-set(url(a.png))', '.background-image\\:image-set\\(url\\(a\\.png\\)\\){background-image:image-set(url(a.png))}'],
  ['height:calc-size(auto,size)', '.height\\:calc-size\\(auto\\,size\\){height:calc-size(auto,size)}']
])('builds %s, which css-tree rejects', (className, text) => {
  expect(generateValidRules(className).map((rule) => rule.text)).toEqual([text])
  expect(validate(className).errors).toEqual([])
})

/**
 * Guards #164's exceptions from widening at the class level: an invalid
 * value of the same property, or the construct on a property that does not
 * take it, still builds nothing and stays invalid for lint. The compiler's
 * `tests/native-declaration.test.ts` holds the full rows per exception.
 */
it.each([
  'container-type:foo',
  'background-image:image-set(foo)',
  'height:image-set(url(a.png))',
  'height:calc-size(auto)',
  'margin:calc-size(auto,size)'
])('still rejects %s', (className) => {
  expect(generateValidRules(className)).toHaveLength(0)
  expectClassInvalid(className)
})

/**
 * Guards: lint accepting a class whose selector suffix is not a selector. `validateCSS` checks
 * declarations only, so `transition:all_.3s,color_1s` (`.3s` and `1s` after `_`) and
 * `hidden:of(.a,>)` (a rule starting with `>`) passed while the browser dropped their rules.
 * Trade-off: the full rows live in the engine's `selector-suffix-names.test.ts` and
 * `of-selector-list.test.ts`; this test only keeps the validator on the engine's verdict.
 *
 * Reverse check: the engine's `isSelectorSuffix` returning `true` reddens only these two rows
 * among the validator tests.
 */
it.each([
  'transition:all_.3s,color_1s',
  'hidden:of(.a,>)'
])('reports %s as invalid', (className) => {
  expect(generateValidRules(className)).toHaveLength(0)
  expectClassInvalid(className)
  expect(validate(className).matched).toBe(false)
})

/**
 * Guards: lint and the editor disagreeing on a selector with escapes. The engine dropped every `\`
 * in a class selector, so the validator approved `:is(.literal:first-child)` for
 * `block:is(.literal\:first)`, a rule for an element nobody named, and `.a` inside `@sm` for
 * `block.a\@sm`. The validator passes the escaped selector the engine now emits, the same one
 * class the editor colours.
 * Trade-off: the engine's `selector-escapes.test.ts` holds the parsing rows; this keeps the
 * validator on the engine's output.
 *
 * Reverse check: dropping the escape alternative from the engine's `SELECTOR_REGEX` (then
 * `bun run build`) reddens only these rows among the validator tests; dropping the `\\` branch of
 * the engine's `splitStateToken` reddens only the `\@sm` row.
 */
it.each([
  ['block:is(.literal\\:first)', '.block\\:is\\(\\.literal\\\\\\:first\\):is(.literal\\:first){display:block}'],
  ['block:is(.a\\.b)', '.block\\:is\\(\\.a\\\\\\.b\\):is(.a\\.b){display:block}'],
  ['block.a\\@sm', '.block\\.a\\\\\\@sm.a\\@sm{display:block}']
])('validates %s with its escapes kept', (className, text) => {
  expect(generateValidRules(className).map((rule) => rule.text)).toEqual([text])
  expectClassValid(className)
})

/**
 * Guards: an escaped `@` in the conditions. Only the selector keeps `\@` in a name; with the escape
 * rule reaching the conditions, `block@sm\@md` became one condition and the engine emitted the
 * invalid `@media (…) (…)`, which the validator rejected. The conditions split at every `@`, so the
 * class keeps its `and`-joined media query and stays valid.
 *
 * Reverse check: skipping `\` in the conditions in the engine's `splitStateToken` (then
 * `bun run build`) reddens only this row among the validator tests.
 */
it('validates block@sm\\@md with its conditions joined', () => {
  expect(generateValidRules('block@sm\\@md').map((rule) => rule.text))
    .toEqual(['@media (width>=52.125rem) and (width>=64rem){.block\\@sm\\\\\\@md{display:block}}'])
  expectClassValid('block@sm\\@md')
})

/**
 * Guards (#234): lint and the build accepting a class whose value the engine now rejects. An open
 * function with an empty argument, and a group with an invalid item, used to emit a declaration
 * native CSS drops; `generateValidRules` even kept `{fg:red;bg:blue,}`'s `color` as a valid group
 * declaration. Trade-off: the full rows live in the engine's `value-list-commas.test.ts` and
 * `group-items.test.ts`; this test only keeps the validator on the engine's verdict. The
 * `fg:rgb(1,` row already passed before #234, since css-tree drops `color:rgb(1,)`; it stays to
 * record the ticket's criterion, not to catch the engine change.
 *
 * The last twelve rows hold an empty function argument in an item's selector, at-rule or raw
 * declaration, which no item rule checks; they keep the group's own parse rejecting them, also
 * when the name in the selector or at-rule is one a value may leave empty (`env`, `url`, `var`),
 * whichever sign starts the selector, and when the selector follows a value-less key or a nested
 * group's first `:`.
 *
 * Reverse check: with the engine source before #234, the three group rows after `fg:rgb(1,` fail;
 * skipping the empty-argument check on a group's own parse fails the nine rows after them;
 * exempting `env`, `url` and `var` outside an item's value fails the five rows from
 * `{fg:red@env(a,)}` to `{fg:red[url(,)]}`; leaving an item's value only on `;`, `:` and `@` fails the three rows from
 * `{fg:red>url(,.a)}`; writing an item raw whose first `:` starts a state fails the last three.
 */
it.each([
  'fg:rgb(1,',
  '{fg:red,}',
  '{fg:red;bg:blue,}',
  '{fg:rgb(}',
  '{fg:red:not(,.a)}',
  '{fg:red@media(a,)}',
  '{fg:red;bg:blue:is(.a,)}',
  '{fg:red;foo$:rgb(1,2,)}',
  '{fg:red@env(a,)}',
  '{fg:red:url(,.a)}',
  '{fg:red>url(,.a)}',
  '{fg:red;bg:blue~var(,.a)}',
  '{fg:red[url(,)]}',
  '{fg:red;block:url(,.a)}',
  '{hidden:env(a,)}',
  '{fg:red;{bg:blue}:url(,)}'
])('reports %s, whose value is invalid, as unmatched', (className) => {
  expect(generateValidRules(className)).toHaveLength(0)
  expectClassInvalid(className)
  expect(validate(className).matched).toBe(false)
})
