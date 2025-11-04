# 34. Use pnpm instead of npm

- **Date**: 2025-11-03
- **Status**: Accepted

## Context and Problem Statement

The project requires a package manager to handle Node.js dependencies for development, building, and testing. The choice of package manager impacts developer workflow, installation speed, disk space usage, and dependency resolution integrity. The default Node.js package manager, `npm`, has known issues with performance and dependency management (e.g., phantom dependencies). The project needed to select a package manager that is efficient, reliable, and modern.

## Decision Drivers

- **Performance**: Faster installation times improve developer productivity and CI/CD pipeline speed.
- **Disk Space Efficiency**: Avoid duplicating common dependencies across multiple projects to save disk space.
- **Strictness**: Prevent "phantom dependencies" (accessing packages that are not explicitly listed in `package.json`) to ensure more reliable and reproducible builds.
- **Developer Experience**: The tool should be easy to use and enforce consistency across the team.

## Considered Options

- **npm**: The default, universally known package manager for Node.js.
- **Yarn (v1/Classic)**: A popular alternative to `npm` that offered better performance and a lockfile for deterministic installs.
- **pnpm**: A fast, disk-space-efficient package manager that uses a content-addressable store and a non-flat `node_modules` directory.

## Decision Outcome

Chosen option: **`pnpm`**, because it directly addresses the key drivers of performance, disk space efficiency, and strict dependency management.

This decision is enforced via the `packageManager` field in the `package.json` file. This ensures that all developers on the project use the exact same version of the package manager, preventing inconsistencies.

### Positive Consequences

- **Faster Dependency Installation**: `pnpm`'s use of a global content-addressable store and symlinks makes installations, especially subsequent ones, significantly faster than `npm`.
- **Reduced Disk Space**: Dependencies are stored once on disk and linked into projects, drastically reducing the disk footprint for developers working on multiple projects.
- **Improved Reliability**: The non-flat `node_modules` structure prevents code from accessing undeclared dependencies, making builds more robust and less prone to environment-specific errors.
- **Built-in Monorepo Support**: `pnpm` includes first-class support for monorepos via workspaces, providing a clear path for future project growth if needed.

### Negative Consequences

- **Learning Curve**: Developers new to `pnpm` will need to learn a slightly different set of commands (e.g., `pnpm add` vs. `npm install <package>`). However, the command structure is very similar to `npm` and `yarn`, minimizing this friction.
- **Tooling Compatibility**: Some older or less-maintained tools might not correctly resolve dependencies from `pnpm`'s unique `node_modules` structure. This is a low risk, as `pnpm` is now widely supported in the ecosystem.

## Pros and Cons of the Options

### npm

- **Good**: Bundled with Node.js, no extra installation needed. Widely known.
- **Bad**: Slower than alternatives. Creates a flat `node_modules` which can lead to phantom dependency issues. Less disk-space efficient.

### Yarn (v1/Classic)

- **Good**: Historically faster and more reliable than `npm`.
- **Bad**: Largely superseded by `pnpm` and modern versions of `npm` in terms of performance and features. Development has slowed.

### pnpm

- **Good**: Superior performance and disk space efficiency. Enforces strict dependency resolution. Excellent monorepo support.
- **Bad**: Minor learning curve for those unfamiliar with it. Potential for rare compatibility issues with older tooling.
