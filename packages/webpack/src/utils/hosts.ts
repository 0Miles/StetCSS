/**
 * The plugin instance the style loader reports entries to. Loader options carry only the
 * host id, so they stay serializable for Rspack.
 */
export interface StetCSSWebpackHost {
  /** Registers an entry the bundler loaded; resolves once the CSS includes it. */
  addStyleEntry(file: string): Promise<void>
}

const HOSTS_KEY = Symbol.for('@stet-css/webpack/hosts')

function getHosts(): Map<string, StetCSSWebpackHost> {
  const scope = globalThis as unknown as Record<symbol, Map<string, StetCSSWebpackHost> | undefined>
  return scope[HOSTS_KEY] ??= new Map()
}

export function registerHost(id: string, host: StetCSSWebpackHost) {
  getHosts().set(id, host)
}

export function getHost(id: string | undefined): StetCSSWebpackHost | undefined {
  return id === undefined ? undefined : getHosts().get(id)
}
