TITLE: Adopt a Feature-First Project Structure

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
A well-defined and scalable project structure is needed to keep the codebase organized, maintainable, and easy to
navigate as the application grows.

DECISION:
We will adopt a "feature-first" (or domain-based) project structure. Core application logic will be organized into
modules under `src/features/<domain>`. Each feature module will contain its own components, hooks, and types. Truly
global, reusable components will reside in `src/components/common/`.

CONSEQUENCES:

- **Positive**:
  - High cohesion: All files related to a single feature are located together, making them easier to find and work on.
  - Low coupling: Features are more self-contained, which simplifies refactoring and code sharing.
  - Improved scalability as new features can be added as new modules without cluttering existing ones.
- **Negative**:
  - Can lead to debates over what constitutes a "feature" and where shared logic between features should live.
  - May require more upfront planning to define feature boundaries.

ALTERNATIVES CONSIDERED:

- **File-type-first structure**: Organizing files by their type (e.g., `src/components`, `src/hooks`, `src/pages`). This
  is simple initially but becomes difficult to manage as the project grows, as related files are scattered across the
  directory tree.

AUTHOR: Gemini

RELATED:

- `src/features/`
- `src/components/common/`
