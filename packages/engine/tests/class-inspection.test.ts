import { describe, expect, test } from 'vitest'
import {
  inspectStetCSSClass,
  normalizeStetCSSNumericValue
} from '../src/inspect'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

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

  test('normalizes number, rem, px, and base-unit numeric values', () => {
    const css = createDefaultCSS()

    expect(normalizeStetCSSNumericValue(css, 1)).toEqual({ kind: 'number', value: 1 })
    expect(normalizeStetCSSNumericValue(css, '1rem')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeStetCSSNumericValue(css, '16px')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeStetCSSNumericValue(css, '4x')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeStetCSSNumericValue(css, '50%')).toBeUndefined()
  })

  /**
   * Prevents: lint's canonical-class suggestions treating `x` values as equal to the wrong rem
   * length under a non-default `base-unit`: under `4px`, `4x` must equal `1rem`; under `1em`,
   * `4x` has no fixed rem length, so it must not count as equal to any rem or px value.
   * Reverse-checked: in `inspect.ts`, dropping `/ ROOT_FONT_SIZE` from the px branch reds the
   * `4px` row only; returning `{ kind: 'rem', value: numericValue * baseUnit.value }` from the
   * default branch reds the `1em` row only.
   */
  test.each([
    { baseUnit: '4px', expected: { kind: 'rem', value: 1 } },
    { baseUnit: '1em', expected: undefined }
  ])('normalizes 4x under base-unit $baseUnit', ({ baseUnit, expected }) => {
    const manifest = cloneManifest()
    manifest.settings = { ...manifest.settings, baseUnit }

    expect(normalizeStetCSSNumericValue(StetCSS.create({ manifest }), '4x')).toEqual(expected)
  })
})
