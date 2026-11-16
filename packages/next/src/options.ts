import type { ScannerOptions } from '@stet-css/scanner'

export interface Options {
  /**
   * Scanner options: `safelist` and `blocklist` shape the class set read from the project's
   * files. Turbopack passes them to its loaders as JSON, so they must be plain data.
   */
  scannerOptions?: ScannerOptions
}
