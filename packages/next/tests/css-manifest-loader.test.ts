import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import stetCSSManifestLoader from '../src/css-manifest-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(join(tmpdir(), 'stet-css-next-'))
  return fixtureDir
}

function runManifestLoader(context: {
  resourcePath: string
  rootContext?: string
  getOptions?: () => any
  addDependency?: (dependency: string) => void
}) {
  return new Promise<string>((resolve, reject) => {
    stetCSSManifestLoader.call({
      ...context,
      async: () => (error: Error | null, result?: string) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result || '')
      }
    })
  })
}

afterEach(() => {
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('css manifest loader', () => {
  it('turns a CSS entry resource into an importable manifest JSON asset', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    const dependencies: string[] = []
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }')

    const source = await runManifestLoader({
      resourcePath: manifestPath,
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(dependencies).toEqual([manifestPath])
    expect(source).toContain('"version":1')
    expect(JSON.parse(source).version).toBe(1)
    expect(source).toContain('primary')
    expect(source).toContain('#123')
  })

  it('wraps the manifest JSON as an ECMAScript module when requested', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }')

    const source = await runManifestLoader({
      resourcePath: manifestPath,
      getOptions: () => ({ module: true })
    })

    expect(source).toMatch(/^export default \{"version":1/)
    expect(source).toContain('primary')
    expect(source).toContain('#123')
  })

  it('wraps the manifest JSON as an external JSON facade when requested', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }')

    const source = await runManifestLoader({
      resourcePath: manifestPath,
      rootContext: projectDir,
      getOptions: () => ({ module: true, external: true })
    })
    const assetDir = join(projectDir, '.next/static/media')
    const assetFile = readdirSync(assetDir).find((file) => file.endsWith('.json'))

    expect(source).toContain('/_next/static/media/stet-css-manifest.')
    expect(source).toContain('loadStetCSSManifestFromFetch')
    expect(source).toContain('async function loadStetCSSManifestFromFetch(url)')
    expect(source).toContain('const response = await fetch(specifier);')
    expect(source).toContain(': await loadStetCSSManifestFromFetch(stetCSSManifestURL);')
    expect(source).toContain(`with: { type: 'json' }`)
    expect(source).toContain('fetch(')
    expect(source).not.toContain('#123')
    expect(assetFile).toBeTruthy()
    expect(readFileSync(join(assetDir, assetFile || ''), 'utf8')).toContain('#123')
    expect(readFileSync(join(projectDir, '.next/dev/static/media', assetFile || ''), 'utf8')).toContain('#123')
  })

  it('inlines manifest modules in development for HMR', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    const env = process.env as Record<string, string | undefined>
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }')

    try {
      env.NODE_ENV = 'development'
      const source = await runManifestLoader({
        resourcePath: manifestPath,
        rootContext: projectDir,
        getOptions: () => ({ module: true, external: true })
      })

      expect(source).toMatch(/^export default \{"version":1/)
      expect(source).toContain('#123')
      expect(source).not.toContain('loadStetCSSManifestFromImport')
    } finally {
      if (originalNodeEnv === undefined) {
        delete env.NODE_ENV
      } else {
        env.NODE_ENV = originalNodeEnv
      }
    }
  })

  it('loads CSS when the loader resource includes ?stet-css-manifest', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    const dependencies: string[] = []
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, [
      '@theme {',
      '    --color-primary: #123;',
      '}',
      '@components {',
      '    btn {',
      '        color: var(--color-primary);',
      '    }',
      '}'
    ].join('\n'))

    const source = await runManifestLoader({
      resourcePath: `${manifestPath}?stet-css-manifest`,
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(dependencies).toEqual([manifestPath])
    expect(source).toContain('"version":1')
    expect(source).toContain('primary')
    expect(source).toContain('#123')
    expect(source).toContain('"btn"')
    expect(source).toContain('var(--color-primary)')
  })

  it('loads the default virtual manifest from CSS entry files only', async () => {
    const projectDir = createFixtureDir()
    mkdirSync(join(projectDir, 'app'), { recursive: true })
    const entryPath = join(projectDir, 'app/globals.css')
    const directiveOnlyPath = join(projectDir, 'app/directives-only.css')
    const dependencies: string[] = []
    writeFileSync(entryPath, [
      '@import "@stet-css/core";',
      '@theme {',
      '    --color-primary: #123;',
      '}',
      '@components {',
      '    btn { color: var(--color-primary); }',
      '}'
    ].join('\n'))
    writeFileSync(directiveOnlyPath, [
      '@source "./ignored.tsx";',
      '@theme {',
      '    --color-ignored: #456;',
      '}'
    ].join('\n'))

    const source = await runManifestLoader({
      resourcePath: join(projectDir, 'node_modules/.stet-css/stet-css-manifest.js'),
      rootContext: projectDir,
      getOptions: () => ({ virtual: true }),
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(source).toContain('"version":1')
    expect(source).toContain('primary')
    expect(source).toContain('#123')
    expect(source).toContain('"btn"')
    expect(source).not.toContain('ignored')
    expect(dependencies).toContain(entryPath)
    expect(dependencies).not.toContain(directiveOnlyPath)
  })

  it('keeps virtual manifest dependencies registered after invalid CSS and recovers on the next run', async () => {
    const projectDir = createFixtureDir()
    const entryPath = join(projectDir, 'app/globals.css')
    const virtualManifestPath = join(projectDir, 'node_modules/.stet-css/stet-css-manifest.js')
    const dependencies: string[] = []
    mkdirSync(join(projectDir, 'app'), { recursive: true })
    writeFileSync(entryPath, [
      '@import "@stet-css/core";',
      '@components {',
      '    card {',
      '        @compose bg:neutral-120;',
      '    }',
      '}'
    ].join('\n'))

    await expect(runManifestLoader({
      resourcePath: virtualManifestPath,
      rootContext: projectDir,
      getOptions: () => ({ virtual: true, module: true }),
      addDependency: (dependency: string) => dependencies.push(dependency)
    })).rejects.toThrow('Invalid @compose class')
    expect(dependencies).toContain(entryPath)

    writeFileSync(entryPath, [
      '@import "@stet-css/core";',
      '@components {',
      '    card {',
      '        @compose block;',
      '    }',
      '}'
    ].join('\n'))

    const source = await runManifestLoader({
      resourcePath: virtualManifestPath,
      rootContext: projectDir,
      getOptions: () => ({ virtual: true, module: true })
    })

    expect(source).toContain('"version":1')
    expect(source).toContain('"card"')
    expect(source).toContain('display')
  })
})
