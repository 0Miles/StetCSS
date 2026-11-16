import { expect, test } from 'vitest'
import { createLanguageCSS, generateCSS } from '../src/master-css'
import { createPresetManifest } from './helpers/create-preset-manifest'

/**
 * Prevents (#69): a class naming a mode the project does not declare (`@dark` when only `sepia`
 * is declared) throwing out of `generateCSS`, which feeds hover and completion documentation, so
 * one such class aborts the editor request; the other classes in the call still render.
 * Reverse-checked: removing the catch around `ensureClassRules` in `generateCSS` reds this test.
 */
test('skips a class using an undeclared mode and keeps the rest', () => {
  const css = createLanguageCSS(createPresetManifest({ settings: { modes: ['sepia'] } }))

  const text = generateCSS(['fg:red@dark', 'fg:blue'], css)

  expect(text).toContain('.fg\\:blue{')
  expect(text).not.toContain('fg\\:red\\@dark')
})
