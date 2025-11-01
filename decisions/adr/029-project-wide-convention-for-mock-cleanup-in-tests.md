# 29. Project-Wide Convention for Mock Cleanup in Tests

- Status: Proposed
- Date: 2025-11-01

## Context

Our tests frequently rely on mocks and spies (`vi.fn()`, `vi.spyOn()`) to isolate the system under test and to assert that certain functions are called. For tests to be reliable and deterministic, the state of these mocks (e.g., call counts, mock implementations) must be reset between each test. Inconsistent cleanup can lead to flaky tests where the outcome of one test is affected by the execution of another.

While Vitest provides configuration options and helper functions for cleanup, we need to establish a clear and explicit convention to be followed consistently across the project.

## Decision

To ensure test isolation, we will adopt the following project-wide convention for cleaning up mocks:

1.  **Explicit Cleanup in Test Files**: Every test file that utilizes mocks or spies must include a `beforeEach` block dedicated to mock cleanup.

2.  **Default to `vi.clearAllMocks()`**: The standard practice will be to call `vi.clearAllMocks()` within the `beforeEach` block. This function resets the `mock.calls` and `mock.instances` properties of all mocks, which is sufficient for most test cases where we only need to track calls.

3.  **Use `vi.resetAllMocks()` When Necessary**: If a test requires restoring the original implementation of a mocked function, `vi.resetAllMocks()` should be used instead. This is a more thorough reset that also removes any mock implementations, restoring the original behavior.

**Example:**

```tsx
import { beforeEach, test, vi } from 'vitest';

// Mocks used in the test file
const myMock = vi.fn();

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Or vi.resetAllMocks() if needed
  });

  test('does something', () => {
    // Test logic that calls myMock
  });

  test('does something else', () => {
    // Test logic that calls myMock, starting with a clean state
  });
});
```

This explicit approach makes the cleanup behavior obvious to any developer reading the test file, even if global cleanup options are configured in `vitest.config.ts`.

## Consequences

**Pros:**

- **Improved Test Reliability**: Enforces strict test isolation, reducing the chance of flaky or order-dependent tests.
- **Clarity and Readability**: Makes the cleanup strategy explicit within each test file, improving developer understanding.
- **Consistency**: Establishes a single, easy-to-follow pattern for all developers contributing to the codebase.

**Cons:**

- **Minor Boilerplate**: Adds a small amount of boilerplate code (`beforeEach` block) to test files that use mocks.
