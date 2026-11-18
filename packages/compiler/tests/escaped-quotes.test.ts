import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileCSS, compileCSSFile } from '../src'

/**
 * Guards #186: a backslash-escaped quote outside a string, as in the selector `.a\'b`, opened a
 * string for the directive scan, so every later `@source`, `@safelist` and `@blocklist` was
 * skipped and reached the output CSS. A quote escaped inside a string (`'it\'s'`) still leaves
 * that string open. The `@compose` half of #186 (CSS module routing) is guarded in
 * `@stet-css/stylesheet`'s `tests/style.test.ts`.
 * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` (`@stet-css/lexer`)
 * reds this test.
 */
test('directives after an escaped quote outside a string still apply', () => {
  const result = compileCSS([
    ".a\\'b { color: red }",
    ".c { content: 'it\\'s' }",
    "@source './pages';",
    "@safelist 'fg:blue';",
    "@blocklist 'legacy';"
  ].join('\n'))

  expect(result.extractionPolicy).toEqual({
    include: ['./pages'],
    exclude: [],
    safelist: ['fg:blue'],
    blocklist: ['legacy']
  })
  expect(result.nativeCSS).toBe([
    ".a\\'b {",
    '  color: red;',
    '}',
    '',
    '.c {',
    '  content: "it\'s";',
    '}'
  ].join('\n'))
})

/**
 * Guards #186 through #183's import conditions: an inlined `@import` wrapped in its `layer()`
 * keeps its top-level directives outside the wrapper, so the directive scans must still find the
 * `@safelist` after `.a\'b` in the imported file, or it never applies.
 * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` (`@stet-css/lexer`)
 * reds this test.
 */
test('a conditioned @import keeps the directives after an escaped quote outside its conditions', () => {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-escaped-quotes-'))
  try {
    writeFileSync(join(root, 'entry.css'), '@import "./local.css" layer(a);')
    writeFileSync(join(root, 'local.css'), ".a\\'b { color: red }\n@safelist 'fg:blue';")
    const result = compileCSSFile(join(root, 'entry.css'))

    expect(result.extractionPolicy.safelist).toEqual(['fg:blue'])
    expect(result.nativeCSS).toBe([
      '@layer a {',
      "  .a\\'b {",
      '    color: red;',
      '  }',
      '}'
    ].join('\n'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

/**
 * Guards the value scans that `compileCSS` runs over the whole native CSS: after an escaped quote
 * outside a string, `--alpha()` was left unlowered and a `$name` alias reached the browser instead
 * of failing with its replacement.
 * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` reds this test.
 */
test('value scans read native CSS after an escaped quote outside a string', () => {
  expect(compileCSS(".a\\'b { color: red }\n.c { color: --alpha(var(--x) / 50%) }").nativeCSS)
    .toContain('color: color-mix(in oklab,var(--x) 50%,transparent);')
  expect(() => compileCSS(".a\\'b { color: red }\n.z { color: $late }"))
    .toThrow('Replace "$late" with "var(--late)"')
})
