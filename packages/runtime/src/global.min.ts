import CSSRuntime from './core'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

const cssRuntime = CSSRuntime.create({ manifest: defaultManifestJSON as unknown as MasterCSSManifest })
if (cssRuntime.needsHydrationManifest()) {
  void cssRuntime.loadHydrationManifest()
    .then(() => cssRuntime.observe())
    .catch((error) => console.error(error))
} else {
  cssRuntime.observe()
}
