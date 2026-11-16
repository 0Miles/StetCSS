import { beforeAll, describe, expect, test } from 'vitest'
import masterCSS from '../src'
import { buildProject } from './plugin-test-helper'

const builds = {
  'masterCSS()': () => masterCSS(),
  // A JavaScript config written for the removed rendering modes; types no longer accept it.
  "masterCSS({ mode: 'runtime', injectRuntime: true, avoidFOUC: true })": () =>
    masterCSS({ mode: 'runtime', injectRuntime: true, avoidFOUC: true } as never)
}
const outputs: Record<string, { css: string, html: string }> = {}

beforeAll(async () => {
  await Promise.all(Object.entries(builds).map(async ([label, plugins]) => {
    outputs[label] = await buildProject({
      plugins: [plugins()],
      prefix: 'master-css-vite-default-options-',
      html: [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head><link rel="stylesheet" href="/src/style.css" /></head>',
        '<body><h1 class="block">Hello World</h1></body>',
        '</html>'
      ].join('\n'),
      styleCSS: '@import "@stet-css/core";\n'
    })
  }))
}, 60000)

describe.each(Object.keys(builds))('%s', (label) => {
  /**
   * Guards: a Vite project gets the rules for the classes in its source in the built CSS, with
   * no options and with a JavaScript config that still passes a removed rendering mode. If the
   * plugin left rule generation to the browser, the stylesheet would ship without utilities and
   * the page would render unstyled, since nothing loads the runtime any more.
   *
   * Reverse check: on the code before #59, where `mode: 'runtime'` still selected the runtime
   * plugins, the second row of both tests failed and the first passed.
   * #66 replaces the second row with an unknown-key error.
   */
  test('builds CSS that contains the rules for classes in the source', () => {
    expect(outputs[label].css).toContain('.block{display:block}')
  })

  /**
   * Guards: the built page is plain HTML plus CSS. If the plugin injected the runtime, the page
   * would gain a script the project never wrote and `<html hidden>`, so it stays blank until
   * that script runs, and forever with JavaScript off.
   */
  test('builds HTML without a runtime script or a hidden root', () => {
    expect(outputs[label].html).not.toMatch(/<script\b/)
    expect(outputs[label].html).not.toMatch(/<html\b[^>]*\bhidden\b/)
  })
})
