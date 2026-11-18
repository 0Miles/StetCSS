import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses } from './oxc'
import { loadOptionalPeer } from './optional-peer'
import type { SourceAdapter, SourceAdapterInput } from './types'

type SvelteCompiler = {
  parse: typeof import('svelte/compiler')['parse']
}

interface SvelteRange {
  start?: number
  end?: number
}

interface SvelteAttributeValue extends SvelteRange {
  type?: string
  data?: string
  raw?: string
}

interface SvelteAttribute {
  type?: string
  name?: string
  value?: SvelteAttributeValue[]
  expression?: SvelteRange
}

interface SvelteScript extends SvelteRange {
  content?: SvelteRange
}

interface SvelteMarkupNode {
  attributes?: SvelteAttribute[]
  children?: SvelteMarkupNode[]
  else?: SvelteMarkupNode
  pending?: SvelteMarkupNode
  then?: SvelteMarkupNode
  catch?: SvelteMarkupNode
}

export const SVELTE_SOURCE_EXT = /\.svelte(?:\?|$)/

function isSvelteSource(source: string) {
  return SVELTE_SOURCE_EXT.test(source) && !/[?&]type=style(?:&|$)/.test(source)
}

function addClassString(classes: Set<string>, value: string | undefined) {
  if (!value) return
  for (const className of extractClassCandidates(value)) {
    if (className) classes.add(className)
  }
}

function addOxc(classes: Set<string>, source: string, content: string) {
  for (const className of extractOxcClasses(source, content)) {
    if (className) classes.add(className)
  }
}

// The legacy AST keeps no script attributes, so `lang` is read from the opening tag.
const TYPESCRIPT_LANG_ATTRIBUTE = /\slang\s*=\s*(?:"(?:ts|typescript)"|'(?:ts|typescript)'|(?:ts|typescript)(?=[\s/>]))/

function isTypeScriptScript(content: string, script: SvelteScript | null | undefined) {
  if (script?.start == null || script.content?.start == null) return false
  return TYPESCRIPT_LANG_ATTRIBUTE.test(content.slice(script.start, script.content.start))
}

function addScript(classes: Set<string>, source: string, content: string, script: SvelteScript | null | undefined) {
  const range = script?.content
  if (range?.start == null || range.end == null) return
  addOxc(classes, source, content.slice(range.start, range.end))
}

/** `source` carries the extension the component's markup expressions parse as. */
function visitMarkup(node: SvelteMarkupNode | undefined, source: string, content: string, classes: Set<string>) {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node.attributes)) {
    for (const attribute of node.attributes) {
      if (attribute.type === 'Class') {
        addClassString(classes, attribute.name)
        if (attribute.expression?.start != null && attribute.expression?.end != null) {
          addOxc(classes, source, content.slice(attribute.expression.start, attribute.expression.end))
        }
        continue
      }
      if (attribute.type !== 'Attribute' || attribute.name !== 'class') continue
      for (const value of attribute.value || []) {
        if (value.type === 'Text') {
          addClassString(classes, value.data ?? value.raw)
        } else if (value.start != null && value.end != null) {
          addOxc(classes, source, content.slice(value.start, value.end))
        }
      }
    }
  }

  for (const child of node.children || []) {
    visitMarkup(child, source, content, classes)
  }
  // `{:else}` / `{:else if}` / each-else and the `{#await}` branches hang off these keys, not `children`.
  for (const branch of [node.else, node.pending, node.then, node.catch]) {
    visitMarkup(branch, source, content, classes)
  }
}

async function loadSvelteCompiler() {
  const specifier = ['svelte', '/compiler'].join('')
  return await loadOptionalPeer<SvelteCompiler>(specifier, 'Svelte')
}

export async function extractSvelteClasses(source: string, content: string): Promise<string[]> {
  const compiler = await loadSvelteCompiler()
  if (!compiler) return extractClassCandidates(content)

  try {
    const ast = compiler.parse(content)
    const classes = new Set<string>()

    const module = ast.module as SvelteScript | null | undefined
    const instance = ast.instance as SvelteScript | null | undefined
    // Like Svelte itself, treat the whole component, both scripts and the
    // markup, as TypeScript when any script has `lang="ts"`.
    const isTypeScript = isTypeScriptScript(content, module) || isTypeScriptScript(content, instance)
    const componentSource = `${source}.${isTypeScript ? 'ts' : 'js'}`
    addScript(classes, componentSource, content, module)
    addScript(classes, componentSource, content, instance)
    visitMarkup(ast.html as SvelteMarkupNode, componentSource, content, classes)

    return [...classes]
  } catch {
    return extractClassCandidates(content)
  }
}

export function svelteAdapter(): SourceAdapter {
  return {
    name: 'svelte',
    test: isSvelteSource,
    async extract({ source, content }: SourceAdapterInput) {
      return await extractSvelteClasses(source, content)
    }
  }
}
