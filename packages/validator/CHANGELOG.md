# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/validator-v0.1.0...validator-v0.2.0) (2026-11-26)


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
* @stet-css/server and its render(), renderCSS() and related exports no longer exist.

### Bug Fixes

* **engine:** keep an escaped `@` in a class selector ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([312d427](https://github.com/0Miles/StetCSS/commit/312d427c708be3f8d906cb44cd3ae9cb340f22ce))
* **engine:** keep splitting conditions at every `@` ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([4e7bcd6](https://github.com/0Miles/StetCSS/commit/4e7bcd6ad3901b30ac6ade6ba8120f252bfe6592))
* **lexer:** colour an escaped selector name as one name ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([c31ecbf](https://github.com/0Miles/StetCSS/commit/c31ecbf41ffa5157a599016c0d4b06203a750aec))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Code Refactoring

* delete @stet-css/server ([77c7fa8](https://github.com/0Miles/StetCSS/commit/77c7fa8958c89a526d95224c6bc2922c71be6bbc)), closes [#61](https://github.com/0Miles/StetCSS/issues/61)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
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
* @stet-css/server and its render(), renderCSS() and related exports no longer exist.

### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **validator:** keep a group's valid declarations when one is invalid ([a7a4df5](https://github.com/0Miles/StetCSS/commit/a7a4df5179c8fc804a4544dd1663dad24eff276d)), closes [#81](https://github.com/0Miles/StetCSS/issues/81)
* **validator:** type the css parameter with @stet-css/core's MasterCSS ([3b67475](https://github.com/0Miles/StetCSS/commit/3b6747540db454c08e51a9f724e5b6578465d51f))


### Code Refactoring

* delete @stet-css/server ([77c7fa8](https://github.com/0Miles/StetCSS/commit/77c7fa8958c89a526d95224c6bc2922c71be6bbc)), closes [#61](https://github.com/0Miles/StetCSS/issues/61)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
