import { describe, expect, test } from 'vitest'
import CSSScanner from '../src'

describe('scanner options', () => {
  /**
   * Guards that a removed option fails loudly and names what replaces it: silently ignoring
   * `blocklist` would ship the classes a project meant to block, with nothing telling the
   * developer to move the list to `@blocklist`.
   * Reverse check: skipping the key check in `validateScannerOptions` turns this test and the
   * unknown-key test red.
   */
  test.each([
    ['safelist', ['block'], '@safelist'],
    ['blocklist', ['block'], '@blocklist'],
    ['exclude', ['**/*.test.ts'], '@source not'],
    ['manifest', {}, '@stet-css/core'],
    ['path', '.', 'no effect'],
    ['verbose', 1, '-v']
  ])('rejects the removed "%s" option with its replacement', async (key, value, replacement) => {
    const init = new CSSScanner({ [key]: value } as never).init()

    await expect(init).rejects.toThrow(`CSSScanner option "${key}" was removed`)
    await expect(init).rejects.toThrow(replacement)
  })

  /**
   * Guards that a misspelled or invented key, such as the `sources` the webpack example once
   * passed, errors instead of being ignored, and says which key is allowed.
   * Reverse check: accepting unknown keys in `validateScannerOptions` turns only this test red.
   */
  test('rejects unknown options and names the allowed one', async () => {
    await expect(new CSSScanner({ sources: ['./src/index.html'] } as never).init())
      .rejects
      .toThrow('Unknown CSSScanner option "sources"; the only option is "adapters".')
  })

  /**
   * Guards that `adapters` stays a list: a single adapter object would otherwise fail deep in
   * extraction with an unrelated error.
   * Reverse check: dropping the array check turns only this test red.
   */
  test('rejects adapters that are not an array', async () => {
    await expect(new CSSScanner({ adapters: { name: 'one' } } as never).init())
      .rejects
      .toThrow('CSSScanner option "adapters" must be an array.')
  })
})
