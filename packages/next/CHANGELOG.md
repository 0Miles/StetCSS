# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/next-v0.2.0...next-v0.3.0) (2026-11-26)


### Miscellaneous Chores

* **next:** Synchronize stet-css versions

## [0.2.0](https://github.com/0Miles/StetCSS/compare/next-v0.1.0...next-v0.2.0) (2026-11-26)


### Bug Fixes

* **next:** compile CSS Modules with [@compose](https://github.com/compose) as CSS Modules ([#244](https://github.com/0Miles/StetCSS/issues/244)) ([ce2eb8a](https://github.com/0Miles/StetCSS/commit/ce2eb8ad8f2ace26f2cb1bc3ce55ba69977bbb7a))
* **stylesheet:** keep CSS Module theme rules pure after Sass compression ([#244](https://github.com/0Miles/StetCSS/issues/244)) ([52c6786](https://github.com/0Miles/StetCSS/commit/52c678639a1eb784be2a559c3759fc2411e1f87f))


### Performance Improvements

* **next:** lower CSS Modules against the shared local style context ([210f2e7](https://github.com/0Miles/StetCSS/commit/210f2e7079d1533eb2b049d29b0bd2d91a5c0583)), closes [#202](https://github.com/0Miles/StetCSS/issues/202)

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


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **next:** rename withMasterCSS, its loaders and manifest patterns to StetCSS ([db65d17](https://github.com/0Miles/StetCSS/commit/db65d17829562bdf9a1ae1a094047fabb2ac69ca))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))
