import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses } from './oxc'
import { loadOptionalPeer } from './optional-peer'
import type { SourceAdapter, SourceAdapterInput } from './types'

type VueCompilerSFC = {
  parse: typeof import('vue/compiler-sfc')['parse']
}

// Vue's template AST node and prop types: an element, a static attribute and a directive.
const ELEMENT_NODE = 1
const ATTRIBUTE_PROP = 6
const DIRECTIVE_PROP = 7

interface VueTemplateProp {
  type: number
  name: string
  loc: { source: string }
  value?: { content: string }
  exp?: { content?: string }
}

interface VueTemplateNode {
  type: number
  props?: VueTemplateProp[]
  children?: VueTemplateNode[]
}

export const VUE_SOURCE_EXT = /\.vue(?:\?|$)/

function isVueSource(source: string) {
  return VUE_SOURCE_EXT.test(source) && !/[?&]type=style(?:&|$)/.test(source)
}

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

/**
 * Vue compiles attribute values and directive expressions with their character references
 * decoded, while the template text extraction reads them as written. Adds the decoded value of
 * every static class attribute and directive expression written with a reference.
 */
function addDecodedTemplateClasses(classes: Set<string>, root: VueTemplateNode) {
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()!
    if (node.type === ELEMENT_NODE) {
      for (const prop of node.props || []) {
        if (!prop.loc.source.includes('&')) continue
        if (prop.type === ATTRIBUTE_PROP && prop.name === 'class' && prop.value) {
          add(classes, extractClassCandidates(prop.value.content))
        } else if (prop.type === DIRECTIVE_PROP && prop.exp?.content) {
          add(classes, extractClassCandidates(prop.exp.content))
        }
      }
    }
    for (const child of node.children || []) stack.push(child)
  }
}

async function loadVueCompiler() {
  const specifier = ['vue', '/compiler-sfc'].join('')
  return await loadOptionalPeer<VueCompilerSFC>(specifier, 'Vue SFC')
}

export async function extractVueClasses(source: string, content: string): Promise<string[]> {
  const compiler = await loadVueCompiler()
  if (!compiler) return extractClassCandidates(content)

  try {
    const classes = new Set<string>()
    const { descriptor } = compiler.parse(content, { filename: source })

    if (descriptor.template?.content) {
      add(classes, extractClassCandidates(descriptor.template.content))
      if (descriptor.template.ast) {
        addDecodedTemplateClasses(classes, descriptor.template.ast as VueTemplateNode)
      }
    }
    if (descriptor.script?.content) {
      add(classes, extractOxcClasses(`${source}.${descriptor.script.lang || 'js'}`, descriptor.script.content))
    }
    if (descriptor.scriptSetup?.content) {
      add(classes, extractOxcClasses(`${source}.${descriptor.scriptSetup.lang || 'js'}`, descriptor.scriptSetup.content))
    }

    return [...classes]
  } catch {
    return extractClassCandidates(content)
  }
}

export function vueAdapter(): SourceAdapter {
  return {
    name: 'vue',
    test: isVueSource,
    async extract({ source, content }: SourceAdapterInput) {
      return await extractVueClasses(source, content)
    }
  }
}
