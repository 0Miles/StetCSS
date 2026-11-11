# @stet-css/engine

Executes `MasterCSSManifest` values: class matching, value, selector, and condition parsing, rule priority and cascade layer insertion, variables, animations, hydration manifest generation, and CSS text. It also holds the **built-in registries** (key aliases, native value namespaces, namespaces), which manifests never carry.

## Boundaries

- CSS-first authoring: `@stet-css/compiler` lowers CSS into a manifest; engine's `src/compile-manifest.ts` only builds in-memory matcher indexes from a finished manifest.
- Default tokens, variants, and utilities are preset CSS in `@stet-css/preset`; new utilities climb the utility ladder.

## Risks

- **Runtime surface**: `@stet-css/runtime` extends `MasterCSS`, so `src/core.ts` and every root value export ship to browsers. Put lint, language, and compiler-only helpers in the `./inspect` or `./compiler` subpaths.
- **Manifest payload**: keep compiled indexes and caches out of `MasterCSSManifest`; serializing one into it needs a browser payload measurement first.
- **Order and globals**: compiled utility order, `compareRulePriority`, layer insertion, and variable and animation token counts (seeded from `emittedGlobals`) decide the output as much as each rule's text; treat a change in any of them as a CSS output change, and a change to generated hydration manifests as a wire-format change in `@stet-css/schema`.

## Validation

Once correctness checks pass, run `pnpm --filter @stet-css/engine bench` for changes to class matching, rule creation or generation, parsing, priority sorting, layer insertion, manifest loading or compilation, or caches and indexes. Report the bench result, `dist/core.js` raw/gzip/brotli size, memory, cold-start, and runtime CPU tradeoffs, and whether CSS output or cascade order changed; for runtime-covered changes, add the likely `@stet-css/runtime` browser bundle impact.
