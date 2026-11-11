# @stet-css/eslint-config

The shareable **flat config**: an array of `@stet-css/eslint-plugin`'s `recommended` and `stylesheet` configs, which users spread into their own (`...css`).

## Boundaries

- Rules, severities, settings, and the configs themselves → `@stet-css/eslint-plugin`; this package only composes them.

## Risks

- **Public shape**: the default export stays a flat-config array users can spread.
- **Plugin parity**: export the plugin's configs unchanged, so this package and the plugin's `recommended` config agree; a default change goes into the plugin config.
