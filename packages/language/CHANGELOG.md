# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-v0.1.0...language-v0.2.0) (2026-11-26)


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
* **language:** mark class positions inside JavaScript strings ([c4eccca](https://github.com/0Miles/StetCSS/commit/c4eccca88836d659ce7a36c27f3d885a479e168d)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **language:** rename the TextMate grammar and its scopes to stet-css ([4e3296b](https://github.com/0Miles/StetCSS/commit/4e3296b42a3253dc5ad86e8ac57823d872a286d9)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **language:** skip ignored object keys when reading class positions ([90585e9](https://github.com/0Miles/StetCSS/commit/90585e97ade069fbe435d5214041d5cb735b8458))
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)


### Bug Fixes

* **engine:** keep an escaped `@` in a class selector ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([312d427](https://github.com/0Miles/StetCSS/commit/312d427c708be3f8d906cb44cd3ae9cb340f22ce))
* **language,language-service:** skip a class using an undeclared mode in generated docs ([b92e231](https://github.com/0Miles/StetCSS/commit/b92e2318cc1084184cdd98d8da5b2d9969c8f282)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **language:** bound class contexts at runtime expressions ([ee87b39](https://github.com/0Miles/StetCSS/commit/ee87b39f93b004a58345f4a0eac96116051f9ebb)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **language:** colour an attribute case flag like native CSS ([#237](https://github.com/0Miles/StetCSS/issues/237)) ([c4fab72](https://github.com/0Miles/StetCSS/commit/c4fab7254d842883ce980966f35f35f6bdf3175a))
* **language:** colour class attribute selectors, an+b and strings like native CSS ([0986498](https://github.com/0Miles/StetCSS/commit/098649846485925fc8dc799bd18d30091fc1b41a)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** colour directive @, [@variant](https://github.com/variant) names and class strings in the grammar ([d019bf2](https://github.com/0Miles/StetCSS/commit/d019bf266caefec29d06e5db5889b3b16c26233d)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** colour selector punctuation, @ and class strings like native CSS in every theme ([5dd7063](https://github.com/0Miles/StetCSS/commit/5dd70633c83fd0e0029af8d986f082aeb01e5795)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** end [@compose](https://github.com/compose) highlighting at the closing brace of its rule ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([814e065](https://github.com/0Miles/StetCSS/commit/814e06533fa7916ebb41ab2b268efe9395147973))
* **language:** find classList calls on a member chain in script files ([cd08b63](https://github.com/0Miles/StetCSS/commit/cd08b636eec33e27dd825a1b587cb0d1ff1bdf1f)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **language:** highlight value syntax after escaped quotes outside strings ([f134c3a](https://github.com/0Miles/StetCSS/commit/f134c3a05394c96aeb8cc706ea0a66d97cd29718)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **language:** parse JSX in javascript documents and .js, .mjs and .cjs files ([56a92f2](https://github.com/0Miles/StetCSS/commit/56a92f221c5acb66a3488f641fc2712d996c4c73)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **language:** place embedded class tokens at raw offsets past escapes ([ce8b47b](https://github.com/0Miles/StetCSS/commit/ce8b47bc88eb0cffa28864206f09867f5962d0a9)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** split class lists on ASCII whitespace only ([c74f9ff](https://github.com/0Miles/StetCSS/commit/c74f9ff85a91516c6ac04d741a54d2ae15a37fe8)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **lexer:** colour an escaped selector name as one name ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([c31ecbf](https://github.com/0Miles/StetCSS/commit/c31ecbf41ffa5157a599016c0d4b06203a750aec))
* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* **lexer:** keep the space before a block's closing brace out of an unterminated directive ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([67c6c71](https://github.com/0Miles/StetCSS/commit/67c6c717d5d44eb77f14047959997851f1b4d46a))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **source:** accept a top-level return in Astro frontmatter ([1b66de9](https://github.com/0Miles/StetCSS/commit/1b66de9db6877856d327bd53186ece93237cad87)), closes [#191](https://github.com/0Miles/StetCSS/issues/191)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **language:** rename MasterCSS Shiki, TextMate, formatter and class-list names to StetCSS ([412ffcb](https://github.com/0Miles/StetCSS/commit/412ffcb9e2566228481d63f6dc814337ab56608d))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))

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
