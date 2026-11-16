import type { PluginOptions } from '@stet-css/vite'

/**
 * Options of the module, passed to `@stet-css/vite`: only `adapters`. An interface rather than an
 * alias, so the module's declarations name this type instead of the scanner type it extends,
 * which this package does not depend on.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the interface is the point, see above
export interface ModuleOptions extends PluginOptions {}
