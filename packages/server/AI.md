# @stet-css/server

Renders the CSS a page needs from its HTML: parses the markup, collects `class` attribute values, generates rules, and writes them into `style#master-css`, optionally with the **hydration manifest** `@stet-css/runtime` hydrates from.

## Boundaries

- Rule generation, sorting and CSS text → `@stet-css/engine`; native-declaration filtering → `@stet-css/validator` (`createServerCSS` is its `createCSSWithNativeDeclarations`).
- Hydrating the rendered style in the browser → `@stet-css/runtime`; scanning source files → `@stet-css/scanner`.

## Risks

- **Entities**: frameworks encode attribute values, so `decodeHTML` restores class entities before rules are generated.
- **One style tag**: update an existing `style#master-css` in place; when `<head>` or `<html>` is missing, create it before inserting.
- **Round-trip**: the parser and serializer run with entity decoding and encoding off, so untouched markup serializes as written.
- **Class source**: rendering reads the HTML `class` attribute only; `className` text, such as serialized framework props, stays data unless the task asks otherwise.

## Validation

Fixture parity in `tests/test.ts`: each `tests/fixtures/<name>/` holds `template.html`, an optional `manifest.css`, and the expected `generated.css`. Add a fixture for a new output case; a `generated.css` diff is a CSS output change.
