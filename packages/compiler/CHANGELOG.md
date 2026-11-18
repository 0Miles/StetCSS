# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/compiler-v0.1.0...compiler-v0.2.0) (2026-11-18)


### ⚠ BREAKING CHANGES

* **compiler:** --breakpoint-* and --container-* tokens are output as written. A px token now yields a px query (768px, not 48rem); a unitless token is output unitless and no longer matches, so write a unit:
* **engine:** unitless lengths in query classes are no longer converted to rem. Write the unit: @>=768 -> @>=768px (or @>=48rem), @container(width>=400) -> @container(width>=400px).
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
* **language:** imports of `syntaxes/master-css.tmLanguage.json`, theme rules targeting `*.master-css` scopes, and ```master-css fences no longer match.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **language:** rename the TextMate grammar and its scopes to stet-css ([4e3296b](https://github.com/0Miles/StetCSS/commit/4e3296b42a3253dc5ad86e8ac57823d872a286d9)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** accept native syntax css-tree 3.2.1 rejects ([cc8aad3](https://github.com/0Miles/StetCSS/commit/cc8aad30ca5a5cee6e4e2371555c1a2b31b714c2)), closes [#164](https://github.com/0Miles/StetCSS/issues/164)
* **compiler:** accept only length units in breakpoint and container tokens ([8e2e72b](https://github.com/0Miles/StetCSS/commit/8e2e72b33da43ded8b3636aca4a3225c599a5090)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** apply mode and [@variant](https://github.com/variant) wrappers and selector aliases to each list item ([535c63d](https://github.com/0Miles/StetCSS/commit/535c63d4efd1fb39d079ac49fb1b766e62f8d01d)), closes [#176](https://github.com/0Miles/StetCSS/issues/176)
* **compiler:** cap [@reference](https://github.com/reference) expansion at 256 per compile ([0ff66c3](https://github.com/0Miles/StetCSS/commit/0ff66c306942758aaa5caf18cec187657ee21c76))
* **compiler:** count every brace form in the [@source](https://github.com/source) expansion limit ([21010a6](https://github.com/0Miles/StetCSS/commit/21010a6bfe919f6fbb41f5ddcfbf46532870de33)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** explain an undeclared mode in [@variant](https://github.com/variant) light and [@variant](https://github.com/variant) dark ([3740da5](https://github.com/0Miles/StetCSS/commit/3740da5f1e5e3cbc9e99e00ce6dfc93ce691c14b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **compiler:** keep a cached reference only when no file it read changed around the compile ([f513dc7](https://github.com/0Miles/StetCSS/commit/f513dc7e400eac8bb510b5d80c308de0dd1b9c82)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** keep breakpoint and container token values as written ([25e0baf](https://github.com/0Miles/StetCSS/commit/25e0baf28e2e01b0b02b8b3c98796cf3c42e0e65))
* **compiler:** keep kept-import conditions and declare each layer once ([6dc56cb](https://github.com/0Miles/StetCSS/commit/6dc56cb94f94f0e52f3070108ee2b56778a5d0c1)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** keep native fallback declarations in entry CSS ([7059c45](https://github.com/0Miles/StetCSS/commit/7059c4548692fd6475e80102839a0738ed3ce979)), closes [#163](https://github.com/0Miles/StetCSS/issues/163)
* **compiler:** keep native statements beside [@compose](https://github.com/compose) rules in a native at-rule block ([4913df9](https://github.com/0Miles/StetCSS/commit/4913df944d5f3d22152550bcde54ca9fdcc8a6a3)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** keep preset modes implicit and require a declared default-mode ([df6d99f](https://github.com/0Miles/StetCSS/commit/df6d99f3c3e273761038ab72173fa868e02bd7fa)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **compiler:** keep relative [@import](https://github.com/import) conditions and the written layer order ([54b3e30](https://github.com/0Miles/StetCSS/commit/54b3e307bffcc5f49a638209aee8c2431d2fd1c3)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** name stet.css as the placeholder file in compiler errors ([43147a1](https://github.com/0Miles/StetCSS/commit/43147a14bb0d2395c062032e5661391c5b8b4ab1)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **compiler:** name the entry in the removed [@preserve](https://github.com/preserve) error ([287597f](https://github.com/0Miles/StetCSS/commit/287597fb79a922a4a6ed09abe88a34df5bf1981e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **compiler:** name the reference chain in the [@reference](https://github.com/reference) limit error ([b3285de](https://github.com/0Miles/StetCSS/commit/b3285dea70ea3fe07cb628b4e5ab75cd9fdbc7df))
* **compiler:** order component query blocks with the engine's query length helper ([afa164e](https://github.com/0Miles/StetCSS/commit/afa164efc35e32e00baa1f2fe6ced514fac81c22)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** read a mode inside an & list in [@variant](https://github.com/variant) as the mode ([9eaf136](https://github.com/0Miles/StetCSS/commit/9eaf136e03eb2073427585b490a6239b71f7b6e6)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **compiler:** read directives and values after escaped quotes outside strings ([a840fe5](https://github.com/0Miles/StetCSS/commit/a840fe5ac3ed899a96b0a52d5d96d4f910b5d6ef)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **compiler:** reject [@source](https://github.com/source) patterns that expand past 1024 globs ([97a6feb](https://github.com/0Miles/StetCSS/commit/97a6febd5af1bbb8ed7ab2edb32db7639d0a6149)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** reject a mode [@variant](https://github.com/variant) cannot express in a condition list ([6119740](https://github.com/0Miles/StetCSS/commit/6119740ef7c696252ded2a547328f15f9907163b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **compiler:** reject CSS nested past 64 levels before lightningcss parses it ([4095d37](https://github.com/0Miles/StetCSS/commit/4095d37c87ea96e89fef7714255f33cb267be242))
* **compiler:** reject statements under [@variant](https://github.com/variant) that nothing would emit ([080d6d8](https://github.com/0Miles/StetCSS/commit/080d6d841d5e3c9ef64d25a3f3a0850697b53286)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **compiler:** write --alpha() numeric percentages without float error ([2294162](https://github.com/0Miles/StetCSS/commit/229416203173904bbcbb0e33b624ca5cf5349e8d)), closes [#166](https://github.com/0Miles/StetCSS/issues/166)
* **engine,compiler:** lead with the media type inside one condition token ([b1e7f3a](https://github.com/0Miles/StetCSS/commit/b1e7f3aea9f6307893b9b15bcc28a8a40b9fe13b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **engine:** output query numbers as written ([02119ab](https://github.com/0Miles/StetCSS/commit/02119ab0321bccb732d554bbd63bbb5398c16ff1))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Performance Improvements

* **compiler:** check each stylesheet for [@master](https://github.com/master) once per import-graph reader ([28dba5b](https://github.com/0Miles/StetCSS/commit/28dba5bf1dbdbaaf3c25576acea18b5a21c52ecb)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** check native fallback overrides against one covered-property set ([4e6abca](https://github.com/0Miles/StetCSS/commit/4e6abca4f9958ba006b7210c12d0c525a9ee9eb5))
* **compiler:** compile a referenced stylesheet once for every stylesheet that references it ([4bdb0b8](https://github.com/0Miles/StetCSS/commit/4bdb0b8e2f078ad08115b6ff8970551c218de55b)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** scan native CSS for $aliases in linear time ([9ca28fd](https://github.com/0Miles/StetCSS/commit/9ca28fd3391c625d96e36f5e4291734d81800693))


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **language:** imports of `syntaxes/master-css.tmLanguage.json`, theme rules targeting `*.master-css` scopes, and ```master-css fences no longer match.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **language:** rename the TextMate grammar and its scopes to stet-css ([4e3296b](https://github.com/0Miles/StetCSS/commit/4e3296b42a3253dc5ad86e8ac57823d872a286d9)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** cap [@reference](https://github.com/reference) expansion at 256 per compile ([0ff66c3](https://github.com/0Miles/StetCSS/commit/0ff66c306942758aaa5caf18cec187657ee21c76))
* **compiler:** count every brace form in the [@source](https://github.com/source) expansion limit ([21010a6](https://github.com/0Miles/StetCSS/commit/21010a6bfe919f6fbb41f5ddcfbf46532870de33)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** explain an undeclared mode in [@variant](https://github.com/variant) light and [@variant](https://github.com/variant) dark ([3740da5](https://github.com/0Miles/StetCSS/commit/3740da5f1e5e3cbc9e99e00ce6dfc93ce691c14b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **compiler:** keep preset modes implicit and require a declared default-mode ([df6d99f](https://github.com/0Miles/StetCSS/commit/df6d99f3c3e273761038ab72173fa868e02bd7fa)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **compiler:** name stet.css as the placeholder file in compiler errors ([43147a1](https://github.com/0Miles/StetCSS/commit/43147a14bb0d2395c062032e5661391c5b8b4ab1)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **compiler:** name the entry in the removed [@preserve](https://github.com/preserve) error ([287597f](https://github.com/0Miles/StetCSS/commit/287597fb79a922a4a6ed09abe88a34df5bf1981e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **compiler:** name the reference chain in the [@reference](https://github.com/reference) limit error ([b3285de](https://github.com/0Miles/StetCSS/commit/b3285dea70ea3fe07cb628b4e5ab75cd9fdbc7df))
* **compiler:** read a mode inside an & list in [@variant](https://github.com/variant) as the mode ([9eaf136](https://github.com/0Miles/StetCSS/commit/9eaf136e03eb2073427585b490a6239b71f7b6e6)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **compiler:** reject [@source](https://github.com/source) patterns that expand past 1024 globs ([97a6feb](https://github.com/0Miles/StetCSS/commit/97a6febd5af1bbb8ed7ab2edb32db7639d0a6149)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** reject a mode [@variant](https://github.com/variant) cannot express in a condition list ([6119740](https://github.com/0Miles/StetCSS/commit/6119740ef7c696252ded2a547328f15f9907163b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* **compiler:** reject CSS nested past 64 levels before lightningcss parses it ([4095d37](https://github.com/0Miles/StetCSS/commit/4095d37c87ea96e89fef7714255f33cb267be242))
* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **engine,compiler:** lead with the media type inside one condition token ([b1e7f3a](https://github.com/0Miles/StetCSS/commit/b1e7f3aea9f6307893b9b15bcc28a8a40b9fe13b)), closes [#72](https://github.com/0Miles/StetCSS/issues/72)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **compiler:** check each stylesheet for [@master](https://github.com/master) once per import-graph reader ([28dba5b](https://github.com/0Miles/StetCSS/commit/28dba5bf1dbdbaaf3c25576acea18b5a21c52ecb)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
