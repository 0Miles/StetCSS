import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import type { Diagnostic } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { withFixture } from './setup'

withFixture('basic', async (context) => {
  test('publishes exact @compose class diagnostics in CSS documents', async ({ expect }) => {
    const text = '.btn { @compose not-a-real-class; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('invalid-compose-class')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('not-a-real-class'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('not-a-real-class') + 'not-a-real-class'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes exact @compose class diagnostics in SFC style blocks', async ({ expect }) => {
    const text = '<template><button /></template>\n<style>\n.btn { @compose not-a-real-class; }\n</style>'
    const document = context.createDocument(text, { lang: 'vue' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('invalid-compose-class')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('not-a-real-class'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('not-a-real-class') + 'not-a-real-class'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  /**
   * Prevents: an SFC style diagnostic landing in an opening-tag attribute that repeats the style content.
   * Reverse check: locating the content with `indexOf` on the whole `<style>` match turns this test red.
   */
  test('publishes SFC style diagnostics in the content, not an opening-tag attribute repeating it', async ({ expect }) => {
    const css = '.btn { @compose not-a-real-class; }'
    const text = `<style data-source="${css}">${css}</style>`
    const document = context.createDocument(text, { lang: 'vue' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    expect(diagnostics).toHaveLength(1)
    expect(document.offsetAt(diagnostics[0].range.start)).toBe(text.lastIndexOf('not-a-real-class'))

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  /**
   * Prevents: a `>` inside a quoted opening-tag attribute ending the `<style>` tag early, which makes
   * the rest of the attribute part of the style content.
   * Reverse check: ending the tag at the first `>` (`<style\b([^>]*)>`) turns this test red.
   */
  test('publishes SFC style diagnostics after a quoted attribute containing >', async ({ expect }) => {
    const text = '<style data-sel=".a > .b">.btn { @compose not-a-real-class; }</style>'
    const document = context.createDocument(text, { lang: 'vue' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    expect(diagnostics).toHaveLength(1)
    expect(document.offsetAt(diagnostics[0].range.start)).toBe(text.indexOf('not-a-real-class'))

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes quoted @compose syntax diagnostics', async ({ expect }) => {
    const text = '.btn { @compose "block"; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('compose-quoted-syntax')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('"block"'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('"block"') + '"block"'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  /**
   * Prevents: an open stylesheet with the removed `@master entry;` showing no error in the editor.
   * The compiler's error must reach the document as one diagnostic on the at-rule.
   * Reverse check: building the compiler's `@master` error as a plain `Error` turns this test red.
   */
  test('publishes removed @master at-rule diagnostics on the at-rule', async ({ expect }) => {
    const text = '.btn { color: red; }\n@master entry;'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics.find((item: { code?: unknown }) => item.code === 'removed-master-at-rule')
    expect(diagnostic?.message).toContain("@import '@stet-css/core'")
    expect(document.offsetAt(diagnostic!.range.start)).toBe(text.indexOf('@master'))
    expect(document.offsetAt(diagnostic!.range.end)).toBe(text.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  /**
   * Prevents: an open stylesheet entry with `@safelist fg:blue;` showing no error while the class
   * never reaches the safelist (#239). The compiler's error must reach the document as one
   * diagnostic on the unquoted argument, naming the quoted form.
   * Reverse check: building the compiler's unquoted-argument error without a source reference
   * turns this test red.
   */
  test('publishes unquoted @safelist argument diagnostics on the argument', async ({ expect }) => {
    const text = "@import '@stet-css/core';\n.btn { color: red; }\n@safelist fg:blue;"
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics.find((item: { code?: unknown }) => item.code === 'unquoted-directive-argument')
    expect(diagnostic?.message).toContain("@safelist 'fg:blue';")
    expect(document.offsetAt(diagnostic!.range.start)).toBe(text.indexOf('fg:blue'))
    expect(document.offsetAt(diagnostic!.range.end)).toBe(text.indexOf('fg:blue') + 'fg:blue'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  /**
   * Prevents (#239 review 4 F2): a red unquoted-argument diagnostic on a stylesheet the build
   * leaves alone. Only a stylesheet whose graph reaches `@stet-css/core` is checked, so Tailwind's
   * `@source inline(...)` and a directive mentioned in a Sass `//` comment publish none, while an
   * unquoted argument outside the comment in that Sass entry still does.
   * Reverse check: checking every document turns the Tailwind row red; leaving `//` comments in
   * the checked text turns the three Sass and Less rows red.
   */
  test.each([
    ['css', '@import "tailwindcss";\n@source inline("underline");\n@source not inline("container");\n@safelist fg:blue;', undefined],
    ['scss', "@import '@stet-css/core';\n// old: @safelist fg:blue;\n.a { background: url(//cdn.test/a.png); }", undefined],
    ['less', "@import '@stet-css/core';\n.a { color: red; } // @source ./src;", undefined],
    ['scss', "@import '@stet-css/core';\n// '@safelist fg:red;\n@safelist fg:blue;", 'fg:blue']
  ])('publishes unquoted-argument diagnostics on a %s document only where the build rejects them', async (lang, text, argument) => {
    const document = context.createDocument(text, { lang })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const ranges = diagnostics
      .filter((item: Diagnostic) => item.code === 'unquoted-directive-argument')
      .map((item: Diagnostic) => document.offsetAt(item.range.start))
    expect(ranges).toEqual(argument ? [text.lastIndexOf(argument)] : [])

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes grouped @compose syntax diagnostics', async ({ expect }) => {
    const text = '.btn { @compose {block}; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('compose-group-syntax')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('{block}'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('{block}') + '{block}'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })
})

withFixture('manifest', async (context) => {
  /**
   * Prevents (#239 review 4 F2): a stylesheet the workspace's entry imports losing its live
   * unquoted-argument diagnostic. The build checks every stylesheet a StetCSS entry reaches, so the
   * editor does too, though the file does not import `@stet-css/core` itself.
   * Reverse check: checking only documents that import `@stet-css/core` turns this test red.
   */
  test('publishes unquoted-argument diagnostics on a stylesheet the entry imports', async ({ expect }) => {
    const text = '@safelist fg:blue;\n@components { fixture-card { display: block; } }'
    const document = TextDocument.create(URI.file(join(context.fixtureDir, 'preset.css')).toString(), 'css', 0, text)
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics.find((item: { code?: unknown }) => item.code === 'unquoted-directive-argument')
    expect(diagnostic && document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('fg:blue'))

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })
})

withFixture('invalid-manifest', async (context) => {
  test('publishes manifest loading diagnostics', async ({ expect }) => {
    const document = context.createDocument('<div class="block"></div>', { lang: 'html' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].code).toBe('manifest-loading-error')
    expect(diagnostics[0].source).toBe('StetCSS')
    expect(diagnostics[0].message).toContain('Failed to load StetCSS manifest')

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })
})
