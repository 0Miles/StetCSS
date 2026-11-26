import { expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { getClassPositions, languageSettings, type LanguageSettings } from '../../src'
import createDoc from '../helpers/create-doc'
import { getClassPosition } from './test'

/**
 * The build reads class attributes by the classes the host renders, character references decoded
 * (#194), so hover, completion and lint read them the same way (#240). Read as written,
 * `block&#32;hidden` is one class the build never generates: hover shows no CSS, completion
 * queries `block&#32;hid`, and lint reports it. Decoded where the build reads as written, lint
 * passes and rewrites text the build never splits. Each class is read at its source spelling,
 * so edits land where it is written. Expected classes are the ones the build extracts from the
 * same text (`@stet-css/source` tests/character-references.test.ts and its adapters).
 * Reverse checks (each also reds the lint, hover or completion tests built on it):
 * - no decoder for `class` attributes → the HTML-hosted and cursor tests; the JSX decoder in
 *   place of the HTML one → the HTML-hosted test;
 * - oxc reading JSX attribute strings as written → the JSX test;
 * - Vue `:class` bindings read as written, single-quoted ones skipped, or class functions scanned
 *   before bindings → the Vue binding test;
 * - decoding by language id instead of the file extension, inside scripts or frontmatter, or for
 *   every attribute name → the as-written test;
 * - finding `<script>`/`<style>` in comments or attribute values → the HTML-hosted test;
 * - reading a Vue root `<template lang="pug">` as markup → the as-written test; reading a nested
 *   one, an `html` one or an upper-case `LANG` as raw text → the HTML-hosted test;
 * - class function or string scans keeping their as-written reading inside a decoded `:class`
 *   binding → the Vue binding test;
 * - closing Astro frontmatter at any `---` → the as-written test.
 */
function readClasses(document: TextDocument, provider?: 'regex' | 'oxc', settings: LanguageSettings = languageSettings) {
  const content = document.getText()
  return getClassPositions(document, settings, provider && { provider }).map(({ range, raw, token }) => {
    expect(content.slice(range.start, range.end)).toBe(raw)
    return [raw, token]
  })
}

function createFileDoc(path: string, languageId: string, content: string) {
  return TextDocument.create(`file:///project/${path}`, languageId, 0, content)
}

test.concurrent('reads HTML-hosted class attributes by their decoded classes', () => {
  // HTML reads a numeric reference without its `;` too, unlike JSX.
  const attribute = 'class="block&#32;hidden inline&#x2d;flex c&nbsp;d a&copyb x&#32y"'
  const classes = [
    ['block', 'block'],
    ['hidden', 'hidden'],
    ['inline&#x2d;flex', 'inline-flex'],
    ['c&nbsp;d', 'c d'],
    ['a&copyb', 'a&copyb'],
    ['x', 'x'],
    ['y', 'y']
  ]
  for (const ext of ['html', 'vue', 'svelte', 'astro'] as const) {
    expect(readClasses(createDoc(ext, `<div ${attribute}></div>`)), ext).toEqual(classes)
  }
  // A `<script>` or `<style>` the HTML tokenizer reads as no tag (in a comment or an attribute
  // value) opens nothing, so the markup after it is still markup.
  const decoded = [['block', 'block'], ['hidden', 'hidden']]
  for (const [ext, content] of [
    ['html', '<!-- <style> moved to app.css -->\n<div class="block&#32;hidden"></div>'],
    ['vue', '<template><!-- <script> --><div class="block&#32;hidden"></div></template>'],
    ['astro', '---\nconst a = 1\n---\n<!-- <style> -->\n<div class="block&#32;hidden"></div>'],
    ['html', '<div title="<style>"></div><p class="block&#32;hidden"></p>'],
    // Vue reads a template as raw text only at the root, and only for a `lang` other than `html`.
    ['vue', '<template lang="html"><div class="block&#32;hidden"></div></template>'],
    ['vue', '<template LANG="pug"><div class="block&#32;hidden"></div></template>'],
    ['vue', '<template><template lang="pug"><div class="block&#32;hidden"></div></template></template>']
  ] as const) {
    expect(readClasses(createDoc(ext, content)), content).toEqual(decoded)
  }
})

test.concurrent('reads JSX attribute strings by their decoded classes and script strings as written', () => {
  // JSX decodes only references that end in `;`; a JavaScript string holds no references.
  const document = createDoc('tsx', 'export default () => <div className="block&#32;hidden e&nbsp" data-x={ clsx(\'g&#32;h\') } />')
  expect(readClasses(document, 'oxc')).toEqual([['block', 'block'], ['hidden', 'hidden'], ['e&nbsp', 'e&nbsp'], ['g&#32;h', 'g&#32;h']])
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
  // A class function's string inside the binding is read as the binding reads it.
  expect(readClasses(createDoc('vue', '<template><div :class="[ clsx(\'inline&#x2d;flex\') ]"></div></template>')))
    .toEqual([['inline&#x2d;flex', 'inline-flex']])
  // Only as the binding reads it, also where a reference splits the string into classes.
  expect(readClasses(createDoc('vue', '<template><div :class="[ clsx(\'block&#32;hidden\') ]"></div></template>')))
    .toEqual([['block', 'block'], ['hidden', 'hidden']])
  // A binding configured with single quotes is an attribute value as well.
  const singleQuoted = { ...languageSettings, classAttributeBindings: { ...languageSettings.classAttributeBindings, ':class': ['\'', '\''] as [string, string] } }
  expect(readClasses(createDoc('vue', '<template><div :class=\'["block&#32;hidden"]\'></div></template>'), undefined, singleQuoted))
    .toEqual([['block', 'block'], ['hidden', 'hidden']])
})

test.concurrent('reads class attributes as written where the build does', () => {
  const asWritten = [['block&#32;hidden', 'block&#32;hidden']]
  const attribute = '<div class="block&#32;hidden"></div>'
  // Files the build extracts as plain text, whatever language they are read as.
  for (const [path, languageId] of [
    ['index.php', 'html'],
    ['index.pug', 'html'],
    ['notes.txt', 'html'],
    ['README.md', 'markdown'],
    ['content.mdx', 'mdx']
  ]) {
    expect(readClasses(createFileDoc(path, languageId, attribute)), path).toEqual(asWritten)
  }
  // Script text and Astro frontmatter, which the build reads as JavaScript.
  expect(readClasses(createDoc('html', '<script>el.innerHTML = \'<p class="block&#32;hidden"></p>\'</script>'))).toEqual(asWritten)
  expect(readClasses(createDoc('vue', '<script setup>const html = \'<p class="block&#32;hidden"></p>\'</script>'))).toEqual(asWritten)
  expect(readClasses(createDoc('astro', '---\nconst html = \'<p class="block&#32;hidden"></p>\'\n---\n<div class="x&#32;y"></div>')))
    .toEqual([...asWritten, ['x', 'x'], ['y', 'y']])
  // A script whose start tag the build reads as the HTML tokenizer does: no whitespace between
  // attributes, or an Astro expression value.
  expect(readClasses(createDoc('html', '<script id="t"type="module">el.innerHTML = \'<p class="block&#32;hidden"></p>\'</script>'))).toEqual(asWritten)
  expect(readClasses(createDoc('astro', '<script define:vars={{ msg: \'hi\' }}>el.innerHTML = \'<p class="block&#32;hidden"></p>\'</script>'))).toEqual(asWritten)
  // Astro finds a closed `<script>` as its build does, even one opened inside an HTML comment.
  expect(readClasses(createDoc('astro', '---\n---\n<!-- the analytics <script> sits at the end -->\n<div class="block&#32;hidden"></div>\n<script>console.log(1)</script>')))
    .toEqual(asWritten)
  // The frontmatter closes at the first `---` outside a comment or string, as the build reads it.
  for (const line of ['// --- helpers ---', 'const rule = \'---\'']) {
    expect(readClasses(createDoc('astro', `---\n${line}\nconst html = '<p class="block&#32;hidden"></p>'\n---\n<div></div>`)), line)
      .toEqual(asWritten)
  }
  // A Vue template in another language (`lang="pug"`), which Vue reads as raw text.
  expect(readClasses(createDoc('vue', '<template lang="pug">\ndiv(id="x" class="block&#32;hidden")\n</template>'))).toEqual(asWritten)
  // Attributes the build does not read as class attributes.
  expect(readClasses(createDoc('vue', '<template><Comp className="block&#32;hidden" /></template>'))).toEqual(asWritten)
  // An Alpine `:class` in an HTML file: the build reads only `class` there.
  expect(readClasses(createDoc('html', '<div :class="\'block&#32;hidden\'"></div>'))).toEqual(asWritten)
  // In a JS/TS document only oxc tells a JSX attribute from a string such as a lit template.
  expect(readClasses(createDoc('ts', 'const t = html`<p class="block&#32;hidden"></p>`'), 'regex')).toEqual(asWritten)
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
