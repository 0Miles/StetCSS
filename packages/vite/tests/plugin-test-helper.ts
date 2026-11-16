import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Plugin } from 'vite'
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
  html = '',
  includeGeneratedCSS
}: {
  command?: 'serve' | 'build'
  html?: string
  includeGeneratedCSS?: boolean
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-vite-project-'))
  projectRoots.push(root)
  writeFileSync(join(root, 'index.html'), html)
  return {
    config: { command, root },
    includeGeneratedCSS,
    scanner: Object.assign(new EventEmitter(), {
      cwd: root,
      options: { safelist: [] },
      slotCSSRule: SLOT_CSS_RULE,
      css: { text: '', manifest: defaultManifestJSON },
      config: {},
      latentClasses: new Set(),
      validClasses: new Set(),
      nativeClassNames: new Set(),
      usedNativeClasses: new Set()
    })
  } as any
}
