# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/project-v0.2.0...project-v0.3.0) (2026-11-26)


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
* **integration:** renamed names (old -> new):
    - MASTER_CSS_MANIFEST_PRELOAD_AS -> STET_CSS_MANIFEST_PRELOAD_AS
    - MASTER_CSS_MANIFEST_PRELOAD_REL -> STET_CSS_MANIFEST_PRELOAD_REL
    - MASTER_CSS_MANIFEST_QUERY -> STET_CSS_MANIFEST_QUERY
    - MASTER_CSS_RUNTIME_INJECTED_MARKER -> STET_CSS_RUNTIME_INJECTED_MARKER
    - RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX -> RESOLVED_STET_CSS_MANIFEST_QUERY_PREFIX
    - fromResolvedMasterCSSManifestId -> fromResolvedStetCSSManifestId
    - isMasterCSSManifestRequest -> isStetCSSManifestRequest
    - loadMasterCSSManifestFromFetch -> loadStetCSSManifestFromFetch
    - loadMasterCSSManifestFromFile -> loadStetCSSManifestFromFile
    - masterCSSManifestFile -> stetCSSManifestFile
    - masterCSSManifestModule -> stetCSSManifestModule
    - masterCSSManifestResponse -> stetCSSManifestResponse
    - masterCSSManifestURL -> stetCSSManifestURL
    - stripMasterCSSManifestQuery -> stripStetCSSManifestQuery
    - toResolvedMasterCSSManifestId -> toResolvedStetCSSManifestId
* **compiler:** renamed names (old -> new):
    - CreateMasterCSSManifestOptions -> CreateStetCSSManifestOptions
    - MASTER_CSS_PACKAGE_ID -> STET_CSS_PACKAGE_ID
    - MASTER_CSS_PACKAGE_IDS -> STET_CSS_PACKAGE_IDS
    - MASTER_CUSTOM_AT_RULES -> STET_CUSTOM_AT_RULES
    - MasterCSSManifestVariableDraft -> StetCSSManifestVariableDraft
    - createMasterCSSManifest -> createStetCSSManifest
    - hasMasterEntry -> hasStetEntry
    - isMasterCSSPackageStyleFile -> isStetCSSPackageStyleFile
    - masterVariantBlock -> stetVariantBlock
    - parseMasterOption -> parseStetOption
    - parseMasterVariantBlock -> parseStetVariantBlock
    - resolveMasterCSSPackageEntryFile -> resolveStetCSSPackageEntryFile
    - resolveMasterCSSPackageImportGraph -> resolveStetCSSPackageImportGraph
    - resolveMasterVariantReference -> resolveStetVariantReference
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
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** report each stylesheet a compile reaches through onDependency ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([c75a457](https://github.com/0Miles/StetCSS/commit/c75a457d7c665f116548befee701236672b6cdaa))
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **project:** let static builds discover Sass stylesheet entries ([609259e](https://github.com/0Miles/StetCSS/commit/609259e800586bdf12d17458e5b4f0e72059da2c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **project:** read .mjs files as project sources ([7ca59e4](https://github.com/0Miles/StetCSS/commit/7ca59e488a3870375a3ce532dd220d80e103acdb))


### Performance Improvements

* **project:** cache entry discovery reads and add a cached project manifest load ([02bbce8](https://github.com/0Miles/StetCSS/commit/02bbce85e472f07e071567668728226a1b7586c2)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/project-v0.1.0...project-v0.2.0) (2026-11-26)


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
* **integration:** renamed names (old -> new):
    - MASTER_CSS_MANIFEST_PRELOAD_AS -> STET_CSS_MANIFEST_PRELOAD_AS
    - MASTER_CSS_MANIFEST_PRELOAD_REL -> STET_CSS_MANIFEST_PRELOAD_REL
    - MASTER_CSS_MANIFEST_QUERY -> STET_CSS_MANIFEST_QUERY
    - MASTER_CSS_RUNTIME_INJECTED_MARKER -> STET_CSS_RUNTIME_INJECTED_MARKER
    - RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX -> RESOLVED_STET_CSS_MANIFEST_QUERY_PREFIX
    - fromResolvedMasterCSSManifestId -> fromResolvedStetCSSManifestId
    - isMasterCSSManifestRequest -> isStetCSSManifestRequest
    - loadMasterCSSManifestFromFetch -> loadStetCSSManifestFromFetch
    - loadMasterCSSManifestFromFile -> loadStetCSSManifestFromFile
    - masterCSSManifestFile -> stetCSSManifestFile
    - masterCSSManifestModule -> stetCSSManifestModule
    - masterCSSManifestResponse -> stetCSSManifestResponse
    - masterCSSManifestURL -> stetCSSManifestURL
    - stripMasterCSSManifestQuery -> stripStetCSSManifestQuery
    - toResolvedMasterCSSManifestId -> toResolvedStetCSSManifestId
* **compiler:** renamed names (old -> new):
    - CreateMasterCSSManifestOptions -> CreateStetCSSManifestOptions
    - MASTER_CSS_PACKAGE_ID -> STET_CSS_PACKAGE_ID
    - MASTER_CSS_PACKAGE_IDS -> STET_CSS_PACKAGE_IDS
    - MASTER_CUSTOM_AT_RULES -> STET_CUSTOM_AT_RULES
    - MasterCSSManifestVariableDraft -> StetCSSManifestVariableDraft
    - createMasterCSSManifest -> createStetCSSManifest
    - hasMasterEntry -> hasStetEntry
    - isMasterCSSPackageStyleFile -> isStetCSSPackageStyleFile
    - masterVariantBlock -> stetVariantBlock
    - parseMasterOption -> parseStetOption
    - parseMasterVariantBlock -> parseStetVariantBlock
    - resolveMasterCSSPackageEntryFile -> resolveStetCSSPackageEntryFile
    - resolveMasterCSSPackageImportGraph -> resolveStetCSSPackageImportGraph
    - resolveMasterVariantReference -> resolveStetVariantReference
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
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** report each stylesheet a compile reaches through onDependency ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([c75a457](https://github.com/0Miles/StetCSS/commit/c75a457d7c665f116548befee701236672b6cdaa))
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **project:** let static builds discover Sass stylesheet entries ([609259e](https://github.com/0Miles/StetCSS/commit/609259e800586bdf12d17458e5b4f0e72059da2c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** reject CSS nested past 64 levels before lightningcss parses it ([4095d37](https://github.com/0Miles/StetCSS/commit/4095d37c87ea96e89fef7714255f33cb267be242))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **project:** read .mjs files as project sources ([7ca59e4](https://github.com/0Miles/StetCSS/commit/7ca59e488a3870375a3ce532dd220d80e103acdb))


### Performance Improvements

* **project:** cache entry discovery reads and add a cached project manifest load ([02bbce8](https://github.com/0Miles/StetCSS/commit/02bbce85e472f07e071567668728226a1b7586c2)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

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
* **integration:** renamed names (old -> new):
    - MASTER_CSS_MANIFEST_PRELOAD_AS -> STET_CSS_MANIFEST_PRELOAD_AS
    - MASTER_CSS_MANIFEST_PRELOAD_REL -> STET_CSS_MANIFEST_PRELOAD_REL
    - MASTER_CSS_MANIFEST_QUERY -> STET_CSS_MANIFEST_QUERY
    - MASTER_CSS_RUNTIME_INJECTED_MARKER -> STET_CSS_RUNTIME_INJECTED_MARKER
    - RESOLVED_MASTER_CSS_MANIFEST_QUERY_PREFIX -> RESOLVED_STET_CSS_MANIFEST_QUERY_PREFIX
    - fromResolvedMasterCSSManifestId -> fromResolvedStetCSSManifestId
    - isMasterCSSManifestRequest -> isStetCSSManifestRequest
    - loadMasterCSSManifestFromFetch -> loadStetCSSManifestFromFetch
    - loadMasterCSSManifestFromFile -> loadStetCSSManifestFromFile
    - masterCSSManifestFile -> stetCSSManifestFile
    - masterCSSManifestModule -> stetCSSManifestModule
    - masterCSSManifestResponse -> stetCSSManifestResponse
    - masterCSSManifestURL -> stetCSSManifestURL
    - stripMasterCSSManifestQuery -> stripStetCSSManifestQuery
    - toResolvedMasterCSSManifestId -> toResolvedStetCSSManifestId
* **compiler:** renamed names (old -> new):
    - CreateMasterCSSManifestOptions -> CreateStetCSSManifestOptions
    - MASTER_CSS_PACKAGE_ID -> STET_CSS_PACKAGE_ID
    - MASTER_CSS_PACKAGE_IDS -> STET_CSS_PACKAGE_IDS
    - MASTER_CUSTOM_AT_RULES -> STET_CUSTOM_AT_RULES
    - MasterCSSManifestVariableDraft -> StetCSSManifestVariableDraft
    - createMasterCSSManifest -> createStetCSSManifest
    - hasMasterEntry -> hasStetEntry
    - isMasterCSSPackageStyleFile -> isStetCSSPackageStyleFile
    - masterVariantBlock -> stetVariantBlock
    - parseMasterOption -> parseStetOption
    - parseMasterVariantBlock -> parseStetVariantBlock
    - resolveMasterCSSPackageEntryFile -> resolveStetCSSPackageEntryFile
    - resolveMasterCSSPackageImportGraph -> resolveStetCSSPackageImportGraph
    - resolveMasterVariantReference -> resolveStetVariantReference
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
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **project:** let static builds discover Sass stylesheet entries ([609259e](https://github.com/0Miles/StetCSS/commit/609259e800586bdf12d17458e5b4f0e72059da2c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** reject CSS nested past 64 levels before lightningcss parses it ([4095d37](https://github.com/0Miles/StetCSS/commit/4095d37c87ea96e89fef7714255f33cb267be242))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
