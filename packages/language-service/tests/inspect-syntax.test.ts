import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { Position } from 'vscode-languageserver-textdocument'
import dedent from 'ts-dedent'
import { Settings } from '../src'

export const inspect = (target: string, settings: Settings = {}) => {
  const content = `export default () => <div className='${target}'></div>`
  const doc = createDoc('tsx', content)
  const range = getRange(target, doc)
  const languageService = new CSSLanguageService(settings)
  return languageService.inspectSyntax(doc, range?.start as Position)
}

test.concurrent('text-center', async () => {
  const target = 'text-center'
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .text-center {
          text-align: center
        }
      }
      \`\`\`
    `
  })
})

test.concurrent('hidden', async () => {
  const target = 'hidden'
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .hidden {
          display: none
        }
      }
      \`\`\`
    `
  })
})

test.concurrent('vendor-prefixed native declarations use unprefixed MDN hover syntax', () => {
  for (const property of ['-webkit-text-size-adjust', '-moz-text-size-adjust', '-ms-text-size-adjust']) {
    const hover = inspect(property + ':none')
    const contents = hover?.contents as { value?: string } | undefined

    expect(contents?.value).toContain(`${property}: none`)
    expect(contents?.value).toContain(`.${property}\\:none`)
  }
})

/**
 * Prevents (#69): hovering a class that names a mode the project does not declare throwing out of
 * the hover request instead of telling the developer what is wrong.
 * Reverse-checked: removing the catch in `inspect-syntax.ts` reds this test (the hover throws).
 */
test('explains a class using an undeclared mode on hover', () => {
  const hover = inspect('fg:red@dark', { manifest: { version: 1, settings: { modes: ['sepia'] } } })

  expect(hover?.contents).toEqual({ kind: 'markdown', value: expect.stringContaining('mode "dark", which is not declared') })
})

/**
 * Prevents (#240): hovering a class in an attribute spelled with a character reference, as in
 * `block&#32;hidden`, reading the whole attribute as one class the build never generates and
 * showing no CSS, while the build generates `.block` and `.hidden`; and hovering one in text the
 * build reads as written (a lit template) showing CSS the build never generates. The hover covers
 * the class where it is spelled.
 * Reverse-checked: dropping the HTML decoder for `class` attributes in `@stet-css/language` reds
 * the HTML row; returning the cursor scan's class without trying oxc when it holds a `&` reds the
 * JSX row.
 */
test('hovers a class that an attribute separates with a character reference', () => {
  const hoverAt = (ext: Parameters<typeof createDoc>[0], content: string) => {
    const doc = createDoc(ext, content)
    const start = content.indexOf('hidden')
    return { doc, start, hover: new CSSLanguageService().inspectSyntax(doc, doc.positionAt(start + 1)) }
  }
  for (const [ext, content] of [
    ['html', '<div class="block&#32;hidden"></div>'],
    ['tsx', 'export default () => <div className="block&#32;hidden" />']
  ] as const) {
    const { doc, start, hover } = hoverAt(ext, content)
    expect(hover?.contents, ext).toEqual({ kind: 'markdown', value: expect.stringContaining('.hidden {\n    display: none') })
    expect(hover?.range, ext).toEqual({ start: doc.positionAt(start), end: doc.positionAt(start + 'hidden'.length) })
  }
  // The build reads a template literal as written: `block&#32;hidden` is no class it generates.
  expect(hoverAt('ts', 'const t = html`<p class="block&#32;hidden"></p>`').hover).toBeUndefined()
})
