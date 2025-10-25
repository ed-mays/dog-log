### TDD plan for the Material UI Navigation Bar (React Router v7)

Below is an incremental, tests-first plan to implement the `NavigationBar` using MUI’s `AppBar` and friends, integrating
with `react-router-dom@7`, and rendering your existing `LogoutButton`. We will:

- keep files at `src/components/common/NavigationBar/NavigationBar.tsx` and `NavigationBar.test.tsx`
- use `@test-utils` for render + `MemoryRouter` in tests
- keep visible strings hardcoded for now (i18n later)
- set `role="navigation"` and `aria-label="Primary"`, and fix the bar to the top

For each step: write a failing test → implement minimal code → refactor if needed.

---

### Step 0: Replace placeholders with test scaffolding

We’ll reset the tests to describe the desired behavior of the nav bar. We will use `@test-utils` and wrap the component
with `MemoryRouter` so that `Link` and `useNavigate` work during render. No assertions yet, just confirm render path
works as a baseline.

#### Test (failing until we implement the MUI structure later)

```tsx
// src/components/common/NavigationBar/NavigationBar.test.tsx
import { render, screen } from '@test-utils';
import { MemoryRouter } from 'react-router-dom';
import { NavigationBar } from './NavigationBar';

describe('NavigationBar', () => {
  function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  test('renders without crashing in a Router context', () => {
    renderWithRouter(<NavigationBar />);
    // No assertions yet; smoke render only.
  });
});
```

#### Minimal implementation (still simple render)

```tsx
// src/components/common/NavigationBar/NavigationBar.tsx
export function NavigationBar() {
  return <div />;
}
```

Run tests to confirm green as a baseline.

---

### Step 1: Add branded AppBar, fixed top, nav role

Requirements addressed:

- Material UI `AppBar`/`Toolbar`
- Fixed to top (`position="fixed"`)
- `role="navigation"` and `aria-label="Primary"`
- Branding name: “Dog Log” with a `Pets` icon

We’ll keep branding clickable to home (`/`) which is standard. We’ll also expose the brand as a heading for
accessibility.

#### Write test (red)

```tsx
// append to NavigationBar.test.tsx
import { within } from '@testing-library/react';

describe('NavigationBar', () => {
  // ...renderWithRouter helper from Step 0

  test('renders a fixed primary navigation bar with brand', () => {
    renderWithRouter(<NavigationBar />);

    // The nav container
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav).toBeInTheDocument();

    // Brand heading text
    const heading = within(nav).getByRole('heading', { name: /dog log/i });
    expect(heading).toBeInTheDocument();

    // Brand acts as a home link (optional but recommended)
    const brandLink = within(nav).getByRole('link', { name: /dog log/i });
    expect(brandLink).toHaveAttribute('href', '/');
  });
});
```

#### Implement minimal code (green)

```tsx
// src/components/common/NavigationBar/NavigationBar.tsx
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import { Link as RouterLink } from 'react-router-dom';

export function NavigationBar() {
  return (
    <AppBar position="fixed" component="nav" aria-label="Primary">
      <Toolbar>
        {/* Brand: icon + title, clickable to home */}
        <IconButton
          color="inherit"
          aria-label="Home"
          component={RouterLink}
          to="/"
          edge="start"
          sx={{ mr: 1 }}
        >
          <PetsIcon titleAccess="Pets" />
        </IconButton>
        <Typography
          component="h1"
          variant="h6"
          noWrap
          sx={{ flexGrow: 1, textDecoration: 'none' }}
        >
          <Box
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ textDecoration: 'none' }}
          >
            Dog Log
          </Box>
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
```

Run tests: should pass. The `AppBar` has `component="nav"`, so the element exposes `role="navigation"`.

Note: In app layout, you’ll likely add a top spacer (`<Toolbar />`) below the `AppBar` to offset fixed height. Out of
scope for this component’s test.

---

### Step 2: Add the “Pets” navigation link

Requirement addressed: Add a navigation link to `/pets`.

#### Write test (red)

```tsx
// append to NavigationBar.test.tsx

test('renders a link to the Pets page', () => {
  renderWithRouter(<NavigationBar />);
  const link = screen.getByRole('link', { name: /pets/i });
  expect(link).toHaveAttribute('href', '/pets');
});
```

#### Implement minimal code (green)

```tsx
// append inside <Toolbar> after the brand area
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// ...inside the Toolbar, after Typography brand
<Button
  color="inherit"
  component={RouterLink}
  to="/pets"
  sx={{ ml: 1 }}
>
  Pets
</Button>
```

Re-run tests: the Pets link assertion should now pass.

---

### Step 3: Integrate the LogoutButton from context

Requirement addressed: Include the existing `LogoutButton` component. It uses `useNavigate`, Zustand auth store, and
lazy i18n namespace loading. We won’t click it yet; we just assert it renders in the nav. To keep the test fast and
isolated, we’ll mock `@i18n` to resolve immediately and avoid a transient `null` render. We’ll also ensure we’re within
a Router (already via `MemoryRouter`). You can optionally mock the auth store to avoid initializing states.

#### Write test (red)

```tsx
// append to NavigationBar.test.tsx
import * as React from 'react';
import { vi } from 'vitest';

// Mock i18n namespace loader to be instant
vi.mock('@i18n', () => ({
  loadNamespace: vi.fn(() => Promise.resolve()),
}));

// Optionally mock auth store to avoid real side-effects
vi.mock('@store/auth.store.tsx', () => ({
  useAuthStore: (selector: any) => selector({ signOut: vi.fn(), initializing: false }),
}));

vi.mock('@store/useResetStores.tsx', () => ({
  useResetStores: () => vi.fn(),
}));

// Now the test

test('renders the LogoutButton in the navigation bar', async () => {
  renderWithRouter(<NavigationBar />);
  const button = await screen.findByTestId('logout-button');
  expect(button).toBeInTheDocument();
});
```

#### Implement minimal code (green)

```tsx
// src/components/common/NavigationBar/NavigationBar.tsx
import LogoutButton from '@features/authentication/components/GoogleAuth/LogoutButton.tsx';

export function NavigationBar() {
  return (
    <AppBar position="fixed" component="nav" aria-label="Primary">
      <Toolbar>
        {/* Brand */}
        <IconButton
          color="inherit"
          aria-label="Home"
          component={RouterLink}
          to="/"
          edge="start"
          sx={{ mr: 1 }}
        >
          <PetsIcon titleAccess="Pets" />
        </IconButton>
        <Typography component="h1" variant="h6" noWrap sx={{ flexGrow: 1 }}>
          <Box component={RouterLink} to="/" color="inherit" sx={{ textDecoration: 'none' }}>
            Dog Log
          </Box>
        </Typography>

        {/* Primary links */}
        <Button color="inherit" component={RouterLink} to="/pets" sx={{ mr: 1 }}>
          Pets
        </Button>

        {/* Actions */}
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
}
```

Re-run tests: now the logout test should pass. Since we mocked `@i18n`, the button renders immediately.

---

### Step 4: Small accessibility polish tests (optional but recommended)

Add a couple more assertions to lock down accessibility contracts:

- `AppBar` exposes `role="navigation"` with `aria-label="Primary"`
- The brand link and Pets link are keyboard-focusable and visible

#### Tests

```tsx
// append optional tests

test('navigation has aria-label Primary', () => {
  renderWithRouter(<NavigationBar />);
  const nav = screen.getByRole('navigation', { name: /primary/i });
  expect(nav).toBeInTheDocument();
});

test('brand and Pets links are visible and focusable', async () => {
  renderWithRouter(<NavigationBar />);
  const brand = screen.getByRole('link', { name: /dog log/i });
  const pets = screen.getByRole('link', { name: /pets/i });
  expect(brand).toBeVisible();
  expect(pets).toBeVisible();
});
```

No additional implementation should be needed.

---

### Step 5: Refactor and document for future i18n

- Extract visible strings to constants to simplify a future i18n migration:
  - `const APP_TITLE = 'Dog Log';`
  - `const PETS_LABEL = 'Pets';`
- Keep `PetsIcon` as the visual treatment for now; later you can swap to a brand asset without changing tests (they
  assert accessible names, not icon internals).
- Keep public API of `NavigationBar` minimal (no props needed right now). You can add props later (e.g., to
  conditionally show links by feature flags) without breaking current tests.

Example refactor (no behavior change):

```tsx
const APP_TITLE = 'Dog Log';
const PETS_LABEL = 'Pets';
// ...use in JSX
```

---

### Step 6: Run linters, types, coverage

- `npm run lint`
- `npm run test:coverage`
- Ensure coverage remains reasonable and tests describe behavior, not implementation details.

---

### Notes specific to your stack and constraints

- React Router v7: `MemoryRouter` is supported and fine for unit tests. Using `component={RouterLink}` on MUI `Button`
  and `IconButton` is the recommended integration pattern.
- `LogoutButton` depends on i18n namespaces; our test mocks `@i18n` to keep the component from rendering `null`. If you
  prefer not to mock, change the test to `await screen.findByTestId('logout-button')` and allow the effect to resolve
  naturally; mocking simply keeps tests faster and more deterministic.
- Styling: follow your preference of CSS modules if needed; MUI `sx` props used here are minimal. You can move styles to
  CSS modules later without changing behavior tests.
- Feature flags: none required for this intro demo. When you gate links later, keep the current selectors based on
  roles/names.

---

### Final behavior checklist

- Fixed top bar using MUI `AppBar` + `Toolbar`
- `role="navigation"` with `aria-label="Primary"`
- Brand area with `Pets` icon and heading text `Dog Log`; brand acts as a home link
- Link to `/pets` labeled `Pets`
- `LogoutButton` rendered on the right
- Tests illustrate TDD: failing tests first, smallest implementation to green, optional refactors
