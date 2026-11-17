import { formatFractionPercentage } from './format-dimension'

export function normalizeEngineVariableValue(value: string | number) {
  return typeof value === 'number'
    ? String(value)
    : value.replace(/\|/g, ' ')
}

export function createCSSVariableReference(name: string, alpha?: number, fallback?: string) {
  const reference = `var(--${name}${fallback ? ',' + fallback : ''})`
  return alpha !== undefined
    ? createAlphaColorValue(reference, alpha)
    : reference
}

export function createAlphaColorValue(value: string, alpha: number) {
  return `color-mix(in oklab,${value} ${formatFractionPercentage(alpha)},transparent)`
}

