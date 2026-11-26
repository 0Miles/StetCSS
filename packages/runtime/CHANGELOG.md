# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/runtime-v0.1.0...runtime-v0.2.0) (2026-11-26)


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
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **runtime:** make theme-layer bucket helpers private
* **runtime:** stop reading or adopting rules already on the page
* @stet-css/server and its render(), renderCSS() and related exports no longer exist.

### Features

* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **runtime:** point the unpkg and jsdelivr fields at the global bundle ([840204d](https://github.com/0Miles/StetCSS/commit/840204d45aff6d1239b4dc11e0123c2c7850ff1f)), closes [#88](https://github.com/0Miles/StetCSS/issues/88)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **runtime:** stop reading or adopting rules already on the page ([b3a8ec5](https://github.com/0Miles/StetCSS/commit/b3a8ec572b6b57210e22205b485fe502534de648)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)


### Bug Fixes

* **engine:** escape the mode name in class and host mode selectors ([#249](https://github.com/0Miles/StetCSS/issues/249)) ([54b1dee](https://github.com/0Miles/StetCSS/commit/54b1dee81f6391981b3ca0c9f410df526abfe168))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **runtime:** append a layer block of unknown name, as engine text sorts it last ([20b23f8](https://github.com/0Miles/StetCSS/commit/20b23f8ca39837398fc2bc306946bb0b0f2aa781))
* **runtime:** embed the default manifest in the CDN bundle ([7eac5e0](https://github.com/0Miles/StetCSS/commit/7eac5e011f1c44a153cb86c516ff133218b1b3de)), closes [#88](https://github.com/0Miles/StetCSS/issues/88)
* **runtime:** emit theme tokens reached through an inline variable ([daa6c53](https://github.com/0Miles/StetCSS/commit/daa6c53f9f94515918a9a6f1869c3d86340a626f)), closes [#185](https://github.com/0Miles/StetCSS/issues/185)
* **runtime:** keep one runtime per root when two runtime copies share a page ([52a9887](https://github.com/0Miles/StetCSS/commit/52a9887da5c66a6f9c70d58a3ae595233f0da6dc)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** keep runtime layer blocks in cascade layer order ([da96739](https://github.com/0Miles/StetCSS/commit/da96739de7b50071a7339992ed9a752555f3022f))
* **runtime:** log and skip a class that names an undeclared mode ([2bce405](https://github.com/0Miles/StetCSS/commit/2bce4058e36522c5df4accbbf3dcbd08086a8a1b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **runtime:** put theme variables on :host in a shadow root ([2234a44](https://github.com/0Miles/StetCSS/commit/2234a444d86135cd87b6422eda72e8008f4be339)), closes [#177](https://github.com/0Miles/StetCSS/issues/177)
* **runtime:** read document members that named page elements shadow ([229924a](https://github.com/0Miles/StetCSS/commit/229924ae8bef337c4d1e8a32288e5e2cfa914db3)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** read the owner document of a shadow root through its prototype ([1536bfc](https://github.com/0Miles/StetCSS/commit/1536bfc0805b9beee58e4d518cd8d9043cd80d6e)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** reveal a hidden page when the runtime fails to start ([fe231bd](https://github.com/0Miles/StetCSS/commit/fe231bd61ee33248ad6fa9086c5e0fe421e745d1)), closes [#90](https://github.com/0Miles/StetCSS/issues/90)
* **runtime:** reveal on the next task when the CDN bundle fails to load ([22c37f5](https://github.com/0Miles/StetCSS/commit/22c37f530cecf2c87549a47d9d70a5edb4a06321)), closes [#90](https://github.com/0Miles/StetCSS/issues/90)
* **runtime:** start when page elements clobber the runtime globals ([5ff6c1b](https://github.com/0Miles/StetCSS/commit/5ff6c1b62ddb844e578172ec9170abb8e9c9e9c4)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)


### Code Refactoring

* delete @stet-css/server ([77c7fa8](https://github.com/0Miles/StetCSS/commit/77c7fa8958c89a526d95224c6bc2922c71be6bbc)), closes [#61](https://github.com/0Miles/StetCSS/issues/61)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **runtime:** make theme-layer bucket helpers private ([ed3c7f8](https://github.com/0Miles/StetCSS/commit/ed3c7f82d8d801d55e9c1e9a0dba506df6421cdb)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
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
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **runtime:** make theme-layer bucket helpers private
* **runtime:** stop reading or adopting rules already on the page
* @stet-css/server and its render(), renderCSS() and related exports no longer exist.
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **runtime:** point the unpkg and jsdelivr fields at the global bundle ([840204d](https://github.com/0Miles/StetCSS/commit/840204d45aff6d1239b4dc11e0123c2c7850ff1f)), closes [#88](https://github.com/0Miles/StetCSS/issues/88)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **runtime:** stop reading or adopting rules already on the page ([b3a8ec5](https://github.com/0Miles/StetCSS/commit/b3a8ec572b6b57210e22205b485fe502534de648)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **runtime:** append a layer block of unknown name, as engine text sorts it last ([20b23f8](https://github.com/0Miles/StetCSS/commit/20b23f8ca39837398fc2bc306946bb0b0f2aa781))
* **runtime:** embed the default manifest in the CDN bundle ([7eac5e0](https://github.com/0Miles/StetCSS/commit/7eac5e011f1c44a153cb86c516ff133218b1b3de)), closes [#88](https://github.com/0Miles/StetCSS/issues/88)
* **runtime:** keep one runtime per root when two runtime copies share a page ([52a9887](https://github.com/0Miles/StetCSS/commit/52a9887da5c66a6f9c70d58a3ae595233f0da6dc)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** keep runtime layer blocks in cascade layer order ([da96739](https://github.com/0Miles/StetCSS/commit/da96739de7b50071a7339992ed9a752555f3022f))
* **runtime:** log and skip a class that names an undeclared mode ([2bce405](https://github.com/0Miles/StetCSS/commit/2bce4058e36522c5df4accbbf3dcbd08086a8a1b)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **runtime:** read document members that named page elements shadow ([229924a](https://github.com/0Miles/StetCSS/commit/229924ae8bef337c4d1e8a32288e5e2cfa914db3)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** read the owner document of a shadow root through its prototype ([1536bfc](https://github.com/0Miles/StetCSS/commit/1536bfc0805b9beee58e4d518cd8d9043cd80d6e)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)
* **runtime:** reveal a hidden page when the runtime fails to start ([fe231bd](https://github.com/0Miles/StetCSS/commit/fe231bd61ee33248ad6fa9086c5e0fe421e745d1)), closes [#90](https://github.com/0Miles/StetCSS/issues/90)
* **runtime:** reveal on the next task when the CDN bundle fails to load ([22c37f5](https://github.com/0Miles/StetCSS/commit/22c37f530cecf2c87549a47d9d70a5edb4a06321)), closes [#90](https://github.com/0Miles/StetCSS/issues/90)
* **runtime:** start when page elements clobber the runtime globals ([5ff6c1b](https://github.com/0Miles/StetCSS/commit/5ff6c1b62ddb844e578172ec9170abb8e9c9e9c4)), closes [#89](https://github.com/0Miles/StetCSS/issues/89)


### Code Refactoring

* delete @stet-css/server ([77c7fa8](https://github.com/0Miles/StetCSS/commit/77c7fa8958c89a526d95224c6bc2922c71be6bbc)), closes [#61](https://github.com/0Miles/StetCSS/issues/61)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **runtime:** make theme-layer bucket helpers private ([ed3c7f8](https://github.com/0Miles/StetCSS/commit/ed3c7f82d8d801d55e9c1e9a0dba506df6421cdb)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
