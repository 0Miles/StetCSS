import { describe, expect, test } from 'vitest'
import {
  inspectStetCSSClass,
  normalizeStetCSSNumericValue
} from '../src/inspect'
import { createDefaultCSS } from './helpers/css-tester'

describe('class inspection', () => {
  test('inspects key/value utilities with variants and token metadata', () => {
    const css = createDefaultCSS()
    const inspection = inspectStetCSSClass(css, 'fg:red-60:hover@sm')

    expect(inspection).toMatchObject({
      className: 'fg:red-60:hover@sm',
      base: 'fg:red-60',
      suffix: ':hover@sm',
      key: 'fg',
      value: 'red-60',
      keyToken: 'fg:',
      valueToken: 'red-60',
      stateToken: ':hover@sm',
      matcherTypes: ['key']
    })
    expect(inspection.rules).toHaveLength(1)
    expect(inspection.variables.has('red-60')).toBe(true)
    expect(inspection.variableEntries.some(({ key }) => key === 'red-60')).toBe(true)
  })

  test('inspects static utilities and important suffixes', () => {
    const css = createDefaultCSS()

    expect(inspectStetCSSClass(css, 'block:hover')).toMatchObject({
      base: 'block',
      suffix: ':hover',
      stateToken: ':hover'
    })
    expect(inspectStetCSSClass(css, 'm:16px!@sm')).toMatchObject({
      base: 'm:16px',
      suffix: '!@sm',
      key: 'm',
      value: '16px',
      keyToken: 'm:',
      valueToken: '16px',
      stateToken: '@sm',
      important: true
    })
  })

  test('falls back to lexical class parts for unknown classes', () => {
    const css = createDefaultCSS()

    expect(inspectStetCSSClass(css, 'unknown:1.5:hover')).toMatchObject({
      rules: [],
      base: 'unknown:1.5',
      suffix: ':hover',
      key: 'unknown',
      value: '1.5',
      matcherTypes: []
    })
  })

  /**
   * Prevents: lint's canonical-class suggestions treating `4x` as a length after `x` stopped
   * being a spacing multiple (#162), so `m:4x` would still be offered as `m:1rem`'s token.
   * Reverse-checked: returning `{ kind: 'rem', value: numericValue / 4 }` for `x` reds only this test.
   */
  test('normalizes number, rem and px numeric values, and leaves x alone', () => {
    expect(normalizeStetCSSNumericValue(1)).toEqual({ kind: 'number', value: 1 })
    expect(normalizeStetCSSNumericValue('1rem')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeStetCSSNumericValue('16px')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeStetCSSNumericValue('4x')).toBeUndefined()
    expect(normalizeStetCSSNumericValue('50%')).toBeUndefined()
  })
})
