# 31. Use Shared Render Function from @test-utils

- Status: Proposed
- Date: 2025-11-01

## Context

Our components are designed to work within a specific application context, which includes providers for routing (`MemoryRouter`), internationalization (`I18nextProvider`), and feature flags (`FeatureFlagsProvider`). Rendering components in tests without these providers leads to errors and requires each test file to manually configure a similar environment, resulting in boilerplate and inconsistency.

To streamline testing and ensure components are rendered in a realistic environment, we have a shared render utility located at `src/test-utils.tsx` (aliased as `@test-utils`).

## Decision

All React component tests must use the custom `render` function exported from the `@test-utils` module. Consequently, imports for `render` and `screen` should always be sourced from this shared utility, not directly from `@testing-library/react`.

This ensures that every component rendered in a test is automatically wrapped with the necessary application-level context providers, making tests more robust and easier to write.

**Example:**

```tsx
// Correct usage
import { render, screen } from '@test-utils';
import { MyComponent } from './MyComponent';

test('should render correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText(/hello world/i)).toBeInTheDocument();
});
```

## Consequences

**Pros:**

- **Consistency**: Guarantees that all components are tested under the same provider configuration.
- **Reduced Boilerplate**: Eliminates the need to wrap components in providers in every single test file.
- **Increased Reliability**: Prevents tests from failing due to missing context providers.
- **Simplified Test Setup**: Developers can focus on writing test logic instead of configuring the rendering environment.

**Cons:**

- **Developer Discipline**: Developers must remember to import from `@test-utils` instead of `@testing-library/react`. This can be enforced with linting rules if necessary.
