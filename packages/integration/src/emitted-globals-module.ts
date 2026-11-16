import type { MasterCSSEmittedGlobals } from '@stet-css/engine'

export type { MasterCSSEmittedGlobals }

export const VIRTUAL_EMITTED_GLOBALS_ID = 'virtual:stet-css-emitted-globals'
export const VIRTUAL_EMITTED_GLOBALS_FILE = 'stet-css-emitted-globals.js'
export const EMPTY_EMITTED_GLOBALS_MODULE = 'export default { variables: {}, animations: {} };'

export function normalizeEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals = {}): Required<MasterCSSEmittedGlobals> {
  return {
    variables: emittedGlobals.variables || {},
    animations: emittedGlobals.animations || {}
  }
}

export function toEmittedGlobalsModule(emittedGlobals: MasterCSSEmittedGlobals) {
  return `export default ${JSON.stringify(normalizeEmittedGlobals(emittedGlobals))};`
}
