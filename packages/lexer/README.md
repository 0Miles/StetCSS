# @stet-css/lexer

Dependency-free lexical source scanners for StetCSS tooling.

## Installation

```bash
npm install @stet-css/lexer
```

## Responsibility

`@stet-css/lexer` identifies source ranges, directive boundaries, quoted strings, class lexical tokens, CSS manifest entry statements, JS/TS nesting depth, and unit constants shared by StetCSS packages.

It does not validate classes, generate CSS, resolve manifests, compile directives, or extract source-level class candidates.

## API

```ts
import {
  collectCSSDirectiveRanges,
  findCSSManifestEntryStatements,
  tokenizeStetCSSClass,
} from '@stet-css/lexer'
```

Common uses:

| API area | Purpose |
| --- | --- |
| Source primitives | Stable offsets and source locations. |
| Directive ranges | Locate CSS directives and quoted arguments without compiling them. |
| Manifest entry scanners | Detect the `@import '@stet-css/core'` entry marker. |
| Class tokenizers | Split StetCSS class strings into lexical token ranges. |
| Script nesting | `exceedsScriptNestingLimit` flags JS/TS nested too deep to hand to a native parser. |
| Unit constants | Shared lexical constants for CSS units. |

Use `@stet-css/source` for source-format-aware class candidate extraction.
