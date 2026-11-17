# Changelog

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

* **language:** renamed names (old -> new):
    - FormatMasterCSSDirectivesOptions -> FormatStetCSSDirectivesOptions
    - MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP -> STET_CSS_SEMANTIC_TOKEN_SCOPE_MAP
    - MASTER_CSS_SHIKI_INJECT_TO -> STET_CSS_SHIKI_INJECT_TO
    - MASTER_CSS_SHIKI_SCOPE_NAME -> STET_CSS_SHIKI_SCOPE_NAME
    - MASTER_CSS_TEXTMATE_GRAMMAR -> STET_CSS_TEXTMATE_GRAMMAR
    - MasterCSSConstructor -> StetCSSConstructor
    - MasterCSSDirectiveFormatEdit -> StetCSSDirectiveFormatEdit
    - MasterCSSSemanticTokenScopeKey -> StetCSSSemanticTokenScopeKey
    - MasterCSSShikiDecoration -> StetCSSShikiDecoration
    - MasterCSSShikiHighlightRoleStyleKey -> StetCSSShikiHighlightRoleStyleKey
    - MasterCSSShikiHighlightRoleStyles -> StetCSSShikiHighlightRoleStyles
    - MasterCSSShikiOptions -> StetCSSShikiOptions
    - MasterCSSShikiSemanticTokenStyle -> StetCSSShikiSemanticTokenStyle
    - MasterCSSShikiSemanticTokenStyleKey -> StetCSSShikiSemanticTokenStyleKey
    - MasterCSSShikiSemanticTokenStyles -> StetCSSShikiSemanticTokenStyles
    - MasterCSSTextMateGrammar -> StetCSSTextMateGrammar
    - applyMasterCSSDirectiveFormatEdits -> applyStetCSSDirectiveFormatEdits
    - createMasterCSSShikiDecorations -> createStetCSSShikiDecorations
    - createMasterCSSShikiLanguageRegistration -> createStetCSSShikiLanguageRegistration
    - formatMasterCSSClassList -> formatStetCSSClassList
    - formatMasterCSSDirectives -> formatStetCSSDirectives
    - getMasterCSSSemanticTokenScopeKeys -> getStetCSSSemanticTokenScopeKeys
    - getMasterCSSShikiLanguageId -> getStetCSSShikiLanguageId
    - isMasterCSSClassListLanguage -> isStetCSSClassListLanguage
    - isMasterCSSShikiSupportedLanguage -> isStetCSSShikiSupportedLanguage
    - isMasterVariableStart -> isStetVariableStart
    - masterCSSClassListLanguageIds -> stetCSSClassListLanguageIds
    - masterCSSShikiLanguage -> stetCSSShikiLanguage
    - masterCSSShikiLanguages -> stetCSSShikiLanguages
    - masterCSSShikiSupportedLanguageIds -> stetCSSShikiSupportedLanguageIds
    - masterCSSTextMateGrammar -> stetCSSTextMateGrammar
    - readMasterVariable -> readStetVariable
    - tokenizeMasterCSSValueSyntax -> tokenizeStetCSSValueSyntax
    - transformerMasterCSS -> transformerStetCSS
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
* **language:** stop treating @master as a directive in editor tooling

### Features

* **language:** let a runtime supply the rules editor features show ([9cd9ef5](https://github.com/0Miles/StetCSS/commit/9cd9ef5c460b692b89c8c9a9be2c12c9b6dfc175)), closes [#82](https://github.com/0Miles/StetCSS/issues/82)
* **language:** rename the TextMate grammar and its scopes to stet-css ([4e3296b](https://github.com/0Miles/StetCSS/commit/4e3296b42a3253dc5ad86e8ac57823d872a286d9)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)


### Bug Fixes

* **language,language-service:** skip a class using an undeclared mode in generated docs ([b92e231](https://github.com/0Miles/StetCSS/commit/b92e2318cc1084184cdd98d8da5b2d9969c8f282)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **language:** mirror the bounded parse thread and guard the copy ([46a26b6](https://github.com/0Miles/StetCSS/commit/46a26b66fd08bb4f4e3f22aed70ad0c135ae9cd8)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** mirror the prescan move and guard it with dense brackets ([6f45447](https://github.com/0Miles/StetCSS/commit/6f45447632bc112ac22226378366d92dd393d017)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** scan JS/TS documents on a stack sized to the source ([4efd746](https://github.com/0Miles/StetCSS/commit/4efd7465d99eb309a4927c2d548960288ed7bf2c)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **language:** rename MasterCSS Shiki, TextMate, formatter and class-list names to StetCSS ([412ffcb](https://github.com/0Miles/StetCSS/commit/412ffcb9e2566228481d63f6dc814337ab56608d))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
