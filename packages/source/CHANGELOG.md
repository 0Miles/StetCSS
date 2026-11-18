# Changelog

## [0.2.0](https://github.com/0Miles/StetCSS/compare/source-v0.1.0...source-v0.2.0) (2026-11-18)


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
