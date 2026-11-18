import { expect, test } from 'vitest'
import { getClassPositions, languageSettings } from '../../src'
import createDoc, { languageIdOfExt } from '../helpers/create-doc'

/**
 * Fault (#198): text beside a runtime expression shared one context with the expression source
 * and with the whole classes around it, so `stetcss lint --fix`, which edits a context as one class
 * list, sorted expression source and class fragments into it. Expression spans now bound contexts,
 * and a class touching one is a `fragment` in a context of its own.
 *
 * Reverse check: finding no expression spans turns the Svelte and Vue cases red; giving oxc
 * template expressions no neighbours turns the .tsx case red.
 */
const contextsOf = (ext: keyof typeof languageIdOfExt, code: string, provider: 'oxc' | 'regex') =>
  getClassPositions(createDoc(ext, code), languageSettings, { provider })
    .map(({ contextRange, token, fragment }) => [code.slice(contextRange.start, contextRange.end), token, !!fragment])

test('a Svelte attribute value', () => {
  expect(contextsOf('svelte', `<div class="bg:{color}-50 fg:white {on ? 'a b' : ''} block"></div>`, 'regex')).toEqual([
    ['bg:', 'bg:', true],
    ['-50', '-50', true],
    [' fg:white ', 'fg:white', false],
    [' block', 'block', false]
  ])
})

test('a Vue :class template', () => {
  expect(contextsOf('vue', "<template><div :class=\"`x${on ? 'a b' : ''} fg:white`\"></div></template>", 'regex')).toEqual([
    ['x', 'x', true],
    [' fg:white', 'fg:white', false]
  ])
})

test('a .tsx className template', () => {
  expect(contextsOf('tsx', "<div className={`x${on ? 'a b' : ''} fg:white`} />", 'oxc')).toEqual([
    ['x', 'x', true],
    ['a', 'a', true],
    [' b', 'b', false],
    [' fg:white', 'fg:white', false]
  ])
})
