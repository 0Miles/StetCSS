# @stet-css/source

Owns **candidate extraction**: pulling unvalidated, class-like strings out of raw source text, plus the format-aware source adapters (HTML, OXC for JS/TS, Astro, Svelte, Vue) and the order they are tried in (`resolveSourceAdapter`, `extractSourceClassCandidates`), shared by the scanner's module scan and the stylesheet's project class set.

## Boundaries

- Candidate validation and rule insertion: `@stet-css/scanner` (through `@stet-css/validator`) for module scans, rendering in `@stet-css/stylesheet` for project files; source returns strings only.
- Lexical primitives (source ranges, class-list tokenizing, unit constants): `@stet-css/lexer`.

## Risks

- **Candidates are CSS output**: an extra candidate adds rules and a missed one drops required CSS, so treat a change in what an adapter extracts as a CSS output change.
- **Static strings only**: OXC extraction reads string literals and expression-free template literals; treat concatenated or interpolated class names as not statically knowable.
- **OXC parsing**: JS/TS that OXC fails to parse, or that nests past `exceedsScriptNestingLimit` from `@stet-css/lexer` (deep enough to crash OXC), falls back to `extractClassCandidates` text extraction, so parser differences shift the candidate set.
- **Parse stack**: sources over 1 KiB parse on a worker thread whose stack grows with the source (`src/adapters/oxc-stack.ts`), because chains the prescan lets through (one level per line, `else if`, `a = b = c`, `new`) still overflow OXC's native stack and kill the process. The call blocks on `Atomics.wait`, and the worker is dropped after 2 s idle. Sources over 1 MiB would need more than the 1 GiB stack cap, so they skip OXC and use text extraction. When the smallest parse thread cannot start, it warns once and parses inline; when only a larger one cannot, that file uses text extraction. The module also runs the `exceedsScriptNestingLimit` prescan. `@stet-css/language` keeps a copy that differs only in `PACKAGE_NAME`, because `packages/language/AI.md` keeps language's imports off source and the dependency would change `bun.lock` (the AGENTS.md dependency chain itself allows it); `packages/language/tests/oxc-stack-copy.test.ts` fails when they drift.
- **Adapter matching** keys on the file id and extension, including ids with a `?query` suffix; a wrong match routes the file to the wrong extractor.
- **Optional peers**: when `vue` or `svelte` is missing, the adapter warns once per specifier and falls back to text extraction (`src/adapters/optional-peer.ts`).
