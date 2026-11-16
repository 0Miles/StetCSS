import type { SourceAdapter } from '@stet-css/source'

export interface ScannerOptions {
  /** Custom source adapters, tried before the built-in ones. */
  adapters?: SourceAdapter[]
}

const scannerOptions: Required<ScannerOptions> = {
  adapters: []
}

/** The only keys `ScannerOptions` accepts. */
export const SCANNER_OPTION_KEYS: readonly string[] = ['adapters'] satisfies readonly (keyof ScannerOptions)[]

/**
 * Removed scanner options and what replaces each, read by every error about a removed key.
 * Class and file rules live in the CSS entry; nothing here is a JavaScript option anymore.
 */
export const REMOVED_SCANNER_OPTIONS: Readonly<Record<string, string>> = {
  path: 'it had no effect',
  verbose: 'the CLI prints its own log with -v',
  manifest: 'configure the project in a CSS entry that imports @stet-css/core',
  safelist: 'use @safelist in the CSS entry',
  blocklist: 'use @blocklist in the CSS entry',
  exclude: 'use @source not in the CSS entry'
}

/**
 * Throws when `options` is not a plain options object, holds a removed or unknown key, or
 * holds `adapters` that are not an array. `owner` names who received the options.
 */
export function validateScannerOptions(options: unknown, owner = 'CSSScanner'): asserts options is ScannerOptions {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError(`${owner} options must be an object.`)
  }
  for (const key of Object.keys(options)) {
    if (SCANNER_OPTION_KEYS.includes(key)) continue
    if (Object.hasOwn(REMOVED_SCANNER_OPTIONS, key)) {
      throw new TypeError(`${owner} option "${key}" was removed; ${REMOVED_SCANNER_OPTIONS[key]}.`)
    }
    throw new TypeError(`Unknown ${owner} option "${key}"; the only option is ${SCANNER_OPTION_KEYS.map((allowed) => `"${allowed}"`).join(', ')}.`)
  }
  const { adapters } = options as ScannerOptions
  if (adapters !== undefined && !Array.isArray(adapters)) {
    throw new TypeError(`${owner} option "adapters" must be an array.`)
  }
}

export { scannerOptions }
export default scannerOptions
