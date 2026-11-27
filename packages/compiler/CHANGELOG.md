# Changelog

## [0.4.0](https://github.com/0Miles/StetCSS/compare/compiler-v0.3.0...compiler-v0.4.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* **compiler:** --breakpoint-* and --container-* tokens are output as written. A px token now yields a px query (768px, not 48rem); a unitless token is output unitless and no longer matches, so write a unit:
* **engine:** unitless lengths in query classes are no longer converted to rem. Write the unit: @>=768 -> @>=768px (or @>=48rem), @container(width>=400) -> @container(width>=400px).
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

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** report each stylesheet a compile reaches through onDependency ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([c75a457](https://github.com/0Miles/StetCSS/commit/c75a457d7c665f116548befee701236672b6cdaa))
* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **language:** rename the TextMate grammar and its scopes to stet-css ([4e3296b](https://github.com/0Miles/StetCSS/commit/4e3296b42a3253dc5ad86e8ac57823d872a286d9)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler,stylesheet,language-server:** close review 4 findings on unquoted directive arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([8431226](https://github.com/0Miles/StetCSS/commit/8431226384e58ca9e811317d7f301467451e935f))
* **compiler,stylesheet:** check directive arguments only in StetCSS graphs and echo only plain ones ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([4a8acd9](https://github.com/0Miles/StetCSS/commit/4a8acd95273c3ecaa92ef1128b087d1d8820247d))
* **compiler,stylesheet:** keep unquoted-argument errors faithful and surfaced ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([daab770](https://github.com/0Miles/StetCSS/commit/daab77086f7d83721851f6b4fc714861457d70d1))
* **compiler:** accept native syntax css-tree 3.2.1 rejects ([cc8aad3](https://github.com/0Miles/StetCSS/commit/cc8aad30ca5a5cee6e4e2371555c1a2b31b714c2)), closes [#164](https://github.com/0Miles/StetCSS/issues/164)
* **compiler:** accept only length units in breakpoint and container tokens ([8e2e72b](https://github.com/0Miles/StetCSS/commit/8e2e72b33da43ded8b3636aca4a3225c599a5090)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** apply mode and [@variant](https://github.com/variant) wrappers and selector aliases to each list item ([535c63d](https://github.com/0Miles/StetCSS/commit/535c63d4efd1fb39d079ac49fb1b766e62f8d01d)), closes [#176](https://github.com/0Miles/StetCSS/issues/176)
* **compiler:** expand selector aliases in [@custom-variant](https://github.com/custom-variant) selectors for classes ([#247](https://github.com/0Miles/StetCSS/issues/247)) ([20b7c61](https://github.com/0Miles/StetCSS/commit/20b7c61d7c393544b0887f7f92eeef8d08658c2f))
* **compiler:** fail on unquoted [@source](https://github.com/source), [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([85ea14f](https://github.com/0Miles/StetCSS/commit/85ea14f07f892c321a609e33682d45caea84c2e8))
* **compiler:** keep a cached reference only when no file it read changed around the compile ([f513dc7](https://github.com/0Miles/StetCSS/commit/f513dc7e400eac8bb510b5d80c308de0dd1b9c82)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** keep an :of() alias's text inside :host() and ::slotted() ([#235](https://github.com/0Miles/StetCSS/issues/235)) ([7932b92](https://github.com/0Miles/StetCSS/commit/7932b92c8e11c6a347e207b7745a7aa321c9863e))
* **compiler:** keep an escaped space inside an [@theme](https://github.com/theme) mode name ([#249](https://github.com/0Miles/StetCSS/issues/249)) ([61cba15](https://github.com/0Miles/StetCSS/commit/61cba15b63e5785470f01452dd5bba7147fd427c))
* **compiler:** keep breakpoint and container token values as written ([25e0baf](https://github.com/0Miles/StetCSS/commit/25e0baf28e2e01b0b02b8b3c98796cf3c42e0e65))
* **compiler:** keep fallback declarations in native [@keyframes](https://github.com/keyframes) blocks ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([23ee950](https://github.com/0Miles/StetCSS/commit/23ee950bc6e76a3cc94ab91e46484d3f92dcd3b8))
* **compiler:** keep fallback declarations in rules lowered by [@compose](https://github.com/compose) ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([8647373](https://github.com/0Miles/StetCSS/commit/8647373c1965a4b268b5eea38643a89af7c551d0))
* **compiler:** keep kept-import conditions and declare each layer once ([6dc56cb](https://github.com/0Miles/StetCSS/commit/6dc56cb94f94f0e52f3070108ee2b56778a5d0c1)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** keep native fallback declarations in entry CSS ([7059c45](https://github.com/0Miles/StetCSS/commit/7059c4548692fd6475e80102839a0738ed3ce979)), closes [#163](https://github.com/0Miles/StetCSS/issues/163)
* **compiler:** keep native statements beside [@compose](https://github.com/compose) rules in a native at-rule block ([4913df9](https://github.com/0Miles/StetCSS/commit/4913df944d5f3d22152550bcde54ca9fdcc8a6a3)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** keep ratio values in queries nested in compiled blocks ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([e5ff0fa](https://github.com/0Miles/StetCSS/commit/e5ff0fa720a80b9b743a51c2df895d80b9a37e0d))
* **compiler:** keep relative [@import](https://github.com/import) conditions and the written layer order ([54b3e30](https://github.com/0Miles/StetCSS/commit/54b3e307bffcc5f49a638209aee8c2431d2fd1c3)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** leave escaped `&` and `&` in strings out of nesting replacement ([#245](https://github.com/0Miles/StetCSS/issues/245)) ([0c8ad68](https://github.com/0Miles/StetCSS/commit/0c8ad68e8e27815d024b0434d76f5612062e7994))
* **compiler:** name stet.css as the placeholder file in compiler errors ([43147a1](https://github.com/0Miles/StetCSS/commit/43147a14bb0d2395c062032e5661391c5b8b4ab1)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **compiler:** name the entry in the removed [@preserve](https://github.com/preserve) error ([287597f](https://github.com/0Miles/StetCSS/commit/287597fb79a922a4a6ed09abe88a34df5bf1981e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **compiler:** order component query blocks with the engine's query length helper ([afa164e](https://github.com/0Miles/StetCSS/commit/afa164efc35e32e00baa1f2fe6ced514fac81c22)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** order the reference cache test's save after the compile start on the file system clock ([fbd3f8d](https://github.com/0Miles/StetCSS/commit/fbd3f8dd599645c2a1025388cc3832a47a976687))
* **compiler:** print sibling keyframes as written and clear replaced fallbacks ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([6a27052](https://github.com/0Miles/StetCSS/commit/6a270521bb91899dd65332e493e7a41f8b28f1f7))
* **compiler:** put an :of() selector alias's ancestor before the nested selector ([#235](https://github.com/0Miles/StetCSS/issues/235)) ([eee1d39](https://github.com/0Miles/StetCSS/commit/eee1d39ea3c3986e5d521b630c23ab632b7b3725))
* **compiler:** range media and container features apart like the engine ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([4cc8333](https://github.com/0Miles/StetCSS/commit/4cc8333c0029f07f9131cd43732c72213c875c55))
* **compiler:** read directives and values after escaped quotes outside strings ([a840fe5](https://github.com/0Miles/StetCSS/commit/a840fe5ac3ed899a96b0a52d5d96d4f910b5d6ef)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **compiler:** reject statements under [@variant](https://github.com/variant) that nothing would emit ([080d6d8](https://github.com/0Miles/StetCSS/commit/080d6d841d5e3c9ef64d25a3f3a0850697b53286)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** sort component query blocks with the engine's comparison ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([f582e82](https://github.com/0Miles/StetCSS/commit/f582e822f33a7ce5a9c8ad47a8f202873519b12a))
* **compiler:** take [@source](https://github.com/source) not only when the compile reads it as one word ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([10a2240](https://github.com/0Miles/StetCSS/commit/10a22400e3374fd56149a9498ab46c82e8c06bba))
* **compiler:** write --alpha() numeric percentages without float error ([2294162](https://github.com/0Miles/StetCSS/commit/229416203173904bbcbb0e33b624ca5cf5349e8d)), closes [#166](https://github.com/0Miles/StetCSS/issues/166)
* **engine:** output query numbers as written ([02119ab](https://github.com/0Miles/StetCSS/commit/02119ab0321bccb732d554bbd63bbb5398c16ff1))
* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **stylesheet:** declare the layers written before @stet-css/core ahead of the preset layers ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([4208c4b](https://github.com/0Miles/StetCSS/commit/4208c4b8522f6fa5b8b1057f127868758f85dd6f))
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Performance Improvements

* **compiler:** check each stylesheet for [@master](https://github.com/master) once per import-graph reader ([28dba5b](https://github.com/0Miles/StetCSS/commit/28dba5bf1dbdbaaf3c25576acea18b5a21c52ecb)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **compiler:** check native fallback overrides against one covered-property set ([4e6abca](https://github.com/0Miles/StetCSS/commit/4e6abca4f9958ba006b7210c12d0c525a9ee9eb5))
* **compiler:** compile a referenced stylesheet once for every stylesheet that references it ([4bdb0b8](https://github.com/0Miles/StetCSS/commit/4bdb0b8e2f078ad08115b6ff8970551c218de55b)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** scan native CSS for $aliases in linear time ([9ca28fd](https://github.com/0Miles/StetCSS/commit/9ca28fd3391c625d96e36f5e4291734d81800693))


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

## [0.3.0](https://github.com/0Miles/StetCSS/compare/compiler-v0.2.0...compiler-v0.3.0) (2026-11-26)


### Bug Fixes

* **compiler,stylesheet,language-server:** close review 4 findings on unquoted directive arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([8431226](https://github.com/0Miles/StetCSS/commit/8431226384e58ca9e811317d7f301467451e935f))
* **compiler,stylesheet:** check directive arguments only in StetCSS graphs and echo only plain ones ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([4a8acd9](https://github.com/0Miles/StetCSS/commit/4a8acd95273c3ecaa92ef1128b087d1d8820247d))
* **compiler,stylesheet:** keep unquoted-argument errors faithful and surfaced ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([daab770](https://github.com/0Miles/StetCSS/commit/daab77086f7d83721851f6b4fc714861457d70d1))
* **compiler:** fail on unquoted [@source](https://github.com/source), [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) arguments ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([85ea14f](https://github.com/0Miles/StetCSS/commit/85ea14f07f892c321a609e33682d45caea84c2e8))
* **compiler:** take [@source](https://github.com/source) not only when the compile reads it as one word ([#239](https://github.com/0Miles/StetCSS/issues/239)) ([10a2240](https://github.com/0Miles/StetCSS/commit/10a22400e3374fd56149a9498ab46c82e8c06bba))
* **stylesheet:** declare the layers written before @stet-css/core ahead of the preset layers ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([4208c4b](https://github.com/0Miles/StetCSS/commit/4208c4b8522f6fa5b8b1057f127868758f85dd6f))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/compiler-v0.1.0...compiler-v0.2.0) (2026-11-26)


### ⚠ BREAKING CHANGES

* **compiler:** --breakpoint-* and --container-* tokens are output as written. A px token now yields a px query (768px, not 48rem); a unitless token is output unitless and no longer matches, so write a unit:
* **engine:** unitless lengths in query classes are no longer converted to rem. Write the unit: @>=768 -> @>=768px (or @>=48rem), @container(width>=400) -> @container(width>=400px).

### Features

* **compiler:** report each stylesheet a compile reaches through onDependency ([#248](https://github.com/0Miles/StetCSS/issues/248)) ([c75a457](https://github.com/0Miles/StetCSS/commit/c75a457d7c665f116548befee701236672b6cdaa))


### Bug Fixes

* **compiler:** accept native syntax css-tree 3.2.1 rejects ([cc8aad3](https://github.com/0Miles/StetCSS/commit/cc8aad30ca5a5cee6e4e2371555c1a2b31b714c2)), closes [#164](https://github.com/0Miles/StetCSS/issues/164)
* **compiler:** accept only length units in breakpoint and container tokens ([8e2e72b](https://github.com/0Miles/StetCSS/commit/8e2e72b33da43ded8b3636aca4a3225c599a5090)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** apply mode and [@variant](https://github.com/variant) wrappers and selector aliases to each list item ([535c63d](https://github.com/0Miles/StetCSS/commit/535c63d4efd1fb39d079ac49fb1b766e62f8d01d)), closes [#176](https://github.com/0Miles/StetCSS/issues/176)
* **compiler:** expand selector aliases in [@custom-variant](https://github.com/custom-variant) selectors for classes ([#247](https://github.com/0Miles/StetCSS/issues/247)) ([20b7c61](https://github.com/0Miles/StetCSS/commit/20b7c61d7c393544b0887f7f92eeef8d08658c2f))
* **compiler:** keep a cached reference only when no file it read changed around the compile ([f513dc7](https://github.com/0Miles/StetCSS/commit/f513dc7e400eac8bb510b5d80c308de0dd1b9c82)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** keep an :of() alias's text inside :host() and ::slotted() ([#235](https://github.com/0Miles/StetCSS/issues/235)) ([7932b92](https://github.com/0Miles/StetCSS/commit/7932b92c8e11c6a347e207b7745a7aa321c9863e))
* **compiler:** keep an escaped space inside an [@theme](https://github.com/theme) mode name ([#249](https://github.com/0Miles/StetCSS/issues/249)) ([61cba15](https://github.com/0Miles/StetCSS/commit/61cba15b63e5785470f01452dd5bba7147fd427c))
* **compiler:** keep breakpoint and container token values as written ([25e0baf](https://github.com/0Miles/StetCSS/commit/25e0baf28e2e01b0b02b8b3c98796cf3c42e0e65))
* **compiler:** keep fallback declarations in native [@keyframes](https://github.com/keyframes) blocks ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([23ee950](https://github.com/0Miles/StetCSS/commit/23ee950bc6e76a3cc94ab91e46484d3f92dcd3b8))
* **compiler:** keep fallback declarations in rules lowered by [@compose](https://github.com/compose) ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([8647373](https://github.com/0Miles/StetCSS/commit/8647373c1965a4b268b5eea38643a89af7c551d0))
* **compiler:** keep kept-import conditions and declare each layer once ([6dc56cb](https://github.com/0Miles/StetCSS/commit/6dc56cb94f94f0e52f3070108ee2b56778a5d0c1)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** keep native fallback declarations in entry CSS ([7059c45](https://github.com/0Miles/StetCSS/commit/7059c4548692fd6475e80102839a0738ed3ce979)), closes [#163](https://github.com/0Miles/StetCSS/issues/163)
* **compiler:** keep native statements beside [@compose](https://github.com/compose) rules in a native at-rule block ([4913df9](https://github.com/0Miles/StetCSS/commit/4913df944d5f3d22152550bcde54ca9fdcc8a6a3)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** keep ratio values in queries nested in compiled blocks ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([e5ff0fa](https://github.com/0Miles/StetCSS/commit/e5ff0fa720a80b9b743a51c2df895d80b9a37e0d))
* **compiler:** keep relative [@import](https://github.com/import) conditions and the written layer order ([54b3e30](https://github.com/0Miles/StetCSS/commit/54b3e307bffcc5f49a638209aee8c2431d2fd1c3)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **compiler:** leave escaped `&` and `&` in strings out of nesting replacement ([#245](https://github.com/0Miles/StetCSS/issues/245)) ([0c8ad68](https://github.com/0Miles/StetCSS/commit/0c8ad68e8e27815d024b0434d76f5612062e7994))
* **compiler:** order component query blocks with the engine's query length helper ([afa164e](https://github.com/0Miles/StetCSS/commit/afa164efc35e32e00baa1f2fe6ced514fac81c22)), closes [#161](https://github.com/0Miles/StetCSS/issues/161)
* **compiler:** order the reference cache test's save after the compile start on the file system clock ([fbd3f8d](https://github.com/0Miles/StetCSS/commit/fbd3f8dd599645c2a1025388cc3832a47a976687))
* **compiler:** print sibling keyframes as written and clear replaced fallbacks ([#242](https://github.com/0Miles/StetCSS/issues/242)) ([6a27052](https://github.com/0Miles/StetCSS/commit/6a270521bb91899dd65332e493e7a41f8b28f1f7))
* **compiler:** put an :of() selector alias's ancestor before the nested selector ([#235](https://github.com/0Miles/StetCSS/issues/235)) ([eee1d39](https://github.com/0Miles/StetCSS/commit/eee1d39ea3c3986e5d521b630c23ab632b7b3725))
* **compiler:** range media and container features apart like the engine ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([4cc8333](https://github.com/0Miles/StetCSS/commit/4cc8333c0029f07f9131cd43732c72213c875c55))
* **compiler:** read directives and values after escaped quotes outside strings ([a840fe5](https://github.com/0Miles/StetCSS/commit/a840fe5ac3ed899a96b0a52d5d96d4f910b5d6ef)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **compiler:** reject statements under [@variant](https://github.com/variant) that nothing would emit ([080d6d8](https://github.com/0Miles/StetCSS/commit/080d6d841d5e3c9ef64d25a3f3a0850697b53286)), closes [#187](https://github.com/0Miles/StetCSS/issues/187)
* **compiler:** sort component query blocks with the engine's comparison ([#233](https://github.com/0Miles/StetCSS/issues/233)) ([f582e82](https://github.com/0Miles/StetCSS/commit/f582e822f33a7ce5a9c8ad47a8f202873519b12a))
* **compiler:** write --alpha() numeric percentages without float error ([2294162](https://github.com/0Miles/StetCSS/commit/229416203173904bbcbb0e33b624ca5cf5349e8d)), closes [#166](https://github.com/0Miles/StetCSS/issues/166)
* **engine:** output query numbers as written ([02119ab](https://github.com/0Miles/StetCSS/commit/02119ab0321bccb732d554bbd63bbb5398c16ff1))
* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Performance Improvements

* **compiler:** check native fallback overrides against one covered-property set ([4e6abca](https://github.com/0Miles/StetCSS/commit/4e6abca4f9958ba006b7210c12d0c525a9ee9eb5))
* **compiler:** compile a referenced stylesheet once for every stylesheet that references it ([4bdb0b8](https://github.com/0Miles/StetCSS/commit/4bdb0b8e2f078ad08115b6ff8970551c218de55b)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)
* **compiler:** scan native CSS for $aliases in linear time ([9ca28fd](https://github.com/0Miles/StetCSS/commit/9ca28fd3391c625d96e36f5e4291734d81800693))

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
