import { fileURLToPath } from 'node:url'
import type { Compiler, RuleSetRule } from 'webpack'
import type { StetCSSWebpackContext, WebpackSubPlugin } from '../plugin'

/** vue-loader's request for a `.vue` `<style>` block: `App.vue?vue&type=style&index=0&…`. */
const VUE_STYLE_BLOCK_QUERY_RE = /(?:^\?|&)type=style(?:&|$)/
/** vue-loader itself, by package name or resolved entry; not its pitcher or template loader. */
const VUE_LOADER_RE = /(?:^|[\\/])vue-loader(?:[\\/](?:dist|lib)[\\/]index\.js)?$/

function resolveStyleCSSLoaderPath() {
  return fileURLToPath(new URL('../style-css-loader.js', import.meta.url))
}

function isVueLoaderRule(rule: unknown) {
  if (!rule || typeof rule !== 'object') return false
  const { enforce, loader, use } = rule as RuleSetRule
  if (enforce) return false
  const uses = Array.isArray(use) ? use : [use]
  return [loader, ...uses].some((item) => {
    const name = typeof item === 'string' ? item : (item as { loader?: unknown } | undefined)?.loader
    return typeof name === 'string' && VUE_LOADER_RE.test(name)
  })
}

export default function StyleEntryPlugin(context: StetCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const createUse = () => [{
        loader: resolveStyleCSSLoaderPath(),
        options: {
          virtualCSSImportModuleId: context.virtualCSSImportModuleId,
          hostId: context.hostId
        }
      }]
      // Installed once every plugin has applied, whatever the order: VueLoaderPlugin copies the
      // rules present at its own `apply` onto `.vue` blocks, and a copy of the `pre` rule would
      // run on the whole `.vue` file, before vue-loader extracts the block.
      compiler.hooks.initialize.tap(context.name, () => {
        const rules = compiler.options.module.rules
        rules.push({
          test: /\.(css|scss|sass)$/,
          enforce: 'pre',
          use: createUse()
        })
        // vue-loader runs a `<style>` block through the loaders between css-loader and
        // vue-loader, after it extracts the block and before Vue's scoped style compiler. A
        // normal rule placed right before vue-loader's lands there.
        const vueLoaderRuleIndex = rules.findIndex(isVueLoaderRule)
        if (vueLoaderRuleIndex === -1) return
        rules.splice(vueLoaderRuleIndex, 0, {
          test: /\.vue$/,
          resourceQuery: VUE_STYLE_BLOCK_QUERY_RE,
          use: createUse()
        })
      })
    }
  }
}
