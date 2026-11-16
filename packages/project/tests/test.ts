import { expect, test } from 'vitest'
import { loadManifest, loadManifestJSON, loadProjectManifest } from '../src/manifest'
import { loadManifestJSONSync, loadManifestSync, loadProjectManifestSync } from '../src/manifest-sync'
import { MASTER_CSS_MANIFEST_QUERY } from '@stet-css/integration/manifest-module'
import {
  STYLE_ENTRY_EXTENSIONS,
  findCSSManifestEntryFiles,
  findCSSManifestEntryFilesSync,
  findMasterCSSWorkspaceDirectories,
  hasStetCSSManifestEntrypoint,
  resolveMasterCSSPackageEntryFile
} from '../src/entries'
import {
  isCompatibleMasterCSSPackageVersion,
  resolveMasterCSSWorkspacePackages
} from '../src/workspace'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { flattenStetCSSManifestVariables } from '@stet-css/schema/manifest'

function createFixture() {
  return mkdtempSync(join(tmpdir(), 'master-css-manifester-'))
}

function isSameOrChildPath(parentPath: string, childPath: string) {
  const relativePath = relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${sep}`)
      && !isAbsolute(relativePath)
    )
}

/**
 * Writes a stylesheet with its own theme and components. Loading it by path needs no entry
 * marker; pass `entry` when the test relies on entry discovery, which needs one, to mark it
 * with `@import "@stet-css/core"`.
 */
function writeCSSFixture(cwd: string, { entry: markEntry = false } = {}) {
  mkdirSync(join(cwd, 'styles'), { recursive: true })
  const entry = join(cwd, 'index.css')
  const tokens = join(cwd, 'styles', 'tokens.css')
  const marker = markEntry ? '@import "@stet-css/core";' : ''
  writeFileSync(tokens, `
    @theme {
      --color-primary: #123;
    }
  `)
  writeFileSync(entry, `
    ${marker}
    @import './styles/tokens.css';

    @components {
      btn {
        color: var(--color-primary);
        display: inline-flex;
      }
    }
  `)
  return { entry, tokens }
}

function writeJSON(file: string, value: unknown) {
  writeFileSync(file, JSON.stringify(value, null, 2))
}

function toPackagePath(packageName: string) {
  return join(...packageName.split('/'))
}

function writeNodePackage(
  root: string,
  packageName: string,
  packageJSON: Record<string, unknown>,
  files: Record<string, string> = { 'index.js': 'export default {}' }
) {
  const packageDir = join(root, 'node_modules', toPackagePath(packageName))
  mkdirSync(packageDir, { recursive: true })
  writeJSON(join(packageDir, 'package.json'), {
    name: packageName,
    type: 'module',
    version: '1.2.3',
    exports: {
      '.': './index.js'
    },
    ...packageJSON
  })
  for (const [file, source] of Object.entries(files)) {
    writeFileSync(join(packageDir, file), source)
  }
  return packageDir
}

test('loads CSS manifest resources', async () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = await loadManifest(entry)
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ],
      nativeCSS: '',
      css: '',
      generatedCSS: ''
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenStetCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'btn',
      layer: 'components',
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads CSS manifest resources synchronously', () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = loadManifestSync(entry)
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ]
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenStetCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads package entry preset manifest from CSS imports', async () => {
  const cwd = createFixture()
  try {
    const entry = join(cwd, 'index.css')
    writeFileSync(entry, `
      @import "@stet-css/core";

      @components {
        card {
          @variant sm {
            color: red;
          }
        }
      }
    `)

    const result = await loadManifest(entry)
    const packageEntry = resolveMasterCSSPackageEntryFile('@stet-css/core', entry, cwd)
    expect(packageEntry).toBeTruthy()
    if (!packageEntry) throw new Error('Expected Master CSS package entry')
    expect(result.dependencies).toContain(packageEntry)
    const packageDependencies = result.dependencies
      .filter((dependency: string) => !isSameOrChildPath(cwd, dependency))
    expect(packageDependencies.length).toBeGreaterThan(1)
    expect(flattenStetCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'breakpoint-sm',
      namespace: 'breakpoint',
      key: 'sm',
      type: 'number',
      value: '52.125rem',
      numeric: { value: 52.125, unit: 'rem' }
    }))
    expect(result.manifest.breakpointConditions?.sm).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
    })
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'card',
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads project-level CSS manifest entries', async () => {
  const cwd = createFixture()
  try {
    const { entry } = writeCSSFixture(cwd, { entry: true })
    writeFileSync(join(cwd, 'ignored.css'), `
      @source "./ignored.tsx";
      @layer components {
        .ignored {
          color: red;
        }
      }
    `)

    expect(hasStetCSSManifestEntrypoint('@master entry;')).toBe(false)
    expect(hasStetCSSManifestEntrypoint('@source "./page.tsx";')).toBe(false)
    expect(hasStetCSSManifestEntrypoint('@import "@stet-css/core/index.css";')).toBe(false)
    await expect(findCSSManifestEntryFiles(cwd)).resolves.toStrictEqual([entry])

    const result = await loadProjectManifest(cwd)
    const syncResult = loadProjectManifestSync(cwd)

    expect(result.entries).toStrictEqual([entry])
    expect(syncResult.manifest).toStrictEqual(result.manifest)
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'btn'
    }))
    expect(result.manifest.utilities).not.toContainEqual(expect.objectContaining({
      name: 'ignored'
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

/**
 * Prevents: a project still marked with the removed `@master entry;` (or holding a `@master { }`
 * block) being silently skipped by discovery, so `stet-css scan`, `inspect` and the language
 * server find no entries and show no error. Such files are listed so compiling them raises the
 * replacement message; unrelated CSS, including `url(logo@master.png)`, stays out.
 * Reverse check: dropping the `@master` predicate from `isDiscoveredCSSManifestEntry` turns only
 * this test red in this package (and the diagnostics `@master` inspect test).
 */
test('lists stylesheets holding removed @master at-rules so compiling them reports the error', async () => {
  const cwd = createFixture()
  try {
    writeFileSync(join(cwd, 'legacy.css'), '@master entry;\n.btn { color: red; }')
    writeFileSync(join(cwd, 'settings.css'), '.btn { color: red; }\n@master { mode-trigger: media; }')
    writeFileSync(join(cwd, 'plain.css'), '.logo { background: url(logo@master.png); }')
    const listed = [join(cwd, 'legacy.css'), join(cwd, 'settings.css')]

    await expect(findCSSManifestEntryFiles(cwd)).resolves.toStrictEqual(listed)
    expect(findCSSManifestEntryFilesSync(cwd)).toStrictEqual(listed)
    await expect(loadProjectManifest(cwd)).rejects.toThrow("@import '@stet-css/core'")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

/**
 * Guards Sass stylesheet entries for static CSS: a build that only looks for `.css` entries
 * drops a Sass entry's `@theme` and `@components`, while manifest loading, which reads plain
 * CSS only, must keep ignoring Sass files.
 * Reverse check: ignoring the `extensions` option turns only this test red.
 */
test('finds Sass stylesheet entries only when the caller asks for their extensions', async () => {
  const cwd = createFixture()
  try {
    mkdirSync(join(cwd, 'styles'), { recursive: true })
    mkdirSync(join(cwd, 'node_modules', 'ui'), { recursive: true })
    writeFileSync(join(cwd, 'styles', 'app.css'), '@import "@stet-css/core";')
    writeFileSync(join(cwd, 'styles', 'theme.scss'), '$brand: #123456;\n@import "@stet-css/core";\n@theme { --color-brand: #{$brand}; }')
    writeFileSync(join(cwd, 'styles', 'legacy.sass'), '@import "@stet-css/core";')
    writeFileSync(join(cwd, 'styles', 'plain.scss'), '.card { color: red; }')
    writeFileSync(join(cwd, 'node_modules', 'ui', 'index.scss'), '@import "@stet-css/core";')

    const styleEntries = [
      join(cwd, 'styles', 'app.css'),
      join(cwd, 'styles', 'legacy.sass'),
      join(cwd, 'styles', 'theme.scss')
    ]
    await expect(findCSSManifestEntryFiles(cwd)).resolves.toStrictEqual([join(cwd, 'styles', 'app.css')])
    await expect(findCSSManifestEntryFiles(cwd, { extensions: STYLE_ENTRY_EXTENSIONS })).resolves.toStrictEqual(styleEntries)
    expect(findCSSManifestEntryFilesSync(cwd, { extensions: STYLE_ENTRY_EXTENSIONS })).toStrictEqual(styleEntries)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('finds Master CSS workspace directories from package and CSS entries', async () => {
  const cwd = createFixture()
  try {
    mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
    mkdirSync(join(cwd, 'docs', 'styles'), { recursive: true })
    writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
      dependencies: {
        '@stet-css/core': 'workspace:*'
      }
    }))
    writeFileSync(join(cwd, 'packages', 'app', 'index.css'), '@import "@stet-css/core";')
    writeFileSync(join(cwd, 'docs', 'styles', 'global.css'), '@import "@stet-css/core";')

    await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
      cwd,
      join(cwd, 'docs', 'styles'),
      join(cwd, 'packages', 'app')
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('does not match sibling workspace path prefixes', async () => {
  const cwd = createFixture()
  try {
    mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
    mkdirSync(join(cwd, 'packages', 'app-kit'), { recursive: true })
    writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
      dependencies: {
        '@stet-css/core': 'workspace:*'
      }
    }))
    writeFileSync(join(cwd, 'packages', 'app-kit', 'index.css'), '@import "@stet-css/core";')

    await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
      cwd,
      join(cwd, 'packages', 'app'),
      join(cwd, 'packages', 'app-kit')
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('resolves Master CSS workspace packages and optional language server', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@stet-css/core': '^1.2.3',
        '@stet-css/language-server': '^1.2.3'
      }
    })
    const cssDir = writeNodePackage(cwd, '@stet-css/core', {
      dependencies: {
        '@stet-css/engine': '^1.2.3',
        '@stet-css/preset': '^1.2.3'
      }
    })
    const engineDir = writeNodePackage(cssDir, '@stet-css/engine', {
      dependencies: {
        '@stet-css/schema': '^1.2.3'
      }
    }, {
      'index.js': 'export const builtinKeyAliases = {}; export const builtinNativeValueNamespaces = []'
    })
    const presetDir = writeNodePackage(cssDir, '@stet-css/preset', {
      exports: {
        './default-manifest.json': './default-manifest.json'
      }
    }, {
      'default-manifest.json': '{"version":1}'
    })
    const schemaDir = writeNodePackage(engineDir, '@stet-css/schema', {
      exports: {
        './utility-type': './utility-type.js'
      }
    }, {
      'utility-type.js': 'export default { Semantic: -2, Shorthand: -1, Normal: 0 }'
    })
    const languageServerDir = writeNodePackage(cwd, '@stet-css/language-server', {
      exports: {
        './server': './server.js'
      }
    }, {
      'server.js': 'export {}'
    })

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(realpathSync(resolution.css?.directory || '')).toBe(realpathSync(cssDir))
    expect(realpathSync(resolution.engine?.directory || '')).toBe(realpathSync(engineDir))
    expect(realpathSync(resolution.presetManifest?.directory || '')).toBe(realpathSync(presetDir))
    expect(realpathSync(resolution.utilityType?.directory || '')).toBe(realpathSync(schemaDir))
    expect(realpathSync(resolution.languageServer?.directory || '')).toBe(realpathSync(languageServerDir))
    expect(resolution.errors).toEqual([])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('reports missing workspace runtime packages without throwing', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@stet-css/core': '^1.2.3'
      }
    })
    const cssDir = writeNodePackage(cwd, '@stet-css/core', {})
    writeNodePackage(cssDir, '@stet-css/engine', {
      exports: {
        '.': './missing.js'
      }
    }, {})
    writeNodePackage(cssDir, '@stet-css/preset', {
      exports: {
        './default-manifest.json': './missing.json'
      }
    }, {})

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(realpathSync(resolution.css?.directory || '')).toBe(realpathSync(cssDir))
    expect(resolution.engine).toBeUndefined()
    expect(resolution.presetManifest).toBeUndefined()
    const requiredRuntimeErrorNames = resolution.errors
      .map(({ name }) => name)
      .filter((name) => name !== '@stet-css/language-server/server')
    expect(requiredRuntimeErrorNames).toEqual([
      '@stet-css/engine',
      '@stet-css/preset/default-manifest.json'
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('reports invalid package exports as resolution errors', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@stet-css/core': '^1.2.3'
      }
    })
    writeNodePackage(cwd, '@stet-css/core', {
      exports: {
        '.': './missing.js'
      }
    }, {})

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(resolution.css).toBeUndefined()
    expect(resolution.errors[0]).toMatchObject({
      name: '@stet-css/core'
    })
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('checks compatible package majors when versions are known', () => {
  expect(isCompatibleMasterCSSPackageVersion('2.1.0', '^2.0.0')).toBe(true)
  expect(isCompatibleMasterCSSPackageVersion('3.0.0', '^2.0.0')).toBe(false)
  expect(isCompatibleMasterCSSPackageVersion(undefined, '^2.0.0')).toBe(true)
  expect(isCompatibleMasterCSSPackageVersion('3.0.0', undefined)).toBe(true)
})

test('turns CSS manifest results into JSON sources', async () => {
  const cwd = createFixture()
  try {
    const { entry } = writeCSSFixture(cwd)
    const result = await loadManifestJSON(entry)
    const syncResult = loadManifestJSONSync(entry + MASTER_CSS_MANIFEST_QUERY)

    expect(result.json).toContain('"version":1')
    expect(JSON.parse(result.json).version).toBe(1)
    expect(syncResult.json).toBe(result.json)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('rejects script config paths', async () => {
  const cwd = createFixture()
  try {
    const script = join(cwd, 'config.ts')
    writeFileSync(script, 'export default {}')

    await expect(loadManifest(script)).rejects.toThrow('CSS files')
    expect(() => loadManifestSync(script)).toThrow('CSS files')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
