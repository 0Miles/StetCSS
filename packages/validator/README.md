# @stet-css/validator

Validate generated StetCSS classes and rules.

## Installation

```bash
npm install @stet-css/validator
```

`@stet-css/validator` validates CSS rules generated from StetCSS classes, including at-rules, selectors, and declarations. It is a Node.js package used by extraction and linting workflows.

## API

### `isClassValid()`

Validates whether a string is a valid StetCSS class.

```ts
import { isClassValid } from '@stet-css/validator'

isClassValid('text-center')
// => true

isClassValid('love:css')
// => false
```

Signature:

```ts
isClassValid(syntax: string, css?: StetCSS): boolean
```

### `generateValidRules()`

Validates a class and returns generated rules.

```ts
import { generateValidRules } from '@stet-css/validator'

generateValidRules('text-center')
// => [{...}]

generateValidRules('love:css')
// => []
```

Signature:

```ts
generateValidRules(syntax: string, css?: StetCSS): Rule[]
```

### `validate()`

Validates a class and returns syntax errors.

```ts
import { validate } from '@stet-css/validator'

validate('text-center')
// => []

validate('love:css')
// => [SyntaxError]
```

Signature:

```ts
validate(syntax: string, css?: StetCSS): SyntaxError[]
```
