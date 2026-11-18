# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/engine-v0.1.0...engine-v0.2.0) (2026-11-18)


### ⚠ BREAKING CHANGES

* **engine:** a manifest object with settings.baseUnit now throws instead of loading with the key ignored (this replaces the earlier note that the key is ignored). Delete settings.baseUnit from hand-written manifests and write spacing as a length (p:4x -> p:1rem).
* **engine:** unitless lengths in query classes are no longer converted to rem. Write the unit: @>=768 -> @>=768px (or @>=48rem), @container(width>=400) -> @container(width>=400px).
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
* **engine:** remove createHydrationManifest
* **runtime:** stop reading or adopting rules already on the page
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** let a shadow-root renderer put theme variables on :host ([72dcf05](https://github.com/0Miles/StetCSS/commit/72dcf051097f8aa69492421780b6f2656df6ef07)), closes [#177](https://github.com/0Miles/StetCSS/issues/177)
* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **runtime:** stop reading or adopting rules already on the page ([b3a8ec5](https://github.com/0Miles/StetCSS/commit/b3a8ec572b6b57210e22205b485fe502534de648)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)


### Bug Fixes

* **compiler:** explain an undeclared mode in [@variant](https://github.com/variant) light and [@variant](https://github.com/variant) dark ([3740da5](https://github.com/0Miles/StetCSS/commit/3740da5f1e5e3cbc9e99e00ce6dfc93ce691c14b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine,compiler:** lead with the media type inside one condition token ([b1e7f3a](https://github.com/0Miles/StetCSS/commit/b1e7f3aea9f6307893b9b15bcc28a8a40b9fe13b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** apply variants and nested rule selectors to each selector-list item ([49db6d4](https://github.com/0Miles/StetCSS/commit/49db6d4d9010abafc5cbfe60c7bca1623ff10a10)), closes [#176](https://github.com/0Miles/StetCSS/issues/176)
* **engine:** check dangling combinators after variants and empty :of() items ([662ccb2](https://github.com/0Miles/StetCSS/commit/662ccb28c4e261d62ad92c1f012040335298c6bd)), closes [#165](https://github.com/0Miles/StetCSS/issues/165)
* **engine:** compare absolute and uppercase query units by resolved length ([2dd8ad6](https://github.com/0Miles/StetCSS/commit/2dd8ad632ff8f7a73a2fac3f6c34e9b50337d725)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **engine:** emit theme tokens reached through an inline variable ([dd1c4da](https://github.com/0Miles/StetCSS/commit/dd1c4da35450de61b67a5283d9ebe6659c886ede)), closes [#185](https://github.com/0Miles/StetCSS/issues/185)
* **engine:** emit theme variables only for declared modes ([f01a1c8](https://github.com/0Miles/StetCSS/commit/f01a1c850e1b46b721a9233a8a1b30a8b7deb642)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine:** generate no rule for a selector suffix that is not a selector ([c87600a](https://github.com/0Miles/StetCSS/commit/c87600ad6eb8d55f40c01ae00ee73fb5395d617c)), closes [#179](https://github.com/0Miles/StetCSS/issues/179)
* **engine:** generate no rule for a selector-list item made only of `_` ([e807eef](https://github.com/0Miles/StetCSS/commit/e807eefe6ec86196a84c7506f4943f7eee2da513)), closes [#179](https://github.com/0Miles/StetCSS/issues/179)
* **engine:** join stacked conditions into one valid query ([902dcff](https://github.com/0Miles/StetCSS/commit/902dcff2d9f88cf1fafe3ce4afff51f647e27915)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** keep an :of() item that starts with a BEM `__` name ([498b590](https://github.com/0Miles/StetCSS/commit/498b5909a95744868e50a21a869807a4a64240ef)), closes [#179](https://github.com/0Miles/StetCSS/issues/179)
* **engine:** keep decimals and ratios in a query as one value ([1f0751c](https://github.com/0Miles/StetCSS/commit/1f0751ce41b2e5e4916f0878ad76f7c529876690)), closes [#184](https://github.com/0Miles/StetCSS/issues/184)
* **engine:** keep the container default for colon-form features except resolution ([4703292](https://github.com/0Miles/StetCSS/commit/470329278820ec235f7e3755906f43969d40c4c6)), closes [#184](https://github.com/0Miles/StetCSS/issues/184)
* **engine:** make a class invalid when a mode or media type cannot join one query ([ffd0fd8](https://github.com/0Miles/StetCSS/commit/ffd0fd84a8e129413741b43302da4cffbaf95342)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** order px width queries against rem breakpoints by resolved width ([b20247b](https://github.com/0Miles/StetCSS/commit/b20247bcf4614a329d0fe74466bca8f56e038dcc)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **engine:** output query numbers as written ([02119ab](https://github.com/0Miles/StetCSS/commit/02119ab0321bccb732d554bbd63bbb5398c16ff1))
* **engine:** reject [@light](https://github.com/light) and [@dark](https://github.com/dark) classes when the mode is not declared ([efd059a](https://github.com/0Miles/StetCSS/commit/efd059aabc6c257ac789ed8453992a189517864a)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine:** reject a leftover settings.baseUnit in a manifest ([7ac5285](https://github.com/0Miles/StetCSS/commit/7ac5285b45fbf0d03b4dcc57bf9873a6896ecbfa)), closes [#162](https://github.com/0Miles/StetCSS/issues/162)
* **engine:** reject class selector suffixes that are not selectors ([88e6a37](https://github.com/0Miles/StetCSS/commit/88e6a37513bb1a1b922b7211398d2f0611ed3be3)), closes [#165](https://github.com/0Miles/StetCSS/issues/165)
* **engine:** reject empty items in function arguments ([3f4f671](https://github.com/0Miles/StetCSS/commit/3f4f671110496222c1b9c33e200b63f1f168e67f)), closes [#175](https://github.com/0Miles/StetCSS/issues/175)
* **engine:** reject values whose top-level comma list has an empty item ([f3e10ba](https://github.com/0Miles/StetCSS/commit/f3e10ba7ce4e30b07e18e1b2d65d6e86894144ab)), closes [#175](https://github.com/0Miles/StetCSS/issues/175)
* **engine:** scope the class under each item of an :of() selector list ([df9d2b4](https://github.com/0Miles/StetCSS/commit/df9d2b42ce97f32754d8132aea669bc64561ab89)), closes [#176](https://github.com/0Miles/StetCSS/issues/176)
* **engine:** treat classes expanding past 4096 variant branches as invalid ([87215be](https://github.com/0Miles/StetCSS/commit/87215be9eac251a969a6228580ba0f89822b9cd1)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)
* **engine:** treat classes nested deeper than 64 brackets as invalid ([c58c37e](https://github.com/0Miles/StetCSS/commit/c58c37e985a05b3f7f7b3298c7528ad6d5cded3b)), closes [#47](https://github.com/0Miles/StetCSS/issues/47)
* **engine:** write alpha modifier percentages without float error ([359bafa](https://github.com/0Miles/StetCSS/commit/359bafa2fd26950a29c1c9163ee620a1a0f58507)), closes [#166](https://github.com/0Miles/StetCSS/issues/166)
* **language-server:** report a manifest setting the engine rejects ([6764d84](https://github.com/0Miles/StetCSS/commit/6764d846a73647dddd570a69650055bf4be52ca9))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **engine:** count a class's variant branches before building them ([73831d8](https://github.com/0Miles/StetCSS/commit/73831d8f27e658b55461c5fc31e3773ec2de4670)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)
* **engine:** resolve a class's variant branches once ([1dffafa](https://github.com/0Miles/StetCSS/commit/1dffafa1e3acc6904f1a2ce72e25889d829d01a3)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)


### Code Refactoring

* **engine:** remove createHydrationManifest ([c9467b2](https://github.com/0Miles/StetCSS/commit/c9467b245acca049672d4846eebb87deb12fc87c)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **engine:** remove createHydrationManifest
* **runtime:** stop reading or adopting rules already on the page
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **runtime:** stop reading or adopting rules already on the page ([b3a8ec5](https://github.com/0Miles/StetCSS/commit/b3a8ec572b6b57210e22205b485fe502534de648)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)


### Bug Fixes

* **compiler:** explain an undeclared mode in [@variant](https://github.com/variant) light and [@variant](https://github.com/variant) dark ([3740da5](https://github.com/0Miles/StetCSS/commit/3740da5f1e5e3cbc9e99e00ce6dfc93ce691c14b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine,compiler:** lead with the media type inside one condition token ([b1e7f3a](https://github.com/0Miles/StetCSS/commit/b1e7f3aea9f6307893b9b15bcc28a8a40b9fe13b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** emit theme variables only for declared modes ([f01a1c8](https://github.com/0Miles/StetCSS/commit/f01a1c850e1b46b721a9233a8a1b30a8b7deb642)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine:** join stacked conditions into one valid query ([902dcff](https://github.com/0Miles/StetCSS/commit/902dcff2d9f88cf1fafe3ce4afff51f647e27915)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** make a class invalid when a mode or media type cannot join one query ([ffd0fd8](https://github.com/0Miles/StetCSS/commit/ffd0fd84a8e129413741b43302da4cffbaf95342)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** reject [@light](https://github.com/light) and [@dark](https://github.com/dark) classes when the mode is not declared ([efd059a](https://github.com/0Miles/StetCSS/commit/efd059aabc6c257ac789ed8453992a189517864a)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **engine:** treat classes expanding past 4096 variant branches as invalid ([87215be](https://github.com/0Miles/StetCSS/commit/87215be9eac251a969a6228580ba0f89822b9cd1)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)
* **engine:** treat classes nested deeper than 64 brackets as invalid ([c58c37e](https://github.com/0Miles/StetCSS/commit/c58c37e985a05b3f7f7b3298c7528ad6d5cded3b)), closes [#47](https://github.com/0Miles/StetCSS/issues/47)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **engine:** count a class's variant branches before building them ([73831d8](https://github.com/0Miles/StetCSS/commit/73831d8f27e658b55461c5fc31e3773ec2de4670)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)
* **engine:** resolve a class's variant branches once ([1dffafa](https://github.com/0Miles/StetCSS/commit/1dffafa1e3acc6904f1a2ce72e25889d829d01a3)), closes [#50](https://github.com/0Miles/StetCSS/issues/50)


### Code Refactoring

* **engine:** remove createHydrationManifest ([c9467b2](https://github.com/0Miles/StetCSS/commit/c9467b245acca049672d4846eebb87deb12fc87c)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
