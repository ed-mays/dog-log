TITLE: Adopt Stable Patterns for Jest/Vitest Module Mocking

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our test suite exhibits inconsistent patterns for mocking modules, particularly Zustand stores. We have observed a mix of `vi.mock` at the module scope, `vi.doMock` within tests (sometimes without proper module resetting), and direct state manipulation (e.g., `useAuthStore.setState()`). This inconsistency makes tests harder to read, maintain, and can lead to state leakage between tests, causing flakiness.

DECISION:
We will standardize on two explicit patterns for mocking modules in Vitest:

1.  **Default Pattern (Module-Level Mock):** For the majority of test scenarios, use `vi.mock('path/to/module')` at the top level of the test file. State and actions can be injected per-test by providing a mock implementation (e.g., via a factory function or by re-implementing the mock in a `beforeEach` block).

2.  **Per-Test Variation Pattern (In-Test Mock):** If a specific test requires a unique mock implementation that differs from others in the same file, use `vi.doMock('path/to/module', ...)` inside the test block. This pattern **must** be used with `vi.resetModules()` in a `beforeEach` or `afterEach` block and a dynamic `await import('./ComponentUnderTest')` _after_ the mock is declared to ensure the component receives the correct mock.

Directly manipulating the state of a live store (e.g., `useAuthStore.setState(...)`) within a test is discouraged and should be refactored to use these explicit mocking patterns.

CONSEQUENCES:

- **Positive:**
  - Establishes a clear, consistent, and predictable approach to mocking.
  - Improves test isolation and reduces the risk of flaky tests caused by shared mock state.
  - Makes test setup and intent easier to understand for all developers.
- **Negative:**
  - Requires a one-time refactoring effort to bring existing tests into compliance with these patterns.

ALTERNATIVES CONSIDERED:

- **Allow any mocking style:** This was rejected as it perpetuates the existing problems of inconsistency, poor test isolation, and difficult maintenance.
- **Only allow top-level `vi.mock`:** This was considered too restrictive, as it doesn't elegantly solve the need for per-test mock variations, which is a valid and sometimes necessary scenario.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
