import type StetCSS from './core'
import type { Utility } from './utility'
import type { Variable } from '@stet-css/schema/css-syntax'
import type { StetCSSManifestUtilityMatcher } from '@stet-css/schema/manifest'
import { ROOT_FONT_SIZE } from './common'

export interface StetCSSNormalizedNumericValue {
  kind: 'number' | 'rem'
  value: number
}

export interface StetCSSInspectedClassVariable {
  key: string
  variable: Variable
}

export interface StetCSSClassInspection {
  className: string
  rules: Utility[]
  base: string
  suffix: string
  key?: string
  value?: string
  keyToken?: string
  valueToken?: string
  stateToken?: string
  important?: boolean
  matcherTypes: StetCSSManifestUtilityMatcher['type'][]
  variables: Map<string, Variable>
  variableEntries: StetCSSInspectedClassVariable[]
}

const CLASS_MODIFIER_SIGNS = new Set(['!', '*', '>', '+', '~', ':', '[', '@', '_'])

function findClassModifierIndex(className: string, start: number) {
  let quote = ''
  let depth = 0
  for (let index = start; index < className.length; index++) {
    const char = className[index]
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '(' || char === '[' || char === '{') {
      depth++
      continue
    }
    if (char === ')' || char === ']' || char === '}') {
      if (depth > 0) depth--
      continue
    }
    if (depth === 0 && CLASS_MODIFIER_SIGNS.has(char)) return index
  }
  return className.length
}

function inspectClassNameParts(className: string) {
  const indexOfColon = className.indexOf(':')
  if (indexOfColon > 0) {
    const end = findClassModifierIndex(className, indexOfColon + 1)
    const base = className.slice(0, end)
    return {
      base,
      suffix: className.slice(end),
      key: className.slice(0, indexOfColon),
      value: className.slice(indexOfColon + 1, end)
    }
  }
  const end = findClassModifierIndex(className, 0)
  return {
    base: className.slice(0, end),
    suffix: className.slice(end)
  }
}

export function normalizeStetCSSNumericValue(value: string | number): StetCSSNormalizedNumericValue | undefined {
  if (typeof value === 'number') return { kind: 'number', value }
  const matches = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)$/i.exec(value)
  if (!matches) return
  const numericValue = Number(matches[1])
  switch (matches[2].toLowerCase()) {
    case '':
      return { kind: 'number', value: numericValue }
    case 'rem':
      return { kind: 'rem', value: numericValue }
    case 'px':
      return { kind: 'rem', value: numericValue / ROOT_FONT_SIZE }
    default:
      return
  }
}

export function inspectStetCSSClass(css: StetCSS, className: string, mode?: string): StetCSSClassInspection {
  const rules = css.generate(className, mode)
  const rule = rules[0]
  const variables = new Map<string, Variable>()
  const matcherTypes = new Set<StetCSSManifestUtilityMatcher['type']>()
  for (const eachRule of rules) {
    for (const [key, variable] of eachRule.registeredUtility.variables || []) {
      if (!variables.has(key)) variables.set(key, variable)
    }
    for (const matcher of eachRule.registeredUtility.matchers) {
      matcherTypes.add(matcher.type)
    }
  }

  if (!rule) {
    return {
      className,
      rules,
      ...inspectClassNameParts(className),
      matcherTypes: [...matcherTypes],
      variables,
      variableEntries: [...variables].map(([key, variable]) => ({ key, variable }))
    }
  }

  const stateToken = rule.stateToken
  const suffix = (rule.important ? '!' : '') + (stateToken || '')
  const base = suffix ? className.slice(0, -suffix.length) : className
  const keyToken = rule.keyToken
  const valueToken = rule.valueToken
  const hasKeyValue = keyToken?.endsWith(':') && valueToken !== undefined
  return {
    className,
    rules,
    base,
    suffix,
    ...(hasKeyValue ? {
      key: keyToken.slice(0, -1),
      value: valueToken
    } : {}),
    ...(keyToken ? { keyToken } : {}),
    ...(valueToken !== undefined ? { valueToken } : {}),
    ...(stateToken ? { stateToken } : {}),
    ...(rule.important ? { important: true } : {}),
    matcherTypes: [...matcherTypes],
    variables,
    variableEntries: [...variables].map(([key, variable]) => ({ key, variable }))
  }
}
