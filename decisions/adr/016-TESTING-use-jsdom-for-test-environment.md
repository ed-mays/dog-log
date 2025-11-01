TITLE: Use JSDOM for the Unit and Component Test Environment

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
Unit and component tests need a simulated browser environment to run in a command-line context. This environment must
provide DOM APIs that allow components to be rendered and interacted with, without the overhead of a full browser.

DECISION:
We will use JSDOM as the test environment for all Vitest tests. JSDOM is a pure-JavaScript implementation of many web
standards, including the DOM and HTML standards. This will be the default environment configured in `vitest.config.ts`.

CONSEQUENCES:

- **Positive**:
  - Provides a fast and lightweight way to run component tests without needing to launch a real browser.
  - Sufficiently mimics a browser environment for the vast majority of component and logic tests.
  - Integrates seamlessly with Vitest and Testing Library.
- **Negative**:
  - JSDOM is not a real browser. It does not implement all browser features, most notably a full rendering engine (
    layout, painting). This means tests that rely on element dimensions, visibility in the viewport, or complex
    browser-native interactions may not work as expected.
  - Can lead to a false sense of security if not supplemented with occasional end-to-end tests in a real browser.

ALTERNATIVES CONSIDERED:

- **Browser-based testing (e.g., Cypress, Playwright)**: These tools run tests in a real browser, providing maximum
  fidelity. However, they are significantly slower and more resource-intensive, making them better suited for end-to-end
  and integration tests rather than fast, iterative unit and component tests.
- **Happy DOM**: Another alternative to JSDOM that aims for higher performance and better compatibility with modern web
  standards. JSDOM was chosen due to its maturity and wider adoption in the ecosystem.

AUTHOR: Gemini

RELATED:

- `vitest.config.ts`
- `vitest.setup.tsx`
