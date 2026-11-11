# AI Notes For `@stet-css/eslint-config`

## Responsibility

`@stet-css/eslint-config` combines the recommended class linting config and stylesheet linting config from `@stet-css/eslint-plugin`.

## Owns

- Config wrapper package entrypoint.
- Compatibility with the plugin recommended and stylesheet config shapes.

## Does Not Own

- ESLint rules.
- Plugin settings schema.
- Class parsing, validation, ordering, or autofix behavior.

## Public Surface

- Root config export.

## Key Files

- `src/index.ts`

## Risk Areas

- Public config compatibility.
- Drift from `@stet-css/eslint-plugin` recommended config.

## Safe Changes

- Wrapper export fixes that stay aligned with the plugin.
- Tests for config re-export behavior.

## Dangerous Changes

- Diverging from the plugin recommended config without a clear reason.
- Adding rule behavior here instead of in `@stet-css/eslint-plugin`.

## Validation

```sh
pnpm --filter @stet-css/eslint-config test
pnpm --filter @stet-css/eslint-config lint
pnpm --filter @stet-css/eslint-config type-check
pnpm --filter @stet-css/eslint-config build
```
