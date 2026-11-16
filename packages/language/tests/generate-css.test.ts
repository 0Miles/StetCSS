import { expect, test } from 'vitest'
import { createLanguageCSS, defaultCSSLanguageRuntime, generateCSS, type CSSLanguageRuntime } from '../src/stet-css'
import { createPresetManifest } from './helpers/create-preset-manifest'

const hookRuntime: CSSLanguageRuntime = {
  ...defaultCSSLanguageRuntime,
  generateRules: (css, className) => css.generate(className)
}

/**
 * Prevents (#69): a class naming a mode the project does not declare (`@dark` when only `sepia`
 * is declared) throwing out of `generateCSS`, which feeds hover and completion documentation, so
 * one such class aborts the editor request; the other classes in the call still render. Covers
 * the engine path and a runtime-supplied `generateRules` hook (the language server's).
 * Reverse-checked: calling the hook / `css.generate` directly in `tryGenerateLanguageRules`
 * instead of through `tryGenerate` reds both rows.
 */
test.each([
  ['engine', defaultCSSLanguageRuntime],
  ['runtime generateRules hook', hookRuntime]
])('skips a class using an undeclared mode and keeps the rest: %s', (_, runtime) => {
  const css = createLanguageCSS(createPresetManifest({ settings: { modes: ['sepia'] } }), runtime)

  const text = generateCSS(['fg:red@dark', 'fg:blue'], css, runtime)

  expect(text).toContain('.fg\\:blue{')
  expect(text).not.toContain('fg\\:red\\@dark')
})
