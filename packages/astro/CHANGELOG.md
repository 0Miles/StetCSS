# Changelog

## [0.4.0](https://github.com/0Miles/StetCSS/compare/astro-v0.3.0...astro-v0.4.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* **diagnostics:** renamed names (old -> new):
    - CreateMasterCSSInspectionReportOptions -> CreateStetCSSInspectionReportOptions
    - MASTER_CSS_INSPECTION_REPORT_VERSION -> STET_CSS_INSPECTION_REPORT_VERSION
    - MasterCSSInspectionDiagnostic -> StetCSSInspectionDiagnostic
    - MasterCSSInspectionDiagnosticCode -> StetCSSInspectionDiagnosticCode
    - MasterCSSInspectionDiagnosticSeverity -> StetCSSInspectionDiagnosticSeverity
    - MasterCSSInspectionDiagnosticSourceKind -> StetCSSInspectionDiagnosticSourceKind
    - MasterCSSInspectionReport -> StetCSSInspectionReport
    - MasterCSSMissingCSSResult -> StetCSSMissingCSSResult
    - MasterCSSSourceInspection -> StetCSSSourceInspection
    - MasterCSSStylesheetError -> StetCSSStylesheetError
    - MasterCSSStylesheetInspection -> StetCSSStylesheetInspection
    - createMasterCSSInspectionReport -> createStetCSSInspectionReport
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


### Bug Fixes

* **astro:** keep the test fixtures' generated .astro types out of lint ([1cbe11b](https://github.com/0Miles/StetCSS/commit/1cbe11b209d660da2ea5ab0fbffe5d5ddb6b7b09))


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## [0.3.0](https://github.com/0Miles/StetCSS/compare/astro-v0.2.0...astro-v0.3.0) (2026-11-26)


### Miscellaneous Chores

* **astro:** Synchronize stet-css versions

## [0.2.0](https://github.com/0Miles/StetCSS/compare/astro-v0.1.0...astro-v0.2.0) (2026-11-26)


### Bug Fixes

* **astro:** keep the test fixtures' generated .astro types out of lint ([1cbe11b](https://github.com/0Miles/StetCSS/commit/1cbe11b209d660da2ea5ab0fbffe5d5ddb6b7b09))

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
