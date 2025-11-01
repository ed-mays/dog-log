TITLE: Mandate Error and Edge Case Coverage in Data-Layer Testing

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our tests for data interactions, from the repository layer up to the UI, are primarily focused on the "happy path" where everything works as expected. We lack sufficient coverage for what happens when things go wrong, such as network failures, database errors (e.g., permission denied), or when the data returned from the server is malformed or incomplete. This oversight exposes our users to unhandled errors, crashes, and a poor overall experience.

DECISION:
We will mandate that all tests involving data-layer interactions must include comprehensive coverage for error states and predictable edge cases. This requirement applies to all layers of the application:

1.  **Repository Layer:** Tests must mock the underlying data source (e.g., Firestore) to simulate specific error conditions (e.g., `unavailable`, `unauthenticated`, `permission-denied`) and assert that the repository correctly throws or propagates these errors. Tests must also cover scenarios where data is missing expected fields or is otherwise malformed.

2.  **UI Layer:** Component tests that trigger data fetching or mutations (e.g., loading a list, submitting a form) must include tests where the corresponding service or repository call is mocked to fail (i.e., reject a promise). These tests must assert that the UI displays a clear, user-friendly error message and that the application remains in a stable state without crashing.

CONSEQUENCES:

- **Positive:**
  - Significantly increases application robustness and resilience to real-world failures.
  - Ensures users receive clear feedback when something goes wrong, improving their experience and trust.
  - Reduces the number of production bugs related to unhandled exceptions and unexpected data shapes.
- **Negative:**
  - Increases the number of test cases required for each feature, which can add to development time.
  - May require more complex mocking setups to simulate various backend failure modes.

ALTERNATIVES CONSIDERED:

- **Only test happy paths:** This was rejected because it ignores the inevitability of network and data-related failures, leading to a brittle and unreliable application.
- **Rely solely on end-to-end (E2E) tests for error handling:** This was rejected as E2E tests are slow, expensive, and notoriously difficult to configure for specific backend failure modes. Unit and integration tests are far better suited for systematically testing these scenarios.

AUTHOR: Gemini

RELATED:

- `005-data-access-strategy-with-services-and-repositories.md`
- `007-testing-strategy-with-vitest-and-testing-library.md`
