# @stet-css/language

Owns the editor-neutral **language primitives** shared by the language service, language server, lint, and the VS Code extension: class-position scanning (`ClassPositionCache`), semantic token classification and encoding over class lists and CSS directives, browser and Shiki highlighting helpers, `createLanguageCSS`, and the canonical TextMate grammar in `syntaxes/`.

## Boundaries

- Stateful features (completion, hover, colors) → `@stet-css/language-service`; LSP capabilities and workspace lifecycle → `@stet-css/language-server`.
- Raw class-list splitting and unescaping → `@stet-css/lexer`; manifest-driven class inspection → `@stet-css/engine/inspect`; class syntax and generated CSS → `@stet-css/engine`.

## Risks

- **Imports** stay at the lexer, engine, core, preset, and schema level. Language-service, language-server, VS Code, runtime, server, scanner, and ESLint packages are out of bounds, even though the dependency direction puts some of them on the same tier.
- **Raw ranges**: tokenize class lists with the lexer, but report raw editor offsets so escaped and quoted classes map back to the source.
- **Class-position scanning** covers JSX, Vue, Svelte, Astro, strings, and function calls; a fix for one syntax keeps the others passing.
- **Character references**: class attributes are read by the classes the build extracts (#240): JSX attribute strings in JS/TS documents by `decodeStetCSSJSXAttributeString`, class attributes in HTML, Angular, Vue, Svelte and Astro documents by `decodeStetCSSHTMLAttributeValue`, and strings in a quoted binding such as Vue's `:class="…"` by the HTML decoder before their JavaScript escapes. Markdown, MDX and unknown documents stay as written, as `@stet-css/source` extracts them as plain text; keep `HTML_ATTRIBUTE_LANGUAGE_IDS` in step with its adapters. Positions carry the decoder (`ClassPosition.characterReferences`) so lint re-parses each context the same way. The decoders come from `@stet-css/lexer/character-reference`, so the `./browser` and `./shiki` entries carry its named-reference table. Semantic tokens inside a class spelled with a reference (`inline&#x2d;flex`) fall back to decoded offsets, and completion queries the class's source spelling up to the cursor.
- **Deep nesting**: JS/TS documents nested past `exceedsScriptNestingLimit` from `@stet-css/lexer` skip oxc, which would crash the host process, and fall back to the regex scan, which only finds class functions after whitespace or `.`. Documents over 1 KiB parse on a worker thread whose stack grows with the source (`src/utils/oxc-stack.ts`, which also runs the prescan; a copy of `@stet-css/source`'s that differs only in `PACKAGE_NAME`, kept because the import rule above keeps language off source and the dependency would change `bun.lock`; `tests/oxc-stack-copy.test.ts` fails when they drift). Documents over 1 MiB, and trees too deep for the JS stack to walk, fall back to the regex scan too. Without worker threads (browsers, through `./shiki`) oxc parses inline.
- **Semantic tokens** classify through `@stet-css/engine/inspect`; tooling-only helpers stay off the `StetCSS` prototype, which is on the runtime surface.
- **CSS directive highlighting** scans directives with the lexer (`collectCSSDirectiveRanges`) rather than the compiler pipeline. The TextMate grammar stays compatible with CSS-family documents; the VS Code extension ships it as-is.

## Validation

Extend the suite for the surface you touch: `tests/get-class-position/` (one file per syntax), `tests/browser.test.ts` and `tests/shiki.test.ts` (both cover semantic tokens), and `tests/format-directives.test.ts`.
