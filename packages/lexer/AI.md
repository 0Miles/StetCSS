# @stet-css/lexer

Owns **lexical scanning** with exact source ranges: class-list parsing and tokenizing, CSS directive ranges, `@import` and `@master` statement scanning for manifest entries, CSS value and variable-reference helpers, the JS/TS nesting-depth prescan, and unit constants. It returns tokens and ranges; consumers validate and compile them.

## Boundaries

- Class lists vs candidates: lexer parses a class list it is handed (`parseMasterCSSClassList`); finding class-like strings in arbitrary source is `@stet-css/source`.
- Directives and entries: lexer locates directive ranges and entry statements; `@stet-css/compiler` parses and lowers directives, and `@stet-css/project` decides which files are entries.

## Risks

- **Source ranges** hold across tokenization boundaries, duplicate tokens, escaped quote and backtick tokens, and cursor or empty positions (`includeEmpty`). `@stet-css/language`, `@stet-css/lint`, and `@stet-css/eslint-plugin` map diagnostics and edits through them; when a range fix changes what a consumer receives, cover it in that consumer's tests too.
- **Import and directive scanning** feeds compiler parsing, project entry discovery, and editor tokens, so a scanning change reaches all three.
- **Script nesting prescan** (`exceedsScriptNestingLimit`) gates oxc parsing in `@stet-css/source` and `@stet-css/language`: oxc-parser overflows its native stack on deep nesting and kills the process. Counting a construct short lets a crashing file through; counting it long sends ordinary files to text extraction or regex scanning, which find different classes.
- **Dependency-free**: `dependencies` stays empty unless the task explicitly justifies one.
