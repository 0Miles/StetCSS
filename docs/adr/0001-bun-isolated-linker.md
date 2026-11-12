# Bun installs with the isolated linker

The dev toolchain moved from pnpm to Bun (#10). Upstream master-co/css sets `linker = "hoisted"`, but StetCSS sets `linker = "isolated"` in `bunfig.toml`, for two reasons:

- pnpm 11 already ran isolated here. It ignores `shamefully-hoist` in `.npmrc`.
- Hoisting would let workspace source import transitive dependencies it never declares. A published `@stet-css/*` package missing a `dependencies` entry would still pass in the repo, and break only when a user installs it with npm or strict pnpm.

## Consequences

When a failure appears only under Bun, fix it with the first step that works:

1. Declare the dependency in the unpublished workspace that needs it, using a version already in `bun.lock`.
2. Add a root `packageExtensions` entry for a third-party package that imports a dependency it never declares.
3. Hoist only the affected package with `publicHoistPattern`, and file a bug for the published package.
4. Switch to `hoisted`, with the packages and reasons recorded in the PR.
