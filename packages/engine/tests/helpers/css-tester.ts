import { expect } from 'vitest'
import UtilityType from '@stet-css/schema/utility-type'
import type {
  StetCSSManifest,
  StetCSSManifestCSSDeclarations,
  StetCSSManifestVariable,
  StetCSSManifestUtilityLayerName,
  StetCSSManifestUtilityRule
} from '@stet-css/schema/manifest'
import { flattenStetCSSManifestVariables, groupStetCSSManifestVariables } from '@stet-css/schema/manifest'
import { builtinNativeValueNamespaces, StetCSS } from '../../src'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest
const nativeFallbackProperties = new Set([
  'animation-direction',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-name',
  'animation-play-state',
  'accent-color',
  'appearance',
  'align-content',
  'align-items',
  'align-self',
  'aspect-ratio',
  'backface-visibility',
  'background',
  'background-blend-mode',
  'background-clip',
  'background-origin',
  'border-block-end-style',
  'border-block-end-width',
  'border-block-start-style',
  'border-block-start-width',
  'border-block-style',
  'border-block-width',
  'border-bottom-style',
  'border-bottom-width',
  'border-image',
  'border-inline-end-style',
  'border-inline-end-width',
  'border-inline-start-style',
  'border-inline-start-width',
  'border-inline-style',
  'border-inline-width',
  'border-left-style',
  'border-left-width',
  'border-right-style',
  'border-right-width',
  'border-style',
  'border-top-style',
  'border-top-width',
  'border-width',
  'break-after',
  'break-before',
  'break-inside',
  'caption-side',
  'clear',
  'clip-path',
  'color-scheme',
  'column-span',
  'columns',
  'contain',
  'container-name',
  'content',
  'box-sizing',
  'counter-increment',
  'counter-reset',
  'counter-set',
  'cursor',
  'direction',
  'display',
  'field-sizing',
  'flex',
  'float',
  'font',
  'font-smooth',
  'font-stretch',
  'forced-color-adjust',
  'grid',
  'grid-area',
  'grid-auto-columns',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-row',
  'grid-row-end',
  'grid-row-start',
  'grid-template',
  'grid-template-areas',
  'hyphens',
  'isolation',
  'justify-content',
  'justify-items',
  'justify-self',
  'list-style',
  'mask-clip',
  'mask-composite',
  'mask-mode',
  'mask-origin',
  'mask-repeat',
  'mask-type',
  'mix-blend-mode',
  'opacity',
  'overflow',
  'overflow-block',
  'overflow-inline',
  'overflow-wrap',
  'overflow-x',
  'overflow-y',
  'overscroll-behavior',
  'overscroll-behavior-block',
  'overscroll-behavior-inline',
  'overscroll-behavior-x',
  'overscroll-behavior-y',
  'place-content',
  'place-items',
  'place-self',
  'pointer-events',
  'position',
  'quotes',
  'resize',
  'rotate',
  'rx',
  'ry',
  'scale',
  'scroll-behavior',
  'scroll-snap-type',
  'scrollbar-gutter',
  'scrollbar-width',
  'shape-outside',
  'shape-image-threshold',
  'stroke-dasharray',
  'tab-size',
  'table-layout',
  'text-overflow',
  'touch-action',
  'transform',
  'transition-behavior',
  'transition-property',
  'visibility',
  'vertical-align',
  'view-transition-class',
  'view-transition-name',
  'white-space',
  'will-change',
  'word-break',
  'writing-mode',
  'z-index',
  'zoom',
  '-webkit-line-clamp',
  '-webkit-text-stroke-width'
])
for (const namespace of builtinNativeValueNamespaces) {
  for (const property of namespace.properties) {
    nativeFallbackProperties.add(property)
  }
}

export type SemanticRuleInput = StetCSSManifestUtilityRule<StetCSSManifestCSSDeclarations>

export interface SemanticUtilityInput {
  name: string
  layer?: StetCSSManifestUtilityLayerName
  rules: SemanticRuleInput[]
}

export function cloneManifest(manifest: StetCSSManifest = defaultManifest): StetCSSManifest {
  return JSON.parse(JSON.stringify(manifest)) as StetCSSManifest
}

export function createDefaultCSS() {
  return StetCSS.create({
    manifest: defaultManifest,
    nativeDeclarationMatcher: ({ property }) => nativeFallbackProperties.has(property)
  })
}

export function createManifestWithVariables(variables: StetCSSManifestVariable[], baseManifest = defaultManifest): StetCSSManifest {
  const manifest = cloneManifest(baseManifest)
  manifest.variables = groupStetCSSManifestVariables([
    ...flattenStetCSSManifestVariables(manifest.variables),
    ...variables
  ])

  return manifest
}

export function createCSSWithVariables(variables: StetCSSManifestVariable[], baseManifest = defaultManifest) {
  return StetCSS.create({ manifest: createManifestWithVariables(variables, baseManifest) })
}

export function createManifestWithSemanticUtilities(utilities: SemanticUtilityInput[], baseManifest = defaultManifest): StetCSSManifest {
  const manifest = cloneManifest(baseManifest)
  manifest.utilities ??= []

  for (const utility of utilities) {
    const index = manifest.utilities.length
    const name = utility.name.startsWith('.') ? utility.name.slice(1) : utility.name
    manifest.utilities.push({
      id: '.' + name,
      name,
      type: UtilityType.Semantic,
      order: index,
      layer: utility.layer || 'components',
      emit: {
        type: 'static',
        rules: utility.rules
      },
      matchers: [{
        type: 'static',
        name
      }]
    })
  }

  return manifest
}

export function createCSSWithSemanticUtilities(utilities: SemanticUtilityInput[]) {
  return StetCSS.create({ manifest: createManifestWithSemanticUtilities(utilities) })
}

export function expectClassText(css: StetCSS, className: string, expected: string) {
  expect(css.createRule(className)?.text).toContain(expected)
}

export function expectLayerText(css: StetCSS, classNames: string | string[], layer: keyof Pick<StetCSS, 'themeLayer' | 'baseLayer' | 'defaultsLayer' | 'componentsLayer' | 'utilitiesLayer' | 'animationsNonLayer'>, expected: string) {
  css.ensureClassRules(...(Array.isArray(classNames) ? classNames : [classNames]))
  expect(css[layer].text).toContain(expected)
  css.deleteClassRules(...(Array.isArray(classNames) ? classNames : [classNames]))
}
