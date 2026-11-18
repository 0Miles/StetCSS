import { describe, expect, test } from 'vitest'
import { extractClassCandidates } from '../src'
import {
  getGroupBody,
  hasBraceGroup,
  hasParenthesizedArrow,
  removeDecorators,
  removeImportCalls,
  removeImportsFrom,
  removeRequireCalls,
  trimTrailing
} from '../src/extraction-scans'

test.concurrent('extracts class candidates from mixed source strings', () => {
  const source = `
    import styles from './style.css'
    const cls = "fg:red hover:bg:blue"
    const nested = { class: 'content:"a;b" bg:url("/logo.png")' }
  `

  expect(extractClassCandidates(source)).toEqual([
    'const',
    'cls',
    'fg:red',
    'hover:bg:blue',
    'nested',
    'class',
    'content:"a;b"',
    'a;b',
    'bg:url("/logo.png")'
  ])
})

test.concurrent('keeps grouped class candidates before downstream validation', () => {
  expect(extractClassCandidates('<div class="{fg:red;bg:blue}" data-id="${id}"></div>')).toEqual([
    '{fg:red;bg:blue}'
  ])
})

test.concurrent('keeps native custom property declarations without legacy dollar assignments', () => {
  expect(extractClassCandidates('<div class="--token:1rem $token:1rem"></div>')).toEqual([
    '--token:1rem'
  ])
})

test.concurrent('drops trailing punctuation and rejects parenthesized arrows', () => {
  expect(extractClassCandidates('<div class="fg:red.:#= a(b:c)=>d bg:blue"></div>')).toEqual([
    'fg:red',
    'bg:blue'
  ])
})

/**
 * Guards: the single-pass scans give exactly what the regexes they replaced
 * gave, including the edges a rewrite gets wrong: `.` stops at line
 * terminators (`\r` too), `\S` stops at whitespace, and greedy `.*` takes the
 * last match on the line. A drift changes which candidates, and so which
 * CSS, a project gets. Expected values are the old regexes' results.
 * Reverse check: letting `hasParenthesizedArrow` ignore line terminators, or
 * `hasBraceGroup` ignore whitespace, turns only its own case red.
 */
describe.concurrent('text extraction scans', () => {
  test('hasParenthesizedArrow: a ( before a )=> on the same line', () => {
    expect(['(a)=>b', '(a\n)=>b', '(a\r\n)=>b', ')=>(a'].map(hasParenthesizedArrow)).toEqual([true, false, false, false])
  })

  test('hasBraceGroup: a { then a } with no whitespace between', () => {
    expect(['{a}', '{a b}', '{a\n}', 'x}{'].map(hasBraceGroup)).toEqual([true, false, false, false])
  })

  test('getGroupBody: first { to last } on the first line that has both', () => {
    expect(['a{b;c}d}', '{a\nb}', '{a\n{b}c}'].map(getGroupBody)).toEqual(['b;c}d', undefined, 'b}c'])
  })

  test('trimTrailing: strips the whole run of trailing ([{\\:#=.', () => {
    expect(['fg:red.:#=', 'a((', 'a.b', '([{\\:#=.'].map(trimTrailing)).toEqual(['fg:red', 'a', 'a.b', ''])
  })

  test('removeDecorators: @ lines ending in \\n, then a declaration keyword', () => {
    expect(['@a\n@b\nexport x', '@a\r\nexport x', 'x @a\nclass y', '@a\nconst x'].map(removeDecorators))
      .toEqual([' x', '@a\r\nexport x', 'x  y', '@a\nconst x'])
  })

  test('removeImportsFrom: to the sentinel after the last from on the import line', () => {
    expect([
      'import a from COMPLETE-STRING--0-- from COMPLETE-STRING--1--;',
      'import a from\nCOMPLETE-STRING--3--',
      'import a\nfrom COMPLETE-STRING--3--'
    ].map(removeImportsFrom)).toEqual([';', '', 'import a\nfrom COMPLETE-STRING--3--'])
  })

  test('removeImportCalls and removeRequireCalls: to the last ) before ; or whitespace', () => {
    expect(['import (a)b)c;d)', 'import\tCOMPLETE-STRING--2--x', 'import(a b)'].map(removeImportCalls))
      .toEqual(['c;d)', 'x', 'import(a b)'])
    expect(['require(a)b)c d)', 'require(require(a)'].map(removeRequireCalls)).toEqual(['c d)', ''])
  })
})
