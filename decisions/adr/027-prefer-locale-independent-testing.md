# 27. Prefer Locale-Independent Testing

- Status: Proposed
- Date: 2025-11-01

## Context

Our application supports multiple languages using `i18next`. Tests that assert on hardcoded, translated text are brittle and can fail when translations change or when a new locale is added. This makes the test suite difficult to maintain and can lead to a focus on implementation details (the specific text) rather than user-observable behavior.

We need a testing strategy that ensures our components function correctly regardless of the selected language, while still allowing us to verify that translations are being applied correctly where necessary.

## Decision

We will adopt a strategy of writing locale-independent tests by default, using accessible queries that are not tied to specific translation strings.

1.  **Prioritize Role and Accessible Name Queries**: Tests should primarily use queries like `getByRole`, `getByLabelText`, and `getByPlaceholderText`. When querying by role, an accessible name can be provided via a regular expression to make the query more specific without hardcoding the full string (e.g., `screen.getByRole('button', { name: /submit/i })`).

2.  **Avoid Asserting on Rendered Text for Behavior Tests**: For most component tests that verify behavior (e.g., a button click leading to a state change), it is not necessary to assert the exact text of the element. It is sufficient to identify it by a role or other accessible means.

3.  **Isolate Translation Verification**: When it is necessary to verify that translations are being correctly applied, these checks should be done in a dedicated, minimal set of tests. These "smoke tests" should:
    - Target a few key strings in a given i18n namespace.
    - Use the `withLocale` test helper to render the component within a specific locale.
    - Assert that the expected translated text is present.

This approach separates the concern of functional testing from translation verification.

## Consequences

**Pros:**

- **More Robust Tests**: Tests will be less likely to break when translation strings are updated.
- **Improved Maintainability**: The test suite will be easier to manage as the number of locales grows.
- **Better Focus**: Tests will be more focused on component behavior and accessibility, rather than on presentation details.

**Cons:**

- **Discipline Required**: Developers must consciously avoid asserting on hardcoded text and instead use accessible query strategies.
- **Potential for Missed Translation Regressions**: If translation verification "smoke tests" are not comprehensive enough, it's possible for a missing or incorrect translation to go unnoticed in a component that is otherwise functionally correct.

This decision aligns with our broader goal of creating a robust, maintainable, and accessible application, as outlined in our testing guidelines.
