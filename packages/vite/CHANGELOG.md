# Changelog

## [0.3.0](https://github.com/0Miles/StetCSS/compare/vite-v0.2.0...vite-v0.3.0) (2026-11-26)


### ⚠ BREAKING CHANGES

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

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
* **integration:** rename virtual module ids to stet-css ([ae4478b](https://github.com/0Miles/StetCSS/commit/ae4478ba7e6e76e05a818c496fdde982f5a206e1)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **scanner:** keep only cache and validation, with adapters as the only option ([5e4bae4](https://github.com/0Miles/StetCSS/commit/5e4bae4646f0ca7d93d7339b761f1c6210eab15b)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **scanner:** rename the build placeholder rule to #stet-css-slot ([bd503d9](https://github.com/0Miles/StetCSS/commit/bd503d9ab4f9e8d264bff5cbb7e2279553933133)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **stylesheet:** keep all native CSS in stylesheet entries ([08ca8a7](https://github.com/0Miles/StetCSS/commit/08ca8a7e6e0c08e4a10e7817ffc444bbfa4940b1)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **vite,astro,svelte,nuxt:** take adapters flat and reject every other key ([430e094](https://github.com/0Miles/StetCSS/commit/430e094996ddfad434769193aa180ce5c358517d)), closes [#66](https://github.com/0Miles/StetCSS/issues/66)
* **vite,astro:** build static CSS only ([209488d](https://github.com/0Miles/StetCSS/commit/209488d0ed419c6e0fbda383d6a3ee68eadaf58e)), closes [#59](https://github.com/0Miles/StetCSS/issues/59)
* **vite,webpack:** rename build plugin names and log prefixes to stet-css ([7bb4197](https://github.com/0Miles/StetCSS/commit/7bb4197d34a7f6ed1794345c78e4bbd44d14307e)), closes [#92](https://github.com/0Miles/StetCSS/issues/92)
* **vite:** build static CSS when masterCSS() has no options ([a66774c](https://github.com/0Miles/StetCSS/commit/a66774c8cd9809d2701152ece54d702a1d00ce02)), closes [#53](https://github.com/0Miles/StetCSS/issues/53)
* **vite:** let first-party integrations name the project directories ([fc18702](https://github.com/0Miles/StetCSS/commit/fc187026d247659497a9b3f2a7c4025c017b4cab)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)
* **vite:** warn when a build registers no Master CSS entry ([36d54f8](https://github.com/0Miles/StetCSS/commit/36d54f8eea7cf30b3fd434a80ca634db1ac3b851)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)


### Bug Fixes

* name StetCSS in messages, logs and comments ([f132d89](https://github.com/0Miles/StetCSS/commit/f132d89762bc95ebe2af75e5e31e67d9409b4945)), closes [#95](https://github.com/0Miles/StetCSS/issues/95)
* **vite:** declare every entry's leading layers in the build host statement ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([8dfe2bc](https://github.com/0Miles/StetCSS/commit/8dfe2bc3b3530c31ce48c7e8e47ce1bdd394979c))
* **vite:** declare the spliced CSS layers before a kept layered [@import](https://github.com/import) ([0f8d0e1](https://github.com/0Miles/StetCSS/commit/0f8d0e11791cd7d535592e8c93078bc13f88d5ea)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **vite:** derive the CSS asset digest from every discovered entry ([5e6b301](https://github.com/0Miles/StetCSS/commit/5e6b301c9651fbf8d5aad4f0fc27928ce38a367d))
* **vite:** ignore bundler timing warnings in the CSS asset tests ([ccd10d2](https://github.com/0Miles/StetCSS/commit/ccd10d20981993c69b1596d36c4c8ecf780901bf))
* **vite:** keep @stet-css/schema out of the emitted declarations ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([20ef521](https://github.com/0Miles/StetCSS/commit/20ef5211e61feb47a63ccde62d4637c8a6b1c165))
* **vite:** keep the dev emittedGlobals module and CSS updates in step ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([aa76143](https://github.com/0Miles/StetCSS/commit/aa76143be68bf11cd8ce1cbf10ce6b5fd16f0ff8))
* **vite:** keep the edited stylesheet in dev hot updates ([e8c244b](https://github.com/0Miles/StetCSS/commit/e8c244b6307f050f6b7a940930d2ea3a7adc3825))
* **vite:** lead dev CSS with the layers of entries not yet registered ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([473ffe4](https://github.com/0Miles/StetCSS/commit/473ffe44914175bdd492a7dbd2ae8a00407e982c))
* **vite:** lead only with the layers of entries the app imports ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([72733c6](https://github.com/0Miles/StetCSS/commit/72733c65b09091bb89fc071c934aedf0f80e3857))
* **vite:** name built CSS assets after the generated CSS ([786bad8](https://github.com/0Miles/StetCSS/commit/786bad84127babe3ecf001b5be54ed9bef869e0e))
* **vite:** order stylesheet entries by path in the generated CSS ([b89489e](https://github.com/0Miles/StetCSS/commit/b89489e83e870f9f22877380194daf0d1e7f7787))
* **vite:** refresh the server environment's CSS entry on dev changes ([032d6ab](https://github.com/0Miles/StetCSS/commit/032d6ab2c7727ccdbd844c15285a2ec80d68dd10)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **vite:** regenerate the dev emittedGlobals module with the managed CSS ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([fd4afe6](https://github.com/0Miles/StetCSS/commit/fd4afe6d2ae0efbed24cff863cb91a451c874166))
* **vite:** register a discovered entry again when a file it imports changes ([#250](https://github.com/0Miles/StetCSS/issues/250)) ([aaaeaac](https://github.com/0Miles/StetCSS/commit/aaaeaac4493adb2627cdc70d2d397e387ac05bea))
* **vite:** restore host layer statements Vite's build hoists imports past ([e118a2f](https://github.com/0Miles/StetCSS/commit/e118a2fa4b7b024741c89e2dfdcae9855189504d)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **vite:** treat a changed wildcard [@blocklist](https://github.com/blocklist) as a changed registration ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([b8e69b0](https://github.com/0Miles/StetCSS/commit/b8e69b0e72400be9b53d71c2864ba8f5a3bc97d0))
* **vite:** type registerStyleCSSSource through @stet-css/stylesheet ([d0834e3](https://github.com/0Miles/StetCSS/commit/d0834e3c6471c3db56efbd2c2b6d8c99fa05ef6b)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/vite-v0.1.0...vite-v0.2.0) (2026-11-26)


### ⚠ BREAKING CHANGES

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

### Features

* **astro:** build static CSS only ([ccdf51d](https://github.com/0Miles/StetCSS/commit/ccdf51d2b6e37b5ca5fb72c10a39c8af631bd5e6)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **compiler:** reject every [@master](https://github.com/master) at-rule; entries need [@import](https://github.com/import) '@stet-css/core' ([f5a72e8](https://github.com/0Miles/StetCSS/commit/f5a72e8a7544f4c64654ddaa4478871b3a6038c1)), closes [#64](https://github.com/0Miles/StetCSS/issues/64)
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
* **vite:** keep @stet-css/schema out of the emitted declarations ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([20ef521](https://github.com/0Miles/StetCSS/commit/20ef5211e61feb47a63ccde62d4637c8a6b1c165))
* **vite:** keep the dev emittedGlobals module and CSS updates in step ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([aa76143](https://github.com/0Miles/StetCSS/commit/aa76143be68bf11cd8ce1cbf10ce6b5fd16f0ff8))
* **vite:** keep the edited stylesheet in dev hot updates ([e8c244b](https://github.com/0Miles/StetCSS/commit/e8c244b6307f050f6b7a940930d2ea3a7adc3825))
* **vite:** name built CSS assets after the generated CSS ([786bad8](https://github.com/0Miles/StetCSS/commit/786bad84127babe3ecf001b5be54ed9bef869e0e))
* **vite:** order stylesheet entries by path in the generated CSS ([b89489e](https://github.com/0Miles/StetCSS/commit/b89489e83e870f9f22877380194daf0d1e7f7787))
* **vite:** refresh the server environment's CSS entry on dev changes ([032d6ab](https://github.com/0Miles/StetCSS/commit/032d6ab2c7727ccdbd844c15285a2ec80d68dd10)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
* **vite:** regenerate the dev emittedGlobals module with the managed CSS ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([fd4afe6](https://github.com/0Miles/StetCSS/commit/fd4afe6d2ae0efbed24cff863cb91a451c874166))
* **vite:** restore host layer statements Vite's build hoists imports past ([e118a2f](https://github.com/0Miles/StetCSS/commit/e118a2fa4b7b024741c89e2dfdcae9855189504d)), closes [#183](https://github.com/0Miles/StetCSS/issues/183)
* **vite:** track the splice placeholder per build environment ([235a60d](https://github.com/0Miles/StetCSS/commit/235a60d8af05772d0a4dc699a469f99b0c2b2c3c))
* **vite:** treat a changed wildcard [@blocklist](https://github.com/blocklist) as a changed registration ([#251](https://github.com/0Miles/StetCSS/issues/251)) ([b8e69b0](https://github.com/0Miles/StetCSS/commit/b8e69b0e72400be9b53d71c2864ba8f5a3bc97d0))
* **vite:** type registerStyleCSSSource through @stet-css/stylesheet ([d0834e3](https://github.com/0Miles/StetCSS/commit/d0834e3c6471c3db56efbd2c2b6d8c99fa05ef6b)), closes [#56](https://github.com/0Miles/StetCSS/issues/56)


### Performance Improvements

* **vite:** coalesce dev source updates into one pending update ([1636417](https://github.com/0Miles/StetCSS/commit/16364176f7d6d839119a069f30404f6eca0dbb19))


### Code Refactoring

* **compiler:** rename MasterCSS manifest, package-entry and variant helpers to StetCSS ([0fbe071](https://github.com/0Miles/StetCSS/commit/0fbe0715383c301a8a81060e491d4e70074f5418))
* **engine:** rename the MasterCSS engine class, options and inspection types to StetCSS ([2a1c5d5](https://github.com/0Miles/StetCSS/commit/2a1c5d5aaa1e61163645afafab2fe98064313e95))
* **integration:** rename MasterCSS manifest-module constants and loaders to StetCSS ([08f083a](https://github.com/0Miles/StetCSS/commit/08f083a54c8cf3caec7ed7910158e46d2aedbc72))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
* **stylesheet:** rename MasterCSS style-source helpers and the masterCSS flag to StetCSS ([098d56c](https://github.com/0Miles/StetCSS/commit/098d56cf888539addd46ea3beb8dcd62eb0d8faa))

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **vite:** derive the CSS asset digest from every discovered entry ([5e6b301](https://github.com/0Miles/StetCSS/commit/5e6b301c9651fbf8d5aad4f0fc27928ce38a367d))
* **vite:** ignore bundler timing warnings in the CSS asset tests ([ccd10d2](https://github.com/0Miles/StetCSS/commit/ccd10d20981993c69b1596d36c4c8ecf780901bf))
* **vite:** keep the edited stylesheet in dev hot updates ([e8c244b](https://github.com/0Miles/StetCSS/commit/e8c244b6307f050f6b7a940930d2ea3a7adc3825))
* **vite:** name built CSS assets after the generated CSS ([786bad8](https://github.com/0Miles/StetCSS/commit/786bad84127babe3ecf001b5be54ed9bef869e0e))
* **vite:** order stylesheet entries by path in the generated CSS ([b89489e](https://github.com/0Miles/StetCSS/commit/b89489e83e870f9f22877380194daf0d1e7f7787))
* **vite:** refresh the server environment's CSS entry on dev changes ([032d6ab](https://github.com/0Miles/StetCSS/commit/032d6ab2c7727ccdbd844c15285a2ec80d68dd10)), closes [#54](https://github.com/0Miles/StetCSS/issues/54)
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
