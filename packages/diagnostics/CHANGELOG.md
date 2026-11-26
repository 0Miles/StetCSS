# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/diagnostics-v0.1.0...diagnostics-v0.2.0) (2026-11-26)


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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **diagnostics:** classify missing CSS by the entries' [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) ([0236349](https://github.com/0Miles/StetCSS/commit/0236349735843b7054631799a10a4db6d9e9f766)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **diagnostics:** give the scanner the entry manifest as its validation input ([7680654](https://github.com/0Miles/StetCSS/commit/76806547b528254cf258c278c563fafcafcebc48)), closes [#65](https://github.com/0Miles/StetCSS/issues/65) [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** judge inspected classes by the entry's manifest ([4a5b529](https://github.com/0Miles/StetCSS/commit/4a5b5293c9c9c02c1a64a9d9868f5e750bfbb8d7)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** list only each file's own classes in an inspection report ([cac29ec](https://github.com/0Miles/StetCSS/commit/cac29ecc2bc7b62c18a5de7a479ed514a0b6fbbe)), closes [#193](https://github.com/0Miles/StetCSS/issues/193)
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **diagnostics:** reuse the prebuilt core artifact when rendering inspect CSS ([ca19713](https://github.com/0Miles/StetCSS/commit/ca197136c924ba90d8d14d3de2b0e6f3b8a21be9)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## 0.1.0 (2026-11-17)


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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **diagnostics:** classify missing CSS by the entries' [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) ([0236349](https://github.com/0Miles/StetCSS/commit/0236349735843b7054631799a10a4db6d9e9f766)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **diagnostics:** give the scanner the entry manifest as its validation input ([7680654](https://github.com/0Miles/StetCSS/commit/76806547b528254cf258c278c563fafcafcebc48)), closes [#65](https://github.com/0Miles/StetCSS/issues/65) [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** judge inspected classes by the entry's manifest ([4a5b529](https://github.com/0Miles/StetCSS/commit/4a5b5293c9c9c02c1a64a9d9868f5e750bfbb8d7)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **diagnostics:** reuse the prebuilt core artifact when rendering inspect CSS ([ca19713](https://github.com/0Miles/StetCSS/commit/ca197136c924ba90d8d14d3de2b0e6f3b8a21be9)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
