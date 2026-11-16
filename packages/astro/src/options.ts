import type { PluginOptions } from '@stet-css/vite'

/**
 * Options for the Astro integration. The integration always builds static CSS,
 * so the Vite plugin's `mode`, `injectRuntime` and `avoidFOUC` are not accepted.
 */
export type IntegrationOptions = Omit<PluginOptions, 'mode' | 'injectRuntime' | 'avoidFOUC'>
