# StetCSS

StetCSS is a fork of Master CSS `v2.0.0-rc.88`: a markup-driven CSS engine where classes such as `fg:red:hover@sm` compile to CSS rules. Packages publish under `@stet-css/*`; `@stet-css/core` (`packages/core`) is the public facade.

## Where things live

- **Direction**: pinned issue #4 (`gh issue view 4`). Read it before adding or changing class syntax, dependencies, config files, or companion tools (editor extension, MCP, skills), and before porting an upstream Master CSS change.
- **Package notes**: `packages/<name>/AI.md` and `benchmarks/AI.md` hold each package's boundaries, risks, and any validation beyond `lint`, `test`, and `type-check`.
- **Research**: GitHub issues labelled `research`. Publish findings there, never as committed files; see `docs/agents/issue-tracker.md`.
- **`docs/`**: version-controlled project documents only.

## Before editing

1. Name the **owning package**: the lowest package in the dependency direction below that holds the behaviour.
2. Read its `package.json` and `AI.md`.
3. Read the source, tests, and fixtures around the behaviour, and the downstream packages that consume it.
4. For a feature, find what already exists first: the owning package's public API, private helpers in lower packages, and tests that lock the behaviour. When the needed behaviour exists only as private code in a lower package, plan the shared API there first.

Done when you can name the owning package, the tests that cover the behaviour, and every downstream consumer your change reaches.

## Invariants

- **CSS output** is the contract. Any change to generated CSS is a behaviour change: make it intentional, explain it, and cover it with tests or fixtures.
- **Layer order** is declared once in `packages/preset/src/base.css` (exposed as `@stet-css/core/base.css`):

  ```txt
  @layer theme, base, defaults, components, utilities;
  ```

  Generated rules go into those layer blocks without re-emitting the statement; keyframes go outside layers.
- **Native CSS behaviour**: a class behaves like the same declaration written in plain CSS. Bare numbers stay as written (`font:14` → `font-size:14`).

## Dependency direction

```txt
shared / external data
  -> schema / lexer
  -> source
  -> engine / preset / integration
  -> compiler / project
  -> validator / server / scanner / runtime / language / language-service / stylesheet
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples
```

Dependencies point down this chain only; engine depends on `schema` and `lexer` alone. `@stet-css/core` re-exports engine and preset, so keep behaviour in the owning lower package. Under cycle pressure, extract the shared piece downward: contracts into `schema`, lexical scanners into `lexer`, class candidate extraction into `source`, adapter-neutral protocol into `integration`.

## Runtime surface

Everything `@stet-css/runtime` imports ships to browsers. Before adding a helper to runtime, engine value exports, schema constants, or preset manifest loading, classify it as runtime core, build-time configuration, or tooling. Put tooling and build-time logic in a subpath or the owning tooling package. Third-party class observation goes through DOM `MutationObserver` or public runtime state.

## Utility ladder

Model a preset utility with the lowest rung that expresses it, and state why each lower rung fell short:

1. `nativeValueNamespaces` (`packages/engine/src/native-value-namespaces.ts`): full native or vendor property classes.
2. `keyAliases` (`packages/engine/src/key-aliases.ts`): short keys pointing at native properties.
3. `@utilities` in `packages/preset/src/utilities.css`: static and semantic utilities, including multi-declaration ones.
4. Engine code (`packages/engine/src/`): special transforms or raw ambiguous matching that CSS directives cannot express.

## Changes

- Keep changes package-local and matched to nearby patterns.
- Bug fixes and narrow features preserve existing behaviour unless correctness requires otherwise. Requested refactors favour the clean design over compatibility shims; list every public API, config, class syntax, or CSS output change they make and update tests to the new contract.
- Solve with the existing toolchain; a new dependency needs a stated reason.
- Change package names, build or release flow, lockfiles, or package manager config only when the task asks for it.
- Update snapshots, fixtures, and generated files only for intentional output changes, and explain each.
- When a test fails, fix the code; change the test only when the behaviour change is intended.

## Validation

Run the affected packages' `lint`, `test`, and `type-check` scripts (`bun run --filter <package> lint`), then widen to `bun run check` when a change crosses packages. Parser, compiler, runtime, scanner, language tooling, and ESLint changes need focused tests.

## Reviews

Lead with findings by severity: bugs, regressions, CSS output changes, public API changes, missing tests, then cascade, variable, manifest, runtime, or extraction risks, then unrelated files. With no findings, name the residual risk or the validation that did not run.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for 0Miles/StetCSS (gh CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
