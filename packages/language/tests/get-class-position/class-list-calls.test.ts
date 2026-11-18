import { expect, test } from 'vitest'
import { getClassPositions, languageSettings } from '../../src'
import createDoc from '../helpers/create-doc'

/**
 * Fault: the oxc scan matched a class function against the whole callee, so the
 * `classList.add/remove/toggle/replace` defaults found only a bare `classList` and missed
 * `element.classList.add(…)`. Script files (.js, .ts, .tsx) take the oxc scan, so `stetcss lint`
 * neither reported nor fixed those class lists, while the regex scan for markup found them. A
 * callee matches by any dotted suffix of its static names, the rule ESLint's define-visitors.ts
 * applies too (tests/issues/198.test.ts there holds the same cases).
 *
 * Reverse check: matching only the whole callee name turns the six member-call cases red and leaves
 * the bare and unrelated-method cases green; matching the callee source tail, as before, turns
 * the optional, non-null and computed cases red.
 */
const tokensOf = (code: string) => getClassPositions(createDoc('ts', code), languageSettings, { provider: 'oxc' })
  .map((position) => position.token)

test.each([
  ['a bare classList', `classList.add('block fg:white')`],
  ['an element', `element.classList.add('block fg:white')`],
  ['a member chain', `document.body.classList.toggle('block fg:white', on)`],
  ['a this chain', `this.el.classList.replace('block', 'fg:white')`],
  ['an optional chain', `element.classList?.add('block fg:white')`],
  ['a non-null assertion', `element.classList!.add('block fg:white')`],
  ['a computed string key', `element['classList'].add('block fg:white')`]
])('reads classList calls on %s', (_, code) => {
  expect(tokensOf(code)).toEqual(['block', 'fg:white'])
})

test('skips other classList methods', () => {
  expect(tokensOf(`element.classList.contains('block fg:white')`)).toEqual([])
})

test('skips a computed identifier key, which reads a variable', () => {
  expect(tokensOf(`element[classList].add('block fg:white')`)).toEqual([])
})
