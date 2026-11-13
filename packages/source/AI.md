# @stet-css/source

Owns **candidate extraction**: pulling unvalidated, class-like strings out of raw source text, plus the format-aware source adapters (HTML, OXC for JS/TS, Astro, Svelte, Vue) and the order they are tried in (`resolveSourceAdapter`, `extractSourceClassCandidates`), shared by the scanner's module scan and the stylesheet's project class set.

## Boundaries

- Candidate validation and rule insertion: `@stet-css/scanner` (through `@stet-css/validator`) for module scans, rendering in `@stet-css/stylesheet` for project files; source returns strings only.
- Lexical primitives (source ranges, class-list tokenizing, unit constants): `@stet-css/lexer`.

## Risks

- **Candidates are CSS output**: an extra candidate adds rules and a missed one drops required CSS, so treat a change in what an adapter extracts as a CSS output change.
- **Static strings only**: OXC extraction reads string literals and expression-free template literals; treat concatenated or interpolated class names as not statically knowable.
- **OXC parsing**: JS/TS that OXC fails to parse, or that nests past `exceedsScriptNestingLimit` from `@stet-css/lexer` (deep enough to crash OXC), falls back to `extractClassCandidates` text extraction, so parser differences shift the candidate set.
- **Adapter matching** keys on the file id and extension, including ids with a `?query` suffix; a wrong match routes the file to the wrong extractor.
- **Optional peers**: when `vue` or `svelte` is missing, the adapter warns once per specifier and falls back to text extraction (`src/adapters/optional-peer.ts`).
