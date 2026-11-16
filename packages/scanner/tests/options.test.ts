import { describe, expect, test } from 'vitest'
import CSSScanner, { validatePluginOptions } from '../src'

describe('scanner options', () => {
  /**
   * Guards that a removed option fails loudly and names what replaces it: silently ignoring
   * `blocklist` would ship the classes a project meant to block, with nothing telling the
   * developer to move the list to `@blocklist`.
   * Reverse check: skipping the removed-key lookup in `validateOptions` turns this test and the
   * build plugin one red.
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
   * Reverse check: accepting unknown keys in `validateOptions` turns this test and the build
   * plugin one red.
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

describe('build plugin options', () => {
  /**
   * Guards that a build plugin config written for the removed options fails at config time
   * and says what replaces each: silently ignoring `mode: 'runtime'` or `injectRuntime` would
   * ship a page without the runtime the project expected, and ignoring a nested `scanner`
   * would drop its adapters.
   * Reverse check: skipping the removed-key lookup in `validateOptions` turns this test and the
   * scanner one red.
   */
  test.each([
    ['mode', 'runtime', 'static CSS is the only output'],
    ['injectRuntime', true, '@stet-css/runtime'],
    ['avoidFOUC', true, 'static CSS'],
    ['scanner', { adapters: [] }, '"adapters"'],
    ['scannerOptions', { adapters: [] }, '"adapters"'],
    ['safelist', ['block'], '@safelist'],
    ['exclude', ['**/*.test.ts'], '@source not']
  ])('rejects the removed "%s" option with its replacement', (key, value, replacement) => {
    const validate = () => validatePluginOptions({ [key]: value }, '@stet-css/vite')

    expect(validate).toThrow(`@stet-css/vite option "${key}" was removed`)
    expect(validate).toThrow(replacement)
  })

  /**
   * Guards that a typo in a build plugin's options errors and names the one allowed key.
   * Reverse check: accepting unknown keys in `validateOptions` turns this test and the scanner
   * one red.
   */
  test('rejects unknown options and names "adapters"', () => {
    expect(() => validatePluginOptions({ adapter: [] }, '@stet-css/next'))
      .toThrow('Unknown @stet-css/next option "adapter"; the only option is "adapters".')
  })

  /**
   * Guards the setup most projects write, `masterCSS()` with no argument, and the one allowed
   * key: rejecting either would break every build.
   * Reverse check: throwing on `undefined` in `validatePluginOptions` turns only this test red.
   */
  test('accepts no options and adapters', () => {
    expect(() => validatePluginOptions(undefined, '@stet-css/vite')).not.toThrow()
    expect(() => validatePluginOptions({ adapters: [] }, '@stet-css/vite')).not.toThrow()
  })
})
