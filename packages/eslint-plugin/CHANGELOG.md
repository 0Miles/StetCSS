# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/eslint-plugin-v0.2.0...eslint-plugin-v0.3.0) (2026-11-26)


### Bug Fixes

* **eslint-plugin:** decode Vue template strings only in :class bindings ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([2e7a75a](https://github.com/0Miles/StetCSS/commit/2e7a75a46982ecb12b2bdd975741c01d2985f596))
* **eslint-plugin:** fix class attributes spelled with character references ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([2197b76](https://github.com/0Miles/StetCSS/commit/2197b7657fec7b700b66b980937fc943c15e29cf))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/eslint-plugin-v0.1.0...eslint-plugin-v0.2.0) (2026-11-26)


### ⚠ BREAKING CHANGES

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
* **lexer:** renamed names (old -> new):
    - MASTER_CSS_LENGTH_UNITS -> STET_CSS_LENGTH_UNITS
    - MASTER_CSS_PACKAGE_MODULE_IDS -> STET_CSS_PACKAGE_MODULE_IDS
    - MASTER_CSS_PACKAGE_MODULE_ID_SET -> STET_CSS_PACKAGE_MODULE_ID_SET
    - MASTER_CSS_VALUE_UNITS -> STET_CSS_VALUE_UNITS
    - MASTER_CSS_VALUE_UNIT_PATTERN -> STET_CSS_VALUE_UNIT_PATTERN
    - MASTER_CSS_VALUE_UNIT_SET -> STET_CSS_VALUE_UNIT_SET
    - MasterCSSClassListItem -> StetCSSClassListItem
    - MasterCSSClassListItemType -> StetCSSClassListItemType
    - MasterCSSClassListParseOptions -> StetCSSClassListParseOptions
    - MasterCSSClassListTokenRange -> StetCSSClassListTokenRange
    - MasterCSSLexicalTokenItem -> StetCSSLexicalTokenItem
    - MasterCSSLexicalTokenModifier -> StetCSSLexicalTokenModifier
    - MasterCSSLexicalTokenRole -> StetCSSLexicalTokenRole
    - MasterCSSLexicalTokenType -> StetCSSLexicalTokenType
    - MasterCSSSplitPart -> StetCSSSplitPart
    - MasterCSSValueTokenizeOptions -> StetCSSValueTokenizeOptions
    - collectMasterCSSClassListTokenRanges -> collectStetCSSClassListTokenRanges
    - createMasterCSSImportPattern -> createStetCSSImportPattern
    - createMasterCSSManifestEntryPattern -> createStetCSSManifestEntryPattern
    - findMasterCSSClosingParen -> findStetCSSClosingParen
    - findMasterCSSClosingQuote -> findStetCSSClosingQuote
    - findMasterCSSGroupedClassClose -> findStetCSSGroupedClassClose
    - hasMasterCSSImport -> hasStetCSSImport
    - hasMasterCSSManifestEntrypoint -> hasStetCSSManifestEntrypoint
    - isMasterCSSModuleId -> isStetCSSModuleId
    - normalizeMasterCSSModuleIds -> normalizeStetCSSModuleIds
    - parseMasterCSSClassList -> parseStetCSSClassList
    - pushMasterCSSLexicalToken -> pushStetCSSLexicalToken
    - replaceMasterCSSImports -> replaceStetCSSImports
    - splitMasterCSSTopLevel -> splitStetCSSTopLevel
    - tokenizeMasterCSSAtQuery -> tokenizeStetCSSAtQuery
    - tokenizeMasterCSSClass -> tokenizeStetCSSClass
    - tokenizeMasterCSSGroupedClassToken -> tokenizeStetCSSGroupedClassToken
    - tokenizeMasterCSSState -> tokenizeStetCSSState
    - tokenizeMasterCSSValue -> tokenizeStetCSSValue
    - unescapeMasterCSSClassListToken -> unescapeStetCSSClassListToken
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

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **eslint-plugin:** end expression fragments only at the lexer's class separators ([302cb61](https://github.com/0Miles/StetCSS/commit/302cb611a65015e22c273844d0bd9992c82f21e2))
* **eslint-plugin:** ignore computed string keys listed in ignoredKeys ([0402019](https://github.com/0Miles/StetCSS/commit/040201901507db401408b80319ad4c7ffbfecc20))
* **eslint-plugin:** leave class fragments inside template literal expressions alone ([e4f9bd7](https://github.com/0Miles/StetCSS/commit/e4f9bd7a4cb56da989460a46df0224cb62c114ae)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **eslint-plugin:** leave class fragments touching Svelte expressions and ignoredKeys alone ([3d25256](https://github.com/0Miles/StetCSS/commit/3d2525628c37e37bf922962ba07bc1f83b7e71ca))
* **eslint-plugin:** link rule docs to their README headings ([b10a3df](https://github.com/0Miles/StetCSS/commit/b10a3df7542a3a16ab0654ec62f15c6bc434ebd6)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **eslint-plugin:** lint the Svelte, Astro, classList and Vue class contexts it missed ([61a203c](https://github.com/0Miles/StetCSS/commit/61a203cb3cef2328202486f6073ac8553fe64e55)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **eslint-plugin:** map decoded class lists back onto source in autofix ([1eb33e1](https://github.com/0Miles/StetCSS/commit/1eb33e1dd7494382b992a9f84ab334d675ff29bd)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **eslint-plugin:** pass ignoredKeys to MDX source linting ([b7f0aaa](https://github.com/0Miles/StetCSS/commit/b7f0aaaf4d631da46e005e6b7a551160807fcad2))
* **eslint-plugin:** reload the manifest after its CSS entry or an imported file changes ([2389bf4](https://github.com/0Miles/StetCSS/commit/2389bf4e6ccbefa2ed0eae3b6614edeb5ca1683f)), closes [#199](https://github.com/0Miles/StetCSS/issues/199)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Performance Improvements

* **eslint-plugin:** remember a workspace's entry files instead of walking it per file ([acb1af5](https://github.com/0Miles/StetCSS/commit/acb1af5a4932df1f2bf4ab4072de541b296137f2)), closes [#199](https://github.com/0Miles/StetCSS/issues/199)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **lexer:** renamed names (old -> new):
    - MASTER_CSS_LENGTH_UNITS -> STET_CSS_LENGTH_UNITS
    - MASTER_CSS_PACKAGE_MODULE_IDS -> STET_CSS_PACKAGE_MODULE_IDS
    - MASTER_CSS_PACKAGE_MODULE_ID_SET -> STET_CSS_PACKAGE_MODULE_ID_SET
    - MASTER_CSS_VALUE_UNITS -> STET_CSS_VALUE_UNITS
    - MASTER_CSS_VALUE_UNIT_PATTERN -> STET_CSS_VALUE_UNIT_PATTERN
    - MASTER_CSS_VALUE_UNIT_SET -> STET_CSS_VALUE_UNIT_SET
    - MasterCSSClassListItem -> StetCSSClassListItem
    - MasterCSSClassListItemType -> StetCSSClassListItemType
    - MasterCSSClassListParseOptions -> StetCSSClassListParseOptions
    - MasterCSSClassListTokenRange -> StetCSSClassListTokenRange
    - MasterCSSLexicalTokenItem -> StetCSSLexicalTokenItem
    - MasterCSSLexicalTokenModifier -> StetCSSLexicalTokenModifier
    - MasterCSSLexicalTokenRole -> StetCSSLexicalTokenRole
    - MasterCSSLexicalTokenType -> StetCSSLexicalTokenType
    - MasterCSSSplitPart -> StetCSSSplitPart
    - MasterCSSValueTokenizeOptions -> StetCSSValueTokenizeOptions
    - collectMasterCSSClassListTokenRanges -> collectStetCSSClassListTokenRanges
    - createMasterCSSImportPattern -> createStetCSSImportPattern
    - createMasterCSSManifestEntryPattern -> createStetCSSManifestEntryPattern
    - findMasterCSSClosingParen -> findStetCSSClosingParen
    - findMasterCSSClosingQuote -> findStetCSSClosingQuote
    - findMasterCSSGroupedClassClose -> findStetCSSGroupedClassClose
    - hasMasterCSSImport -> hasStetCSSImport
    - hasMasterCSSManifestEntrypoint -> hasStetCSSManifestEntrypoint
    - isMasterCSSModuleId -> isStetCSSModuleId
    - normalizeMasterCSSModuleIds -> normalizeStetCSSModuleIds
    - parseMasterCSSClassList -> parseStetCSSClassList
    - pushMasterCSSLexicalToken -> pushStetCSSLexicalToken
    - replaceMasterCSSImports -> replaceStetCSSImports
    - splitMasterCSSTopLevel -> splitStetCSSTopLevel
    - tokenizeMasterCSSAtQuery -> tokenizeStetCSSAtQuery
    - tokenizeMasterCSSClass -> tokenizeStetCSSClass
    - tokenizeMasterCSSGroupedClassToken -> tokenizeStetCSSGroupedClassToken
    - tokenizeMasterCSSState -> tokenizeStetCSSState
    - tokenizeMasterCSSValue -> tokenizeStetCSSValue
    - unescapeMasterCSSClassListToken -> unescapeStetCSSClassListToken
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

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **eslint-plugin:** import MasterCSS from @stet-css/core ([ebc7cd7](https://github.com/0Miles/StetCSS/commit/ebc7cd73b6bd8d845cf956da3b0d17c34fb829ff))
* **eslint-plugin:** link rule docs to their README headings ([b10a3df](https://github.com/0Miles/StetCSS/commit/b10a3df7542a3a16ab0654ec62f15c6bc434ebd6)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
