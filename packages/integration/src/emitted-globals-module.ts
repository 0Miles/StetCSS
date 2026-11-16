import type { StetCSSEmittedGlobals } from '@stet-css/engine'

export type { StetCSSEmittedGlobals }

export const VIRTUAL_EMITTED_GLOBALS_ID = 'virtual:stet-css-emitted-globals'
export const VIRTUAL_EMITTED_GLOBALS_FILE = 'stet-css-emitted-globals.js'
export const EMPTY_EMITTED_GLOBALS_MODULE = 'export default { variables: {}, animations: {} };'

export function normalizeEmittedGlobals(emittedGlobals: StetCSSEmittedGlobals = {}): Required<StetCSSEmittedGlobals> {
  return {
    variables: emittedGlobals.variables || {},
    animations: emittedGlobals.animations || {}
  }
}

export function toEmittedGlobalsModule(emittedGlobals: StetCSSEmittedGlobals) {
  return `export default ${JSON.stringify(normalizeEmittedGlobals(emittedGlobals))};`
}
