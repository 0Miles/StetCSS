import type { SourceAdapter } from '@stet-css/source'

export interface ScannerOptions {
  /** Custom source adapters, tried before the built-in ones. */
  adapters?: SourceAdapter[]
}

const scannerOptions: Required<ScannerOptions> = {
  adapters: []
}

/** The only keys `ScannerOptions` accepts. */
export const SCANNER_OPTION_KEYS: readonly string[] = Object.keys(scannerOptions)

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
 * Build plugin options removed when the plugins became static-only and took `adapters` flat,
 * and what replaces each. Plugins also reject the removed scanner keys they used to pass on.
 */
export const REMOVED_PLUGIN_OPTIONS: Readonly<Record<string, string>> = {
  ...REMOVED_SCANNER_OPTIONS,
  mode: 'static CSS is the only output; to also run the runtime, start @stet-css/runtime in the app (CSSRuntime.create(...).observe(), see its README)',
  injectRuntime: 'start @stet-css/runtime in the app (CSSRuntime.create(...).observe(), see its README)',
  avoidFOUC: 'static CSS is in the page before it renders',
  scanner: 'pass "adapters" directly',
  scannerOptions: 'pass "adapters" directly'
}

/** Removed plugin keys that held scanner options; their own removed keys are reported with them. */
const NESTED_SCANNER_OPTION_KEYS = ['scanner', 'scannerOptions']

/** The replacements for the removed keys inside a nested `scanner` value, so one run names them all. */
function describeNestedRemovedOptions(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return ''
  return Object.keys(value)
    .filter((key) => Object.hasOwn(REMOVED_SCANNER_OPTIONS, key))
    .map((key) => `; its "${key}" was removed too: ${REMOVED_SCANNER_OPTIONS[key]}`)
    .join('')
}

function validateOptions(options: unknown, owner: string, removedOptions: Readonly<Record<string, string>>): asserts options is ScannerOptions {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError(`${owner} options must be an object.`)
  }
  for (const key of Object.keys(options)) {
    if (SCANNER_OPTION_KEYS.includes(key)) continue
    if (Object.hasOwn(removedOptions, key)) {
      const nested = NESTED_SCANNER_OPTION_KEYS.includes(key)
        ? describeNestedRemovedOptions((options as Record<string, unknown>)[key])
        : ''
      throw new TypeError(`${owner} option "${key}" was removed; ${removedOptions[key]}${nested}.`)
    }
    throw new TypeError(`Unknown ${owner} option "${key}"; the only option is ${SCANNER_OPTION_KEYS.map((allowed) => `"${allowed}"`).join(', ')}.`)
  }
  const { adapters } = options as ScannerOptions
  if (adapters !== undefined && !Array.isArray(adapters)) {
    throw new TypeError(`${owner} option "adapters" must be an array.`)
  }
}

/**
 * Throws when `options` is not a plain options object, holds a removed or unknown key, or
 * holds `adapters` that are not an array. `owner` names who received the options.
 */
export function validateScannerOptions(options: unknown, owner = 'CSSScanner'): asserts options is ScannerOptions {
  validateOptions(options, owner, REMOVED_SCANNER_OPTIONS)
}

/**
 * The check every build plugin runs on its options when the config loads: the options are
 * `ScannerOptions` (only `adapters`), and a removed plugin or scanner key names its
 * replacement, including the removed keys inside a nested `scanner`. `owner` is the plugin's
 * package name.
 */
export function validatePluginOptions(options: unknown, owner: string): asserts options is ScannerOptions {
  validateOptions(options, owner, REMOVED_PLUGIN_OPTIONS)
}

export { scannerOptions }
export default scannerOptions
