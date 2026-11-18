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
  loc: { source: string, start: { offset: number }, end: { offset: number } }
  value?: { content: string }
  arg?: { content?: string, isStatic?: boolean }
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

/** The value Vue compiles a `class` attribute or `:class` binding to, character references decoded. */
function getDecodedClassValue(prop: VueTemplateProp) {
  if (prop.type === ATTRIBUTE_PROP) return prop.name === 'class' ? prop.value?.content : undefined
  if (prop.type === DIRECTIVE_PROP && prop.name === 'bind' && prop.arg?.isStatic && prop.arg.content === 'class') {
    return prop.exp?.content
  }
}

/**
 * Vue compiles attribute values and directive expressions with their character references
 * decoded. Extracts every `class` attribute and `:class` binding written with a reference by its
 * decoded value, and returns the template with those attributes blanked out, so the template text
 * extraction does not read them as written.
 */
function extractDecodedClassAttributes(classes: Set<string>, root: VueTemplateNode, template: string, templateStart: number) {
  const ranges: { start: number, end: number }[] = []
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()!
    if (node.type === ELEMENT_NODE) {
      for (const prop of node.props || []) {
        if (!prop.loc.source.includes('&')) continue
        const value = getDecodedClassValue(prop)
        if (value === undefined) continue
        add(classes, extractClassCandidates(value))
        ranges.push({ start: prop.loc.start.offset - templateStart, end: prop.loc.end.offset - templateStart })
      }
    }
    for (const child of node.children || []) stack.push(child)
  }
  if (!ranges.length) return template
  ranges.sort((a, b) => a.start - b.start)
  let blanked = ''
  let cursor = 0
  for (const { start, end } of ranges) {
    blanked += template.slice(cursor, start) + ' '.repeat(end - start)
    cursor = end
  }
  return blanked + template.slice(cursor)
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
      const { template } = descriptor
      const content = template.ast
        ? extractDecodedClassAttributes(classes, template.ast as VueTemplateNode, template.content, template.loc.start.offset)
        : template.content
      add(classes, extractClassCandidates(content))
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
