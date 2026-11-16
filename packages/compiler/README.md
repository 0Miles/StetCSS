# @stet-css/compiler

Compile Master CSS stylesheet directives into manifest data, native CSS, and directive metadata.

## Installation

```bash
npm install @stet-css/compiler
```

## Responsibility

`@stet-css/compiler` is the CSS source compiler for Master CSS. It parses CSS manifest directives such as `@settings`, `@theme`, `@custom-variant`, `@defaults`, `@components`, `@utilities`, local `@compose`, top-level extraction directives, native CSS, and CSS import graphs.

The compiler delegates class semantics and rule generation to `@stet-css/engine`; project entry discovery belongs to `@stet-css/project`.

## API

### Root entry

Use the root entry in Node environments when CSS imports and filesystem dependencies should be resolved.

```ts
import {
  compileCSS,
  compileCSSFile,
  compileCSSManifest,
  compileCSSManifestFile,
  compileProjectManifest,
} from '@stet-css/compiler'
```

Common flows:

```ts
const result = compileCSSManifest('@theme { --color-primary: #4f46e5; }')
const fileResult = await compileCSSManifestFile('/project/src/index.css')
const projectResult = await compileProjectManifest(['/project/src/index.css'])
```

Compiler results include the compiled manifest, dependency paths, warnings, native CSS, and directive metadata used by build integrations.

Every stylesheet an import graph reads, the entry included, must be a regular file of at most 16 MiB. One import graph inlines at most 10,000 stylesheets and 64 MiB, counting each repeated import of the same file; past these limits compilation fails with an error naming the file.

Each `@reference` compiles the referenced stylesheet, so one compile expands at most 256 `@reference` directives across its whole reference tree, counting each repeated reference of the same file; `compileProjectManifest()` gives each entry stylesheet its own budget. The stylesheets referenced files import count toward the compile's 10,000-stylesheet and 64 MiB limits. Past these limits compilation fails before any referenced stylesheet is compiled, with an error naming the file (the reference chain that reached it, for the `@reference` limit).

### Browser entry

Use `@stet-css/compiler/browser` when CSS import resolution is not needed.

```ts
import { compileCSSManifest } from '@stet-css/compiler/browser'
```

The browser compiler rejects `@reference` directives because they require filesystem resolution.

## Related packages

- `@stet-css/engine` executes compiled manifests.
- `@stet-css/project` discovers and loads project CSS manifest entries.
- `@stet-css/stylesheet` composes stylesheet entries for static rendering.
