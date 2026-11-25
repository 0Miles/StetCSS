import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { compileProjectManifest } from '../src'

const roots: string[] = []

afterEach(() => {
  roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }))
})

function createProject(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-on-dependency-'))
  roots.push(root)
  for (const [file, text] of Object.entries(files)) writeFileSync(join(root, file), text)
  return root
}

function compileReporting(root: string) {
  const reported: string[] = []
  let error: unknown
  try {
    compileProjectManifest([join(root, 'index.css')], { root, onDependency: (file) => reported.push(file) })
  } catch (caught) {
    error = caught
  }
  return { reported, error }
}

/**
 * Guards #248: a compile that fails returns no dependencies, so the language server could not watch
 * the file whose fix would make it succeed. `onDependency` must name every stylesheet the compile
 * reached, the missing import itself included, before the failure.
 */
test('reports the files read and the missing import of a compile that fails', () => {
  const root = createProject({
    'index.css': `@import './a.css';\n@import './missing.css';\n`,
    'a.css': '.a { color: red; }\n'
  })

  const { reported, error } = compileReporting(root)

  expect(String(error)).toContain('missing.css')
  expect(reported).toEqual(expect.arrayContaining([
    join(root, 'index.css'),
    join(root, 'a.css'),
    join(root, 'missing.css')
  ]))
})

/**
 * Guards #248 for `@reference`: a referenced stylesheet that fails to compile is still a file the
 * fix lands in, so it must be reported although the compile throws.
 */
test('reports a referenced stylesheet whose compile fails', () => {
  const root = createProject({
    'index.css': `@reference './tokens.css';\n.btn { @compose brand; }\n`,
    'tokens.css': '.brand {\n  @compose "block";\n}\n'
  })

  const { reported, error } = compileReporting(root)

  expect(error).toBeDefined()
  expect(reported).toContain(join(root, 'tokens.css'))
})
