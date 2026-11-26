import { fileURLToPath } from 'node:url'
import type { Compiler, RuleSetRule } from 'webpack'
import type { StetCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { STYLE_FILE_RE } from '../utils/transform-style-source'

/** vue-loader's request for a `.vue` `<style>` block: `App.vue?vue&type=style&index=0&…`. */
const VUE_STYLE_BLOCK_QUERY_RE = /(?:^\?|&)type=style(?:&|$)/
/**
 * What webpack's rules see as that request's resource: `App.vue`, or `App.vue.css` when
 * vue-loader's `experimentalInlineMatchResource` names the block by a match resource.
 */
const VUE_STYLE_BLOCK_RESOURCE_RE = /\.vue(?:\.(?:css|scss|sass))?$/
/** vue-loader itself, by package name or resolved entry; not its pitcher or template loader. */
const VUE_LOADER_RE = /(?:^|[\\/])vue-loader(?:[\\/](?:dist|lib)[\\/]index\.js)?$/
/** The file VueLoaderPlugin matches rules against to find the one for `.vue` files. */
const VUE_FILE_PROBE = 'foo.vue'

function resolveStyleCSSLoaderPath() {
  return fileURLToPath(new URL('../style-css-loader.js', import.meta.url))
}

/** A webpack rule condition: RegExp, absolute-path prefix, function, array, or `and`/`or`/`not`. */
function matchesCondition(condition: unknown, value: string): boolean {
  if (condition instanceof RegExp) return condition.test(value)
  if (typeof condition === 'string') return value.startsWith(condition)
  if (typeof condition === 'function') return Boolean(condition(value))
  if (Array.isArray(condition)) return condition.some((item) => matchesCondition(item, value))
  if (!condition || typeof condition !== 'object') return false
  const { and, or, not } = condition as { and?: unknown[], or?: unknown[], not?: unknown }
  return (!and || and.every((item) => matchesCondition(item, value)))
    && (!or || or.some((item) => matchesCondition(item, value)))
    && (not === undefined || !matchesCondition(not, value))
}

function usesVueLoader({ loader, use }: RuleSetRule) {
  const uses = Array.isArray(use) ? use : [use]
  return [loader, ...uses].some((item) => {
    const name = typeof item === 'string' ? item : (item as { loader?: unknown } | undefined)?.loader
    return typeof name === 'string' && VUE_LOADER_RE.test(name)
  })
}

/**
 * Whether the rule hands `.vue` files to vue-loader, found the way VueLoaderPlugin finds it: a
 * plain `foo.vue` request, `include` aside. VueLoaderPlugin's copies of rules match `?vue` block
 * requests only, and a rule that runs other files through vue-loader, such as VuePress's
 * `.md` one, matches no `.vue` file; both can sit before the css rule's copies.
 */
function isVueFileRule(rule: unknown) {
  if (!rule || typeof rule !== 'object') return false
  const { enforce, test, resource, exclude, resourceQuery } = rule as RuleSetRule
  if (enforce || !usesVueLoader(rule as RuleSetRule)) return false
  return (test === undefined || matchesCondition(test, VUE_FILE_PROBE))
    && (resource === undefined || matchesCondition(resource, VUE_FILE_PROBE))
    && (exclude === undefined || !matchesCondition(exclude, VUE_FILE_PROBE))
    && (resourceQuery === undefined || matchesCondition(resourceQuery, ''))
}

export default function StyleEntryPlugin(context: StetCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const createUse = (options: { vueStyleBlock?: boolean } = {}) => [{
        loader: resolveStyleCSSLoaderPath(),
        options: {
          virtualCSSImportModuleId: context.virtualCSSImportModuleId,
          hostId: context.hostId,
          ...options
        }
      }]
      let installed = false
      const install = () => {
        if (installed) return
        installed = true
        const rules = compiler.options.module.rules
        rules.push({
          test: STYLE_FILE_RE,
          enforce: 'pre',
          use: createUse()
        })
        // vue-loader runs a `<style>` block through the loaders between css-loader and
        // vue-loader, after it extracts the block and before Vue's scoped style compiler. A
        // normal rule placed right before the rule for `.vue` files, so after every copy
        // VueLoaderPlugin makes and every rule vue-loader's match-resource form meets, lands
        // there.
        const vueFileRuleIndex = rules.findIndex(isVueFileRule)
        if (vueFileRuleIndex === -1) return
        rules.splice(vueFileRuleIndex, 0, {
          test: VUE_STYLE_BLOCK_RESOURCE_RE,
          resourceQuery: VUE_STYLE_BLOCK_QUERY_RE,
          use: createUse({ vueStyleBlock: true })
        })
      }
      // Installed once every plugin has applied, whatever the order: VueLoaderPlugin copies the
      // rules present at its own `apply` onto `.vue` blocks, and a copy of the `pre` rule would
      // run on the whole `.vue` file. A plugin applied after `webpack()` returned misses
      // `initialize`; its rules go in before the first build instead, as webpack compiles the
      // rules when a build creates its module factory.
      compiler.hooks.initialize.tap(context.name, install)
      compiler.hooks.beforeRun.tap(context.name, install)
      compiler.hooks.watchRun.tap(context.name, install)
    }
  }
}
