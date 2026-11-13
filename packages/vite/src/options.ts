import type { ScannerOptions } from '@stet-css/scanner'

/* The default options */
const options: PluginOptions = {
  mode: 'static',
  injectRuntime: true,
  avoidFOUC: true,
}

export default options

export interface PluginOptions {
  /**
   * Defines how Master CSS should be integrated into the build.
   *
   * - `'runtime'`: Injects CSSRuntime through Vite's HTML transform and imports the project manifest code.
   * - `'static'`: Wires the generated CSS module and enables generated utilities in the shared style entry pipeline.
   * - `'pre-render'`: Renders all `*.html` dependencies and injects CSS internally. This mode may be integrated with other SSR capabilities.
   * - `'progressive'`: Combines `'runtime'` and `'pre-render'` modes.
   * - `null`: Disables automatic integration
   *
   * @default 'static'
   */
  mode?: 'runtime' | 'static' | 'progressive' | 'pre-render' | null

  /**
   * Scanner options for class usage scanning.
   */
  scanner?: ScannerOptions

  /**
   * Whether to include Master CSS’s runtime engine through Vite's HTML transform.
   * Applies to `'runtime'` and `'progressive'` modes only.
   *
   * @default true
   */
  injectRuntime?: boolean

  /**
   * Prevents Flash of Unstyled Content (FOUC) during the initial render.
   * Applies to `'runtime'` mode only.
   *
   * @default true
   */
  avoidFOUC?: boolean
}
