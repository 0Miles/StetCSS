# @stet-css/eslint-config

An ESLint config enforcing a consistent coding style for StetCSS.

## Installation

```bash
npm install -D @stet-css/eslint-config
```

## Usage

Use the flat config in `eslint.config.js`:

```js
import { defineConfig } from 'eslint/config'
import css from '@stet-css/eslint-config'

export default defineConfig([
  ...css
])
```

This package combines the recommended class linting config and the standalone stylesheet config from `@stet-css/eslint-plugin`.

For custom rules and settings, configure the plugin rules in the same flat config:

```js
import { defineConfig } from 'eslint/config'
import css from '@stet-css/eslint-config'

export default defineConfig([
  ...css,
  {
    rules: {
      '@stet-css/no-invalid-classes': ['error', {
        disallowUnknownClass: true
      }]
    }
  }
])
```

## Related docs

- [ESLint plugin package](../eslint-plugin)
