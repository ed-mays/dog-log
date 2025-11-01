TITLE: Prefer Accessible Queries Over Implementation-Specific Assertions

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our test suite currently contains assertions that rely on implementation-specific details, such as `data-testid` attributes. This practice makes tests more brittle and less representative of the user experience. Since most of our components load data asynchronously, it's crucial that our querying strategy handles timing issues gracefully. The goal is to write tests that are resilient to refactoring and aligned with accessibility best practices.

DECISION:
We will prioritize accessible queries provided by Testing Library when locating elements in tests. The preferred query order is as follows, using `findBy*` variants to handle asynchronous appearance:

1.  `findByRole` (with an accessible name, e.g., `{ name: /submit/i }`)
2.  `findByLabelText`
3.  `findByPlaceholderText`
4.  `findByText`
5.  `findByTestId` (to be used only as a last resort when no other accessible query is suitable).

`getBy*` should be used for elements expected to be present synchronously, and `queryBy*` for asserting absence.

CONSEQUENCES:

- **Positive:**
  - Tests become more robust and less likely to break when implementation details (like class names or `data-testid` values) change.
  - Encourages developers to write more accessible components from the start.
  - Tests more closely reflect how a user interacts with the application.
- **Negative:**
  - May require a refactoring effort to update existing tests that heavily rely on `data-testid`.
  - In rare cases where accessible queries are not feasible, adding them might require minor component modifications.

ALTERNATIVES CONSIDERED:

- **Continue using `data-testid` freely:** Rejected because it couples tests to implementation details, making them brittle and discouraging accessible design.
- **Enforce only `getByRole`:** Rejected as too restrictive. While `getByRole` is the top preference, other accessible queries like `getByLabelText` are equally valid and necessary for form elements.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
