import type { ScannerOptions } from '@stet-css/scanner'

export interface Options {
  /**
   * Scanner options; the only key is `adapters`. Turbopack passes loader options as JSON, so
   * anything that is not plain data is lost.
   */
  scannerOptions?: ScannerOptions
}
