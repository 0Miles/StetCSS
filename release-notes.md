:robot: I have created a release *beep* *boop*
---


<details><summary>astro: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/astro-v0.1.0...astro-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **vite,astro:** build static CSS only
* **astro:** build static CSS only

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **vite,astro:** build static CSS only ([209488d](https://github.com/0Miles/StetCSS/commit/209488d0ed419c6e0fbda383d6a3ee68eadaf58e)), closes [#59](https://github.com/0Miles/StetCSS/issues/59)


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>cli: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/cli-v0.1.0...cli-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

* **cli:** the installed command is `stet-css` instead of `cli`, and help and errors name `stet-css` instead of `@stet-css/cli`.
* **lint:** renamed names (old -> new):
    - MasterCSSCanonicalClassesReportOptions -> StetCSSCanonicalClassesReportOptions
    - MasterCSSClassListEditOptions -> StetCSSClassListEditOptions
    - MasterCSSClassListLintReportOptions -> StetCSSClassListLintReportOptions
    - MasterCSSConflictingClassesReportOptions -> StetCSSConflictingClassesReportOptions
    - MasterCSSFixContentOptions -> StetCSSFixContentOptions
    - MasterCSSInvalidClassesReportOptions -> StetCSSInvalidClassesReportOptions
    - MasterCSSLintContentOptions -> StetCSSLintContentOptions
    - MasterCSSLintContentRuleOptions -> StetCSSLintContentRuleOptions
    - MasterCSSLintDiagnostic -> StetCSSLintDiagnostic
    - MasterCSSLintDiagnosticData -> StetCSSLintDiagnosticData
    - MasterCSSLintDiagnosticSeverity -> StetCSSLintDiagnosticSeverity
    - MasterCSSLintDiagnosticSourceKind -> StetCSSLintDiagnosticSourceKind
    - MasterCSSLintFileResult -> StetCSSLintFileResult
    - MasterCSSLintFileSourceKind -> StetCSSLintFileSourceKind
    - MasterCSSLintFix -> StetCSSLintFix
    - MasterCSSLintRange -> StetCSSLintRange
    - MasterCSSLintReport -> StetCSSLintReport
    - MasterCSSLintReportOptions -> StetCSSLintReportOptions
    - MasterCSSLintRuleId -> StetCSSLintRuleId
    - MasterCSSLintSourceDiagnostic -> StetCSSLintSourceDiagnostic
    - MasterCSSLintSourceFix -> StetCSSLintSourceFix
    - MasterCSSLintSourceFixKind -> StetCSSLintSourceFixKind
    - MasterCSSLintSourceFixSafety -> StetCSSLintSourceFixSafety
    - MasterCSSLintSourceLocation -> StetCSSLintSourceLocation
    - MasterCSSLintSourceLocationRange -> StetCSSLintSourceLocationRange
    - MasterCSSLintSummary -> StetCSSLintSummary
    - MasterCSSUnapprovedRawValueClassesReportOptions -> StetCSSUnapprovedRawValueClassesReportOptions
    - defaultMasterCSSLintRules -> defaultStetCSSLintRules
    - fixMasterCSSContent -> fixStetCSSContent
    - lintMasterCSSContent -> lintStetCSSContent
    - masterCSSLintRuleIds -> stetCSSLintRuleIds
    - resolveMasterCSSLintRules -> resolveStetCSSLintRules
    - summarizeMasterCSSLintFiles -> summarizeStetCSSLintFiles
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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **cli:** without `-o/--output`, the CLI now writes `stet.css` (was `master.css`).
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **cli:** print the -v log from the CLI itself ([65ddd8c](https://github.com/0Miles/StetCSS/commit/65ddd8c98cdb0109865e0101e9761a5daa0d3491)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** write extracted CSS to stet.css by default ([8818108](https://github.com/0Miles/StetCSS/commit/88181081a9c7caccb2885ceb36797461a43c804a)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **cli:** install the command as stet-css ([9834418](https://github.com/0Miles/StetCSS/commit/98344185368bac1ab71a3f82a438fc875d0d847c)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **cli:** keep --no-export stdout pure CSS by logging to stderr ([a389fab](https://github.com/0Miles/StetCSS/commit/a389fab3c30239538f5d8f7425361af17d0549b9)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **cli:** keep watching when a stylesheet entry breaks ([99169e5](https://github.com/0Miles/StetCSS/commit/99169e5734321a66fddf266cf15e5aa2d979b632))
* **cli:** lint .mjs files by default ([c4bbd4b](https://github.com/0Miles/StetCSS/commit/c4bbd4bbf2037578faacca958dc04fbb0874df62))
* **cli:** report a broken watch entry only once it is watched again ([9250e7c](https://github.com/0Miles/StetCSS/commit/9250e7c89d6941c043f88596fdb5769c1662fc3b))
* **cli:** report unreadable stylesheet entries without a stack trace ([0d64f94](https://github.com/0Miles/StetCSS/commit/0d64f94cac6b53e79cc2aec9908e50767e112259))
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>compiler: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/compiler-v0.1.0...compiler-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>core: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/core-v0.1.0...core-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **engine:** remove createHydrationManifest

### Code Refactoring

* **engine:** remove createHydrationManifest ([c9467b2](https://github.com/0Miles/StetCSS/commit/c9467b245acca049672d4846eebb87deb12fc87c)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>diagnostics: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/diagnostics-v0.1.0...diagnostics-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **diagnostics:** classify missing CSS by the entries' [@safelist](https://github.com/safelist) and [@blocklist](https://github.com/blocklist) ([0236349](https://github.com/0Miles/StetCSS/commit/0236349735843b7054631799a10a4db6d9e9f766)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **diagnostics:** give the scanner the entry manifest as its validation input ([7680654](https://github.com/0Miles/StetCSS/commit/76806547b528254cf258c278c563fafcafcebc48)), closes [#65](https://github.com/0Miles/StetCSS/issues/65) [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** judge inspected classes by the entry's manifest ([4a5b529](https://github.com/0Miles/StetCSS/commit/4a5b5293c9c9c02c1a64a9d9868f5e750bfbb8d7)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)
* **diagnostics:** list only each file's own classes in an inspection report ([cac29ec](https://github.com/0Miles/StetCSS/commit/cac29ecc2bc7b62c18a5de7a479ed514a0b6fbbe)), closes [#193](https://github.com/0Miles/StetCSS/issues/193)
* **diagnostics:** report classes styled by an entry native rule as present ([c67e032](https://github.com/0Miles/StetCSS/commit/c67e032c08281256a09ef10df46ae1b9f5e94b60)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Performance Improvements

* **diagnostics:** reuse the prebuilt core artifact when rendering inspect CSS ([ca19713](https://github.com/0Miles/StetCSS/commit/ca197136c924ba90d8d14d3de2b0e6f3b8a21be9)), closes [#71](https://github.com/0Miles/StetCSS/issues/71)


### Code Refactoring

* **diagnostics:** rename MasterCSS inspection report types to StetCSS ([9c18772](https://github.com/0Miles/StetCSS/commit/9c1877219d2aa313f5f14f9d618723aee18d6f7a))
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>engine: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/engine-v0.1.0...engine-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>eslint-config: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/eslint-config-v0.1.0...eslint-config-v0.2.0) (2026-11-18)


### Miscellaneous Chores

* **eslint-config:** Synchronize stet-css versions
</details>

<details><summary>eslint-plugin: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/eslint-plugin-v0.1.0...eslint-plugin-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

* **lint:** renamed names (old -> new):
    - MasterCSSCanonicalClassesReportOptions -> StetCSSCanonicalClassesReportOptions
    - MasterCSSClassListEditOptions -> StetCSSClassListEditOptions
    - MasterCSSClassListLintReportOptions -> StetCSSClassListLintReportOptions
    - MasterCSSConflictingClassesReportOptions -> StetCSSConflictingClassesReportOptions
    - MasterCSSFixContentOptions -> StetCSSFixContentOptions
    - MasterCSSInvalidClassesReportOptions -> StetCSSInvalidClassesReportOptions
    - MasterCSSLintContentOptions -> StetCSSLintContentOptions
    - MasterCSSLintContentRuleOptions -> StetCSSLintContentRuleOptions
    - MasterCSSLintDiagnostic -> StetCSSLintDiagnostic
    - MasterCSSLintDiagnosticData -> StetCSSLintDiagnosticData
    - MasterCSSLintDiagnosticSeverity -> StetCSSLintDiagnosticSeverity
    - MasterCSSLintDiagnosticSourceKind -> StetCSSLintDiagnosticSourceKind
    - MasterCSSLintFileResult -> StetCSSLintFileResult
    - MasterCSSLintFileSourceKind -> StetCSSLintFileSourceKind
    - MasterCSSLintFix -> StetCSSLintFix
    - MasterCSSLintRange -> StetCSSLintRange
    - MasterCSSLintReport -> StetCSSLintReport
    - MasterCSSLintReportOptions -> StetCSSLintReportOptions
    - MasterCSSLintRuleId -> StetCSSLintRuleId
    - MasterCSSLintSourceDiagnostic -> StetCSSLintSourceDiagnostic
    - MasterCSSLintSourceFix -> StetCSSLintSourceFix
    - MasterCSSLintSourceFixKind -> StetCSSLintSourceFixKind
    - MasterCSSLintSourceFixSafety -> StetCSSLintSourceFixSafety
    - MasterCSSLintSourceLocation -> StetCSSLintSourceLocation
    - MasterCSSLintSourceLocationRange -> StetCSSLintSourceLocationRange
    - MasterCSSLintSummary -> StetCSSLintSummary
    - MasterCSSUnapprovedRawValueClassesReportOptions -> StetCSSUnapprovedRawValueClassesReportOptions
    - defaultMasterCSSLintRules -> defaultStetCSSLintRules
    - fixMasterCSSContent -> fixStetCSSContent
    - lintMasterCSSContent -> lintStetCSSContent
    - masterCSSLintRuleIds -> stetCSSLintRuleIds
    - resolveMasterCSSLintRules -> resolveStetCSSLintRules
    - summarizeMasterCSSLintFiles -> summarizeStetCSSLintFiles
* **project:** renamed names (old -> new):
    - MASTER_CSS_PACKAGE_NAME_PATTERN -> STET_CSS_PACKAGE_NAME_PATTERN
    - MasterCSSWorkspacePackageResolution -> StetCSSWorkspacePackageResolution
    - MasterCSSWorkspacePackageResolutionError -> StetCSSWorkspacePackageResolutionError
    - ResolvedMasterCSSWorkspacePackage -> ResolvedStetCSSWorkspacePackage
    - collectMasterCSSPackageWorkspaceDirectories -> collectStetCSSPackageWorkspaceDirectories
    - collectMasterCSSPackageWorkspaceDirectoriesSync -> collectStetCSSPackageWorkspaceDirectoriesSync
    - findMasterCSSWorkspaceDirectories -> findStetCSSWorkspaceDirectories
    - findMasterCSSWorkspaceDirectoriesSync -> findStetCSSWorkspaceDirectoriesSync
    - hasMasterCSSDependency -> hasStetCSSDependency
    - hasMasterCSSManifestEntrypointFallback -> hasStetCSSManifestEntrypointFallback
    - isCompatibleMasterCSSPackageVersion -> isCompatibleStetCSSPackageVersion
    - isMasterCSSDependencyName -> isStetCSSDependencyName
    - resolveMasterCSSWorkspacePackages -> resolveStetCSSWorkspacePackages
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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.

### Features

* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **eslint-plugin:** end expression fragments only at the lexer's class separators ([302cb61](https://github.com/0Miles/StetCSS/commit/302cb611a65015e22c273844d0bd9992c82f21e2))
* **eslint-plugin:** ignore computed string keys listed in ignoredKeys ([0402019](https://github.com/0Miles/StetCSS/commit/040201901507db401408b80319ad4c7ffbfecc20))
* **eslint-plugin:** import MasterCSS from @stet-css/core ([ebc7cd7](https://github.com/0Miles/StetCSS/commit/ebc7cd73b6bd8d845cf956da3b0d17c34fb829ff))
* **eslint-plugin:** leave class fragments inside template literal expressions alone ([e4f9bd7](https://github.com/0Miles/StetCSS/commit/e4f9bd7a4cb56da989460a46df0224cb62c114ae)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **eslint-plugin:** leave class fragments touching Svelte expressions and ignoredKeys alone ([3d25256](https://github.com/0Miles/StetCSS/commit/3d2525628c37e37bf922962ba07bc1f83b7e71ca))
* **eslint-plugin:** link rule docs to their README headings ([b10a3df](https://github.com/0Miles/StetCSS/commit/b10a3df7542a3a16ab0654ec62f15c6bc434ebd6)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **eslint-plugin:** lint the Svelte, Astro, classList and Vue class contexts it missed ([61a203c](https://github.com/0Miles/StetCSS/commit/61a203cb3cef2328202486f6073ac8553fe64e55)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **eslint-plugin:** map decoded class lists back onto source in autofix ([1eb33e1](https://github.com/0Miles/StetCSS/commit/1eb33e1dd7494382b992a9f84ab334d675ff29bd)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **eslint-plugin:** pass ignoredKeys to MDX source linting ([b7f0aaa](https://github.com/0Miles/StetCSS/commit/b7f0aaaf4d631da46e005e6b7a551160807fcad2))
* **eslint-plugin:** reload the manifest after its CSS entry or an imported file changes ([2389bf4](https://github.com/0Miles/StetCSS/commit/2389bf4e6ccbefa2ed0eae3b6614edeb5ca1683f)), closes [#199](https://github.com/0Miles/StetCSS/issues/199)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)


### Performance Improvements

* **eslint-plugin:** remember a workspace's entry files instead of walking it per file ([acb1af5](https://github.com/0Miles/StetCSS/commit/acb1af5a4932df1f2bf4ab4072de541b296137f2)), closes [#199](https://github.com/0Miles/StetCSS/issues/199)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>integration: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/integration-v0.1.0...integration-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>language: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-v0.1.0...language-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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

* **language,language-service:** skip a class using an undeclared mode in generated docs ([b92e231](https://github.com/0Miles/StetCSS/commit/b92e2318cc1084184cdd98d8da5b2d9969c8f282)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **language:** bound class contexts at runtime expressions ([ee87b39](https://github.com/0Miles/StetCSS/commit/ee87b39f93b004a58345f4a0eac96116051f9ebb)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **language:** colour class attribute selectors, an+b and strings like native CSS ([0986498](https://github.com/0Miles/StetCSS/commit/098649846485925fc8dc799bd18d30091fc1b41a)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** colour directive @, [@variant](https://github.com/variant) names and class strings in the grammar ([d019bf2](https://github.com/0Miles/StetCSS/commit/d019bf266caefec29d06e5db5889b3b16c26233d)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** colour selector punctuation, @ and class strings like native CSS in every theme ([5dd7063](https://github.com/0Miles/StetCSS/commit/5dd70633c83fd0e0029af8d986f082aeb01e5795)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** find classList calls on a member chain in script files ([cd08b63](https://github.com/0Miles/StetCSS/commit/cd08b636eec33e27dd825a1b587cb0d1ff1bdf1f)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **language:** highlight value syntax after escaped quotes outside strings ([f134c3a](https://github.com/0Miles/StetCSS/commit/f134c3a05394c96aeb8cc706ea0a66d97cd29718)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **language:** mirror the bounded parse thread and guard the copy ([46a26b6](https://github.com/0Miles/StetCSS/commit/46a26b66fd08bb4f4e3f22aed70ad0c135ae9cd8)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** mirror the prescan move and guard it with dense brackets ([6f45447](https://github.com/0Miles/StetCSS/commit/6f45447632bc112ac22226378366d92dd393d017)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** parse JSX in javascript documents and .js, .mjs and .cjs files ([56a92f2](https://github.com/0Miles/StetCSS/commit/56a92f221c5acb66a3488f641fc2712d996c4c73)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **language:** place embedded class tokens at raw offsets past escapes ([ce8b47b](https://github.com/0Miles/StetCSS/commit/ce8b47bc88eb0cffa28864206f09867f5962d0a9)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **language:** scan JS/TS documents on a stack sized to the source ([4efd746](https://github.com/0Miles/StetCSS/commit/4efd7465d99eb309a4927c2d548960288ed7bf2c)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **language:** split class lists on ASCII whitespace only ([c74f9ff](https://github.com/0Miles/StetCSS/commit/c74f9ff85a91516c6ac04d741a54d2ae15a37fe8)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **source:** accept a top-level return in Astro frontmatter ([1b66de9](https://github.com/0Miles/StetCSS/commit/1b66de9db6877856d327bd53186ece93237cad87)), closes [#191](https://github.com/0Miles/StetCSS/issues/191)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **language:** rename MasterCSS Shiki, TextMate, formatter and class-list names to StetCSS ([412ffcb](https://github.com/0Miles/StetCSS/commit/412ffcb9e2566228481d63f6dc814337ab56608d))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>language-server: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-server-v0.1.0...language-server-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

* **project:** renamed names (old -> new):
    - MASTER_CSS_PACKAGE_NAME_PATTERN -> STET_CSS_PACKAGE_NAME_PATTERN
    - MasterCSSWorkspacePackageResolution -> StetCSSWorkspacePackageResolution
    - MasterCSSWorkspacePackageResolutionError -> StetCSSWorkspacePackageResolutionError
    - ResolvedMasterCSSWorkspacePackage -> ResolvedStetCSSWorkspacePackage
    - collectMasterCSSPackageWorkspaceDirectories -> collectStetCSSPackageWorkspaceDirectories
    - collectMasterCSSPackageWorkspaceDirectoriesSync -> collectStetCSSPackageWorkspaceDirectoriesSync
    - findMasterCSSWorkspaceDirectories -> findStetCSSWorkspaceDirectories
    - findMasterCSSWorkspaceDirectoriesSync -> findStetCSSWorkspaceDirectoriesSync
    - hasMasterCSSDependency -> hasStetCSSDependency
    - hasMasterCSSManifestEntrypointFallback -> hasStetCSSManifestEntrypointFallback
    - isCompatibleMasterCSSPackageVersion -> isCompatibleStetCSSPackageVersion
    - isMasterCSSDependencyName -> isStetCSSDependencyName
    - resolveMasterCSSWorkspacePackages -> resolveStetCSSWorkspacePackages
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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **vscode:** settings written under `masterCSS.*` and LSP clients sending `masterCSS` settings are no longer read.
* **language:** stop treating @master as a directive in editor tooling

### Features

* **compiler:** report removed [@master](https://github.com/master) and [@preserve](https://github.com/preserve) as located directive errors ([5a103c7](https://github.com/0Miles/StetCSS/commit/5a103c76dcc1bbc2996510afe7f5b716383f6daf)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **language:** stop treating [@master](https://github.com/master) as a directive in editor tooling ([ebb4cea](https://github.com/0Miles/StetCSS/commit/ebb4cea57a31f78fe60a63cfe9770cfb82b3a0b5)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **vscode:** rename editor settings, commands and LSP methods to stetCSS ([70dfcd1](https://github.com/0Miles/StetCSS/commit/70dfcd14f96bed7efe19f4a4d7c4bbce329e72dd)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)


### Bug Fixes

* **language-server:** place SFC style diagnostics in the content, not the opening tag ([1368013](https://github.com/0Miles/StetCSS/commit/1368013d9a471aba26e4cc26fe47e3370a3b0fbb)), closes [#200](https://github.com/0Miles/StetCSS/issues/200)
* **language-server:** report a manifest setting the engine rejects ([6764d84](https://github.com/0Miles/StetCSS/commit/6764d846a73647dddd570a69650055bf4be52ca9))
* **language-server:** show what the build emits for invalid classes ([4ac63dd](https://github.com/0Miles/StetCSS/commit/4ac63dd986e9588ebfa9d39cadc7295062e16ba1)), closes [#82](https://github.com/0Miles/StetCSS/issues/82)
* **language-server:** type handler results with vscode-languageserver types ([1fca4f8](https://github.com/0Miles/StetCSS/commit/1fca4f888cf8dda20b9d2ce6f1d710cd45921112))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>language-service: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/language-service-v0.1.0...language-service-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>lexer: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/lexer-v0.1.0...lexer-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **lexer:** decode HTML and JSX character references with source ranges ([267ed25](https://github.com/0Miles/StetCSS/commit/267ed251cf880c6833dd73d85437d6aeee72dae4)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **lexer:** decode JavaScript string bodies when parsing class lists ([2c8c1e4](https://github.com/0Miles/StetCSS/commit/2c8c1e4e7fcf3bfdf7c1823269a593ca7411a0a3)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **lexer:** export the CSS length units ([76a565a](https://github.com/0Miles/StetCSS/commit/76a565af7e5c0bf3c2753baa463d84bb61a0fe60)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)


### Bug Fixes

* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **lexer:** give selector punctuation its own roles and finish nth and attribute edges ([bc1e0e8](https://github.com/0Miles/StetCSS/commit/bc1e0e82ebcac24712c293075b7ea81c068f2a29)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **lexer:** skip CSS escapes outside strings in the shared scanners ([7cbe3ea](https://github.com/0Miles/StetCSS/commit/7cbe3eaac5caa02ba9d828c54a8030f800da9753)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **lexer:** tokenize attribute selectors, an+b arguments and a query's | ([2bd2f56](https://github.com/0Miles/StetCSS/commit/2bd2f56a33015fa6c16c004cc66fca45dd307f97)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Code Refactoring

* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
</details>

<details><summary>lint: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/lint-v0.1.0...lint-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

* **lint:** renamed names (old -> new):
    - MasterCSSCanonicalClassesReportOptions -> StetCSSCanonicalClassesReportOptions
    - MasterCSSClassListEditOptions -> StetCSSClassListEditOptions
    - MasterCSSClassListLintReportOptions -> StetCSSClassListLintReportOptions
    - MasterCSSConflictingClassesReportOptions -> StetCSSConflictingClassesReportOptions
    - MasterCSSFixContentOptions -> StetCSSFixContentOptions
    - MasterCSSInvalidClassesReportOptions -> StetCSSInvalidClassesReportOptions
    - MasterCSSLintContentOptions -> StetCSSLintContentOptions
    - MasterCSSLintContentRuleOptions -> StetCSSLintContentRuleOptions
    - MasterCSSLintDiagnostic -> StetCSSLintDiagnostic
    - MasterCSSLintDiagnosticData -> StetCSSLintDiagnosticData
    - MasterCSSLintDiagnosticSeverity -> StetCSSLintDiagnosticSeverity
    - MasterCSSLintDiagnosticSourceKind -> StetCSSLintDiagnosticSourceKind
    - MasterCSSLintFileResult -> StetCSSLintFileResult
    - MasterCSSLintFileSourceKind -> StetCSSLintFileSourceKind
    - MasterCSSLintFix -> StetCSSLintFix
    - MasterCSSLintRange -> StetCSSLintRange
    - MasterCSSLintReport -> StetCSSLintReport
    - MasterCSSLintReportOptions -> StetCSSLintReportOptions
    - MasterCSSLintRuleId -> StetCSSLintRuleId
    - MasterCSSLintSourceDiagnostic -> StetCSSLintSourceDiagnostic
    - MasterCSSLintSourceFix -> StetCSSLintSourceFix
    - MasterCSSLintSourceFixKind -> StetCSSLintSourceFixKind
    - MasterCSSLintSourceFixSafety -> StetCSSLintSourceFixSafety
    - MasterCSSLintSourceLocation -> StetCSSLintSourceLocation
    - MasterCSSLintSourceLocationRange -> StetCSSLintSourceLocationRange
    - MasterCSSLintSummary -> StetCSSLintSummary
    - MasterCSSUnapprovedRawValueClassesReportOptions -> StetCSSUnapprovedRawValueClassesReportOptions
    - defaultMasterCSSLintRules -> defaultStetCSSLintRules
    - fixMasterCSSContent -> fixStetCSSContent
    - lintMasterCSSContent -> lintStetCSSContent
    - masterCSSLintRuleIds -> stetCSSLintRuleIds
    - resolveMasterCSSLintRules -> resolveStetCSSLintRules
    - summarizeMasterCSSLintFiles -> summarizeStetCSSLintFiles
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
* **lint:** consumers filtering diagnostics by `source === 'Master CSS'` must match `'StetCSS'`.
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **lint:** label diagnostics and ESLint rules as StetCSS ([69f2642](https://github.com/0Miles/StetCSS/commit/69f2642119738a80c4dabc240c65c830cfba8688)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **lint:** pass scriptString through class-list edit options ([6b76512](https://github.com/0Miles/StetCSS/commit/6b76512b65f98f9f073c1c7516e6939095e95dad)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)


### Bug Fixes

* **lint:** decode JavaScript string class lists in source linting ([83da91e](https://github.com/0Miles/StetCSS/commit/83da91ed7796016c2cace324627fb26f4c80a133)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **lint:** honour ignoredKeys when linting and fixing source content ([a1e6304](https://github.com/0Miles/StetCSS/commit/a1e630469b2c03132ef132e2aac5b9acbe553836))
* **lint:** leave class fragments beside runtime expressions unreported ([cd92cff](https://github.com/0Miles/StetCSS/commit/cd92cff5bb8a8645a8d0f2a1ee557f3cd038b5cf)), closes [#198](https://github.com/0Miles/StetCSS/issues/198)
* **lint:** lint .mjs files as JavaScript ([c45c6af](https://github.com/0Miles/StetCSS/commit/c45c6af1599c0813f49924521271cd4e13a7d695))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **validator,lint,language-service:** report an undeclared mode instead of crashing ([4283972](https://github.com/0Miles/StetCSS/commit/42839727713550aa310c1e60aeb120c82eadcf05)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **validator:** keep a group's valid declarations when one is invalid ([a7a4df5](https://github.com/0Miles/StetCSS/commit/a7a4df5179c8fc804a4544dd1663dad24eff276d)), closes [#81](https://github.com/0Miles/StetCSS/issues/81)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **lint:** rename MasterCSS lint report, rule and fix types to StetCSS ([3914b26](https://github.com/0Miles/StetCSS/commit/3914b26daa2544c423e3ba6d1b070f2caabeccb1))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>next: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/next-v0.1.0...next-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **next:** the module every stylesheet entry imports, and the self-ignoring directory that holds it, move from `.master/next.css` to `.stet/next.css`. A `.master/` directory left by an earlier build is no longer read and can be deleted.
* **runtime:** the runtime's own <style> element id and its two global names change; pages or scripts reading the old names no longer find them. Generated CSS rules are unchanged.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **next:** take adapters flat and refuse them under Turbopack
* **scanner:** keep only cache and validation, with adapters as the only option
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries
* **next:** compute static CSS from the project files for every build

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **next:** compute static CSS from the project files for every build ([1649b86](https://github.com/0Miles/StetCSS/commit/1649b86da710618b160eaccb720db0fb20626281)), closes [#57](https://github.com/0Miles/StetCSS/issues/57)
* **next:** generate the shared CSS module at .stet/next.css ([6697043](https://github.com/0Miles/StetCSS/commit/6697043b8c0638882a1427ec23a7e1abb9614314)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **next:** keep the generated CSS directory out of git by itself ([d89668e](https://github.com/0Miles/StetCSS/commit/d89668eeb6f3d85331c0e6c4c17cefcd2047cee2)), closes [#57](https://github.com/0Miles/StetCSS/issues/57)
* **next:** take adapters flat and refuse them under Turbopack ([4303639](https://github.com/0Miles/StetCSS/commit/43036391ec9ef8d81412b24cfe2c0745e806c3a3)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** keep only cache and validation, with adapters as the only option ([5e4bae4](https://github.com/0Miles/StetCSS/commit/5e4bae4646f0ca7d93d7339b761f1c6210eab15b)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **next:** carry Sass entries into the static CSS ([8a065c3](https://github.com/0Miles/StetCSS/commit/8a065c3b1d2bd7bb087f7a4f6ee02f0d95345b9c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)


### Performance Improvements

* **next:** lower CSS Modules against the shared local style context ([210f2e7](https://github.com/0Miles/StetCSS/commit/210f2e7079d1533eb2b049d29b0bd2d91a5c0583)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **next:** rename withMasterCSS, its loaders and manifest patterns to StetCSS ([db65d17](https://github.com/0Miles/StetCSS/commit/db65d17829562bdf9a1ae1a094047fabb2ac69ca))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>nuxt: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/nuxt-v0.1.0...nuxt-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **nuxt:** the Nuxt module's config key is now `stetcss` (was `mastercss`). Options written under `mastercss` in nuxt.config are no longer read.
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **nuxt:** only build static CSS, from the Nuxt project root

### Features

* **nuxt:** only build static CSS, from the Nuxt project root ([9c08790](https://github.com/0Miles/StetCSS/commit/9c08790ed7985bfac4d1c7fe1fdf92dc367421b3)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **nuxt:** read module options from the stetcss config key ([a75ee5e](https://github.com/0Miles/StetCSS/commit/a75ee5e7aaa7e3c7a0b1cbca518074805fa83813)), closes [#93](https://github.com/0Miles/StetCSS/issues/93)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* **nuxt:** check module options before the nuxi prepare return ([a84ee7c](https://github.com/0Miles/StetCSS/commit/a84ee7ce94ba7908c78265c9bd3cbbc5150bd1e0)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **nuxt:** declare ModuleOptions as an interface so the module types keep it ([cc76ad8](https://github.com/0Miles/StetCSS/commit/cc76ad8ffe435640dd3b9696e19f862f33759813)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **nuxt:** read every layer through the vite integration host ([99decbb](https://github.com/0Miles/StetCSS/commit/99decbbbb04b53f67754ed101d78ad2bc96c1ae2)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **nuxt:** type the Nitro server plugin without importing nitropack ([b72f180](https://github.com/0Miles/StetCSS/commit/b72f1804044d504ffecb125cc01f249156ae1db7))


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>preset: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/preset-v0.1.0...preset-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)


### Bug Fixes

* **preset:** regenerate the default native CSS with its fallbacks ([c143939](https://github.com/0Miles/StetCSS/commit/c143939c85d24f1f08a8c990b6b700848aa5cb74))


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>project: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/project-v0.1.0...project-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

* **project:** renamed names (old -> new):
    - MASTER_CSS_PACKAGE_NAME_PATTERN -> STET_CSS_PACKAGE_NAME_PATTERN
    - MasterCSSWorkspacePackageResolution -> StetCSSWorkspacePackageResolution
    - MasterCSSWorkspacePackageResolutionError -> StetCSSWorkspacePackageResolutionError
    - ResolvedMasterCSSWorkspacePackage -> ResolvedStetCSSWorkspacePackage
    - collectMasterCSSPackageWorkspaceDirectories -> collectStetCSSPackageWorkspaceDirectories
    - collectMasterCSSPackageWorkspaceDirectoriesSync -> collectStetCSSPackageWorkspaceDirectoriesSync
    - findMasterCSSWorkspaceDirectories -> findStetCSSWorkspaceDirectories
    - findMasterCSSWorkspaceDirectoriesSync -> findStetCSSWorkspaceDirectoriesSync
    - hasMasterCSSDependency -> hasStetCSSDependency
    - hasMasterCSSManifestEntrypointFallback -> hasStetCSSManifestEntrypointFallback
    - isCompatibleMasterCSSPackageVersion -> isCompatibleStetCSSPackageVersion
    - isMasterCSSDependencyName -> isStetCSSDependencyName
    - resolveMasterCSSWorkspacePackages -> resolveStetCSSWorkspacePackages
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
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **project:** list stylesheets holding @master at-rules in entry discovery
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **project:** let static builds discover Sass stylesheet entries ([609259e](https://github.com/0Miles/StetCSS/commit/609259e800586bdf12d17458e5b4f0e72059da2c)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)
* **project:** list stylesheets holding [@master](https://github.com/master) at-rules in entry discovery ([961b083](https://github.com/0Miles/StetCSS/commit/961b08355d7b0e1f1b46d4c11ebe018ddd3ae55a)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** reject CSS nested past 64 levels before lightningcss parses it ([4095d37](https://github.com/0Miles/StetCSS/commit/4095d37c87ea96e89fef7714255f33cb267be242))
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **project:** read .mjs files as project sources ([7ca59e4](https://github.com/0Miles/StetCSS/commit/7ca59e488a3870375a3ce532dd220d80e103acdb))


### Performance Improvements

* **project:** cache entry discovery reads and add a cached project manifest load ([02bbce8](https://github.com/0Miles/StetCSS/commit/02bbce85e472f07e071567668728226a1b7586c2)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **project:** rename MasterCSS workspace resolution helpers to StetCSS ([623f714](https://github.com/0Miles/StetCSS/commit/623f71456225056188e647cbab8fdf07132b2eb0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>runtime: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/runtime-v0.1.0...runtime-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>scanner: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/scanner-v0.1.0...scanner-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **scanner:** intermediate CSS that a build plugin has not yet spliced carries the new selector. Final generated CSS is unchanged: the placeholder never survives a successful build.
* **scanner:** keep only cache and validation, with adapters as the only option
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **scanner:** keep only cache and validation, with adapters as the only option ([5e4bae4](https://github.com/0Miles/StetCSS/commit/5e4bae4646f0ca7d93d7339b761f1c6210eab15b)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **scanner:** rename the build placeholder rule to #stet-css-slot ([bd503d9](https://github.com/0Miles/StetCSS/commit/bd503d9ab4f9e8d264bff5cbb7e2279553933133)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** return each source's own candidates from scanSource ([d6af925](https://github.com/0Miles/StetCSS/commit/d6af9256d036aaefc7e8ab1c295fcbd8adec50e0)), closes [#193](https://github.com/0Miles/StetCSS/issues/193)
* **scanner:** validate against a manifest a first-party caller passes internally ([c534629](https://github.com/0Miles/StetCSS/commit/c534629f2ee8a1a9ef09a5546d832b96fcef7bdf)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **scanner:** validate build plugin options and map their removed keys ([b61811e](https://github.com/0Miles/StetCSS/commit/b61811eac27a29d60af58e8705e648aa9017bc63)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **scanner:** name removed keys inside a nested scanner and how to start the runtime ([2c8ec84](https://github.com/0Miles/StetCSS/commit/2c8ec846da4f8ce3a8776ca7173cc124f957aea6)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Code Refactoring

* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>schema: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/schema-v0.1.0...schema-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **schema:** remove the hydration-manifest subpath
* **runtime:** stop reading or adopting rules already on the page
* @stet-css/server and its render(), renderCSS() and related exports no longer exist.
* **stylesheet:** keep all native CSS in stylesheet entries
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **runtime:** rename the style element id and globals to Stet ([5ec8012](https://github.com/0Miles/StetCSS/commit/5ec801255f8916c155ab32da7c7a7915afbcc393)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **runtime:** stop reading or adopting rules already on the page ([b3a8ec5](https://github.com/0Miles/StetCSS/commit/b3a8ec572b6b57210e22205b485fe502534de648)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Bug Fixes

* **compiler:** keep preset modes implicit and require a declared default-mode ([df6d99f](https://github.com/0Miles/StetCSS/commit/df6d99f3c3e273761038ab72173fa868e02bd7fa)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **schema:** let a string condition node carry a comparison operator ([91ec01a](https://github.com/0Miles/StetCSS/commit/91ec01a2b410b87ff847b902c991801f21a2240c)), closes [#184](https://github.com/0Miles/StetCSS/issues/184)


### Code Refactoring

* delete @stet-css/server ([77c7fa8](https://github.com/0Miles/StetCSS/commit/77c7fa8958c89a526d95224c6bc2922c71be6bbc)), closes [#61](https://github.com/0Miles/StetCSS/issues/61)
* **schema:** remove the hydration-manifest subpath ([9dc4089](https://github.com/0Miles/StetCSS/commit/9dc408942ca8338c90418675d2b8f53340122da9)), closes [#62](https://github.com/0Miles/StetCSS/issues/62)
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
</details>

<details><summary>source: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/source-v0.1.0...source-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **stylesheet:** make the class set the only source of generated classes

### Bug Fixes

* **source:** accept a top-level return in Astro frontmatter ([1b66de9](https://github.com/0Miles/StetCSS/commit/1b66de9db6877856d327bd53186ece93237cad87)), closes [#191](https://github.com/0Miles/StetCSS/issues/191)
* **source:** bound the oxc parse thread's memory, stack and waits ([bc143cb](https://github.com/0Miles/StetCSS/commit/bc143cb5c44b0e8f08dd36dc136d026ef63008d5)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** extract class attributes by the classes the host renders ([87b9a41](https://github.com/0Miles/StetCSS/commit/87b9a41e2aa6a027867b3e72745b5334f353cb4d)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **source:** extract Svelte classes from else, each-else and await branches ([d3efa92](https://github.com/0Miles/StetCSS/commit/d3efa92a6e7c0b67cc4bdc3dbb4838adc1794e30)), closes [#182](https://github.com/0Miles/StetCSS/issues/182)
* **source:** keep reading template placeholders after an unclosed `${` ([14f94a9](https://github.com/0Miles/StetCSS/commit/14f94a989ed29e93aa6901e6eec4e3d4744cdc85)), closes [#195](https://github.com/0Miles/StetCSS/issues/195)
* **source:** make every backtracking extraction pattern single-pass ([fd1b2e3](https://github.com/0Miles/StetCSS/commit/fd1b2e3eb29a00596fd98cfc8d9cb355a86ffb13)), closes [#77](https://github.com/0Miles/StetCSS/issues/77)
* **source:** parse a whole Svelte component as TypeScript when any script is ([ac9ba1d](https://github.com/0Miles/StetCSS/commit/ac9ba1d356796e9d7a69694cedaf720a53076ea4)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **source:** parse Astro scripts as TypeScript ([e9204f8](https://github.com/0Miles/StetCSS/commit/e9204f810c48b5af3dd27b6fc5f8c9290699bdab)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **source:** parse JS/TS on a stack sized to the source ([eadd3db](https://github.com/0Miles/StetCSS/commit/eadd3db9c8e828f3f49ac5eae1b4630b18197f44)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** parse JSX in .js, .mjs and .cjs files ([bdf5ccb](https://github.com/0Miles/StetCSS/commit/bdf5ccba5ebd8f457a8daaa837752ebb36c040fa)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **source:** parse Svelte scripts in the language their lang attribute names ([e5939d9](https://github.com/0Miles/StetCSS/commit/e5939d9910e521810b3c0a24e7253055684a4c2e)), closes [#190](https://github.com/0Miles/StetCSS/issues/190)
* **source:** read Astro and Vue class attributes by their decoded value only ([9fa6789](https://github.com/0Miles/StetCSS/commit/9fa678991b8b8c9adcdcb1a4763f20acb33946d6)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **source:** run the nesting prescan inside the oxc stack module ([26790af](https://github.com/0Miles/StetCSS/commit/26790af152f95ee461f1036047c82974230cf0c1)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** scan long tokens once in text extraction ([2e68924](https://github.com/0Miles/StetCSS/commit/2e68924eceaf6ae4816c4ca0151ab68d8026fe6a)), closes [#77](https://github.com/0Miles/StetCSS/issues/77)
* **source:** skip regular expressions and follow Astro's fence rules in frontmatter ([45ee6ed](https://github.com/0Miles/StetCSS/commit/45ee6ed80976fc91c331baccad5ccbd9b6866f0a)), closes [#191](https://github.com/0Miles/StetCSS/issues/191)
* **source:** split Astro frontmatter at the fences the Astro compiler reads ([86c5498](https://github.com/0Miles/StetCSS/commit/86c54985c1315c3d42503342586988a93bcd6bff)), closes [#191](https://github.com/0Miles/StetCSS/issues/191)
* **source:** stop extracting template literal placeholders as classes ([c6cacb2](https://github.com/0Miles/StetCSS/commit/c6cacb2c456790c0d458c21f668af3536347477d)), closes [#195](https://github.com/0Miles/StetCSS/issues/195)


### Performance Improvements

* **source:** find each decorator @ once and share the scan removal loop ([318bb40](https://github.com/0Miles/StetCSS/commit/318bb40dd397a6bd5859e8877d20d8187adb27af))


### Code Refactoring

* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
</details>

<details><summary>stylesheet: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/stylesheet-v0.1.0...stylesheet-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **scanner:** intermediate CSS that a build plugin has not yet spliced carries the new selector. Final generated CSS is unchanged: the placeholder never survives a successful build.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **stylesheet:** make the class set the only source of generated classes
* **stylesheet:** keep all native CSS in stylesheet entries

### Features

* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** rename the build placeholder rule to #stet-css-slot ([bd503d9](https://github.com/0Miles/StetCSS/commit/bd503d9ab4f9e8d264bff5cbb7e2279553933133)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **stylesheet:** let build integrations keep their output out of the class set ([6fe36c7](https://github.com/0Miles/StetCSS/commit/6fe36c71869bd4baca7e0271cde11c9daa41a35d))
* **stylesheet:** read extra project directories in the class set ([e9a2a9e](https://github.com/0Miles/StetCSS/commit/e9a2a9eaf0ded66709bb389ea2732853fed8b95a)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)


### Bug Fixes

* **compiler:** count every brace form in the [@source](https://github.com/source) expansion limit ([21010a6](https://github.com/0Miles/StetCSS/commit/21010a6bfe919f6fbb41f5ddcfbf46532870de33)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** name the entry in the removed [@preserve](https://github.com/preserve) error ([287597f](https://github.com/0Miles/StetCSS/commit/287597fb79a922a4a6ed09abe88a34df5bf1981e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **compiler:** reject [@source](https://github.com/source) patterns that expand past 1024 globs ([97a6feb](https://github.com/0Miles/StetCSS/commit/97a6febd5af1bbb8ed7ab2edb32db7639d0a6149)), closes [#49](https://github.com/0Miles/StetCSS/issues/49)
* **compiler:** warn about custom modes under the default media trigger ([2726d86](https://github.com/0Miles/StetCSS/commit/2726d864ad77ebaa54e1a31f46d251d85ce2ec1e)), closes [#70](https://github.com/0Miles/StetCSS/issues/70)
* **engine:** reject [@light](https://github.com/light) and [@dark](https://github.com/dark) classes when the mode is not declared ([efd059a](https://github.com/0Miles/StetCSS/commit/efd059aabc6c257ac789ed8453992a189517864a)), closes [#69](https://github.com/0Miles/StetCSS/issues/69)
* **project:** read .mjs files as project sources ([7ca59e4](https://github.com/0Miles/StetCSS/commit/7ca59e488a3870375a3ce532dd220d80e103acdb))
* **stylesheet:** compose package utilities from an entry in static builds ([404b998](https://github.com/0Miles/StetCSS/commit/404b998786b9cb264557d765a02d3d4aaa54be89)), closes [#57](https://github.com/0Miles/StetCSS/issues/57)
* **stylesheet:** emit theme tokens native CSS reaches through an inline variable ([47b1179](https://github.com/0Miles/StetCSS/commit/47b1179c4b30c3cffa87ff00a78b849066f07398)), closes [#185](https://github.com/0Miles/StetCSS/issues/185)
* **stylesheet:** expand relative [@import](https://github.com/import) conditions like the compiler ([4a833c7](https://github.com/0Miles/StetCSS/commit/4a833c72fe4a42ed67250c6743a1388ce120035f)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **stylesheet:** find entry imports with the lexer's import scanner ([371e131](https://github.com/0Miles/StetCSS/commit/371e1314036289b68c7e8e1e64e8bbd546f52f68)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)
* **stylesheet:** keep generated keyframes reachable in Vue scoped styles ([67e21d9](https://github.com/0Miles/StetCSS/commit/67e21d9e2cf3edb141ce248d629db251933b17e3)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)
* **stylesheet:** keep generated rules global in Vue scoped styles ([ef88829](https://github.com/0Miles/StetCSS/commit/ef88829e93d220108fd15e4d5178162b3eb0d1f0)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)
* **stylesheet:** keep the written layer order in build host sources ([122f7b3](https://github.com/0Miles/StetCSS/commit/122f7b3348abf7243b12eac83403d35de2d2e912)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **stylesheet:** read the directives of Sass stylesheet entries ([90193eb](https://github.com/0Miles/StetCSS/commit/90193eb6bc8905af93958a31c14602e37aaf4290)), closes [#58](https://github.com/0Miles/StetCSS/issues/58)


### Performance Improvements

* **stylesheet:** share one local style context across local stylesheets ([de8952b](https://github.com/0Miles/StetCSS/commit/de8952b3c97e65dcb864ac7d215e99328a868348)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>svelte: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/svelte-v0.1.0...svelte-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **svelte:** the `@stet-css/svelte/hooks.server` subpath and its exports (`handle`, `createMasterCSSHandle`, `createMasterCSSChunkRenderer`, `collectMasterCSSClasses`, `injectMasterStyle`, `createMasterCSSStaticHydrationManifestWriter` and their types) are removed. Delete the `hooks.server` re-export from SvelteKit projects.
* **svelte:** `@stet-css/svelte/vite` defaults to static instead of progressive, and no longer exports `SVELTEKIT_SSR_EXTERNAL`. Pass

### Features

* **svelte:** build static CSS when masterCSS() has no options ([de23eaf](https://github.com/0Miles/StetCSS/commit/de23eaf4ad84d21ca957e5f4cf576b34c0c60295)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **svelte:** drop the hooks.server server rendering path ([075c2b8](https://github.com/0Miles/StetCSS/commit/075c2b88590442b3a386dcfd4543ad285d9a319e)), closes [#55](https://github.com/0Miles/StetCSS/issues/55)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)


### Code Refactoring

* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>validator: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/validator-v0.1.0...validator-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
</details>

<details><summary>vite: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/vite-v0.1.0...vite-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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
* **vite,webpack:** Vite configs or tools that find these plugins by name must use the new names. Generated CSS is unchanged.
* **scanner:** intermediate CSS that a build plugin has not yet spliced carries the new selector. Final generated CSS is unchanged: the placeholder never survives a successful build.
* **integration:** imports of the old virtual ids and query no longer resolve; there is no alias because nothing has been published yet. client.d.ts declares only the new ids. Generated CSS is unchanged.
* **compiler:** reject every @master at-rule; entries need @import '@stet-css/core'
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key
* **scanner:** keep only cache and validation, with adapters as the only option
* **stylesheet:** make the class set the only source of generated classes
* **vite,astro:** build static CSS only
* **astro:** build static CSS only
* **stylesheet:** keep all native CSS in stylesheet entries
* **vite:** `masterCSS()` without `mode` no longer injects the runtime. Pass `mode: 'runtime'` to keep the previous output.
* **vite:** read static classes from the project's files
* **engine:** remove root-size and take base-unit as a CSS length

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **engine:** remove root-size and take base-unit as a CSS length ([b069347](https://github.com/0Miles/StetCSS/commit/b0693477db5739924b0358d2faf5a005627bdbb8)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** keep only cache and validation, with adapters as the only option ([5e4bae4](https://github.com/0Miles/StetCSS/commit/5e4bae4646f0ca7d93d7339b761f1c6210eab15b)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **scanner:** rename the build placeholder rule to #stet-css-slot ([bd503d9](https://github.com/0Miles/StetCSS/commit/bd503d9ab4f9e8d264bff5cbb7e2279553933133)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **vite,astro:** build static CSS only ([209488d](https://github.com/0Miles/StetCSS/commit/209488d0ed419c6e0fbda383d6a3ee68eadaf58e)), closes [#59](https://github.com/0Miles/StetCSS/issues/59)
* **vite,webpack:** rename build plugin names and log prefixes to stet-css ([7bb4197](https://github.com/0Miles/StetCSS/commit/7bb4197d34a7f6ed1794345c78e4bbd44d14307e)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **vite:** build static CSS when masterCSS() has no options ([a66774c](https://github.com/0Miles/StetCSS/commit/a66774c8cd9809d2701152ece54d702a1d00ce02)), closes [#53](https://github.com/0Miles/StetCSS/issues/53)
* **vite:** let first-party integrations name the project directories ([fc18702](https://github.com/0Miles/StetCSS/commit/fc187026d247659497a9b3f2a7c4025c017b4cab)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **vite:** read static classes from the project's files ([7459689](https://github.com/0Miles/StetCSS/commit/7459689f042c45d07744baa6f384b94755c84f1a))
* **vite:** warn when a build registers no Master CSS entry ([36d54f8](https://github.com/0Miles/StetCSS/commit/36d54f8eea7cf30b3fd434a80ca634db1ac3b851)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **vite:** compare dev CSS updates with the CSS before the edit ([459ea07](https://github.com/0Miles/StetCSS/commit/459ea0741642f9d0f43c92489c32624de50d5006))
* **vite:** declare the spliced CSS layers before a kept layered [@import](https://github.com/import) ([0f8d0e1](https://github.com/0Miles/StetCSS/commit/0f8d0e11791cd7d535592e8c93078bc13f88d5ea)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **vite:** derive the CSS asset digest from every discovered entry ([5e6b301](https://github.com/0Miles/StetCSS/commit/5e6b301c9651fbf8d5aad4f0fc27928ce38a367d))
* **vite:** ignore bundler timing warnings in the CSS asset tests ([ccd10d2](https://github.com/0Miles/StetCSS/commit/ccd10d20981993c69b1596d36c4c8ecf780901bf))
* **vite:** keep the edited stylesheet in dev hot updates ([e8c244b](https://github.com/0Miles/StetCSS/commit/e8c244b6307f050f6b7a940930d2ea3a7adc3825))
* **vite:** name built CSS assets after the generated CSS ([786bad8](https://github.com/0Miles/StetCSS/commit/786bad84127babe3ecf001b5be54ed9bef869e0e))
* **vite:** order stylesheet entries by path in the generated CSS ([b89489e](https://github.com/0Miles/StetCSS/commit/b89489e83e870f9f22877380194daf0d1e7f7787))
* **vite:** refresh the server environment's CSS entry on dev changes ([032d6ab](https://github.com/0Miles/StetCSS/commit/032d6ab2c7727ccdbd844c15285a2ec80d68dd10)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **vite:** restore host layer statements Vite's build hoists imports past ([e118a2f](https://github.com/0Miles/StetCSS/commit/e118a2fa4b7b024741c89e2dfdcae9855189504d)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **vite:** track the splice placeholder per build environment ([235a60d](https://github.com/0Miles/StetCSS/commit/235a60d8af05772d0a4dc699a469f99b0c2b2c3c))
* **vite:** type registerStyleCSSSource through @stet-css/stylesheet ([d0834e3](https://github.com/0Miles/StetCSS/commit/d0834e3c6471c3db56efbd2c2b6d8c99fa05ef6b)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)


### Performance Improvements

* **vite:** coalesce dev source updates into one pending update ([1636417](https://github.com/0Miles/StetCSS/commit/16364176f7d6d839119a069f30404f6eca0dbb19))


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
</details>

<details><summary>webpack: 0.2.0</summary>

## [0.2.0](https://github.com/0Miles/StetCSS/compare/webpack-v0.1.0...webpack-v0.2.0) (2026-11-18)


###   BREAKING CHANGES

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


### Performance Improvements

* **webpack:** lower CSS Modules against the shared local style context ([140e6fd](https://github.com/0Miles/StetCSS/commit/140e6fdc35d0584bdc4ab67cbd17fb94d3ba461f)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **next:** rename withMasterCSS, its loaders and manifest patterns to StetCSS ([db65d17](https://github.com/0Miles/StetCSS/commit/db65d17829562bdf9a1ae1a094047fabb2ac69ca))
* **schema:** rename MasterCSS manifest types, constants and helpers to StetCSS ([e1c755a](https://github.com/0Miles/StetCSS/commit/e1c755a7f6537952b8117def00b5946cd06b8db8))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
* **webpack:** rename the MasterCSSPlugin class, its tap name and webpack context types to StetCSS ([c8e988c](https://github.com/0Miles/StetCSS/commit/c8e988c2f004dcd6b283f4a9a8f6297dd9181e76))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).