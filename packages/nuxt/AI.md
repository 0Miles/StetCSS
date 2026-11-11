# @stet-css/nuxt

Owns the Nuxt module: it registers `@stet-css/vite` per mode, adds the client runtime plugin (`src/runtime/css-runtime.ts`) and the Nitro server plugin (`src/runtime/css-server.ts`), and wires the project manifest into Vite and Nitro **virtual modules**.

## Boundaries

- Mode semantics and option defaults live in `@stet-css/vite`; `ModuleOptions` is its `PluginOptions`, and Nuxt behaviour stays aligned with it.
- Vue SFC extraction lives in `@stet-css/source`, reached through scanner auto adapters.
- HTML rendering lives in `@stet-css/server`; the browser runtime in `@stet-css/runtime`.

## Risks

- **Client/server split**: on the server, `virtual:master-css-manifest` resolves through Nitro's `virtual` config; on the client, through the Vite plugin. Mode behaviour differs on each side.
- **Server runtime** (`src/runtime/css-server.ts`) runs in Nitro and stays server-safe; browser code goes in `src/runtime/css-runtime.ts`.
- **Nuxt build options** change only when mode behaviour requires it, as `static` does by turning off `features.inlineStyles` (Nuxt cannot inline generated static CSS during SSR).

## Validation

Each mode has a fixture app in `tests/fixtures/<mode>/` driven by `tests/<mode>.test.ts`; extend the matching fixture for mode behaviour changes.
