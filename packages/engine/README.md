# @stet-css/engine

The manifest-driven Master CSS engine.

## Installation

```bash
npm install @stet-css/engine
```

## Responsibility

`@stet-css/engine` executes `MasterCSSManifest` values. It owns class matching, value parsing, selector and at-rule parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, hydration manifest generation, CSS text emission, and built-in key/namespace registries.

This package does not discover project files, resolve CSS imports, compile CSS directives, or integrate with frameworks.

## API

### `MasterCSS`

```ts
import { MasterCSS } from '@stet-css/engine'

const css = MasterCSS.create({ manifest })

css.ensureClassRules('text:center', 'font:semibold')
console.log(css.text)
```

| API | Description |
| --- | --- |
| `MasterCSS.create({ manifest, emittedGlobals })` | Creates a `MasterCSS` instance. |
| `css.ensureClassRules(...classNames)` | Ensures class names have generated rules. |
| `css.deleteClassRules(...classNames)` | Deletes generated rules for class names. |
| `css.createRule(className)` | Creates one generated rule without inserting it. |
| `css.createRules(className)` | Creates all generated rule branches without inserting them. |
| `css.refresh(manifest?)` | Refreshes with a compiled manifest. |
| `css.reset()` | Clears rules and state. |
| `css.text` | Generated CSS text. |

### Compiler helpers

`@stet-css/engine/compiler` exposes parse, generate, inspect, and built-in registry helpers used by the compiler, language tooling, docs, and tests.

```ts
import {
  builtinKeyAliases,
  builtinNativeValueNamespaces,
  compareRulePriority,
} from '@stet-css/engine/compiler'
```

### Inspection helpers

`@stet-css/engine/inspect` exposes tooling-only class inspection helpers for lint and language tooling without adding those methods to the runtime-covered `MasterCSS` prototype.

```ts
import { inspectMasterCSSClass } from '@stet-css/engine/inspect'

const inspection = inspectMasterCSSClass(css, 'fg:red:hover')
```

## Related packages

- `@stet-css/core` is the public facade over this package and the default preset.
- `@stet-css/compiler` lowers CSS directives into manifests.
- `@stet-css/runtime` runs the engine against live browser DOM roots.
