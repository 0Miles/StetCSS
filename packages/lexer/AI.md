# @stet-css/lexer

Owns **lexical scanning** with exact source ranges: class-list parsing and tokenizing, CSS directive ranges, `@import` and `@master` statement scanning for manifest entries, CSS value and variable-reference helpers, the JS/TS nesting-depth prescan, and unit constants. It returns tokens and ranges; consumers validate and compile them.

## Boundaries

- Class lists vs candidates: lexer parses a class list it is handed (`parseMasterCSSClassList`); finding class-like strings in arbitrary source is `@stet-css/source`.
- Directives and entries: lexer locates directive ranges and entry statements; `@stet-css/compiler` parses and lowers directives, and `@stet-css/project` decides which files are entries.

## Risks

- **Source ranges** hold across tokenization boundaries, duplicate tokens, escaped quote and backtick tokens, and cursor or empty positions (`includeEmpty`). `@stet-css/language`, `@stet-css/lint`, and `@stet-css/eslint-plugin` map diagnostics and edits through them; when a range fix changes what a consumer receives, cover it in that consumer's tests too.
- **Import and directive scanning** feeds compiler parsing, project entry discovery, and editor tokens, so a scanning change reaches all three.
- **Script nesting prescan** (`exceedsScriptNestingLimit`) gates oxc parsing in `@stet-css/source` and `@stet-css/language`: oxc-parser overflows its native stack on deep nesting and kills the process. Counting a construct short lets a crashing file through; counting it long sends ordinary files to text extraction or regex scanning, which find different classes. Its docstring lists what it counts short on purpose (chains split across lines, closing brackets inside strings, comments or regular expressions). Sources up to 1 KiB parse inline on the caller's stack, as small as a default 4 MB worker-thread stack; longer ones parse on a stack sized to the source, at 1 KiB per character, which assumes the limit caps bracket nesting (brackets cost oxc up to ten times more stack per character than uncounted chains). The `deep-nesting` tests guard both: source feeds the deepest input of 1 KiB or less in every shape to a default-stack worker, and source and language feed the deepest input the prescan allows (over 1 KiB, so it parses on the sized stack). Rerun them after raising the limit or upgrading `oxc-parser`.
- **Dependency-free**: `dependencies` stays empty unless the task explicitly justifies one.
