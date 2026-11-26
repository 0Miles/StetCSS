# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/cli-v0.1.0...cli-v0.2.0) (2026-11-26)


### ⚠ BREAKING CHANGES

* **cli:** the installed command is `stet-css` instead of `cli`, and help and errors name `stet-css` instead of `@stet-css/cli`.
* **lint:** renamed names (old -> new):
    - MasterCSSCanonicalClassesReportOptions -> StetCSSCanonicalClassesReportOptions
    - MasterCSSClassListEditOptions -> StetCSSClassListEditOptions
    - MasterCSSClassListLintReportOptions -> StetCSSClassListLintReportOptions
    - MasterCSSConflictingClassesReportOptions -> StetCSSConflictingClassesReportOptions
    - MasterCSSFixContentOptions -> StetCSSFixContentOptions
    - MasterCSSInvalidClassesReportOptions -> StetCSSInvalidClassesReportOptions
    - MasterCSSLintContentOptions -> StetCSSLintContentOptions
    - MasterCSSLintContentRuleOptions -> StetCSSLintContentRuleOptions
    - MasterCSSLintDiagnostic -> StetCSSLintDiagnostic
    - MasterCSSLintDiagnosticData -> StetCSSLintDiagnosticData
    - MasterCSSLintDiagnosticSeverity -> StetCSSLintDiagnosticSeverity
    - MasterCSSLintDiagnosticSourceKind -> StetCSSLintDiagnosticSourceKind
    - MasterCSSLintFileResult -> StetCSSLintFileResult
    - MasterCSSLintFileSourceKind -> StetCSSLintFileSourceKind
    - MasterCSSLintFix -> StetCSSLintFix
    - MasterCSSLintRange -> StetCSSLintRange
    - MasterCSSLintReport -> StetCSSLintReport
    - MasterCSSLintReportOptions -> StetCSSLintReportOptions
    - MasterCSSLintRuleId -> StetCSSLintRuleId
    - MasterCSSLintSourceDiagnostic -> StetCSSLintSourceDiagnostic
    - MasterCSSLintSourceFix -> StetCSSLintSourceFix
    - MasterCSSLintSourceFixKind -> StetCSSLintSourceFixKind
    - MasterCSSLintSourceFixSafety -> StetCSSLintSourceFixSafety
    - MasterCSSLintSourceLocation -> StetCSSLintSourceLocation
    - MasterCSSLintSourceLocationRange -> StetCSSLintSourceLocationRange
    - MasterCSSLintSummary -> StetCSSLintSummary
    - MasterCSSUnapprovedRawValueClassesReportOptions -> StetCSSUnapprovedRawValueClassesReportOptions
    - defaultMasterCSSLintRules -> defaultStetCSSLintRules
    - fixMasterCSSContent -> fixStetCSSContent
    - lintMasterCSSContent -> lintStetCSSContent
    - masterCSSLintRuleIds -> stetCSSLintRuleIds
    - resolveMasterCSSLintRules -> resolveStetCSSLintRules
    - summarizeMasterCSSLintFiles -> summarizeStetCSSLintFiles
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
* **cli:** without `-o/--output`, the CLI now writes `stet.css` (was `master.css`).
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **cli:** print the -v log from the CLI itself ([65ddd8c](https://github.com/0Miles/StetCSS/commit/65ddd8c98cdb0109865e0101e9761a5daa0d3491)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** write extracted CSS to stet.css by default ([8818108](https://github.com/0Miles/StetCSS/commit/88181081a9c7caccb2885ceb36797461a43c804a)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **cli:** install the command as stet-css ([9834418](https://github.com/0Miles/StetCSS/commit/98344185368bac1ab71a3f82a438fc875d0d847c)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **cli:** keep --no-export stdout pure CSS by logging to stderr ([a389fab](https://github.com/0Miles/StetCSS/commit/a389fab3c30239538f5d8f7425361af17d0549b9)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** keep watching when a stylesheet entry breaks ([99169e5](https://github.com/0Miles/StetCSS/commit/99169e5734321a66fddf266cf15e5aa2d979b632))
* **cli:** lint .mjs files by default ([c4bbd4b](https://github.com/0Miles/StetCSS/commit/c4bbd4bbf2037578faacca958dc04fbb0874df62))
* **cli:** report a broken watch entry only once it is watched again ([9250e7c](https://github.com/0Miles/StetCSS/commit/9250e7c89d6941c043f88596fdb5769c1662fc3b))
* **cli:** report unreadable stylesheet entries without a stack trace ([0d64f94](https://github.com/0Miles/StetCSS/commit/0d64f94cac6b53e79cc2aec9908e50767e112259))
* **cli:** skip the build's ignored directories when lint runs with no pattern ([#238](https://github.com/0Miles/StetCSS/issues/238)) ([5d2433d](https://github.com/0Miles/StetCSS/commit/5d2433dd39f14e2aed46c23acc0cafe4777c9703))
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

* **cli:** the installed command is `stet-css` instead of `cli`, and help and errors name `stet-css` instead of `@stet-css/cli`.
* **lint:** renamed names (old -> new):
    - MasterCSSCanonicalClassesReportOptions -> StetCSSCanonicalClassesReportOptions
    - MasterCSSClassListEditOptions -> StetCSSClassListEditOptions
    - MasterCSSClassListLintReportOptions -> StetCSSClassListLintReportOptions
    - MasterCSSConflictingClassesReportOptions -> StetCSSConflictingClassesReportOptions
    - MasterCSSFixContentOptions -> StetCSSFixContentOptions
    - MasterCSSInvalidClassesReportOptions -> StetCSSInvalidClassesReportOptions
    - MasterCSSLintContentOptions -> StetCSSLintContentOptions
    - MasterCSSLintContentRuleOptions -> StetCSSLintContentRuleOptions
    - MasterCSSLintDiagnostic -> StetCSSLintDiagnostic
    - MasterCSSLintDiagnosticData -> StetCSSLintDiagnosticData
    - MasterCSSLintDiagnosticSeverity -> StetCSSLintDiagnosticSeverity
    - MasterCSSLintDiagnosticSourceKind -> StetCSSLintDiagnosticSourceKind
    - MasterCSSLintFileResult -> StetCSSLintFileResult
    - MasterCSSLintFileSourceKind -> StetCSSLintFileSourceKind
    - MasterCSSLintFix -> StetCSSLintFix
    - MasterCSSLintRange -> StetCSSLintRange
    - MasterCSSLintReport -> StetCSSLintReport
    - MasterCSSLintReportOptions -> StetCSSLintReportOptions
    - MasterCSSLintRuleId -> StetCSSLintRuleId
    - MasterCSSLintSourceDiagnostic -> StetCSSLintSourceDiagnostic
    - MasterCSSLintSourceFix -> StetCSSLintSourceFix
    - MasterCSSLintSourceFixKind -> StetCSSLintSourceFixKind
    - MasterCSSLintSourceFixSafety -> StetCSSLintSourceFixSafety
    - MasterCSSLintSourceLocation -> StetCSSLintSourceLocation
    - MasterCSSLintSourceLocationRange -> StetCSSLintSourceLocationRange
    - MasterCSSLintSummary -> StetCSSLintSummary
    - MasterCSSUnapprovedRawValueClassesReportOptions -> StetCSSUnapprovedRawValueClassesReportOptions
    - defaultMasterCSSLintRules -> defaultStetCSSLintRules
    - fixMasterCSSContent -> fixStetCSSContent
    - lintMasterCSSContent -> lintStetCSSContent
    - masterCSSLintRuleIds -> stetCSSLintRuleIds
    - resolveMasterCSSLintRules -> resolveStetCSSLintRules
    - summarizeMasterCSSLintFiles -> summarizeStetCSSLintFiles
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
* **cli:** without `-o/--output`, the CLI now writes `stet.css` (was `master.css`).
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **cli:** print the -v log from the CLI itself ([65ddd8c](https://github.com/0Miles/StetCSS/commit/65ddd8c98cdb0109865e0101e9761a5daa0d3491)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** write extracted CSS to stet.css by default ([8818108](https://github.com/0Miles/StetCSS/commit/88181081a9c7caccb2885ceb36797461a43c804a)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **cli:** install the command as stet-css ([9834418](https://github.com/0Miles/StetCSS/commit/98344185368bac1ab71a3f82a438fc875d0d847c)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **cli:** keep --no-export stdout pure CSS by logging to stderr ([a389fab](https://github.com/0Miles/StetCSS/commit/a389fab3c30239538f5d8f7425361af17d0549b9)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** keep watching when a stylesheet entry breaks ([99169e5](https://github.com/0Miles/StetCSS/commit/99169e5734321a66fddf266cf15e5aa2d979b632))
* **cli:** report a broken watch entry only once it is watched again ([9250e7c](https://github.com/0Miles/StetCSS/commit/9250e7c89d6941c043f88596fdb5769c1662fc3b))
* **cli:** report unreadable stylesheet entries without a stack trace ([0d64f94](https://github.com/0Miles/StetCSS/commit/0d64f94cac6b53e79cc2aec9908e50767e112259))
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
