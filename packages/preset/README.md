# @stet-css/preset

The default Master CSS preset source and compiled manifest.

## Installation

```bash
npm install @stet-css/preset
```

Most applications should import preset styles through `@stet-css/core`. Use this package directly when tooling needs the preset package boundary.

## CSS entries

```css
@import '@stet-css/preset';
@import '@stet-css/preset/base.css';
@import '@stet-css/preset/theme.css';
@import '@stet-css/preset/variants.css';
@import '@stet-css/preset/utilities.css';
```

The default index entry contains:

```css
@import "./base.css";
@import "./theme.css";
@import "./variants.css";
@import "./utilities.css";
```

`base.css` declares the stable cascade layer order:

```css
@layer theme, base, defaults, components, utilities;
```

## Manifest

The compiled default manifest is available as JSON:

```ts
import defaultManifest from '@stet-css/preset/default-manifest.json'
```

The generated manifest is derived from the preset CSS source. Do not edit generated manifest output by hand.

## Related packages

- `@stet-css/core` re-exports the preset CSS entries for application use.
- `@stet-css/engine` owns built-in key aliases and native value namespaces.
- `@stet-css/compiler` compiles preset CSS source into manifest data.
