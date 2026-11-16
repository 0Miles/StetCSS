import type { ScannerOptions } from '@stet-css/scanner'

/* The default options */
const options: PluginOptions = {}

export default options

export interface PluginOptions {
  /**
   * Scanner options for class usage scanning.
   */
  scanner?: ScannerOptions
}
