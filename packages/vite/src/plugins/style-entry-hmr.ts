import type { Plugin, ViteDevServer } from 'vite'
import { isStylesheetSourceFile } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import { getScanner } from '../utils/scanner-context'

/** HMR when the stylesheet entries or the project's source files change */
export default function StyleEntryHMRPlugin(_options: PluginOptions, context: PluginContext): Plugin {
  const servers: ViteDevServer[] = []
  let updateChain: Promise<unknown> = Promise.resolve()
  const onError = (label: string) => (err: unknown) => {
    console.error(`[master-css.vite] ${label} failed:`, err)
  }
  const updateStyleCSSImporters = async ({ server }: { server: ViteDevServer }) => {
    if (!server) return
    const virtualCSSImporters = Array.from(context.virtualCSSImporters || [])
    await Promise.all(virtualCSSImporters.map(async (eachModuleId) => {
      const eachModule = server.moduleGraph.getModuleById(eachModuleId)
      if (eachModule) {
        await server.reloadModule(eachModule)
      }
    }))
  }
  const queueUpdate = (update: () => Promise<unknown>, label: string) => {
    updateChain = updateChain.then(update).catch(onError(label))
    return updateChain
  }
  /**
   * A source file was added, changed or removed: classes come from the project's files, so
   * reload the managed CSS when its output changed. Templates that no client module imports,
   * such as Astro pages, reach the CSS this way.
   */
  const handleSourceFileChange = (server: ViteDevServer, file: string) => {
    if (!context.virtualCSSImporters?.size) return
    if (!isStylesheetSourceFile(file, {
      scanner: getScanner(context),
      styleCSSSources: context.styleCSSSources,
      projectDir: context.config?.root
    })) return
    return queueUpdate(async () => {
      const previousCSS = context.extractedCSS
      if (await getExtractedCSS(context) === previousCSS) return
      await updateStyleCSSImporters({ server })
    }, 'source update')
  }
  return {
    name: 'master-css:style-entry:hmr',
    enforce: 'pre',
    apply: 'serve',
    buildStart() {
      getScanner(context).on('change', () => {
        void queueUpdate(() => Promise.all(servers.map((eachServer) => updateStyleCSSImporters({ server: eachServer }))), 'hmr update')
      })
    },
    configureServer(server) {
      servers.push(server)
      for (const event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, (file: string) => {
          void handleSourceFileChange(server, file)
        })
      }
    }
  }
}
