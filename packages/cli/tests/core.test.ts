import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs from 'node:fs'
import os from 'node:os'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }

interface TestDiagnostic {
  code: string
  sourceKind?: string
  fixes?: { kind: string, safety: string }[]
}

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function runCLI(args: string[], options: { cwd?: string, input?: string } = {}) {
  return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
    encoding: 'utf8',
    input: options.input,
    stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    cwd: options.cwd,
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: tsconfigPath
    }
  })
}

function runFailedCLI(args: string[], options: { cwd?: string, input?: string } = {}) {
  try {
    runCLI(args, options)
  } catch (error) {
    return error as { stderr?: Buffer | string, stdout?: Buffer | string, status?: number }
  }
  throw new Error(`Expected CLI command to fail: ${args.join(' ')}`)
}

describe('root command', () => {
  it('shows scan options and the lint subcommand', () => {
    const output = runCLI(['--help'])
    expect(output).toContain('Usage: @stet-css/cli [options] [command] [source paths...]')
    expect(output).toContain('-w, --watch')
    expect(output).toContain('--no-export')
    expect(output).toContain('Commands:')
    expect(output).toContain('lint')
    expect(output).toContain('inspect')
    expect(output).not.toContain('extract [options]')
    expect(output).not.toContain('render [options]')
  })

  it.each(['extract', 'render', 'scan'])('rejects removed %s command', (command) => {
    const error = runFailedCLI([command])
    expect(error.status).toBe(1)
    expect(String(error.stderr)).toContain(`The "${command}" command was removed.`)
  })

  /**
   * Guards the error a user sees for a stylesheet the build cannot read, such as one still
   * written with the removed `@master` at-rule: the message names the fix, and an uncaught
   * exception buried it under a source excerpt, a stack trace and the error's fields.
   * Reverse check: rethrowing the original error instead of `StylesheetEntryError` in
   * `registerManagedCSSEntries` turns only this test red.
   */
  it.each([
    ['a removed @master at-rule', '@master entry;\n', '@master entry; was removed'],
    ['a missing import', '@import "@stet-css/core";\n@import "./missing.css";\n', 'CSS file not found']
  ])('prints only the message for a stylesheet with %s', (_, css, message) => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-stylesheet-error-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), css)
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="block"></div>')
      const error = runFailedCLI(['--no-export'], { cwd })
      const stderr = String(error.stderr)
      expect(error.status).toBe(1)
      expect(stderr).toContain(message)
      expect(stderr).toContain(fs.realpathSync(cwd))
      expect(stderr).not.toMatch(/^\s+at /m)
      expect(stderr.trim().split('\n')).toHaveLength(1)
      expect(String(error.stdout)).toBe('')
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('publishes only the package-name binary', () => {
    expect(pkg.bin).toBe('./dist/bin/index.js')
  })
})

describe('inspect command', () => {
  it('prints scanner state and missing CSS diagnostics as json', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-inspect-json-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="block text-decoration:bad()"></div>')
      const error = runFailedCLI([
        'inspect',
        '--classes',
        'block never-generated-class',
        'index.html'
      ], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
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
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('can include generated CSS and stylesheet entry metadata without failing', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-inspect-css-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), '@import "@stet-css/core";')
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="block"></div>')
      const output = runCLI([
        'inspect',
        '--classes',
        'block',
        '--include-css',
        '--exit-code',
        'never',
        'index.html'
      ], { cwd })
      const report = JSON.parse(output)
      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0]).toEqual(expect.objectContaining({
        filePath: fs.realpathSync(resolve(cwd, 'index.css')),
        stetCSS: true
      }))
      expect(report.stylesheets.entries[0].dependencies).toContain(fs.realpathSync(resolve(cwd, 'index.css')))
      expect(report.css.included).toBe(true)
      expect(report.css.text).toContain('display:block')
      expect(report.missingCSS.missing).toHaveLength(0)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports stylesheet entry errors without hiding scanner diagnostics', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-inspect-entry-error-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), '@import "@stet-css/core";\n@import "./missing.css";')
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="block"></div>')
      const error = runFailedCLI(['inspect', 'index.html'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0].errors[0]).toContain('CSS file not found')
      expect(report.stylesheets.errors).toContainEqual(expect.objectContaining({
        filePath: fs.realpathSync(resolve(cwd, 'index.css')),
        message: expect.stringContaining('CSS file not found')
      }))
      expect(report.scanner.classes.valid).toContain('block')
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'stylesheet-error',
        severity: 'error',
        sourceKind: 'stylesheet',
        filePath: fs.realpathSync(resolve(cwd, 'index.css'))
      }))
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })
})

describe('lint command', () => {
  it('prints machine-readable diagnostics as json', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-json-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="fg:white m:2x text-decoration:bad()"></div>')
      const error = runFailedCLI(['lint', 'index.html'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.version).toBe(1)
      expect(report.manifest.status).toBe('loaded')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].diagnostics.map((diagnostic: TestDiagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
        'invalid-class-order',
        'invalid-class'
      ]))
      expect(report.files[0].diagnostics[0]).toHaveProperty('loc.start.line')
      expect(report.files[0].diagnostics[0].source).toBe('StetCSS')
      expect(report.summary.errors).toBeGreaterThan(0)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('lints stdin buffers without requiring ESLint parser configuration', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-stdin-'))
    try {
      const output = runCLI([
        'lint',
        '--stdin',
        '--stdin-filepath',
        'src/App.tsx',
        '--exit-code',
        'never'
      ], {
        cwd,
        input: '<div className="fg:white m:2x"></div>'
      })
      const report = JSON.parse(output)
      expect(report.files).toHaveLength(1)
      expect(report.files[0].filePath).toMatch(/src[/\\]App\.tsx$/)
      expect(report.files[0].diagnostics.some((diagnostic: TestDiagnostic) => diagnostic.code === 'invalid-class-order')).toBe(true)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('includes stylesheet compose diagnostics in the default source set', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-css-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), '.btn { @compose text-align:center contain:content; }')
      const output = runCLI(['lint', '--exit-code', 'never'], { cwd })
      const report = JSON.parse(output)
      expect(report.files).toHaveLength(1)
      expect(report.files[0].sourceKind).toBe('stylesheet')
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        code: 'prefer-canonical-class',
        sourceKind: 'compose-directive'
      }))
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        code: 'prefer-native-declaration',
        sourceKind: 'compose-directive',
        fixes: [expect.objectContaining({ kind: 'directive', safety: 'structural' })]
      }))
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports manifest preflight diagnostics', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-manifest-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), '@import "@stet-css/core";\n\n.btn { @compose "block"; }')
      const error = runFailedCLI(['lint'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.manifest.status).toBe('error')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].sourceKind).toBe('manifest')
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        ruleId: 'manifest',
        code: 'manifest-loading-error',
        sourceKind: 'manifest'
      }))
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('fixes class-list diagnostics', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-fix-'))
    try {
      const file = resolve(cwd, 'index.html')
      fs.writeFileSync(file, '<div class="fg:white m:2x"></div>')
      runCLI(['lint', '--fix', 'index.html'], { cwd })
      expect(fs.readFileSync(file, 'utf8')).toBe('<div class="m:xs fg:white"></div>')
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('does not write structural directive fixes unless explicitly allowed', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'stet-css-cli-lint-directive-fix-'))
    try {
      const file = resolve(cwd, 'index.css')
      fs.writeFileSync(file, '.btn { @compose contain:content; }')
      runCLI(['lint', '--fix', 'index.css'], { cwd })
      expect(fs.readFileSync(file, 'utf8')).toBe('.btn { @compose contain:content; }')

      runCLI(['lint', '--fix', '--fix-directives', 'index.css'], { cwd })
      expect(fs.readFileSync(file, 'utf8')).toBe('.btn { contain: content; }')
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })
})
