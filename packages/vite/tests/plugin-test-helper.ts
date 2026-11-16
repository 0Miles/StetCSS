import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, type BuildOptions, type Plugin, type PluginOption } from 'vite'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }

export const SLOT_CSS_RULE = '#master-css-slot{--slot:0}'

export async function runTransform(plugin: Plugin, id: string) {
  if (typeof plugin.transform === 'function') {
    return await plugin.transform.call({} as any, readFileSync(id, 'utf-8'), id)
  }
  if (plugin.transform && typeof plugin.transform === 'object' && 'handler' in plugin.transform) {
    return await (plugin.transform.handler as any).call({} as any, readFileSync(id, 'utf-8'), id)
  }
  throw new Error('plugin.transform is not a callable function')
}

export async function runTransformIndexHtml(plugin: Plugin, html: string) {
  if (typeof plugin.transformIndexHtml === 'function') {
    const result = await plugin.transformIndexHtml.call({} as any, html, {} as any)
    return typeof result === 'string' ? result : (result && 'html' in result ? result.html : undefined)
  }
  throw new Error('transformIndexHtml is not defined')
}
const projectRoots: string[] = []

/** Deletes the projects `createProjectContext` made; call it from `afterEach`. */
export function removeProjects() {
  for (const root of projectRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
}

/**
 * A plugin context for a temp project whose only source file is `index.html`: the plugin
 * reads classes from the project's files, so `html` decides the extracted CSS.
 */
export function createProjectContext({
  command = 'build',
  html = ''
}: {
  command?: 'serve' | 'build'
  html?: string
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-vite-project-'))
  projectRoots.push(root)
  writeFileSync(join(root, 'index.html'), html)
  return {
    config: { command, root },
    scanner: {
      cwd: root,
      options: { adapters: [] },
      slotCSSRule: SLOT_CSS_RULE,
      css: { text: '', manifest: defaultManifestJSON },
      config: {},
      latentClasses: new Set(),
      validClasses: new Set()
    }
  } as any
}

export interface BuildProjectOptions {
  appClass?: string
  build?: BuildOptions
  /** Replaces the default `index.html`, which renders `appClass` and loads `src/main.ts`. */
  html?: string
  mainTS?: string
  plugins: PluginOption[]
  prefix?: string
  setup?: (root: string) => void
  styleCSS?: string
}

/**
 * Runs a real Vite build of a temp project and returns its built `index.html` (empty when the
 * build emits none, such as an SSR build), the concatenated CSS assets and their file names.
 * Fails when the build emits no CSS asset.
 */
export async function buildProject({
  appClass = '',
  build: buildOptions,
  html,
  mainTS = 'import "./style.css"\n',
  plugins,
  prefix = 'master-css-vite-style-entry-',
  setup,
  styleCSS
}: BuildProjectOptions) {
  const tmpRoot = join(process.cwd(), 'tmp')
  mkdirSync(tmpRoot, { recursive: true })
  const root = mkdtempSync(join(tmpRoot, prefix))

  try {
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'index.html'), html ?? [
      `<main${appClass ? ` class="${appClass}"` : ''}></main>`,
      '<script type="module" src="/src/main.ts"></script>'
    ].join('\n'))
    writeFileSync(join(root, 'src/main.ts'), mainTS)
    if (styleCSS !== undefined) writeFileSync(join(root, 'src/style.css'), styleCSS)
    setup?.(root)

    await build({
      root,
      logLevel: 'silent',
      plugins,
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        ...buildOptions
      }
    })

    const assetsDir = join(root, 'dist/assets')
    const cssFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.css'))
    if (!cssFiles.length) throw new Error('Expected Vite build to emit a CSS asset.')

    const builtHTMLPath = join(root, 'dist/index.html')
    return {
      cssFiles,
      css: cssFiles
        .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
        .join('\n'),
      html: existsSync(builtHTMLPath) ? readFileSync(builtHTMLPath, 'utf8') : ''
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
