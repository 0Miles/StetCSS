export const builtinNamespaces = Object.freeze([
  'animate',
  'breakpoint',
  'color',
  'color-line',
  'color-surface',
  'color-text',
  'container',
  'content',
  'duration',
  'easing',
  'font',
  'font-family',
  'font-feature',
  'font-size',
  'font-weight',
  'leading',
  'order',
  'radius',
  'shadow',
  'spacing',
  'tracking'
] as const)

export type StetCSSBuiltinNamespace = typeof builtinNamespaces[number]
export type StetCSSBuiltinNamespaceRef = `~${StetCSSBuiltinNamespace}` | `=${StetCSSBuiltinNamespace}`

export function builtinNamespaceRef(namespace: StetCSSBuiltinNamespace, exact = false): StetCSSBuiltinNamespaceRef {
  return `${exact ? '=' : '~'}${namespace}` as StetCSSBuiltinNamespaceRef
}

export const builtinNamespaceSet: ReadonlySet<string> = new Set<string>(builtinNamespaces)
