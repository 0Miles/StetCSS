# @stet-css/validator

Owns **CSS validity**: whether the CSS a class generates passes `css-tree` grammars for at-rules (names, preludes, descriptors) and declarations. It also owns `createCSSWithNativeDeclarations`, which plugs the `css-tree` native declaration matcher into `MasterCSS`; the scanner, server, stylesheet, CLI, MCP and ESLint plugin build their instances with it.

## Boundaries

- Which rules a class generates is engine behaviour in `@stet-css/engine`; this package judges only the CSS those rules emit.
- Lint diagnostic wording for invalid and unknown classes lives in `@stet-css/lint`.

## Risks

- **`css-tree` gaps** (newer CSS functions, at-rule preludes, property values): add a narrow exception for the specific construct, with a test, and keep `css-tree` as the parser.
- **Strict results**: keep `SyntaxError`, `SyntaxMatchError` and `SyntaxReferenceError` reported outside a deliberate exception, and keep classes that generate no rules invalid.
- **`generateValidRules`** returns rules only after every rule's CSS passes `validateCSS`; the scanner and `@stet-css/lint` use its output as already-checked CSS.
- **Native declaration matcher**: `cssTreeNativeDeclarationMatcher` decides whether native `property:value` classes generate rules at all, so changing it is a CSS output change for every instance built with `createCSSWithNativeDeclarations`.

## Validation

CSS-text cases go in `tests/css.test.ts` (calls `validateCSS` directly); class cases go in `tests/test.ts` with the `tests/utils` expect helpers.
