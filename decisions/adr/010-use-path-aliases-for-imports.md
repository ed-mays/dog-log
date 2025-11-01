TITLE: Use Path Aliases for Module Imports

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
As a project grows, relative import paths (`../../../components/common`) become long, brittle, and difficult to manage,
making it hard to move files and understand the dependency graph.

DECISION:
We will use path aliases configured in `tsconfig.app.json` to create clean, absolute-like import paths. Aliases like
`@components/`, `@features/`, and `@store/` will map to their corresponding directories in the `src/` folder.

CONSEQUENCES:

- **Positive**:
  - Greatly improves code readability and maintainability.
  - Makes it trivial to move files or refactor directory structures without breaking imports.
  - Creates a stable and predictable import structure across the entire application.
- **Negative**:
  - Requires proper configuration in the IDE and build tools to resolve the aliases. (This is already handled by Vite
    and TypeScript).
  - New developers must learn the available aliases.

ALTERNATIVES CONSIDERED:

- **Relative paths only**: The default behavior. While simple, it does not scale well and leads to the aforementioned
  problems in a large codebase.

AUTHOR: Gemini

RELATED:

- `tsconfig.app.json`
