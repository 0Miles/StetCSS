import { expect, test } from 'vitest'
import { compileCSS } from '../src'

/** #178's rule shape, with one declaration varied so lightningcss cannot merge the rules. */
function createNativeCSS(size: number) {
  let css = ''
  for (let index = 0; css.length < size; index++) {
    css += `.card-${index} { color: var(--color-red); background: oklch(60% .2 30); padding: ${index}px 2rem; font-family: "Inter", sans-serif; }\n`
  }
  return css
}

/**
 * Counts the characters every JavaScript regular expression examines while `run` executes. A
 * global or sticky regex starts at `lastIndex`, any other at 0; a match ends the scan at its end,
 * and a miss scans to the end of the input, or examines one position when the regex is sticky.
 */
function countRegExpScannedCharacters(run: () => void) {
  const exec = RegExp.prototype.exec
  let scanned = 0
  RegExp.prototype.exec = function (this: RegExp, input: string) {
    const start = this.global || this.sticky ? this.lastIndex : 0
    const match = exec.call(this, input)
    scanned += match
      ? match.index + match[0].length - start
      : this.sticky ? 1 : String(input).length - start
    return match
  } as typeof exec
  try {
    run()
  } finally {
    RegExp.prototype.exec = exec
  }
  return scanned
}

/**
 * Guards #181 (and its duplicate #178): the `$alias` check on an entry's native CSS ran a global
 * regex from every character to the end of the stylesheet, so a 200 KB vendor `@import` took
 * about 5 s per compile and a Vite build 30 s. Counts the characters regexes scan instead of
 * timing, so the test cannot flake: doubling the native CSS must about double the work, where the
 * quadratic scan quadruples it. Trade-off: it sees only regex scans, not hand-written loops.
 * Reverse check: `CSS_VARIABLE_ALIAS` in `stylesheet-value.ts` back on the `g` flag reds this test
 * (ratio 4.02) and the string and escape rows below, which a forward-searching regex then misreads.
 */
test('compiling native CSS scans each character a bounded number of times as the stylesheet grows', () => {
  const small = createNativeCSS(16 * 1024)
  const large = createNativeCSS(32 * 1024)
  const smallScanned = countRegExpScannedCharacters(() => compileCSS(small))
  const largeScanned = countRegExpScannedCharacters(() => compileCSS(large))
  expect(largeScanned / smallScanned).toBeLessThan(2.5)
})

const preservedAliases = [
  { place: 'a string', css: '.a { content: "$x" }', nativeCSS: '.a {\n  content: "$x";\n}' },
  { place: 'a kept comment', css: '/*! $x */ .a { color: red }', nativeCSS: '/*! $x */\n.a {\n  color: red;\n}' },
  { place: 'an escape', css: '.a { --v: \\$x }', nativeCSS: '.a {\n  --v: \\$x;\n}' }
]

/**
 * Guards #181's third criterion: making the `$alias` scan linear must not change which `$name`
 * counts as an alias. One inside a string, a kept comment or after `\` is native CSS and passes
 * through.
 * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` (`@stet-css/lexer`)
 * reds only the escape row here.
 */
test.each(preservedAliases)('an alias inside $place stays native CSS', ({ css, nativeCSS }) => {
  expect(compileCSS(css).nativeCSS).toBe(nativeCSS)
})

/**
 * Guards the scan's position handling: a sticky regex tests only `lastIndex`, so an alias deep in
 * the native CSS is found only if the scan moves `lastIndex` along with it. A missed alias lets
 * `$late` reach the browser as an invalid value instead of failing with its replacement.
 * Reverse check: deleting `CSS_VARIABLE_ALIAS.lastIndex = index` in `stylesheet-value.ts` reds
 * this test and the alias rejections in `css-first-core-migration.test.ts`.
 */
test('an unquoted $name after a long stretch of native CSS fails with its replacement', () => {
  expect(() => compileCSS(`${createNativeCSS(16 * 1024)}.z { color: $late }`))
    .toThrow('Replace "$late" with "var(--late)"')
})
