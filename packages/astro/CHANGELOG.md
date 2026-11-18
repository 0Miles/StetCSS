# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/astro-v0.1.0...astro-v0.2.0) (2026-11-18)


### ⚠ BREAKING CHANGES

* **stylesheet:** renamed names (old -> new):
    - DefaultMasterCSSPackageArtifact -> DefaultStetCSSPackageArtifact
    - canUseDefaultMasterCSSPackageArtifact -> canUseDefaultStetCSSPackageArtifact
    - compileMasterCSSPackage -> compileStetCSSPackage
    - createMasterCSSPackageHostSource -> createStetCSSPackageHostSource
    - createMasterStyleCSSPattern -> createStetStyleCSSPattern
    - expandMasterCSSPackage -> expandStetCSSPackage
    - hasMasterCSS -> hasStetCSS
    - hasMasterCSSPackageSource -> hasStetCSSPackageSource
    - hasMasterSource -> hasStetSource
    - hasMasterStyleEntrypoint -> hasStetStyleEntrypoint
    - includeMasterBaseCSS -> includeStetBaseCSS
    - isMasterCSSCompilerPackageStyleFile -> isStetCSSCompilerPackageStyleFile
    - isMasterCSSManifestModuleId -> isStetCSSManifestModuleId
    - isMasterStyleSource -> isStetStyleSource
    - masterCSS -> stetCSS
    - masterCSSResult -> stetCSSResult
    - masterFirst -> stetFirst
    - masterImport -> stetImport
    - masterLast -> stetLast
    - masterSource -> stetSource
    - readDefaultMasterCSSPackageArtifact -> readDefaultStetCSSPackageArtifact
    - removeMasterStyleDirectives -> removeStetStyleDirectives
    - resolveMasterCSSPackageCompileSource -> resolveStetCSSPackageCompileSource
    - resolveMasterCSSPackageManifest -> resolveStetCSSPackageManifest
    - resolveMasterStyleSource -> resolveStetStyleSource
    - sourceHasMasterEntry -> sourceHasStetEntry
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **vite,astro:** build static CSS only
* **astro:** build static CSS only

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **vite,astro:** build static CSS only ([209488d](https://github.com/0Miles/StetCSS/commit/209488d0ed419c6e0fbda383d6a3ee68eadaf58e)), closes [#59](https://github.com/0Miles/StetCSS/issues/59)


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

* **stylesheet:** renamed names (old -> new):
    - DefaultMasterCSSPackageArtifact -> DefaultStetCSSPackageArtifact
    - canUseDefaultMasterCSSPackageArtifact -> canUseDefaultStetCSSPackageArtifact
    - compileMasterCSSPackage -> compileStetCSSPackage
    - createMasterCSSPackageHostSource -> createStetCSSPackageHostSource
    - createMasterStyleCSSPattern -> createStetStyleCSSPattern
    - expandMasterCSSPackage -> expandStetCSSPackage
    - hasMasterCSS -> hasStetCSS
    - hasMasterCSSPackageSource -> hasStetCSSPackageSource
    - hasMasterSource -> hasStetSource
    - hasMasterStyleEntrypoint -> hasStetStyleEntrypoint
    - includeMasterBaseCSS -> includeStetBaseCSS
    - isMasterCSSCompilerPackageStyleFile -> isStetCSSCompilerPackageStyleFile
    - isMasterCSSManifestModuleId -> isStetCSSManifestModuleId
    - isMasterStyleSource -> isStetStyleSource
    - masterCSS -> stetCSS
    - masterCSSResult -> stetCSSResult
    - masterFirst -> stetFirst
    - masterImport -> stetImport
    - masterLast -> stetLast
    - masterSource -> stetSource
    - readDefaultMasterCSSPackageArtifact -> readDefaultStetCSSPackageArtifact
    - removeMasterStyleDirectives -> removeStetStyleDirectives
    - resolveMasterCSSPackageCompileSource -> resolveStetCSSPackageCompileSource
    - resolveMasterCSSPackageManifest -> resolveStetCSSPackageManifest
    - resolveMasterStyleSource -> resolveStetStyleSource
    - sourceHasMasterEntry -> sourceHasStetEntry
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **vite,astro:** build static CSS only
* **astro:** build static CSS only

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **vite,astro:** build static CSS only ([209488d](https://github.com/0Miles/StetCSS/commit/209488d0ed419c6e0fbda383d6a3ee68eadaf58e)), closes [#59](https://github.com/0Miles/StetCSS/issues/59)


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
