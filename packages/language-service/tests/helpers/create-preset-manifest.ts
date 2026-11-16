import { defaultManifest, UtilityType, type StetCSSManifest } from '@stet-css/language'
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
type PresetManifestDraftInput = Partial<Omit<StetCSSManifest, 'variables' | 'utilities'>> & {
  variables?: PlanVariableDraft[]
  utilities?: ManifestUtilityDraft[]
}
type PresetManifestInput = StetCSSManifest | PresetManifestDraftInput

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
  const input = manifest as PresetManifestDraftInput
  const defaultUtilities = defaultManifest.utilities || []
  const utilities = (input.utilities || []).map((utility, index) => normalizeUtility(utility as ManifestUtilityDraft, defaultUtilities.length + index))
  const variables = (input.variables || []).map(normalizeVariable)
  return {
    ...defaultManifest,
    ...input,
    settings: {
      ...defaultManifest.settings,
      ...input.settings
    },
    variables: groupStetCSSManifestVariables([
      ...flattenStetCSSManifestVariables(defaultManifest.variables),
      ...variables
    ]),
    animations: {
      ...(defaultManifest.animations || {}),
      ...(input.animations || {})
    },
    variants: [
      ...(defaultManifest.variants || []),
      ...(input.variants || [])
    ],
    utilities: [
      ...defaultUtilities,
      ...utilities
    ]
  }
}
