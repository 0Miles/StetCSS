import { defaultManifest, UtilityType, type StetCSSManifest } from '../../src'
import {
  flattenStetCSSManifestVariables,
  groupStetCSSManifestVariables,
  type StetCSSManifestVariable
} from '@stet-css/schema/manifest'

type PlanVariableDraft = StetCSSManifestVariable
type ManifestUtilityDraft = Partial<NonNullable<StetCSSManifest['utilities']>[number]> & {
  declarations?: Record<string, string | number>
  rules?: { selector?: string, declarations: Record<string, string | number> }[]
}
type PresetManifestInput = Partial<Omit<StetCSSManifest, 'variables' | 'utilities'>> & {
  variables?: PlanVariableDraft[]
  utilities?: ManifestUtilityDraft[]
}

function normalizeVariable(variable: PlanVariableDraft): PlanVariableDraft {
  if (variable.name && variable.type) return variable
  const value = variable.value
  return {
    ...variable,
    name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key),
    type: variable.type || (typeof value === 'number' ? 'number' : 'string')
  }
}

function normalizeUtility(utility: ManifestUtilityDraft, order: number): NonNullable<StetCSSManifest['utilities']>[number] {
  if (utility.emit && utility.matchers) {
    return utility as NonNullable<StetCSSManifest['utilities']>[number]
  }
  const name = utility.name || utility.id?.replace(/^\./, '') || ''
  const id = utility.id || (utility.type === UtilityType.Semantic || utility.layer === 'components' ? `.${name}` : name)
  return {
    id,
    name,
    type: utility.type ?? UtilityType.Semantic,
    order: utility.order ?? order,
    layer: utility.layer,
    emit: {
      type: 'static',
      rules: utility.rules || [
        {
          selector: '&',
          declarations: utility.declarations || {}
        }
      ]
    },
    matchers: [
      {
        type: 'static',
        name
      }
    ]
  }
}

export function createPresetManifest(manifest: PresetManifestInput = {}): StetCSSManifest {
  if (manifest.version === 1) return manifest as StetCSSManifest
  const defaultUtilities = defaultManifest.utilities || []
  const utilities = (manifest.utilities || []).map((utility, index) => normalizeUtility(utility as ManifestUtilityDraft, defaultUtilities.length + index))
  const variables = (manifest.variables || []).map(normalizeVariable)
  return {
    ...defaultManifest,
    ...manifest,
    settings: {
      ...defaultManifest.settings,
      ...manifest.settings
    },
    variables: groupStetCSSManifestVariables([
      ...flattenStetCSSManifestVariables(defaultManifest.variables),
      ...variables
    ]),
    animations: {
      ...(defaultManifest.animations || {}),
      ...(manifest.animations || {})
    },
    variants: [
      ...(defaultManifest.variants || []),
      ...(manifest.variants || [])
    ],
    utilities: [
      ...defaultUtilities,
      ...utilities
    ]
  }
}
