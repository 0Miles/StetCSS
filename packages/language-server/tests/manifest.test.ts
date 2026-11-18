import { test, vi } from 'vitest'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { withFixture } from './setup'

withFixture('manifest', async (context) => {
  test('loads managed CSS entry manifest before language features run', async ({ expect }) => {
    const textDocument = context.createDocument('<div class="fixture-button"></div>')

    await context.server.onDidOpen({ document: textDocument })

    expect(context.rootWorkspace?.languageService?.settings.manifest).toMatchObject({
      utilities: expect.arrayContaining([
        expect.objectContaining({
          name: 'fixture-card',
          type: -2,
          layer: 'components',
          emit: expect.objectContaining({
            type: 'static',
            rules: expect.arrayContaining([
              expect.objectContaining({
                declarations: { display: 'block' }
              })
            ])
          })
        }),
        expect.objectContaining({
          name: 'fixture-button',
          type: -2,
          layer: 'components',
          emit: expect.objectContaining({
            type: 'static',
            rules: expect.arrayContaining([
              expect.objectContaining({
                declarations: {
                  display: 'inline-flex',
                  color: 'oklch(100% 0 none)',
                  'background-color': 'oklch(63.7% .237 25.331)'
                }
              })
            ])
          })
        })
      ])
    })

    await context.server.onDidClose({ document: textDocument })
  })
})

const rejectedManifestSettings: [string, StetCSSManifest, string][] = [
  ['a leftover settings.baseUnit', { version: 1, settings: { baseUnit: '4px' } } as unknown as StetCSSManifest, 'settings.baseUnit was removed'],
  ['version 2', { version: 2 } as unknown as StetCSSManifest, 'Unsupported StetCSSManifest version']
]

for (const [label, manifest, message] of rejectedManifestSettings) {
  withFixture('settings-manifest', async (context) => {
    /**
     * Prevents: a `manifest` setting the engine rejects (one written before #162 that still
     * carries `settings.baseUnit`, or a version 2 manifest) making every document open in the
     * workspace reject, so the editor loses all StetCSS features and shows no error. The workspace
     * reports the engine's error as a manifest-loading diagnostic and keeps working with the
     * default manifest.
     * Reverse-checked: building the service from the loaded manifest without catching its error in
     * `initWorkspaceLanguageService` (as before) reds both rows and nothing else.
     */
    test(`reports a manifest setting with ${label} and falls back to the default manifest`, async ({ expect, onTestFinished }) => {
      const document = context.createDocument('<div class="block"></div>', { lang: 'html' })
      const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
      onTestFinished(() => sendDiagnostics.mockRestore())

      await context.server.onDidOpen({ document })

      const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
      expect(diagnostics).toHaveLength(1)
      expect(diagnostics[0].code).toBe('manifest-loading-error')
      expect(diagnostics[0].message).toContain(message)
      expect(context.rootWorkspace?.languageService?.css.createRule('block')?.text).toContain('display:block')

      await context.server.onDidClose({ document })
    })
  }, { manifest })
}
