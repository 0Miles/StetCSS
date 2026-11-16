import type { ScannerOptions } from '@stet-css/scanner'

/**
 * Options of `withMasterCSS(nextConfig, options)`: only `adapters`, custom source adapters for
 * the class set. Custom adapters need webpack: Turbopack passes loader options to its workers
 * as JSON, which drops functions.
 */
export type Options = ScannerOptions
