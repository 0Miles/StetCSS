import { expect, test } from 'vitest'
import { getStetCSSAstroMarkupElements } from '../src/astro'

function readElements(markup: string) {
  const { scripts, elements } = getStetCSSAstroMarkupElements(markup)
  const slice = ({ start, end }: { start: number, end: number }) => markup.slice(start, end)
  return { scripts: scripts.map(slice), elements: elements.map(slice) }
}

/**
 * `@stet-css/source` reads Astro markup text without these elements and `@stet-css/language`
 * reads class attributes inside them as written (#240), so both must find the same ones as the
 * build always has: closed elements found by pattern on the raw text, scripts first. Expected
 * slices are the text the build's former `replace` calls removed from the same markup.
 * Reverse checks: finding styles before taking scripts out reds the split-tag row; keeping a
 * script inside a style as its own element reds the nested row.
 */
test('finds script and style elements as the Astro build does', () => {
  expect(readElements('<style>a<script>b</script>c</style>d<script type="module">e</script>')).toEqual({
    scripts: ['b', 'e'],
    elements: ['<style>a<script>b</script>c</style>', '<script type="module">e</script>']
  })
  // A style tag split by a script reads whole once the script is taken out.
  expect(readElements('<sty<script>x</script>le>p{}</style><p>')).toEqual({
    scripts: ['x'],
    elements: ['<sty<script>x</script>le>p{}</style>']
  })
  // A comment does not hide a closed element, and an element without its closing tag is none.
  expect(readElements('<!-- the <script> moved -->\n<div></div>\n<script>a</script><style>')).toEqual({
    scripts: [' moved -->\n<div></div>\n<script>a'],
    elements: ['<script> moved -->\n<div></div>\n<script>a</script>']
  })
  expect(readElements('<script define:vars={{ msg: \'hi\' }}>b</script>')).toEqual({
    scripts: ['b'],
    elements: ['<script define:vars={{ msg: \'hi\' }}>b</script>']
  })
})
