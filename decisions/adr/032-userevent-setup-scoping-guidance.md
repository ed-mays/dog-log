# 32. userEvent.setup() Scoping Guidance

- Status: Accepted
- Date: 2025-11-01

## Context

The `@testing-library/user-event` library is our standard for simulating user interactions. The recommended way to use this library is by creating an instance via `userEvent.setup()`. This instance maintains its own internal state, including timers for simulating delays in user actions (e.g., `delay` option in `type()`).

If a single `user-event` instance is shared across multiple tests, state can leak between them. For example, timers or pointer positions from one test could interfere with another, leading to flaky, unpredictable, and hard-to-debug test failures.

## Decision

To ensure complete test isolation and prevent state leakage, a new `user-event` instance must be created for each individual test. This will be achieved by following one of these patterns:

1.  **Directly in the Test**: Call `userEvent.setup()` at the beginning of each `test` block that simulates user interactions.

2.  **Via a `setup()` Helper**: For more complex tests, create a `setup()` helper function that is called from within the `test` block. This helper should be responsible for calling `userEvent.setup()` and can also return the `user` instance along with other test-specific variables or rendered screen queries.

Under no circumstances should `userEvent.setup()` be called at the top level of a module or within a `describe` block where the instance would be shared across multiple tests.

**Example:**

```tsx
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MyInteractiveComponent } from './MyInteractiveComponent';

test('should handle user interaction correctly', async () => {
  // Create a fresh instance for this specific test
  const user = userEvent.setup();
  render(<MyInteractiveComponent />);

  await user.click(screen.getByRole('button'));
  // ...assertions
});

// Alternative using a setup() helper
function setup() {
  return {
    user: userEvent.setup(),
    ...render(<MyInteractiveComponent />),
  };
}

test('should also handle interaction correctly with a helper', async () => {
  const { user } = setup();
  await user.click(screen.getByRole('button'));
  // ...assertions
});
```

## Consequences

**Pros:**

- **Guaranteed Test Isolation**: Prevents state from `user-event` from leaking between tests, leading to more reliable and deterministic outcomes.
- **Improved Readability**: Makes the setup for user interaction explicit within each test.
- **Alignment with Best Practices**: Follows the official recommendation from the `@testing-library/user-event` documentation.

**Cons:**

- **Minor Boilerplate**: Requires calling `userEvent.setup()` in each test rather than once per file. This is a small price to pay for test reliability.
