TITLE: Prefer user-event over fireEvent for UI Testing

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our testing guidelines emphasize simulating user behavior as closely as possible. While both `@testing-library/fire-event` and `@testing-library/user-event` can trigger DOM events, `user-event` provides a higher-fidelity simulation of actual browser interactions (e.g., `type` includes keyboard events, `click` includes hover/focus). We observed inconsistencies in our tests where both libraries were used, leading to confusion and less realistic test scenarios.

DECISION:
We will exclusively use `@testing-library/user-event` for simulating all user interactions in our tests. The `fireEvent` utility will be deprecated from our codebase. All `user-event` calls, being asynchronous, must be `await`ed.

CONSEQUENCES:

- **Positive:**
  - Tests will more accurately reflect how users interact with the application, increasing confidence in their results.
  - A single, consistent pattern for event simulation makes tests easier to write, read, and maintain.
  - Eliminates a class of flaky tests that might pass with `fireEvent` but fail with real user input.
- **Negative:**
  - Requires a one-time effort to refactor existing tests that still use `fireEvent`.

ALTERNATIVES CONSIDERED:

- **Continue using both:** This was rejected as it leads to inconsistency and lower-quality tests. `fireEvent` does not always trigger the full sequence of events a user would, making `user-event` the superior choice for reliability.
- **Use only `fireEvent`:** This was rejected because it fails to capture the full user experience and can lead to tests that don't accurately represent component behavior in a real browser.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
