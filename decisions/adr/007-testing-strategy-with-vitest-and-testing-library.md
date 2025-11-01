TITLE: Testing Strategy with Vitest and Testing Library

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
A robust and consistent testing strategy is essential for ensuring code quality, preventing regressions, and enabling
confident refactoring. The strategy must align with modern React best practices.

DECISION:
We will use Vitest as the test runner and `@testing-library/react` for rendering components and simulating user
interactions. The strategy emphasizes testing from the user's perspective. Key conventions include:

1. **Prefer `user-event`** for all user interactions.
2. **Use `findBy*` queries** for asynchronous elements.
3. **Prioritize accessible queries** (`getByRole`, `getByLabelText`, etc.) over implementation details like
   `getByTestId`.
4. **Avoid snapshot testing** in favor of explicit assertions.
5. **Use a shared render wrapper** from `@test-utils` to provide necessary context (i18n, feature flags).
6. **Colocate test files** with the component files (`Component.test.tsx`).

CONSEQUENCES:

- **Positive**:
  - Tests are more resilient to implementation changes and focus on behavior rather than internal details.
  - Encourages the development of more accessible applications.
  - Vitest provides a fast, modern test-running experience with a Jest-compatible API.
  - A clear, documented strategy ensures consistency across the team.
- **Negative**:
  - Writing good, user-centric tests can have a steeper learning curve than snapshot testing or implementation-heavy
    tests.

ALTERNATIVES CONSIDERED:

- **Jest**: The historical standard for React testing. Vitest offers better performance and a more modern feature set,
  especially within a Vite project.
- **Enzyme**: A legacy testing library that encourages testing implementation details, leading to brittle tests. It is
  no longer recommended.

AUTHOR: Gemini

RELATED:

- `vitest.config.ts`
- `src/test-utils.tsx`
