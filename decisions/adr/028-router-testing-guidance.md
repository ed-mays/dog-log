# 28. Router Testing Guidance

- Status: Accepted
- Date: 2025-11-01

## Context

Our application uses `react-router` for navigation. Components often have routing-related logic, such as navigating after a form submission or rendering different content based on the current path. We need a consistent and effective strategy for testing this logic to ensure a reliable user experience.

Currently, there is no formal guidance on whether to perform integration-style tests with a real router instance or to unit-test components by mocking router hooks like `useNavigate`. This can lead to inconsistent and less effective tests.

## Decision

We will adopt a two-pronged approach for testing router-related functionality, choosing the pattern that best fits the testing goal.

1.  **Integration-Style Testing (Preferred for User Flows)**:
    - For tests that cover a user flow involving navigation (e.g., submitting a form and being redirected), we will use our custom `render` utility from `@test-utils`.
    - This utility wraps the component in a `MemoryRouter`, allowing us to specify `initialRoutes` in the render options.
    - Assertions should be made on the resulting screen content (e.g., `expect(screen.findByRole('heading', { name: /new page title/i })).toBeInTheDocument()`). This verifies that the navigation was successful from a user's perspective.

2.  **Unit Testing with Mocks (For Component Isolation)**:
    - When the goal is to unit-test a component in isolation and verify that it _triggers_ a navigation event without testing the result of that navigation, it is acceptable to mock the `useNavigate` hook.
    - This is useful for components that have a simple responsibility, such as a "Back" button.
    - The test should assert that the mocked `navigate` function was called with the expected path.

**Example (Integration-Style):**

```tsx
// In an AddPetPage.test.tsx
import { render, screen, userEvent } from '@test-utils';
import AddPetPage from './AddPetPage';

test('navigates to the pet list after successful submission', async () => {
  render(<AddPetPage />, { initialRoutes: ['/pets/add'] });

  // ...fill out the form
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  // Assert that the user is on the new page
  expect(
    await screen.findByRole('heading', { name: /my pets/i })
  ).toBeInTheDocument();
});
```

**Example (Unit Test with Mock):**

```tsx
import { render, screen, userEvent } from '@test-utils';
import BackButton from './BackButton';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

test('calls navigate with -1 when clicked', async () => {
  render(<BackButton />);
  await userEvent.click(screen.getByRole('button', { name: /back/i }));
  expect(mockNavigate).toHaveBeenCalledWith(-1);
});
```

## Consequences

**Pros:**

- **Clarity and Consistency**: Provides clear guidelines for developers on how to test different routing scenarios.
- **More Realistic Tests**: The preference for integration-style testing ensures that we are testing navigation flows as the user would experience them.
- **Focused Unit Tests**: Allows for simple, focused unit tests for components where the full navigation flow is out of scope.

**Cons:**

- **Slightly More Complex Setup**: Integration-style tests require providing `initialRoutes` and may involve more setup than simple unit tests.
- **Potential for Over-testing**: Developers must be careful not to re-test the functionality of `react-router` itself. Assertions should focus on the application's response to navigation, not the internal workings of the router.
