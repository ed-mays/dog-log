TITLE: Enforce Comprehensive Accessibility Testing Practices

STATUS: Accepted
DATE: 2025-11-01

CONTEXT:
Our current tests primarily verify the presence and basic interactions of components. However, they often overlook critical accessibility (a11y) behaviors, especially for interactive elements like modals, dialogs, and forms. This gap means we could be shipping features that are difficult or impossible for users relying on assistive technologies to use.

DECISION:
We will expand our testing practices to include comprehensive accessibility checks for all interactive components. Tests for components like modals, dialogs, and complex forms must verify the following:

1.  **Focus Management:** For modals and dialogs, assert that focus is correctly trapped within the component when it is open.
2.  **Keyboard Accessibility:**
    - Assert that interactive elements can be activated via the keyboard (e.g., `Enter` or `Space` on buttons).
    - Assert that modals and dialogs can be closed using the `Escape` key.
    - Assert a logical tab order through interactive elements.
3.  **ARIA Attributes:** Assert the presence and correct state of important ARIA attributes, such as `aria-modal="true"` for modals, `role="alert"` for dynamic error messages, and appropriate roles for custom components.

We will also consider introducing automated accessibility checks (e.g., using `jest-axe`) into our test suite to catch common violations during development.

CONSEQUENCES:

- **Positive:**
  - Increases confidence that our application is usable by people with disabilities.
  - Builds accessibility into our development workflow, catching issues early.
  - Improves the overall quality and robustness of our components.
- **Negative:**
  - Writing these additional assertions will increase the time it takes to write tests.
  - Requires a learning curve for developers not yet familiar with these a11y concepts.

ALTERNATIVES CONSIDERED:

- **Manual Accessibility Testing Only:** Rejected as it is not scalable, is prone to human error, and happens too late in the development cycle.
- **Relying solely on automated tools like Axe:** Rejected because while tools are helpful for catching common issues, they cannot verify all aspects of keyboard navigation and focus management, which require explicit behavioral tests.

AUTHOR: Gemini

RELATED:

- `007-testing-strategy-with-vitest-and-testing-library.md`
- `020-prefer-accessible-queries-over-implementation-specific-assertions.md`
