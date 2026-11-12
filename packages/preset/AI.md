# @stet-css/preset

Owns the default stylesheet source in `src/*.css` (tokens, utilities, keyframes, variants, and the layer statement in `base.css`) and the **generated artifacts** built from it: `src/default-manifest.json` and `src/default-native.css`.

## Boundaries

- Key aliases, native value namespaces, and namespace registries are engine built-ins in `@stet-css/engine`; the manifest carries none of them.
- Manifest discovery lives in `@stet-css/project`; the public facade in `@stet-css/core`.

## Risks

- **Generated artifacts** change only through source: edit `src/*.css`, then run `bun run --filter @stet-css/preset generate`. Every artifact diff is a CSS output change and needs the source change that explains it.
- **Token namespaces** match the engine built-ins; add a namespace to the engine first.
- **New utilities** climb the utility ladder in `AGENTS.md`; most land as engine aliases or `@utilities` entries in `src/utilities.css`.
