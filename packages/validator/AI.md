# @stet-css/validator

Owns **class CSS validity**: whether the CSS a class generates is valid, judged with `css-tree` grammars for at-rules (names, preludes, descriptors) and declarations. It owns the at-rule checks; declarations go through the native declaration check in `@stet-css/compiler/native-declaration` (`checkNativePropertyName`, `matchNativeDeclarationValue`, `cssTreeNativeDeclarationMatcher`), which lives there because the compiler lowers `@compose` with it and cannot depend on this package. This package re-exports the matcher and uses the same check in `validateCSS`, so builds, lint and the compiler accept the same declarations.

It also owns `createCSSWithNativeDeclarations`, which plugs that matcher into `StetCSS`; the scanner, stylesheet, CLI and ESLint plugin build their instances with it.

## Boundaries

- Which rules a class generates is engine behaviour in `@stet-css/engine`; this package judges only the CSS those rules emit.
- Lint diagnostic wording for invalid and unknown classes lives in `@stet-css/lint`.
- Whether a native `property: value` declaration is valid, including the `css-tree` gap exceptions, is `@stet-css/compiler/native-declaration`; this package adds class and at-rule context around it.

## Risks

- **`css-tree` gaps** (newer CSS functions, at-rule preludes, property values): add a narrow exception for the specific construct, with a test, and keep `css-tree` as the parser. Property-value exceptions go in `packages/compiler/src/native-declaration.ts` with rows in its `tests/native-declaration.test.ts`; at-rule exceptions go here.
- **Strict results**: keep `SyntaxError`, `SyntaxMatchError` and `SyntaxReferenceError` reported outside a deliberate exception, and keep classes that generate no rules invalid.
- **`generateValidRules`** returns rules only after every rule's CSS passes `validateCSS`; the scanner and `@stet-css/lint` use its output as already-checked CSS. A group (`{a:b;c:d}`) drops only its invalid declarations, as native CSS and the runtime do; any other failing rule drops the whole class. `validate()` and `isClassValid()` still report the group's invalid declaration.
- **Native declaration matcher**: `cssTreeNativeDeclarationMatcher` (from the compiler) decides whether native `property:value` classes generate rules at all, so changing it is a CSS output change for every instance built with `createCSSWithNativeDeclarations`.

## Validation

CSS-text cases go in `tests/css.test.ts` (calls `validateCSS` directly); class cases go in `tests/test.ts` with the `tests/utils` expect helpers.
