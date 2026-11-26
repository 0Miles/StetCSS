# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/svelte-v0.1.0...svelte-v0.2.0) (2026-11-26)


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
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **svelte:** the `@stet-css/svelte/hooks.server` subpath and its exports (`handle`, `createMasterCSSHandle`, `createMasterCSSChunkRenderer`, `collectMasterCSSClasses`, `injectMasterStyle`, `createMasterCSSStaticHydrationManifestWriter` and their types) are removed. Delete the `hooks.server` re-export from SvelteKit projects.
* **svelte:** `@stet-css/svelte/vite` defaults to static instead of progressive, and no longer exports `SVELTEKIT_SSR_EXTERNAL`. Pass

### Features

* **svelte:** build static CSS when masterCSS() has no options ([de23eaf](https://github.com/0Miles/StetCSS/commit/de23eaf4ad84d21ca957e5f4cf576b34c0c60295)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **svelte:** drop the hooks.server server rendering path ([075c2b8](https://github.com/0Miles/StetCSS/commit/075c2b88590442b3a386dcfd4543ad285d9a319e)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


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
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **svelte:** the `@stet-css/svelte/hooks.server` subpath and its exports (`handle`, `createMasterCSSHandle`, `createMasterCSSChunkRenderer`, `collectMasterCSSClasses`, `injectMasterStyle`, `createMasterCSSStaticHydrationManifestWriter` and their types) are removed. Delete the `hooks.server` re-export from SvelteKit projects.
* **svelte:** `@stet-css/svelte/vite` defaults to static instead of progressive, and no longer exports `SVELTEKIT_SSR_EXTERNAL`. Pass

### Features

* **svelte:** build static CSS when masterCSS() has no options ([de23eaf](https://github.com/0Miles/StetCSS/commit/de23eaf4ad84d21ca957e5f4cf576b34c0c60295)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **svelte:** drop the hooks.server server rendering path ([075c2b8](https://github.com/0Miles/StetCSS/commit/075c2b88590442b3a386dcfd4543ad285d9a319e)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
