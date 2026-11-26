# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/language-service-v0.2.0...language-service-v0.3.0) (2026-11-26)


### Bug Fixes

* **language:** decode class attributes only where the build does ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([4507dd2](https://github.com/0Miles/StetCSS/commit/4507dd298fe7b21f45e9e8f5eeaeefc98e480880))
* **language:** read class attributes by the classes the build extracts ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([fc57533](https://github.com/0Miles/StetCSS/commit/fc575336fb952e3062b440dc271e09225ee70651))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-service-v0.1.0...language-service-v0.2.0) (2026-11-26)


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
* **vscode:** settings written under `masterCSS.*` and LSP clients sending `masterCSS` settings are no longer read.
* **language:** stop treating @master as a directive in editor tooling

### Features

* **language-service:** export collectSFCStyleBlocks for SFC style content offsets ([48fcaf8](https://github.com/0Miles/StetCSS/commit/48fcaf810b1c6bacaa1a8519e6c0d6b434056840)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language:** let a runtime supply the rules editor features show ([9cd9ef5](https://github.com/0Miles/StetCSS/commit/9cd9ef5c460b692b89c8c9a9be2c12c9b6dfc175)), closes [#82](https://github.com/0Miles/StetCSS/issues/82)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **vscode:** rename editor settings, commands and LSP methods to stetCSS ([70dfcd1](https://github.com/0Miles/StetCSS/commit/70dfcd14f96bed7efe19f4a4d7c4bbce329e72dd)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **language-service:** clamp document color channels to the LSP 0..1 range ([71ed9c4](https://github.com/0Miles/StetCSS/commit/71ed9c49236990bef89088919e65d604754a7084)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language-service:** end the SFC style opening tag after quoted attributes ([c337914](https://github.com/0Miles/StetCSS/commit/c337914316772925f7d803397e6f274c86ba8c39)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language-service:** format SFC style content, not an opening-tag attribute ([aabc91f](https://github.com/0Miles/StetCSS/commit/aabc91f1f175fb115270d003a653781dd8779e07)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language,language-service:** skip a class using an undeclared mode in generated docs ([b92e231](https://github.com/0Miles/StetCSS/commit/b92e2318cc1084184cdd98d8da5b2d9969c8f282)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **language:** colour class attribute selectors, an+b and strings like native CSS ([0986498](https://github.com/0Miles/StetCSS/commit/098649846485925fc8dc799bd18d30091fc1b41a)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** colour selector punctuation, @ and class strings like native CSS in every theme ([5dd7063](https://github.com/0Miles/StetCSS/commit/5dd70633c83fd0e0029af8d986f082aeb01e5795)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **language:** rename MasterCSS Shiki, TextMate, formatter and class-list names to StetCSS ([412ffcb](https://github.com/0Miles/StetCSS/commit/412ffcb9e2566228481d63f6dc814337ab56608d))
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
* **vscode:** settings written under `masterCSS.*` and LSP clients sending `masterCSS` settings are no longer read.
* **language:** stop treating @master as a directive in editor tooling
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **language:** let a runtime supply the rules editor features show ([9cd9ef5](https://github.com/0Miles/StetCSS/commit/9cd9ef5c460b692b89c8c9a9be2c12c9b6dfc175)), closes [#82](https://github.com/0Miles/StetCSS/issues/82)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **vscode:** rename editor settings, commands and LSP methods to stetCSS ([70dfcd1](https://github.com/0Miles/StetCSS/commit/70dfcd14f96bed7efe19f4a4d7c4bbce329e72dd)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **language,language-service:** skip a class using an undeclared mode in generated docs ([b92e231](https://github.com/0Miles/StetCSS/commit/b92e2318cc1084184cdd98d8da5b2d9969c8f282)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **language:** rename MasterCSS Shiki, TextMate, formatter and class-list names to StetCSS ([412ffcb](https://github.com/0Miles/StetCSS/commit/412ffcb9e2566228481d63f6dc814337ab56608d))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
