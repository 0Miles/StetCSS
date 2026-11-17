# Changelog

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

* **next:** renamed names (old -> new):
    - MASTER_CSS_MANIFEST_IMPORT_CONTENT_PATTERN -> STET_CSS_MANIFEST_IMPORT_CONTENT_PATTERN
    - MASTER_CSS_MANIFEST_IMPORT_PATTERN -> STET_CSS_MANIFEST_IMPORT_PATTERN
    - MASTER_CSS_MANIFEST_RESOURCE_QUERY -> STET_CSS_MANIFEST_RESOURCE_QUERY
    - MASTER_CSS_STYLE_CONTENT_PATTERN -> STET_CSS_STYLE_CONTENT_PATTERN
    - MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN -> STET_CSS_VIRTUAL_MANIFEST_PATH_PATTERN
    - MasterCSSManifestLoaderOptions -> StetCSSManifestLoaderOptions
    - MasterCSSNextSetup -> StetCSSNextSetup
    - applyMasterCSSTurbopackConfig -> applyStetCSSTurbopackConfig
    - applyMasterCSSWebpackConfig -> applyStetCSSWebpackConfig
    - loadMasterCSSManifestFromImport -> loadStetCSSManifestFromImport
    - masterCSSManifestImportLoader -> stetCSSManifestImportLoader
    - masterCSSManifestLoader -> stetCSSManifestLoader
    - masterCSSNextGeneratedCSSLoader -> stetCSSNextGeneratedCSSLoader
    - masterCSSStyleCSSLoader -> stetCSSStyleCSSLoader
    - withMasterCSS -> withStetCSS
* **webpack:** renamed names (old -> new):
    - MasterCSSPlugin -> StetCSSPlugin
    - MasterCSSWebpackContext -> StetCSSWebpackContext
    - MasterCSSWebpackHost -> StetCSSWebpackHost
    - hasMasterStyleManifestDirective -> hasStetStyleManifestDirective
    - loadMasterCSSManifestModule -> loadStetCSSManifestModule
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
* **vite,webpack:** Vite configs or tools that find these plugins by name must use the new names. Generated CSS is unchanged.
* **scanner:** intermediate CSS that a build plugin has not yet spliced carries the new selector. Final generated CSS is unchanged: the placeholder never survives a successful build.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **webpack:** take only adapters and drop the scanner-options form
* **scanner:** keep only cache and validation, with adapters as the only option
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries
* **webpack:** only build static CSS, from the project's class set
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** keep only cache and validation, with adapters as the only option ([5e4bae4](https://github.com/0Miles/StetCSS/commit/5e4bae4646f0ca7d93d7339b761f1c6210eab15b)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **scanner:** rename the build placeholder rule to #stet-css-slot ([bd503d9](https://github.com/0Miles/StetCSS/commit/bd503d9ab4f9e8d264bff5cbb7e2279553933133)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **vite,webpack:** rename build plugin names and log prefixes to stet-css ([7bb4197](https://github.com/0Miles/StetCSS/commit/7bb4197d34a7f6ed1794345c78e4bbd44d14307e)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **webpack:** only build static CSS, from the project's class set ([2d86707](https://github.com/0Miles/StetCSS/commit/2d86707ba397fc720bbf458f72856085abff5f4c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **webpack:** take only adapters and drop the scanner-options form ([062c10e](https://github.com/0Miles/StetCSS/commit/062c10eb0c447dbbf27a61fe1b443f0b94de66e0)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **webpack:** keep Sass entries and entries outside the root in static CSS ([2a487e7](https://github.com/0Miles/StetCSS/commit/2a487e7d6c01635711c0727043289cb72ef6873e)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **webpack:** type the css and manifest getters with @stet-css/core types ([60dc372](https://github.com/0Miles/StetCSS/commit/60dc372c0c82419553995622c938667320e9e066))


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **next:** rename withMasterCSS, its loaders and manifest patterns to StetCSS ([db65d17](https://github.com/0Miles/StetCSS/commit/db65d17829562bdf9a1ae1a094047fabb2ac69ca))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
* **webpack:** rename the MasterCSSPlugin class, its tap name and webpack context types to StetCSS ([c8e988c](https://github.com/0Miles/StetCSS/commit/c8e988c2f004dcd6b283f4a9a8f6297dd9181e76))
