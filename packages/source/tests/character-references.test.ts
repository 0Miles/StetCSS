import { expect, test } from 'vitest'
import { extractAstroClasses, extractHTMLClasses, extractOxcClasses, extractSvelteClasses, extractVueClasses } from '../src'

/**
 * A browser decodes character references in a class attribute before it splits the classes
 * (#194). Extracting the source spelling instead drops the CSS of every class spelled with one.
 * Reverse checks (each restored afterwards):
 * - HTML adapter passing the value as written → the three HTML tests;
 * - oxc adapter not decoding JSX attribute strings → the JSX test;
 * - Astro or Vue keeping the raw attribute next to the decoded one → its own test;
 * - Vue decoding every directive, not only `:class` → the Vue test;
 * - candidates splitting on `\S+` again → the five tests with `&nbsp;`.
 */

test.concurrent('extracts HTML class attributes by the classes the browser reads', () => {
  expect(extractHTMLClasses('index.html', `
    <div class="block&#32;hidden"></div>
    <p class=inline&#x2d;flex></p>
  `)).toEqual(['block', 'hidden', 'inline-flex'])
})

test.concurrent('keeps a no-break space inside the class it joins', () => {
  expect(extractHTMLClasses('index.html', '<div class="block&nbsp;hidden"></div>'))
    .toEqual(['block\u00A0hidden'])
})

test.concurrent('keeps an ampersand that starts no reference as written, like the browser', () => {
  // In an attribute value, a reference missing its `;` stays as written before an alphanumeric.
  expect(extractHTMLClasses('index.html', '<div class="content:&quot;&copy;&quot; a&copyb a&b"></div>'))
    .toEqual(['content:"©"', 'a&copyb', 'a&b'])
})

test.concurrent('leaves HTML script text as written', () => {
  expect(extractHTMLClasses('index.html', `<script>const classes = 'block&#32;hidden'</script>`))
    .toEqual(['block&#32;hidden'])
})

test.concurrent('extracts JSX attribute strings by the classes the compiled element gets', () => {
  // JSX decodes only references that end in `;`, so `&nbsp` stays as written.
  expect(extractOxcClasses('App.tsx', `
    export const App = () => <div className="block&#32;hidden inline&#x2d;flex a&amp;b c&nbsp;d e&nbsp">
      {'g&#32;h'}
    </div>
  `)).toEqual(['block', 'hidden', 'inline-flex', 'a&b', 'c\u00A0d', 'e&nbsp', 'g&#32;h'])
})

test('extracts Vue class attributes and bindings by the classes Vue renders', async () => {
  // Vue decodes every attribute value, but only `class` and `:class` name classes; the click
  // handler is read as written by the template text extraction.
  await expect(extractVueClasses('App.vue', `
    <template>
      <div class="block&#32;hidden c&nbsp;d a&copyb"><p class=inline&#x2d;flex /></div>
      <span :class="ok &amp;&amp; 'flex&#32;grid'" @click="go('m&#32;n')" />
    </template>
  `)).resolves.toEqual(['ok', 'flex', 'grid', 'block', 'hidden', 'c\u00A0d', 'a&copyb', 'inline-flex', 'go(\'m&#32;n\')', 'm&#32;n'])
})

test('extracts Svelte class attributes by the classes Svelte renders', async () => {
  await expect(extractSvelteClasses('App.svelte', '<div class="block&#32;hidden c&nbsp;d a&copyb"><p class=inline&#x2d;flex></p></div>'))
    .resolves
    .toEqual(['block', 'hidden', 'c\u00A0d', 'a&copyb', 'inline-flex'])
})

test.concurrent('extracts Astro static class attributes by the classes the browser reads', () => {
  // Frontmatter and script strings are JavaScript, where an `&` is just a character.
  expect(extractAstroClasses('Page.astro', `---
const label = 'x&#32;y'
---
<div class="block&#32;hidden c&nbsp;d a&copyb" title="t&#32;u"><p class=inline&#x2d;flex></p></div>
<script>const classes = 'p&#32;q'</script>
`)).toEqual(['x&#32;y', 'p&#32;q', 'block', 'hidden', 'c\u00A0d', 'a&copyb', 'inline-flex', 't&#32;u'])
})
