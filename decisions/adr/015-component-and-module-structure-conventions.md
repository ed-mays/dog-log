TITLE: Component and Module Structure Conventions

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
To ensure consistency and maintainability within the feature-first project structure, a clear set of conventions is
needed for how individual components and modules are defined, structured, and exposed.

DECISION:
We will adopt the following conventions for component and module structure:

1. **One Public Component Per File**: Each file should export only one public-facing React component.
2. **Co-location of Related Files**: A component's styles (`.module.css`) and unit tests (`.test.tsx`) should be placed
   in the same directory as the component file itself.
3. **Minimal Public API**: When a feature module becomes complex, an `index.ts` file should be used to explicitly export
   only the components, hooks, and types that are intended for consumption by other parts of the application, hiding
   internal implementation details.

CONSEQUENCES:

- **Positive**:
  - Makes the project structure highly predictable and easy to navigate.
  - Co-location makes it easy to find all files related to a single component.
  - Using `index` files for public APIs enforces encapsulation and reduces unintended dependencies between modules.
- **Negative**:
  - Can lead to a larger number of files compared to putting multiple small components in a single file.
  - Requires developer discipline to maintain the public API boundary of modules.

ALTERNATIVES CONSIDERED:

- **Allowing multiple components per file**: Can reduce the file count but makes it harder to find specific components
  and can lead to bloated, unfocused files.
- **Centralized test and style directories**: Separating tests and styles from the components they belong to makes it
  much harder to work on a component in isolation and increases navigation overhead.

AUTHOR: Gemini

RELATED:

- `src/features/`
