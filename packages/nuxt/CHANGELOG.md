# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/nuxt-v0.2.0...nuxt-v0.3.0) (2026-11-26)


### Miscellaneous Chores

* **nuxt:** Synchronize stet-css versions

## [0.2.0](https://github.com/0Miles/StetCSS/compare/nuxt-v0.1.0...nuxt-v0.2.0) (2026-11-26)


### Miscellaneous Chores

* **nuxt:** Synchronize stet-css versions

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
* **nuxt:** the Nuxt module's config key is now `stetcss` (was `mastercss`). Options written under `mastercss` in nuxt.config are no longer read.
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **nuxt:** only build static CSS, from the Nuxt project root

### Features

* **nuxt:** only build static CSS, from the Nuxt project root ([9c08790](https://github.com/0Miles/StetCSS/commit/9c08790ed7985bfac4d1c7fe1fdf92dc367421b3)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **nuxt:** read module options from the stetcss config key ([a75ee5e](https://github.com/0Miles/StetCSS/commit/a75ee5e7aaa7e3c7a0b1cbca518074805fa83813)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* **nuxt:** check module options before the nuxi prepare return ([a84ee7c](https://github.com/0Miles/StetCSS/commit/a84ee7ce94ba7908c78265c9bd3cbbc5150bd1e0)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **nuxt:** declare ModuleOptions as an interface so the module types keep it ([cc76ad8](https://github.com/0Miles/StetCSS/commit/cc76ad8ffe435640dd3b9696e19f862f33759813)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **nuxt:** read every layer through the vite integration host ([99decbb](https://github.com/0Miles/StetCSS/commit/99decbbbb04b53f67754ed101d78ad2bc96c1ae2)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **nuxt:** type the Nitro server plugin without importing nitropack ([b72f180](https://github.com/0Miles/StetCSS/commit/b72f1804044d504ffecb125cc01f249156ae1db7))


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
