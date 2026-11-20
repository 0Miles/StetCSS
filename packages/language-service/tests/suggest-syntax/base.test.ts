import { expect, it, test } from 'vitest'
import { hint } from './helper'

it.concurrent('types " should hint completions', () => expect(hint('')?.length).toBeGreaterThan(0))
it.concurrent('types   should hint completions', () => expect(hint('text-center ')?.length).toBeGreaterThan(0))
it.concurrent('types dynamic enum key should hint enum values', () => {
  expect(hint('user-select:')?.some(({ label }) => label === 'none')).toBe(true)
  expect(hint('line-clamp:')?.some(({ label }) => label === 'none')).toBe(true)
})

test.todo('types any trigger character in "" should not hint')
test.todo(`types any trigger character in '' should not hint`)
test.todo('emit class="" should hint completions')

/**
 * Prevents (#240): completion after a class that a character reference separates, as in
 * `block&#32;user-select:`, querying `block&#32;user-select:` as one class and offering nothing.
 * Reverse-checked: dropping the HTML decoder from `getAttributeCharacterReferences` in
 * `@stet-css/language` reds this test.
 */
it.concurrent('completes a class that an attribute separates with a character reference', () => {
  expect(hint('block&#32;user-select:')?.some(({ label }) => label === 'none')).toBe(true)
})
