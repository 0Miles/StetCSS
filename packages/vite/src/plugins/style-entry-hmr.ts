import type { Plugin, ViteDevServer } from 'vite'
import { isStylesheetSourceFile } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import getExtractedCSS, { getStylesheetSourceContext } from '../utils/extracted-css'
import { invalidateEmittedGlobalsModule } from '../utils/emitted-globals-module'
import { registerEditedStyleEntries } from '../utils/register-style-source'

/** HMR when the project's source files change */
export default function StyleEntryHMRPlugin(context: PluginContext): Plugin {
  let updateChain: Promise<unknown> = Promise.resolve()
  const updateStyleCSSImporters = async (server: ViteDevServer) => {
    const virtualCSSImporters = Array.from(context.virtualCSSImporters || [])
    await Promise.all(virtualCSSImporters.map(async (eachModuleId) => {
      // `server.moduleGraph` returns the client module when several environments hold the
      // id, so reloading it leaves the others with their cached transform. Frameworks that
      // inline the server environment's CSS into the HTML (Astro, SvelteKit, Nuxt) would
      // keep serving the CSS from before the change.
      for (const environment of Object.values(server.environments ?? {})) {
        if (environment.name === 'client') continue
        const environmentModule = environment.moduleGraph.getModuleById(eachModuleId)
        if (environmentModule) {
          environment.moduleGraph.invalidateModule(environmentModule)
        }
      }
      const eachModule = server.moduleGraph.getModuleById(eachModuleId)
      if (eachModule) {
        await server.reloadModule(eachModule)
      }
    }))
  }
  const queueUpdate = (update: () => Promise<unknown>) => {
    updateChain = updateChain.then(update).catch((err: unknown) => {
      console.error('[stet-css.vite] source update failed:', err)
    })
  }
  const serversWithPendingSourceUpdate = new Set<ViteDevServer>()
  /**
   * A source file was added, changed or removed: classes come from the project's files, so
   * reload the managed CSS when its output changed. Templates that no client module imports,
   * such as Astro pages, reach the CSS this way.
   */
  const handleSourceFileChange = (server: ViteDevServer, file: string) => {
    if (!context.virtualCSSImporters?.size) return
    if (!isStylesheetSourceFile(file, getStylesheetSourceContext(context))) return
    // Before the queued extraction: a page reload this change triggers (an HTML edit, a module
    // without an HMR boundary) can request the module first, and it reads the file from disk.
    invalidateEmittedGlobalsModule(server)
    // A burst of changes (a checkout, save-all) shares one pending update, which extracts
    // after the changes before it started have landed.
    if (serversWithPendingSourceUpdate.has(server)) return
    serversWithPendingSourceUpdate.add(server)
    // The baseline is taken when the file changes, not when the queued update runs: another
    // extraction in between (an SSR transform of the entry) would already see the new
    // classes and make the update look like a no-op. The emittedGlobals module's load does
    // not record its extraction, since a load can read a save before its watcher event.
    const previousCSS = context.extractedCSS
    queueUpdate(async () => {
      serversWithPendingSourceUpdate.delete(server)
      if (await getExtractedCSS(context) === previousCSS) return
      await updateStyleCSSImporters(server)
    })
  }
  return {
    name: 'stet-css:style-entry:hmr',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      for (const event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, (file: string) => {
          handleSourceFileChange(server, file)
        })
      }
    },
    /**
     * A stylesheet entry, or a stylesheet it imports, was edited. Vite awaits this hook before
     * it sends the update (a full reload when the page imports the manifest), and the
     * reloaded page can request the emittedGlobals module before the entry's transform runs
     * again; so the entry is registered from disk here first. Returns nothing, which keeps
     * Vite's own update list.
     */
    async handleHotUpdate({ file, server }) {
      if (await registerEditedStyleEntries(context, file)) invalidateEmittedGlobalsModule(server)
    }
  }
}
