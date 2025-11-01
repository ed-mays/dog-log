# Guidance Inconsistencies - 1 Nov. 2025

- The documentation does not specify whether to use a comprehensive UI component library (like Material-UI) or to build
  all UI components from scratch.
  - **References**: `.junie/guidelines.md` (Section 1 & 2)
  - **References**: `README.md` (Tech Stack)

- A strategy for managing global styles, themes (e.g., light/dark mode), or design tokens (colors, fonts) is not
  defined.
  - **References**: `.junie/guidelines.md` (Section 2)
  - **References**: `src/styles/*`

- The purpose of the aliased `src/models` directory is not explained in the project structure documentation.
  - **References**: `.junie/guidelines.md` (Section 2)
  - **References**: `.github/copilot-instructions.md` (Path aliases)
  - **References**: `README.md` (Path Aliases)

- The intended scope and contents of the aliased `src/utils` directory are not described.
  - **References**: `.junie/guidelines.md` (Section 2)
  - **References**: `.github/copilot-instructions.md` (Path aliases)

- The specific criteria that distinguish a "unit test" from an "integration test" in this project's context are not
  defined.
  - **References**: `.junie/guidelines.md` (Section 3, Scripts)
  - **References**: `README.md` (Available Scripts)

- The guidance to place async side-effects in Zustand stores "when practical" is subjective and lacks a clear definition
  of when it is not practical.
  - **References**: `.junie/guidelines.md` (Section 5, State & Data)

- The documentation is slightly inconsistent about whether custom data hooks should call the service layer or the
  repository layer directly.
  - **References**: `.junie/guidelines.md` (Section 6, Data Access Strategy) — The principle says hooks use services,
    but the text also says hooks can call repository functions.

- The concept of a "stateful" repository provided via React context is mentioned as a possibility but is not explained.
  - **References**: `.junie/guidelines.md` (Section 6, Data Access Strategy)

- The guidance mentions a top-level error boundary but does not describe a strategy for more granular, feature-level
  error handling.
  - **References**: `README.md` (Error Handling)

- The guidelines encourage accessibility practices but do not specify a formal accessibility standard or target level of
  compliance to adhere to.
  - **References**: `.junie/guidelines.md` (Section 4, Testing Guidelines)
  - **References**: `.github/copilot-instructions.md` (Testing Guidelines)
