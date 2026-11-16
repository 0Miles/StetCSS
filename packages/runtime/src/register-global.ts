import type Core from './core'
import startDebuggers from './debuggers'

declare global {
  var MasterCSSRuntime: typeof Core
  var masterCSSRuntime: Core
}

/**
 * Browsers expose elements with a matching `id` or `name` as globals, so the name may
 * already hold page content. Only another runtime class counts as registered.
 */
function isRuntimeClass(value: unknown): value is typeof Core {
  return typeof value === 'function' && (value as Partial<typeof Core>).instances instanceof WeakMap
}

export default function registerGlobal(CSSRuntime: typeof Core) {
  if (!isRuntimeClass(globalThis.MasterCSSRuntime)) globalThis.MasterCSSRuntime = CSSRuntime
  if (process.env.NODE_ENV === 'development') {
    startDebuggers()
  }
}
