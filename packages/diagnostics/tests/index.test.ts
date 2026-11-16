import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMasterCSSInspectionReport } from '../src'

function createTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe('@stet-css/diagnostics', () => {
  it('reports scanner state, per-file discoveries, and missing CSS diagnostics', async () => {
    const cwd = createTempDir('master-css-diagnostics-inspect-')
    try {
      writeFileSync(join(cwd, 'index.html'), '<div class="block text-decoration:bad()"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html'],
        classes: ['block', 'never-generated-class']
      })

      expect(report.version).toBe(1)
      expect(report.inputs.files[0]).toMatch(/index\.html$/)
      expect(report.scanner.classes.valid).toContain('block')
      expect(report.scanner.classes.invalid).toContain('text-decoration:bad()')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].discovered.valid).toContain('block')
      expect(report.files[0].discovered.invalid).toContain('text-decoration:bad()')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: 'block',
        reason: 'generated'
      }))
      expect(report.missingCSS.missing).toContainEqual(expect.objectContaining({
        className: 'never-generated-class',
        reason: 'not-detected'
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid-scanner-class',
        sourceKind: 'scanner',
        filePath: expect.stringMatching(/index\.html$/)
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'missing-css',
        sourceKind: 'missing-css'
      }))
      expect(report.summary.errors).toBe(1)
      expect(report.summary.warnings).toBe(1)
      expect(report.css.bytes).toBeGreaterThan(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  /**
   * Guards that missing-CSS checks follow the entry's `@safelist` and `@blocklist`, the only
   * place those lists live: a blocked class a file uses must report missing, not generated,
   * and a safelisted class nothing uses must report present.
   * Reverse check: classifying a valid class as generated before the blocklist check turns only
   * this test red.
   */
  it('classifies missing CSS by the entry\'s @safelist and @blocklist', async () => {
    const cwd = createTempDir('master-css-diagnostics-directives-')
    try {
      writeFileSync(join(cwd, 'index.css'), `
        @import "@stet-css/core";
        @safelist 'p:2x';
        @blocklist 'block';
      `)
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        classes: ['block', 'p:2x']
      })

      expect(report.scanner.classes.safelist).toEqual(['p:2x'])
      expect(report.scanner.classes.blocklist).toEqual(['block'])
      expect(report.missingCSS.missing).toEqual([
        { className: 'block', status: 'missing', reason: 'blocklisted' }
      ])
      expect(report.missingCSS.present).toEqual([
        { className: 'p:2x', status: 'present', reason: 'safelist' }
      ])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('includes generated CSS and stylesheet entry metadata', async () => {
    const cwd = createTempDir('master-css-diagnostics-css-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@import "@stet-css/core";')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html'],
        classes: 'block',
        includeCss: true
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0]).toEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        masterCSS: true
      }))
      expect(report.stylesheets.entries[0].dependencies).toContain(resolve(cwd, 'index.css'))
      expect(report.css.included).toBe(true)
      expect(report.css.text).toContain('display:block')
      expect(report.missingCSS.missing).toHaveLength(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  /**
   * Prevents: `stet-css inspect --classes card` calling a class missing, and exiting non-zero,
   * when an entry styles it with a native rule. Entries keep every native rule, so the class is
   * styled whether or not markup uses it; a class with no rule anywhere stays missing, and a
   * `.png` inside a declaration value is not a class.
   * Reverse-checked: dropping the native-class branch from `classifyMissingCSS` turns only
   * this test red.
   */
  it('reports classes styled by an entry native rule as present', async () => {
    const cwd = createTempDir('master-css-diagnostics-native-')
    try {
      writeFileSync(join(cwd, 'index.css'), [
        '@import "@stet-css/core";',
        '.card { color: red; background: url(a.png); }',
        '@media (min-width: 768px) { .unused\\:wide:hover { color: blue; } }'
      ].join('\n'))
      writeFileSync(join(cwd, 'index.html'), '<div class="card"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html'],
        classes: ['card', 'unused:wide', 'png', 'ghost']
      })

      expect(report.missingCSS.present).toEqual([
        { className: 'card', status: 'present', reason: 'native-css' },
        { className: 'unused:wide', status: 'present', reason: 'native-css' }
      ])
      expect(report.missingCSS.missing.map((result) => result.className)).toEqual(['png', 'ghost'])
      expect(report.summary.errors).toBe(2)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  /**
   * Prevents: `stet-css inspect` staying silent when an entry sets `default-mode` under the
   * media trigger. Build plugins do not print compiler warnings, so the inspection report is
   * where a developer finds out the setting is ignored.
   * Reverse-checked: `warnings: []` in place of `result.warnings` in `registerManagedCSSEntries`
   * turns only this test red.
   */
  it('reports the entry compiler warning for default-mode under the media trigger', async () => {
    const cwd = createTempDir('master-css-diagnostics-entry-warning-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@import "@stet-css/core";\n@settings { default-mode: dark; }')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html']
      })

      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'stylesheet-warning',
        severity: 'warning',
        sourceKind: 'stylesheet',
        filePath: resolve(cwd, 'index.css'),
        message: expect.stringContaining('default-mode')
      }))
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  /**
   * Guards that `inspect` answers for the files the root command reads: a class only used in
   * `build/` or in a file the entry excludes with `@source not` is not generated, so the
   * report must call it missing instead of telling the user it is present.
   * Reverse check: inspecting the old `**` glob without the entry's directives turns only
   * this test red.
   */
  it('inspects the same source files the root command reads', async () => {
    const cwd = createTempDir('master-css-diagnostics-sources-')
    try {
      mkdirSync(join(cwd, 'src/legacy'), { recursive: true })
      mkdirSync(join(cwd, 'build'), { recursive: true })
      writeFileSync(join(cwd, 'src/index.css'), '@import "@stet-css/core";\n@source not \'./legacy\';')
      writeFileSync(join(cwd, 'src/page.html'), '<div class="block"></div>')
      writeFileSync(join(cwd, 'src/legacy/page.html'), '<div class="m:4x"></div>')
      writeFileSync(join(cwd, 'build/index.html'), '<div class="p:2x"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        classes: 'block m:4x p:2x',
        includeCss: true
      })

      expect(report.inputs.files).toStrictEqual([resolve(cwd, 'src/page.html')])
      expect(report.css.text).not.toContain('m\\:4x')
      expect(report.missingCSS.present.map((result) => result.className)).toStrictEqual(['block'])
      expect(report.missingCSS.missing.map((result) => result.className)).toStrictEqual(['m:4x', 'p:2x'])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  /**
   * Prevents (#71): `stet-css inspect` warning that a class using the entry's own token, mode,
   * utility or component "did not generate Master CSS rules" while the build emits a rule for it, because the
   * scanner judged classes by the preset's default manifest instead of the entry's.
   * Reverse check: building the scanner without the entry manifest turns only this test red.
   */
  it('judges classes by the tokens, modes, utilities and components the entry declares, as the build does', async () => {
    const cwd = createTempDir('master-css-diagnostics-entry-manifest-')
    try {
      writeFileSync(join(cwd, 'index.css'), [
        '@import "@stet-css/core";',
        // A custom mode needs the class trigger to apply; under media it warns (#70).
        '@settings { mode-trigger: class; }',
        '@theme { --color-brand: #f00; --spacing-card: 1.25rem; }',
        '@theme light {}',
        '@theme sepia {}',
        '@utilities { cardy { color: red; } }',
        '@components { btnz { display: block; } }'
      ].join('\n'))
      writeFileSync(join(cwd, 'index.html'), '<div class="block fg:brand p:card fg:red@sepia cardy btnz"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        classes: 'fg:brand p:card fg:red@sepia cardy btnz',
        includeCss: true
      })

      expect(report.css.text).toContain('.fg\\:brand{color:var(--color-brand)}')
      expect(report.css.text).toContain('.p\\:card{padding:var(--spacing-card)}')
      expect(report.css.text).toContain('.fg\\:red\\@sepia{')
      expect(report.scanner.classes.invalid).toStrictEqual([])
      expect(report.scanner.classes.valid).toStrictEqual(['block', 'btnz', 'cardy', 'fg:brand', 'fg:red@sepia', 'p:card'])
      expect(report.missingCSS.missing).toStrictEqual([])
      expect(report.diagnostics).toStrictEqual([])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports stylesheet entry errors without hiding scanner diagnostics', async () => {
    const cwd = createTempDir('master-css-diagnostics-entry-error-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@import "@stet-css/core";\n@import "./missing.css";')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html']
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0].errors[0]).toContain('CSS file not found')
      expect(report.stylesheets.errors).toContainEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        message: expect.stringContaining('CSS file not found')
      }))
      expect(report.scanner.classes.valid).toContain('block')
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'stylesheet-error',
        severity: 'error',
        sourceKind: 'stylesheet',
        filePath: resolve(cwd, 'index.css')
      }))
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
