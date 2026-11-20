import { expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { getClassPositions, languageSettings } from '../../src'
import createDoc from '../helpers/create-doc'
import { getClassPosition } from './test'

/**
 * The build reads class attributes by the classes the host renders, character references decoded
 * (#194), so hover, completion and lint read them the same way (#240). Read as written,
 * `block&#32;hidden` is one class the build never generates: hover shows no CSS, completion
 * queries `block&#32;hid`, and lint reports it. Each class is read at its source spelling, so
 * edits land where it is written. Expected classes are the ones the build extracts from the same
 * attributes (`@stet-css/source` tests/character-references.test.ts).
 * Reverse checks (each also reds the lint, hover or completion tests built on it):
 * - no HTML decoder for class attributes → the HTML-hosted and cursor tests;
 * - oxc reading JSX attribute strings as written → the JSX test;
 * - quoted bindings read as written → the Vue binding test;
 * - Markdown and MDX decoded like HTML → the as-written test.
 */
function readClasses(document: TextDocument, provider?: 'regex' | 'oxc') {
  const content = document.getText()
  return getClassPositions(document, languageSettings, provider && { provider }).map(({ range, raw, token }) => {
    expect(content.slice(range.start, range.end)).toBe(raw)
    return [raw, token]
  })
}

test.concurrent('reads HTML-hosted class attributes by their decoded classes', () => {
  const attribute = 'class="block&#32;hidden inline&#x2d;flex c&nbsp;d a&copyb"'
  const classes = [
    ['block', 'block'],
    ['hidden', 'hidden'],
    ['inline&#x2d;flex', 'inline-flex'],
    ['c&nbsp;d', 'c d'],
    ['a&copyb', 'a&copyb']
  ]
  for (const ext of ['html', 'vue', 'svelte', 'astro'] as const) {
    expect(readClasses(createDoc(ext, `<div ${attribute}></div>`)), ext).toEqual(classes)
  }
})

test.concurrent('reads JSX attribute strings by their decoded classes and script strings as written', () => {
  // JSX decodes only references that end in `;`; a JavaScript string holds no references.
  const document = createDoc('tsx', 'export default () => <div className="block&#32;hidden e&nbsp" data-x={ clsx(\'g&#32;h\') } />')
  const classes = [['block', 'block'], ['hidden', 'hidden'], ['e&nbsp', 'e&nbsp'], ['g&#32;h', 'g&#32;h']]
  expect(readClasses(document, 'oxc')).toEqual(classes)
  // The language service tries the regex scan first at a cursor.
  expect(readClasses(document, 'regex')).toEqual(classes)
})

test.concurrent('reads strings in a Vue class binding after the template decodes the attribute', () => {
  const document = createDoc('vue', '<div :class="[\'fg:white&#32;bg:black\', ok && `p&#32;m`, { \'x&#32;y\': ok }]"></div>')
  expect(readClasses(document)).toEqual([
    ['fg:white', 'fg:white'],
    ['bg:black', 'bg:black'],
    ['p', 'p'],
    ['m', 'm'],
    ['x', 'x'],
    ['y', 'y']
  ])
})

test.concurrent('reads class attributes as written where the build does', () => {
  // The build extracts Markdown and MDX as plain text, without decoding.
  for (const languageId of ['markdown', 'mdx']) {
    const document = TextDocument.create(`file:///abc.${languageId}`, languageId, 0, '<div class="block&#32;hidden"></div>')
    expect(readClasses(document), languageId).toEqual([['block&#32;hidden', 'block&#32;hidden']])
  }
})

test.concurrent('finds the decoded class at the cursor', () => {
  const content = '<div class="block&#32;hidden"></div>'
  const document = createDoc('html', content)
  const start = content.indexOf('hidden')
  expect(getClassPosition(document, document.positionAt(start + 3))).toMatchObject({
    range: { start, end: start + 'hidden'.length },
    raw: 'hidden',
    token: 'hidden'
  })
})
