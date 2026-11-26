# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/lint-v0.2.0...lint-v0.3.0) (2026-11-26)


### Bug Fixes

* **lint:** give no fix when a respelled class would break a string read as written ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([8704bcd](https://github.com/0Miles/StetCSS/commit/8704bcd7ce8051e279438c03dfc012153fc5fb0e))
* **lint:** keep each class when an edit rejoins decoded spellings ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([a8b8bf5](https://github.com/0Miles/StetCSS/commit/a8b8bf5d6c2cf85bc5111152117cebec93d0efcb))
* **lint:** lint and fix class attributes with character references by their decoded classes ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([a158092](https://github.com/0Miles/StetCSS/commit/a158092c8df12177f4d39ee1004417aafcbee3d4))
* **lint:** rebuild a class list the parser read as written as written ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([0071d82](https://github.com/0Miles/StetCSS/commit/0071d822e6cdb20213e3f0eb646dee20867df3a8))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/lint-v0.1.0...lint-v0.2.0) (2026-11-26)


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
* **lint:** pass scriptString through class-list edit options ([6b76512](https://github.com/0Miles/StetCSS/commit/6b76512b65f98f9f073c1c7516e6939095e95dad)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)


### Bug Fixes

* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* **lint:** decode JavaScript string class lists in source linting ([83da91e](https://github.com/0Miles/StetCSS/commit/83da91ed7796016c2cace324627fb26f4c80a133)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **lint:** honour ignoredKeys when linting and fixing source content ([a1e6304](https://github.com/0Miles/StetCSS/commit/a1e630469b2c03132ef132e2aac5b9acbe553836))
* **lint:** leave class fragments beside runtime expressions unreported ([cd92cff](https://github.com/0Miles/StetCSS/commit/cd92cff5bb8a8645a8d0f2a1ee557f3cd038b5cf)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **lint:** lint .mjs files as JavaScript ([c45c6af](https://github.com/0Miles/StetCSS/commit/c45c6af1599c0813f49924521271cd4e13a7d695))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
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
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **validator:** keep a group's valid declarations when one is invalid ([a7a4df5](https://github.com/0Miles/StetCSS/commit/a7a4df5179c8fc804a4544dd1663dad24eff276d)), closes [#81](https://github.com/0Miles/StetCSS/issues/81)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
