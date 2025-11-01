TITLE: Adopt Reusable Factory Pattern for Async Store Mocking

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
In our test suite, multiple tests independently mock the asynchronous actions of our Zustand stores (e.g., `signInWithGoogle`, `fetchPets`). This hand-rolled approach leads to repeated boilerplate for handling async states (pending, success, error) and makes the tests verbose and harder to maintain. When a store's interface changes, updates are required in every test file that mocks it.

DECISION:
We will create and use reusable factory functions to generate mocks for our Zustand stores. These factories will be centralized in the `src/testUtils/mocks/` directory.

Each factory (e.g., `createAuthStoreMock`, `createPetsStoreMock`) will:

1.  Accept an optional object to override the default mock state or actions (e.g., providing a specific user, a list of pets, or a `vi.fn()` spy).
2.  Return a complete, selector-friendly mock implementation of the store hook that can be provided to `vi.mock`.

This pattern will abstract away the repetitive setup for both state and asynchronous actions, allowing tests to focus on the specific behavior being tested.

CONSEQUENCES:

- **Positive:**
  - Drastically reduces boilerplate code in tests, making them cleaner and more focused.
  - Centralizes mock logic, so changes to a store's structure only require updates in one place (the factory).
  - Improves developer experience by providing a simple, consistent, and type-safe way to mock stores.
- **Negative:**
  - Requires an initial investment to create the factory functions and refactor existing tests.

ALTERNATIVES CONSIDERED:

- **Continue with hand-rolled mocks:** This was rejected as it leads to significant code duplication and high maintenance overhead, which are the problems we aim to solve.
- **Use a generic mocking library:** While powerful, a third-party library would add another dependency. Creating our own lightweight, type-safe factories is sufficient for our needs and keeps the setup explicit and easy to understand.

AUTHOR: Gemini

RELATED:

- `006-use-zustand-for-state-management.md`
- `019-adopt-stable-patterns-for-jest-vitest-module-mocking.md`
