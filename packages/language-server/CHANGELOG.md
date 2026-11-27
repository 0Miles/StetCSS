# Changelog

## [0.4.0](https://github.com/0Miles/StetCSS/compare/language-server-v0.3.0...language-server-v0.4.0) (2026-11-27)


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
* **project:** renamed names (old -> new):
    - MASTER_CSS_PACKAGE_NAME_PATTERN -> STET_CSS_PACKAGE_NAME_PATTERN
    - MasterCSSWorkspacePackageResolution -> StetCSSWorkspacePackageResolution
    - MasterCSSWorkspacePackageResolutionError -> StetCSSWorkspacePackageResolutionError
    - ResolvedMasterCSSWorkspacePackage -> ResolvedStetCSSWorkspacePackage
    - collectMasterCSSPackageWorkspaceDirectories -> collectStetCSSPackageWorkspaceDirectories
    - collectMasterCSSPackageWorkspaceDirectoriesSync -> collectStetCSSPackageWorkspaceDirectoriesSync
    - findMasterCSSWorkspaceDirectories -> findStetCSSWorkspaceDirectories
    - findMasterCSSWorkspaceDirectoriesSync -> findStetCSSWorkspaceDirectoriesSync
    - hasMasterCSSDependency -> hasStetCSSDependency
    - hasMasterCSSManifestEntrypointFallback -> hasStetCSSManifestEntrypointFallback
    - isCompatibleMasterCSSPackageVersion -> isCompatibleStetCSSPackageVersion
    - isMasterCSSDependencyName -> isStetCSSDependencyName
    - resolveMasterCSSWorkspacePackages -> resolveStetCSSWorkspacePackages
* **engine:** renamed names (old -> new):
    - MasterCSS -> StetCSS
    - MasterCSSCreateOptions -> StetCSSCreateOptions
    - MasterCSSBuiltinKeyAliases -> StetCSSBuiltinKeyAliases
    - MasterCSSBuiltinNamespace -> StetCSSBuiltinNamespace
    - MasterCSSBuiltinNamespaceRef -> StetCSSBuiltinNamespaceRef
    - MasterCSSBuiltinNativeValueNamespace -> StetCSSBuiltinNativeValueNamespace
    - MasterCSSBuiltinNativeValueNamespaces -> StetCSSBuiltinNativeValueNamespaces
    - MasterCSSBuiltinSelectorAliases -> StetCSSBuiltinSelectorAliases
    - MasterCSSClassInspection -> StetCSSClassInspection
    - MasterCSSEmittedGlobals -> StetCSSEmittedGlobals
    - MasterCSSInspectedClassVariable -> StetCSSInspectedClassVariable
    - MasterCSSNormalizedNumericValue -> StetCSSNormalizedNumericValue
    - MasterCSSOptions -> StetCSSOptions
    - assertMasterCSSManifest -> assertStetCSSManifest
    - inspectMasterCSSClass -> inspectStetCSSClass
    - normalizeMasterCSSNumericValue -> normalizeStetCSSNumericValue
* **schema:** renamed names (old -> new):
    - MASTER_CSS_RUNTIME_STYLE_ID -> STET_CSS_RUNTIME_STYLE_ID
    - MasterCSSManifest -> StetCSSManifest
    - MasterCSSManifestAnimationOptions -> StetCSSManifestAnimationOptions
    - MasterCSSManifestAnimations -> StetCSSManifestAnimations
    - MasterCSSManifestCSSDeclarationPrimitive -> StetCSSManifestCSSDeclarationPrimitive
    - MasterCSSManifestCSSDeclarations -> StetCSSManifestCSSDeclarations
    - MasterCSSManifestCondition -> StetCSSManifestCondition
    - MasterCSSManifestConditionBooleanNode -> StetCSSManifestConditionBooleanNode
    - MasterCSSManifestConditionComparisonOperatorNode -> StetCSSManifestConditionComparisonOperatorNode
    - MasterCSSManifestConditionGroupNode -> StetCSSManifestConditionGroupNode
    - MasterCSSManifestConditionIdentifier -> StetCSSManifestConditionIdentifier
    - MasterCSSManifestConditionLogicalOperatorNode -> StetCSSManifestConditionLogicalOperatorNode
    - MasterCSSManifestConditionNode -> StetCSSManifestConditionNode
    - MasterCSSManifestConditionNumberNode -> StetCSSManifestConditionNumberNode
    - MasterCSSManifestConditionOperatorNode -> StetCSSManifestConditionOperatorNode
    - MasterCSSManifestConditionStringNode -> StetCSSManifestConditionStringNode
    - MasterCSSManifestConditionValueNode -> StetCSSManifestConditionValueNode
    - MasterCSSManifestConditions -> StetCSSManifestConditions
    - MasterCSSManifestDefaultMode -> StetCSSManifestDefaultMode
    - MasterCSSManifestKeyframes -> StetCSSManifestKeyframes
    - MasterCSSManifestModeTrigger -> StetCSSManifestModeTrigger
    - MasterCSSManifestSelectorCombinatorNode -> StetCSSManifestSelectorCombinatorNode
    - MasterCSSManifestSelectorLiteralNode -> StetCSSManifestSelectorLiteralNode
    - MasterCSSManifestSelectorNode -> StetCSSManifestSelectorNode
    - MasterCSSManifestSelectorSeparatorNode -> StetCSSManifestSelectorSeparatorNode
    - MasterCSSManifestSelectors -> StetCSSManifestSelectors
    - MasterCSSManifestSettings -> StetCSSManifestSettings
    - MasterCSSManifestUtilities -> StetCSSManifestUtilities
    - MasterCSSManifestUtility -> StetCSSManifestUtility
    - MasterCSSManifestUtilityEmit -> StetCSSManifestUtilityEmit
    - MasterCSSManifestUtilityKind -> StetCSSManifestUtilityKind
    - MasterCSSManifestUtilityLayerName -> StetCSSManifestUtilityLayerName
    - MasterCSSManifestUtilityMatcher -> StetCSSManifestUtilityMatcher
    - MasterCSSManifestUtilityMatcherValueSegments -> StetCSSManifestUtilityMatcherValueSegments
    - MasterCSSManifestUtilityRule -> StetCSSManifestUtilityRule
    - MasterCSSManifestVariable -> StetCSSManifestVariable
    - MasterCSSManifestVariableAlias -> StetCSSManifestVariableAlias
    - MasterCSSManifestVariableAliasSet -> StetCSSManifestVariableAliasSet
    - MasterCSSManifestVariableEntry -> StetCSSManifestVariableEntry
    - MasterCSSManifestVariableNumericValue -> StetCSSManifestVariableNumericValue
    - MasterCSSManifestVariableType -> StetCSSManifestVariableType
    - MasterCSSManifestVariableValue -> StetCSSManifestVariableValue
    - MasterCSSManifestVariables -> StetCSSManifestVariables
    - MasterCSSManifestVariant -> StetCSSManifestVariant
    - MasterCSSManifestVariantBranch -> StetCSSManifestVariantBranch
    - MasterCSSManifestVariantToken -> StetCSSManifestVariantToken
    - MasterCSSManifestVariants -> StetCSSManifestVariants
    - flattenMasterCSSManifestVariables -> flattenStetCSSManifestVariables
    - getMasterCSSManifestVariableName -> getStetCSSManifestVariableName
    - groupMasterCSSManifestVariables -> groupStetCSSManifestVariables
    - normalizeMasterCSSManifestForJSON -> normalizeStetCSSManifestForJSON
    - stringifyMasterCSSManifestJSON -> stringifyStetCSSManifestJSON
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **vscode:** settings written under `masterCSS.*` and LSP clients sending `masterCSS` settings are no longer read.
* **language:** stop treating @master as a directive in editor tooling

### Features

* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **vscode:** rename editor settings, commands and LSP methods to stetCSS ([70dfcd1](https://github.com/0Miles/StetCSS/commit/70dfcd14f96bed7efe19f4a4d7c4bbce329e72dd)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **compiler,stylesheet,language-server:** close review 4 findings on unquoted directive arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([8431226](https://github.com/0Miles/StetCSS/commit/8431226384e58ca9e811317d7f301467451e935f))
* **compiler:** fail on unquoted [@source](https://github.com/source), [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([85ea14f](https://github.com/0Miles/StetCSS/commit/85ea14f07f892c321a609e33682d45caea84c2e8))
* **language-server:** place SFC style diagnostics in the content, not the opening tag ([1368013](https://github.com/0Miles/StetCSS/commit/1368013d9a471aba26e4cc26fe47e3370a3b0fbb)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language-server:** reload a workspace when its manifest files change outside the editor ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([6d19786](https://github.com/0Miles/StetCSS/commit/6d19786e75bbdb74bd6f09d15184c133413491f5))
* **language-server:** report a manifest setting the engine rejects ([6764d84](https://github.com/0Miles/StetCSS/commit/6764d846a73647dddd570a69650055bf4be52ca9))
* **language-server:** watch every file a load reaches, stamped before it is read ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([578d0b3](https://github.com/0Miles/StetCSS/commit/578d0b3fa0c3840d5acf1c21aafd641551c88e98))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## [0.3.0](https://github.com/0Miles/StetCSS/compare/language-server-v0.2.0...language-server-v0.3.0) (2026-11-26)


### Bug Fixes

* **compiler,stylesheet,language-server:** close review 4 findings on unquoted directive arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([8431226](https://github.com/0Miles/StetCSS/commit/8431226384e58ca9e811317d7f301467451e935f))
* **compiler:** fail on unquoted [@source](https://github.com/source), [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([85ea14f](https://github.com/0Miles/StetCSS/commit/85ea14f07f892c321a609e33682d45caea84c2e8))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-server-v0.1.0...language-server-v0.2.0) (2026-11-26)


### Bug Fixes

* **language-server:** place SFC style diagnostics in the content, not the opening tag ([1368013](https://github.com/0Miles/StetCSS/commit/1368013d9a471aba26e4cc26fe47e3370a3b0fbb)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language-server:** reload a workspace when its manifest files change outside the editor ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([6d19786](https://github.com/0Miles/StetCSS/commit/6d19786e75bbdb74bd6f09d15184c133413491f5))
* **language-server:** report a manifest setting the engine rejects ([6764d84](https://github.com/0Miles/StetCSS/commit/6764d846a73647dddd570a69650055bf4be52ca9))
* **language-server:** watch every file a load reaches, stamped before it is read ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([578d0b3](https://github.com/0Miles/StetCSS/commit/578d0b3fa0c3840d5acf1c21aafd641551c88e98))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

* **project:** renamed names (old -> new):
    - MASTER_CSS_PACKAGE_NAME_PATTERN -> STET_CSS_PACKAGE_NAME_PATTERN
    - MasterCSSWorkspacePackageResolution -> StetCSSWorkspacePackageResolution
    - MasterCSSWorkspacePackageResolutionError -> StetCSSWorkspacePackageResolutionError
    - ResolvedMasterCSSWorkspacePackage -> ResolvedStetCSSWorkspacePackage
    - collectMasterCSSPackageWorkspaceDirectories -> collectStetCSSPackageWorkspaceDirectories
    - collectMasterCSSPackageWorkspaceDirectoriesSync -> collectStetCSSPackageWorkspaceDirectoriesSync
    - findMasterCSSWorkspaceDirectories -> findStetCSSWorkspaceDirectories
    - findMasterCSSWorkspaceDirectoriesSync -> findStetCSSWorkspaceDirectoriesSync
    - hasMasterCSSDependency -> hasStetCSSDependency
    - hasMasterCSSManifestEntrypointFallback -> hasStetCSSManifestEntrypointFallback
    - isCompatibleMasterCSSPackageVersion -> isCompatibleStetCSSPackageVersion
    - isMasterCSSDependencyName -> isStetCSSDependencyName
    - resolveMasterCSSWorkspacePackages -> resolveStetCSSWorkspacePackages
* **engine:** renamed names (old -> new):
    - MasterCSS -> StetCSS
    - MasterCSSCreateOptions -> StetCSSCreateOptions
    - MasterCSSBuiltinKeyAliases -> StetCSSBuiltinKeyAliases
    - MasterCSSBuiltinNamespace -> StetCSSBuiltinNamespace
    - MasterCSSBuiltinNamespaceRef -> StetCSSBuiltinNamespaceRef
    - MasterCSSBuiltinNativeValueNamespace -> StetCSSBuiltinNativeValueNamespace
    - MasterCSSBuiltinNativeValueNamespaces -> StetCSSBuiltinNativeValueNamespaces
    - MasterCSSBuiltinSelectorAliases -> StetCSSBuiltinSelectorAliases
    - MasterCSSClassInspection -> StetCSSClassInspection
    - MasterCSSEmittedGlobals -> StetCSSEmittedGlobals
    - MasterCSSInspectedClassVariable -> StetCSSInspectedClassVariable
    - MasterCSSNormalizedNumericValue -> StetCSSNormalizedNumericValue
    - MasterCSSOptions -> StetCSSOptions
    - assertMasterCSSManifest -> assertStetCSSManifest
    - inspectMasterCSSClass -> inspectStetCSSClass
    - normalizeMasterCSSNumericValue -> normalizeStetCSSNumericValue
* **schema:** renamed names (old -> new):
    - MASTER_CSS_RUNTIME_STYLE_ID -> STET_CSS_RUNTIME_STYLE_ID
    - MasterCSSManifest -> StetCSSManifest
    - MasterCSSManifestAnimationOptions -> StetCSSManifestAnimationOptions
    - MasterCSSManifestAnimations -> StetCSSManifestAnimations
    - MasterCSSManifestCSSDeclarationPrimitive -> StetCSSManifestCSSDeclarationPrimitive
    - MasterCSSManifestCSSDeclarations -> StetCSSManifestCSSDeclarations
    - MasterCSSManifestCondition -> StetCSSManifestCondition
    - MasterCSSManifestConditionBooleanNode -> StetCSSManifestConditionBooleanNode
    - MasterCSSManifestConditionComparisonOperatorNode -> StetCSSManifestConditionComparisonOperatorNode
    - MasterCSSManifestConditionGroupNode -> StetCSSManifestConditionGroupNode
    - MasterCSSManifestConditionIdentifier -> StetCSSManifestConditionIdentifier
    - MasterCSSManifestConditionLogicalOperatorNode -> StetCSSManifestConditionLogicalOperatorNode
    - MasterCSSManifestConditionNode -> StetCSSManifestConditionNode
    - MasterCSSManifestConditionNumberNode -> StetCSSManifestConditionNumberNode
    - MasterCSSManifestConditionOperatorNode -> StetCSSManifestConditionOperatorNode
    - MasterCSSManifestConditionStringNode -> StetCSSManifestConditionStringNode
    - MasterCSSManifestConditionValueNode -> StetCSSManifestConditionValueNode
    - MasterCSSManifestConditions -> StetCSSManifestConditions
    - MasterCSSManifestDefaultMode -> StetCSSManifestDefaultMode
    - MasterCSSManifestKeyframes -> StetCSSManifestKeyframes
    - MasterCSSManifestModeTrigger -> StetCSSManifestModeTrigger
    - MasterCSSManifestSelectorCombinatorNode -> StetCSSManifestSelectorCombinatorNode
    - MasterCSSManifestSelectorLiteralNode -> StetCSSManifestSelectorLiteralNode
    - MasterCSSManifestSelectorNode -> StetCSSManifestSelectorNode
    - MasterCSSManifestSelectorSeparatorNode -> StetCSSManifestSelectorSeparatorNode
    - MasterCSSManifestSelectors -> StetCSSManifestSelectors
    - MasterCSSManifestSettings -> StetCSSManifestSettings
    - MasterCSSManifestUtilities -> StetCSSManifestUtilities
    - MasterCSSManifestUtility -> StetCSSManifestUtility
    - MasterCSSManifestUtilityEmit -> StetCSSManifestUtilityEmit
    - MasterCSSManifestUtilityKind -> StetCSSManifestUtilityKind
    - MasterCSSManifestUtilityLayerName -> StetCSSManifestUtilityLayerName
    - MasterCSSManifestUtilityMatcher -> StetCSSManifestUtilityMatcher
    - MasterCSSManifestUtilityMatcherValueSegments -> StetCSSManifestUtilityMatcherValueSegments
    - MasterCSSManifestUtilityRule -> StetCSSManifestUtilityRule
    - MasterCSSManifestVariable -> StetCSSManifestVariable
    - MasterCSSManifestVariableAlias -> StetCSSManifestVariableAlias
    - MasterCSSManifestVariableAliasSet -> StetCSSManifestVariableAliasSet
    - MasterCSSManifestVariableEntry -> StetCSSManifestVariableEntry
    - MasterCSSManifestVariableNumericValue -> StetCSSManifestVariableNumericValue
    - MasterCSSManifestVariableType -> StetCSSManifestVariableType
    - MasterCSSManifestVariableValue -> StetCSSManifestVariableValue
    - MasterCSSManifestVariables -> StetCSSManifestVariables
    - MasterCSSManifestVariant -> StetCSSManifestVariant
    - MasterCSSManifestVariantBranch -> StetCSSManifestVariantBranch
    - MasterCSSManifestVariantToken -> StetCSSManifestVariantToken
    - MasterCSSManifestVariants -> StetCSSManifestVariants
    - flattenMasterCSSManifestVariables -> flattenStetCSSManifestVariables
    - getMasterCSSManifestVariableName -> getStetCSSManifestVariableName
    - groupMasterCSSManifestVariables -> groupStetCSSManifestVariables
    - normalizeMasterCSSManifestForJSON -> normalizeStetCSSManifestForJSON
    - stringifyMasterCSSManifestJSON -> stringifyStetCSSManifestJSON
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **vscode:** settings written under `masterCSS.*` and LSP clients sending `masterCSS` settings are no longer read.
* **language:** stop treating @master as a directive in editor tooling

### Features

* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **vscode:** rename editor settings, commands and LSP methods to stetCSS ([70dfcd1](https://github.com/0Miles/StetCSS/commit/70dfcd14f96bed7efe19f4a4d7c4bbce329e72dd)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **language-server:** show what the build emits for invalid classes ([4ac63dd](https://github.com/0Miles/StetCSS/commit/4ac63dd986e9588ebfa9d39cadc7295062e16ba1)), closes [#82](https://github.com/0Miles/StetCSS/issues/82)
* **language-server:** type handler results with vscode-languageserver types ([1fca4f8](https://github.com/0Miles/StetCSS/commit/1fca4f888cf8dda20b9d2ce6f1d710cd45921112))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
