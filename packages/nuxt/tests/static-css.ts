import { expect } from 'vitest'

export function findStylesheetHrefs(html: string) {
  return [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)]
    .map((match) => match[0].match(/\bhref="([^"]+\.css)"/)?.[1])
    .filter((href): href is string => !!href)
}

/** The static fixture's classes: the app's component, a server component and a layer component. */
export function expectStaticFixtureCSS(css: string) {
  expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
  expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
  expect(css).toMatch(/margin-top:\s*123px/)
  expect(css).toMatch(/margin-bottom:\s*77px/)
}
