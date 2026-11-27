# Changelog

## [0.4.0](https://github.com/0Miles/StetCSS/compare/lexer-v0.3.0...lexer-v0.4.0) (2026-11-27)


### ⚠ BREAKING CHANGES

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
* **lexer:** add a nesting `&` replacement that skips escapes and strings ([#245](https://github.com/0Miles/StetCSS/issues/245)) ([2d7e3e5](https://github.com/0Miles/StetCSS/commit/2d7e3e5bdc8585ad92cf26751fd8254647e38305))
* **lexer:** decode HTML and JSX character references with source ranges ([267ed25](https://github.com/0Miles/StetCSS/commit/267ed251cf880c6833dd73d85437d6aeee72dae4)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **lexer:** decode JavaScript string bodies when parsing class lists ([2c8c1e4](https://github.com/0Miles/StetCSS/commit/2c8c1e4e7fcf3bfdf7c1823269a593ca7411a0a3)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)
* **lexer:** parse class lists by the character references of their attribute ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([e9b5bcc](https://github.com/0Miles/StetCSS/commit/e9b5bcc09de080a19a5cf8d49be55b6ea6051aba))


### Bug Fixes

* **engine:** keep an escaped `@` in a class selector ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([312d427](https://github.com/0Miles/StetCSS/commit/312d427c708be3f8d906cb44cd3ae9cb340f22ce))
* **engine:** keep splitting conditions at every `@` ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([4e7bcd6](https://github.com/0Miles/StetCSS/commit/4e7bcd6ad3901b30ac6ade6ba8120f252bfe6592))
* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)
* **lexer:** colour an escaped selector name as one name ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([c31ecbf](https://github.com/0Miles/StetCSS/commit/c31ecbf41ffa5157a599016c0d4b06203a750aec))
* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* **lexer:** give selector punctuation its own roles and finish nth and attribute edges ([bc1e0e8](https://github.com/0Miles/StetCSS/commit/bc1e0e82ebcac24712c293075b7ea81c068f2a29)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **lexer:** keep the space before a block's closing brace out of an unterminated directive ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([67c6c71](https://github.com/0Miles/StetCSS/commit/67c6c717d5d44eb77f14047959997851f1b4d46a))
* **lexer:** skip CSS escapes outside strings in the shared scanners ([7cbe3ea](https://github.com/0Miles/StetCSS/commit/7cbe3eaac5caa02ba9d828c54a8030f800da9753)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **lexer:** tokenize an attribute selector's case flag ([#237](https://github.com/0Miles/StetCSS/issues/237)) ([2a01aba](https://github.com/0Miles/StetCSS/commit/2a01aba79688b3415cb172cd017dded5dee273cc))
* **lexer:** tokenize attribute selectors, an+b arguments and a query's | ([2bd2f56](https://github.com/0Miles/StetCSS/commit/2bd2f56a33015fa6c16c004cc66fca45dd307f97)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)


### Code Refactoring

* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))

## [0.3.0](https://github.com/0Miles/StetCSS/compare/lexer-v0.2.0...lexer-v0.3.0) (2026-11-26)


### Features

* **lexer:** parse class lists by the character references of their attribute ([#240](https://github.com/0Miles/StetCSS/issues/240)) ([e9b5bcc](https://github.com/0Miles/StetCSS/commit/e9b5bcc09de080a19a5cf8d49be55b6ea6051aba))

## [0.2.0](https://github.com/0Miles/StetCSS/compare/lexer-v0.1.0...lexer-v0.2.0) (2026-11-26)


### Features

* **lexer:** add a nesting `&` replacement that skips escapes and strings ([#245](https://github.com/0Miles/StetCSS/issues/245)) ([2d7e3e5](https://github.com/0Miles/StetCSS/commit/2d7e3e5bdc8585ad92cf26751fd8254647e38305))
* **lexer:** decode HTML and JSX character references with source ranges ([267ed25](https://github.com/0Miles/StetCSS/commit/267ed251cf880c6833dd73d85437d6aeee72dae4)), closes [#194](https://github.com/0Miles/StetCSS/issues/194)
* **lexer:** decode JavaScript string bodies when parsing class lists ([2c8c1e4](https://github.com/0Miles/StetCSS/commit/2c8c1e4e7fcf3bfdf7c1823269a593ca7411a0a3)), closes [#196](https://github.com/0Miles/StetCSS/issues/196)


### Bug Fixes

* **engine:** keep an escaped `@` in a class selector ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([312d427](https://github.com/0Miles/StetCSS/commit/312d427c708be3f8d906cb44cd3ae9cb340f22ce))
* **engine:** keep splitting conditions at every `@` ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([4e7bcd6](https://github.com/0Miles/StetCSS/commit/4e7bcd6ad3901b30ac6ade6ba8120f252bfe6592))
* **lexer:** colour an escaped selector name as one name ([#246](https://github.com/0Miles/StetCSS/issues/246)) ([c31ecbf](https://github.com/0Miles/StetCSS/commit/c31ecbf41ffa5157a599016c0d4b06203a750aec))
* **lexer:** end a nested directive without its last semicolon at the block's closing brace ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([7a45843](https://github.com/0Miles/StetCSS/commit/7a45843017d4c5e4c9eebc53184afa1223508885))
* **lexer:** give selector punctuation its own roles and finish nth and attribute edges ([bc1e0e8](https://github.com/0Miles/StetCSS/commit/bc1e0e82ebcac24712c293075b7ea81c068f2a29)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **lexer:** keep the space before a block's closing brace out of an unterminated directive ([#241](https://github.com/0Miles/StetCSS/issues/241)) ([67c6c71](https://github.com/0Miles/StetCSS/commit/67c6c717d5d44eb77f14047959997851f1b4d46a))
* **lexer:** skip CSS escapes outside strings in the shared scanners ([7cbe3ea](https://github.com/0Miles/StetCSS/commit/7cbe3eaac5caa02ba9d828c54a8030f800da9753)), closes [#186](https://github.com/0Miles/StetCSS/issues/186)
* **lexer:** tokenize an attribute selector's case flag ([#237](https://github.com/0Miles/StetCSS/issues/237)) ([2a01aba](https://github.com/0Miles/StetCSS/commit/2a01aba79688b3415cb172cd017dded5dee273cc))
* **lexer:** tokenize attribute selectors, an+b arguments and a query's | ([2bd2f56](https://github.com/0Miles/StetCSS/commit/2bd2f56a33015fa6c16c004cc66fca45dd307f97)), closes [#201](https://github.com/0Miles/StetCSS/issues/201)
* **stylesheet:** keep an escaped comma inside one selector when scoping Vue generated CSS ([73f6fde](https://github.com/0Miles/StetCSS/commit/73f6fde3f83407edb7ed276f8c1fff28876a7f41)), closes [#189](https://github.com/0Miles/StetCSS/issues/189)

## 0.1.0 (2026-11-17)


### ⚠ BREAKING CHANGES

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
* **lexer:** export the CSS length units ([76a565a](https://github.com/0Miles/StetCSS/commit/76a565af7e5c0bf3c2753baa463d84bb61a0fe60)), closes [#42](https://github.com/0Miles/StetCSS/issues/42)


### Bug Fixes

* **language:** stop highlighting the removed [@preserve](https://github.com/preserve) directive ([0fc407a](https://github.com/0Miles/StetCSS/commit/0fc407a4d563a9368aa77159b94c279eae97521e)), closes [#45](https://github.com/0Miles/StetCSS/issues/45)


### Code Refactoring

* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
