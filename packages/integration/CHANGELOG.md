# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/integration-v0.2.0...integration-v0.3.0) (2026-11-26)


### Miscellaneous Chores

* **integration:** Synchronize stet-css versions

## [0.2.0](https://github.com/0Miles/StetCSS/compare/integration-v0.1.0...integration-v0.2.0) (2026-11-26)


### Miscellaneous Chores

* **integration:** Synchronize stet-css versions

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **integration:** drop the basename parameter of toHashedManifestAssetFileName
* **integration:** drop toHashedHydrationManifestAssetFileName
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** drop the basename parameter of toHashedManifestAssetFileName ([0666ded](https://github.com/0Miles/StetCSS/commit/0666dedb00a10fdc4bd20fa539037254a1caa535)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **integration:** drop toHashedHydrationManifestAssetFileName ([7ac1f53](https://github.com/0Miles/StetCSS/commit/7ac1f530aa0cd9acf1d0777a391e4ef0c6e7cb87)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
