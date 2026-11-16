declare module '*?stet-css-manifest' {
  import type { StetCSSManifest } from '@stet-css/engine'

  const manifest: StetCSSManifest
  export default manifest
}

declare module 'virtual:stet-utilities.css' {
}

declare module 'virtual:stet-css-manifest' {
  import type { StetCSSManifest } from '@stet-css/engine'

  const manifest: StetCSSManifest
  export default manifest
}

declare module 'virtual:stet-css-emitted-globals' {
  import type { MasterCSSEmittedGlobals } from '@stet-css/engine'

  const emittedGlobals: MasterCSSEmittedGlobals
  export default emittedGlobals
}
