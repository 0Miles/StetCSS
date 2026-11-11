import type { GeneratedRule } from '@stet-css/engine'
import type HydratedGeneratedRule from '../generated-rule'

export interface HydrateResult {
  allUtilities: (GeneratedRule | HydratedGeneratedRule)[]
}
