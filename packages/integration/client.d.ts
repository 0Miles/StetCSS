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
  import type { StetCSSEmittedGlobals } from '@stet-css/engine'

  const emittedGlobals: StetCSSEmittedGlobals
  export default emittedGlobals
}
