# Changelog

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
* **stylesheet:** make the class set the only source of generated classes

### Bug Fixes

* **source:** bound the oxc parse thread's memory, stack and waits ([bc143cb](https://github.com/0Miles/StetCSS/commit/bc143cb5c44b0e8f08dd36dc136d026ef63008d5)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** make every backtracking extraction pattern single-pass ([fd1b2e3](https://github.com/0Miles/StetCSS/commit/fd1b2e3eb29a00596fd98cfc8d9cb355a86ffb13)), closes [#77](https://github.com/0Miles/StetCSS/issues/77)
* **source:** parse JS/TS on a stack sized to the source ([eadd3db](https://github.com/0Miles/StetCSS/commit/eadd3db9c8e828f3f49ac5eae1b4630b18197f44)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** run the nesting prescan inside the oxc stack module ([26790af](https://github.com/0Miles/StetCSS/commit/26790af152f95ee461f1036047c82974230cf0c1)), closes [#76](https://github.com/0Miles/StetCSS/issues/76)
* **source:** scan long tokens once in text extraction ([2e68924](https://github.com/0Miles/StetCSS/commit/2e68924eceaf6ae4816c4ca0151ab68d8026fe6a)), closes [#77](https://github.com/0Miles/StetCSS/issues/77)


### Performance Improvements

* **source:** find each decorator @ once and share the scan removal loop ([318bb40](https://github.com/0Miles/StetCSS/commit/318bb40dd397a6bd5859e8877d20d8187adb27af))


### Code Refactoring

* **lexer:** rename MasterCSS class-list, tokenizer and entry helpers to StetCSS ([ae0a26a](https://github.com/0Miles/StetCSS/commit/ae0a26a729c9130b0ba1f6eb990d66c396e4dea0))
* **stylesheet:** make the class set the only source of generated classes ([4c98cc3](https://github.com/0Miles/StetCSS/commit/4c98cc3e44c98fa16d68f87a02c9a661e6deecd2)), closes [#65](https://github.com/0Miles/StetCSS/issues/65)
