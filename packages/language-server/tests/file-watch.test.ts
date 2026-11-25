import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { afterEach, expect, test, vi } from 'vitest'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { components, controlFileChecks, disposeProjects, ENTRY_CSS, openProject, until } from './watch-project'

afterEach(disposeProjects)

/**
 * Guards #248: the server loaded a workspace's manifest once, when its first document opened, so a
 * `git checkout` that changed an imported CSS file left completion and hover on the old components
 * until a `.css` save in the editor or a restart. The replaced file must show in both, with no
 * editor event at all.
 */
test('shows a component that a `git checkout` adds to an imported CSS file', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const text = '<div class="watch-chip"></div>'
  const document = await project.open(text)
  const completionOffset = text.indexOf('watch-') + 'watch-'.length
  expect(await document.hover('watch-chip')).toBeUndefined()
  expect(await document.completionLabels(completionOffset)).not.toContain('watch-chip')

  project.replace('components.css', components('watch-chip', 'flex'))

  await until(async () => (await document.hover('watch-chip'))?.includes('display:flex') ?? false, 'hover to show watch-chip')
  expect(await document.completionLabels(completionOffset)).toContain('watch-chip')
})

/** A package in the project's node_modules whose CSS the compiler reads through its `style` field. */
function stylePackage(name: string, version: string, css: string) {
  return {
    [`node_modules/${name}/package.json`]: JSON.stringify({ name, version, style: './index.css' }),
    [`node_modules/${name}/index.css`]: css
  }
}

/**
 * Guards #248 for a preset update: the preset's CSS lives in node_modules, outside every editor
 * event, and an install replaces its whole directory. Completion and hover must move to the new
 * preset once the install has written it.
 */
test('shows a component from a preset that an install replaced in node_modules', async () => {
  const project = await openProject({
    'index.css': `@import '@stet-css/core';\n`,
    ...stylePackage('@stet-css/core', '1.0.0', `@import '@stet-css/preset';\n`),
    ...stylePackage('@stet-css/preset', '1.0.0', components('preset-card', 'block'))
  })
  const text = '<div class="preset-chip"></div>'
  const document = await project.open(text)
  const completionOffset = text.indexOf('preset-') + 'preset-'.length
  expect(await document.completionLabels(completionOffset)).toContain('preset-card')
  expect(await document.hover('preset-chip')).toBeUndefined()

  project.remove('node_modules/@stet-css/preset')
  for (const [file, content] of Object.entries(stylePackage('@stet-css/preset', '2.0.0', components('preset-chip', 'grid')))) {
    project.write(file, content)
  }

  await until(async () => (await document.hover('preset-chip'))?.includes('display:grid') ?? false, 'hover to show preset-chip')
  expect(await document.completionLabels(completionOffset)).toContain('preset-chip')
  expect(await document.completionLabels(completionOffset)).not.toContain('preset-card')
})

/** A package that re-exports a built workspace package, so the server loads it as the project's own runtime. */
function runtimePackage(name: string, entry: string) {
  const url = pathToFileURL(entry).href
  return {
    [`node_modules/${name}/package.json`]: JSON.stringify({ name, version: '1.0.0', type: 'module', exports: { '.': './index.js' } }),
    [`node_modules/${name}/index.js`]: `export * from ${JSON.stringify(url)}\n`
  }
}

/**
 * Guards #248 for a preset update in a workspace with no CSS entry: its manifest is the installed
 * preset's `default-manifest.json`, read when the workspace loads, so a new preset version must
 * reach completion and hover the same way.
 */
test('uses the default manifest of a preset that an install updated in node_modules', async () => {
  const require = createRequire(import.meta.url)
  const coreEntry = require.resolve('@stet-css/core')
  const engineEntry = createRequire(coreEntry).resolve('@stet-css/engine')
  const defaultManifest = JSON.parse(readFileSync(require.resolve('@stet-css/preset/default-manifest.json'), 'utf8')) as StetCSSManifest
  const presetManifest = (manifest: StetCSSManifest) => ({
    'node_modules/@stet-css/preset/package.json': JSON.stringify({
      name: '@stet-css/preset',
      version: '1.0.0',
      exports: { './default-manifest.json': './default-manifest.json' }
    }),
    'node_modules/@stet-css/preset/default-manifest.json': JSON.stringify(manifest)
  })
  const project = await openProject({
    'package.json': JSON.stringify({ private: true, dependencies: { '@stet-css/core': '1.0.0' } }),
    ...runtimePackage('@stet-css/core', coreEntry),
    ...runtimePackage('@stet-css/engine', engineEntry),
    ...presetManifest(defaultManifest)
  })
  const document = await project.open('<div class="preset-block"></div>')
  expect(document.workspace().languageRuntimeSource).toBe('workspace')
  expect(await document.hover('preset-block')).toBeUndefined()

  const block = defaultManifest.utilities!.find((utility) => utility.name === 'block')!
  project.write('node_modules/@stet-css/preset/default-manifest.json', JSON.stringify({
    ...defaultManifest,
    utilities: [
      ...defaultManifest.utilities!,
      { ...block, id: '.preset-block', name: 'preset-block', matchers: [{ type: 'static', name: 'preset-block' }] }
    ]
  }))

  await until(async () => (await document.hover('preset-block'))?.includes('display:block') ?? false, 'hover to show preset-block')
})

/**
 * Guards #248: a branch switch writes many watched files, a few at a time, and reloading the
 * workspace for each check that finds a change rebuilds the manifest over and over while the
 * editor waits. The server must wait until a check finds nothing new, then reload once.
 * Catches: reporting changes at every check that finds one (`changed ||` dropped in
 * `FileWatcher.check`), which reloads three times here.
 */
test('reloads once after a branch switch that rewrites the watched files over several checks', async () => {
  const checkFiles = controlFileChecks()
  const project = await openProject({
    'index.css': `@import '@stet-css/core';\n@import './a.css';\n@import './b.css';\n@import './c.css';\n`,
    'a.css': components('watch-a', 'block'),
    'b.css': components('watch-b', 'block'),
    'c.css': components('watch-c', 'block')
  })
  const document = await project.open('<div class="watch-c2"></div>')
  const publishedBefore = document.diagnostics().length

  for (const [file, name] of [['a.css', 'watch-a2'], ['b.css', 'watch-b2'], ['c.css', 'watch-c2']]) {
    project.replace(file, components(name, 'grid'))
    checkFiles()
  }
  checkFiles()
  checkFiles()
  checkFiles()
  await project.server.reloading

  expect(await document.hover('watch-c2')).toContain('display:grid')
  expect(document.diagnostics().length - publishedBefore).toBe(1)
})

/**
 * Guards #248 for diagnostics: a branch whose imported CSS imports a file that is not there must
 * show the manifest error on open documents, and switching back must clear it, although the failed
 * load returned no dependencies.
 * Catches: a failed load that watches only the entries, not the files it reached through
 * `onDependency`, which leaves the error up after the switch back.
 */
test('shows and then clears a manifest error that a branch switch brings and takes away', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-card"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics()).toEqual([])

  project.replace('components.css', `@import './missing.css';\n`)
  await until(() => lastDiagnostics().some(({ code }) => code === 'manifest-loading-error'), 'the manifest error')

  project.replace('components.css', components('watch-card', 'flex'))
  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-card')).toContain('display:flex')
})

/**
 * Guards #248 for a document opened while an imported file fails to compile: no earlier load
 * listed that file and the failed compile lists none, yet fixing it outside the editor must clear
 * the error.
 * Catches: a failed load that watches only the entries; before the import graph fallback in
 * `loadWorkspacePlan` existed, the error stayed up and this test alone was red.
 */
test('clears a manifest error once the imported file it points at is fixed', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': '.watch-card {\n  @compose "block";\n}\n'
  })
  const document = await project.open('<div class="watch-card"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics().map(({ code }) => code)).toContain('manifest-loading-error')

  project.replace('components.css', components('watch-card', 'flex'))

  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-card')).toContain('display:flex')
})

/**
 * Guards #248 (review F1): a branch without the stylesheet removes the entry and its import, and the
 * reload that follows finds nothing to load. Switching back must still reload, although no load
 * lists those files any more.
 * Catches: a reload that replaces the watched files with what it found, dropping the missing ones.
 */
test('picks up an entry that a branch switch removed and a later one restored', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-card"></div>')
  expect(await document.hover('watch-card')).toContain('display:block')

  project.remove('index.css')
  project.remove('components.css')
  await until(async () => (await document.hover('watch-card')) === undefined, 'the stylesheet to go away')

  project.write('index.css', ENTRY_CSS)
  project.write('components.css', components('watch-card', 'flex'))

  await until(async () => (await document.hover('watch-card'))?.includes('display:flex') ?? false, 'hover to show watch-card again')
})

/**
 * Guards #248 (review F2): a document opened while an import is missing gets a failed first load
 * with no earlier load to fall back on; fixing the importing file outside the editor must clear the
 * error.
 * Catches: a failed load that watches only the entries, or loses the files it reached before the
 * missing import.
 */
test('clears a first-load error once the file that imports a missing stylesheet is fixed', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': `@import './missing.css';\n`
  })
  const document = await project.open('<div class="watch-card"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics().map(({ code }) => code)).toContain('manifest-loading-error')

  project.replace('components.css', components('watch-card', 'flex'))

  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-card')).toContain('display:flex')
})

/**
 * Guards #248 (review F3): a branch switch can write the importing file before the file it imports,
 * or a build can generate the import later. Creating the missing file must reload the workspace.
 * Catches: not watching the missing import's own path.
 */
test('picks up a missing import once the file is created', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-new"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []

  project.replace('components.css', `@import './widgets/new.css';\n`)
  await until(() => lastDiagnostics().some(({ code }) => code === 'manifest-loading-error'), 'the manifest error')

  project.write('widgets/new.css', components('watch-new', 'grid'))

  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-new')).toContain('display:grid')
})

/**
 * Guards #248 (review F8): a stylesheet the entry pulls in with `@reference` feeds the manifest like
 * an import; when it fails to compile on the first load, fixing it outside the editor must clear
 * the error.
 * Catches: a failed load that lists `@import` files but not `@reference` targets.
 */
test('clears a first-load error once the referenced stylesheet is fixed', async () => {
  const project = await openProject({
    'index.css': `@import '@stet-css/core';\n@reference './tokens.css';\n`,
    'tokens.css': '.watch-card {\n  @compose "block";\n}\n'
  })
  const document = await project.open('<div class="block"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics().map(({ code }) => code)).toContain('manifest-loading-error')

  project.replace('tokens.css', '.watch-card {\n  @compose block;\n}\n')

  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
})

/**
 * Prevents the server from checking a workspace's files for the rest of the session after its
 * last document closed, when nothing it could reload is in use.
 */
test('stops checking files once no document of the workspace is open', async () => {
  controlFileChecks()
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-card"></div>')
  expect(vi.getTimerCount()).toBe(1)

  await document.close()

  expect(vi.getTimerCount()).toBe(0)
})
