import type { StetCSSManifest } from '@stet-css/schema/manifest'
import type { MasterCSSEmittedGlobals } from '@stet-css/engine'
import CSSRuntime from './core'

type CSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type CSSRuntimeManifest = StetCSSManifest | ((host: HTMLElement) => StetCSSManifest)
type CSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)
type CSSRuntimeEmittedGlobals = MasterCSSEmittedGlobals | ((host: HTMLElement) => MasterCSSEmittedGlobals | undefined)

export interface CSSRuntimeOptions {
  manifest: CSSRuntimeManifest
  root?: CSSRuntimeRoot
  emittedGlobals?: CSSRuntimeEmittedGlobals
}

export type CSSRuntimeDecoratorOptions = CSSRuntimeOptions

function resolveManifest(host: HTMLElement, manifest: CSSRuntimeManifest): StetCSSManifest {
  return typeof manifest === 'function' ? manifest(host) : manifest
}

function resolveRoot(host: HTMLElement, root: CSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
  return typeof root === 'function'
    ? root(host)
    : root || host.shadowRoot
}

function resolveEmittedGlobals(host: HTMLElement, emittedGlobals: CSSRuntimeEmittedGlobals | undefined): MasterCSSEmittedGlobals | undefined {
  return typeof emittedGlobals === 'function' ? emittedGlobals(host) : emittedGlobals
}

export default function cssRuntime(options: CSSRuntimeOptions): <T extends CSSRuntimeHostConstructor>(target: T) => T {
  return function <T extends CSSRuntimeHostConstructor>(target: T): T {
    const connectedCallback = target.prototype.connectedCallback as (() => void) | undefined
    const disconnectedCallback = target.prototype.disconnectedCallback as (() => void) | undefined

    return class extends target {
      cssRuntime?: CSSRuntime

      connectedCallback() {
        connectedCallback?.call(this)
        const root = resolveRoot(this, options.root)
        if (!root) {
          throw new Error('`@cssRuntime()` requires a shadow root. Provide `options.root` or create a shadow root before `connectedCallback()` finishes.')
        }
        const cssRuntime = CSSRuntime.create({
          manifest: resolveManifest(this, options.manifest),
          root,
          emittedGlobals: resolveEmittedGlobals(this, options.emittedGlobals)
        })
        this.cssRuntime = cssRuntime
        cssRuntime.observe()
      }

      disconnectedCallback() {
        disconnectedCallback?.call(this)
        this.cssRuntime?.destroy()
        this.cssRuntime = undefined
      }
    }
  }
}
