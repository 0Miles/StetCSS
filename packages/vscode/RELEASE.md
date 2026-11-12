# VS Code Extension Release

Use this package release flow for `master-css-vscode` Marketplace releases.

## Requirements

- Use the repository package manager, Bun, at the version pinned in the root `package.json`:

```sh
bun --version
```

- Install the native packages for every platform before packaging targets other than your own. A plain `bun install` installs only your platform's, and the release stops before changing any file when a selected target's packages are missing:

```sh
bun install --os=win32 --os=darwin --os=linux --cpu=x64 --cpu=arm64 --cpu=arm --libc=glibc --libc=musl
```

- Configure GitHub Actions OIDC through `azure/login` with `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`.
- Add the managed identity resource ID as a Contributor of the `masterco` Visual Studio Marketplace publisher.
- Verify VSCE can publish with Microsoft Entra ID after Azure login:

```sh
bun x --cwd packages/vscode --no-install vsce verify-pat --azure-credential masterco
```

If the publisher has not authorized the managed identity, Marketplace returns `InvalidAccessException: The requested operation is not allowed.`

## Release

Preview the release plan without changing files:

```sh
bun run release:vscode -- --dry-run --azure-credential
```

Patch, build, package, and publish all supported targets:

```sh
bun run release:vscode -- --patch --azure-credential
```

Package without publishing:

```sh
bun run release:vscode -- --patch --no-publish
```

Release a limited target set:

```sh
bun run release:vscode -- --patch --azure-credential --target darwin-arm64
bun run release:vscode -- --patch --azure-credential --target linux-x64,darwin-arm64
```

The default target set is `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, and `darwin-arm64`.

## What The Script Does

1. Verifies `@types/vscode` does not declare a newer major/minor range than `engines.vscode`.
2. Checks that the native packages of every selected target resolve, and stops with the install command above if any are missing.
3. Records the current worktree state so pre-existing CI changes do not fail the release.
4. Runs the root `bun run build`.
5. Bumps the extension version with `bun pm version`, without creating a git commit or tag.
6. Runs `master-css-vscode` `build` and `type-check`.
7. Verifies that the release only adds expected VS Code version changes.
8. Verifies VSCE publish rights when publishing, using Microsoft Entra ID when `--azure-credential` is set.
9. Packages or publishes the selected VSIX targets.
10. Prints the Marketplace URL and remaining tracked changes.

Marketplace URL:

https://marketplace.visualstudio.com/items?itemName=masterco.master-css-vscode
