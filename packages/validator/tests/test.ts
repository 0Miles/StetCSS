import { test, it, expect } from 'vitest'
import { generateValidRules, validate } from '../src'
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
 * Guards #81: a static build dropped a whole group when one declaration was
 * invalid, while runtime and native CSS drop only that declaration. The
 * scanner inserts exactly these rules, so the text is the build output.
 * `validate()` must still report the bad declaration for lint.
 *
 * Reverse check: returning `[]` instead of the reduced group in
 * `generate-valid-rules.ts` reddens the reduced-group rows only.
 */
it.each([
  ['{display:banana;bg:red}', '.\\{display\\:banana\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{flex:col;bg:red}', '.\\{flex\\:col\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{top:48;bg:red}', '.\\{top\\:48\\;bg\\:red\\}{background-color:var(--color-red)}'],
  ['{made-up:x;bg:red;fg:blue}', '.\\{made-up\\:x\\;bg\\:red\\;fg\\:blue\\}{background-color:var(--color-red);color:var(--color-blue)}'],
  ['{text-align:asdf;bg:red}:hover@sm', '@media (width>=52.125rem){.\\{text-align\\:asdf\\;bg\\:red\\}\\:hover\\@sm:hover{background-color:var(--color-red)}}']
])('drops only the invalid declaration of group %s', (className, text) => {
  expect(generateValidRules(className).map((rule) => rule.text)).toEqual([text])
  expect(validate(className).errors).toHaveLength(1)
})

it('drops a group whose declarations are all invalid', () => {
  expect(generateValidRules('{display:banana;top:48}')).toHaveLength(0)
})

it('fairly irregular classes can be ignored very well', () => {
  expect(generateValidRules('shadow:rgba(45,43,37,0.05)|0|-1|0|0|inset,rgba(15,14,12,')).toHaveLength(0)
})
