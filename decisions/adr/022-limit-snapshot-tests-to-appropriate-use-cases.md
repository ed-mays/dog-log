TITLE: Limit Snapshot Tests to Appropriate Use Cases

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our project uses i18next for internationalization, which makes UI components subject to frequent text changes. Snapshot tests (e.g., `.toMatchSnapshot()`, `asFragment()`) capture the entire rendered output of a component, making them extremely brittle. They often fail due to minor, intentional UI refactors or translation updates. This leads to a high maintenance burden without providing clear, behavioral assertions.

DECISION:
We will avoid using snapshot tests for React components. Instead, all tests should use explicit assertions to verify specific, user-visible behavior and output. Assertions should be made against rendered text content, ARIA attributes (roles, states), and component state changes.

This aligns with the Testing Library philosophy of writing tests that resemble how users interact with the software, focusing on behavior rather than implementation details.

Snapshot tests should only be considered for rare cases where the output is a stable, serializable value not subject to frequent change or internationalization, such as the output of a complex, non-UI data transformation function.

CONSEQUENCES:

- **Positive:**
  - Tests are more robust, resilient to UI refactoring, and less likely to break on translation changes.
  - Tests become more focused and meaningful, asserting specific behaviors rather than large, opaque snapshots.
  - Pull request reviews are simpler, as the intent of each assertion is explicit.
- **Negative:**
  - Writing explicit assertions can be more verbose than a single snapshot assertion.
  - Requires a one-time effort to refactor any existing tests that use snapshots.

ALTERNATIVES CONSIDERED:

- **Continue using snapshot tests for components:** This was rejected due to the high maintenance cost and brittleness, especially in a project with i18n.
- **Use inline snapshots:** This was also rejected as it shares the same fundamental flaws as file-based snapshots—it couples the test to the implementation and is sensitive to minor, irrelevant changes.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
- `020-prefer-accessible-queries-over-implementation-specific-assertions.md`
