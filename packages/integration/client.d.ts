declare module '*?master-css-manifest' {
  import type { MasterCSSManifest } from '@stet-css/engine'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module 'virtual:master-utilities.css' {
}

declare module 'virtual:master-css-manifest' {
  import type { MasterCSSManifest } from '@stet-css/engine'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module 'virtual:master-css-emitted-globals' {
  import type { MasterCSSEmittedGlobals } from '@stet-css/engine'

  const emittedGlobals: MasterCSSEmittedGlobals
  export default emittedGlobals
}
