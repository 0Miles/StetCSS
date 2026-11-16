import { expect } from 'vitest'

export function findStylesheetHrefs(html: string) {
  return [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)]
    .map((match) => match[0].match(/\bhref="([^"]+\.css)"/)?.[1])
    .filter((href): href is string => !!href)
}

/**
 * The static fixture's classes: the app's component, a server component, a `layers/`
 * component, a component of the layer it extends from outside the project root, and a
 * class only `server/` code names, beside `app/` and in no layer.
 */
export function expectStaticFixtureCSS(css: string) {
  expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
  expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
  expect(css).toMatch(/margin-top:\s*123px/)
  expect(css).toMatch(/margin-bottom:\s*77px/)
  expect(css).toMatch(/margin-left:\s*66px/)
  expect(css).toMatch(/margin-right:\s*88px/)
}
