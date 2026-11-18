# StetCSS Diagnostics

Adapter-neutral project inspection reports for StetCSS tooling.

`@stet-css/diagnostics` builds scanner, stylesheet, generated CSS, and missing CSS reports that can be reused by adapters such as `@stet-css/cli`.

It does not own class lint policy. Use `@stet-css/lint` for class-list diagnostics and fixes.

## Usage

```ts
import { createStetCSSInspectionReport } from '@stet-css/diagnostics'

const report = await createStetCSSInspectionReport({
  cwd: process.cwd(),
  patterns: ['src/**/*.{html,tsx}'],
  classes: ['btn', 'card'],
  includeCss: false
})
```

The report uses `version: 1` and includes scanner state, stylesheet entries, generated CSS metadata, missing CSS checks, per-file discoveries, diagnostics, and summary counts.

Each file's `discovered` classes are the candidates that file contains, so a class several files use is listed under each of them. An invalid-class diagnostic points at the first file, in input order, that contains the class. A file's `changed` flag says whether it brought classes no earlier-scanned file had, so it can be `false` for a file whose classes another file already brought.
