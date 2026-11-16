import log from './log'
import type CSSRuntime from '../core'
import type { StetCSSManifest } from '@stet-css/schema/manifest'

export function debugRuntimeCreated(cssRuntime: CSSRuntime) {
  log.debug('created', cssRuntime)
}

export function debugRuntimeObserved(cssRuntime: CSSRuntime) {
  log.debug('observed', cssRuntime)
}

export function debugRuntimeRefreshed(cssRuntime: CSSRuntime, manifest: StetCSSManifest) {
  log.debug('refreshed', cssRuntime, manifest)
}

export function debugRuntimeDisconnected(cssRuntime: CSSRuntime) {
  log.debug('disconnected', cssRuntime)
}

export function debugRuntimeDestroyed(cssRuntime: CSSRuntime) {
  log.debug('destroyed', cssRuntime)
}
