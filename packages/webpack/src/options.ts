import type { ScannerOptions } from '@stet-css/scanner'

export interface PluginOptions {
  scanner?: ScannerOptions
}

export interface ResolvedPluginOptions {
  scanner: ScannerOptions
}

function isPluginOptions(options: ScannerOptions | PluginOptions): options is PluginOptions {
  return 'scanner' in options
}

export function resolvePluginOptions(options: ScannerOptions | PluginOptions = {}): ResolvedPluginOptions {
  return {
    scanner: isPluginOptions(options) ? options.scanner ?? {} : options
  }
}
