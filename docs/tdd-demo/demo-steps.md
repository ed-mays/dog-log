# Test-driven development (TDD) demo steps

# Demo Prep

- Launch iTerm2 with 3 panes
  - run `npm run dev:with-emulators`
  - run `npm run test:watch`
  - the third pane is for random git commands and stuff
- Launch browser at http://localhost:5173 and sign in with Google
- In VSCode
  - Open /src/components/common/NavigationBar/NavigationBar.tsx
  - Open /src/components/common/NavigationBar/NavigationBar.test.tsx

# Step 0: Setting the stage

## Context

- This demo is to illustrate the basic test-driven development flow
- Given the time constraints, I only implemented basic tests for the navigation bar
  - We will dive a little deeper into other scenarios at the end of the demo

## Finished product

- Switch to `main` branch
- Show the browser window, pointing out the navigation bar

# Step 1: Terminal walkthrough

- Specifically mention the pane where we're running `test:watch` and why we do it this way

# Step 2: Starting point

- Switch to `tdd-demo-starting-point` branch
- Establish base context:
  - Stub NavigationBar implementation
  - Stub NavigationBar tests implementation
- Review flow: For each step: write a failing test → implement minimal code → refactor if needed.

# Step 3: Base navigation bar structure

- AC:
  - Component uses Material UI AppBar and Toolbar
  - Component is fixed to the top of the page
  - Component is branded with "Dog Log" and branding includes a material `Pets` icon
  - Component is correctly adorned with aria properties

## Step 3.1: Failing test

```tsx
// src/components/common/NavigationBar/NavigationBar.test.tsx
it('renders a fixed primary navigation bar with brand', () => {
  render(<NavigationBar />);

  // The nav container
  const nav = screen.getByRole('navigation', { name: /primary/i });
  expect(nav).toBeInTheDocument();
});
```

## Step 3.2: Demonstrate failing test in terminal

## Step 3.3: Minimal implementation

```tsx
export function NavigationBar() {
  return <AppBar position="fixed" component="nav" aria-label="Primary" />;
}
```

### Next test: Branding

```tsx
it('renders the expected branding', () => {
  render(<NavigationBar />);

  // The nav container
  const nav = screen.getByRole('navigation', { name: /primary/i });
  // Brand heading text
  const heading = within(nav).getByRole('heading', { name: /dog log/i });
  expect(heading).toBeInTheDocument();

  // Brand acts as a home link
  const brandLink = within(nav).getByRole('link', { name: /dog log/i });
  expect(brandLink).toHaveAttribute('href', '/');
});
```

### Next implementation: Branding

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

## Step 3.4: Demonstrate passing test in terminal

## Step 3.5: Demonstrate husky hooks

```bash
git add . && git commit -m "implement navigation bar foundation"
```

# Step 4: Implement "Pets" Navigation Link

- AC:
  - Component contains a link that navigates to the "Pets" route when clicked

## Step 4.1: Failing test

```tsx
// append to NavigationBar.test.tsx

it('renders a link to the Pets page', () => {
  render(<NavigationBar />);
  const link = screen.getByRole('link', { name: /pets/i });
  expect(link).toHaveAttribute('href', '/pets');
});
```

## Step 4.2: Demonstrate failing test in terminal

## Step 4.3: Minimal implementation

```tsx
// append inside <Toolbar> after the brand area
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// ...inside the Toolbar, after Typography brand
<Button color="inherit" component={RouterLink} to="/pets" sx={{ ml: 1 }}>
  Pets
</Button>;
```

## Step 4.4: Demonstrate passing test in terminal

# Step 5: Integrate LogoutButton component

- AC:
  - Integrate the existing LogoutButton component with the navigation bar
  -
- Technical Notes:
  - LogoutButton leverages an auth store
  - LogoutButton lazy-loads its i18n namespace
  - LogoutButton has its own test suite to verify its behavior and interactions so we will only test that it renders within the navigation bar.

## Step 5.1: Failing test

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
  useAuthStore: (selector: any) =>
    selector({ signOut: vi.fn(), initializing: false }),
}));

vi.mock('@store/useResetStores.tsx', () => ({
  useResetStores: () => vi.fn(),
}));

// Now the test

it('renders the LogoutButton in the navigation bar', async () => {
  render(<NavigationBar />);
  const button = await screen.findByTestId('logout-button');
  expect(button).toBeInTheDocument();
});
```

## Step 5.2: Demonstrate failing test in terminal

## Step 5.3: Minimal implementation

```tsx
// src/components/common/NavigationBar/NavigationBar.tsx
import { LogoutButton } from '@features/authentication';

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
          <Box
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ textDecoration: 'none' }}
          >
            Dog Log
          </Box>
        </Typography>

        {/* Primary links */}
        <Button
          color="inherit"
          component={RouterLink}
          to="/pets"
          sx={{ mr: 1 }}
        >
          Pets
        </Button>

        {/* Actions */}
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
}
```

## Step 5.4: Demonstrate passing test in terminal

# Step 6: Small accessibility polish tests

- AC:
  - The brand link and Pets link are keyboard-focusable and visible
  - `AppBar` exposes `role="navigation"` with `aria-label="Primary"`

## Step 6.1: Failing test

```tsx
// append optional tests

it('navigation has aria-label Primary', () => {
  render(<NavigationBar />);
  const nav = screen.getByRole('navigation', { name: /primary/i });
  expect(nav).toBeInTheDocument();
});

it('brand and Pets links are visible and focusable', async () => {
  render(<NavigationBar />);
  const brand = screen.getByRole('link', { name: /dog log/i });
  const pets = screen.getByRole('link', { name: /pets/i });
  expect(brand).toBeVisible();
  expect(pets).toBeVisible();
});
```

## Step 6.2: Demonstrate failing test in terminal

## Step 6.3: Minimal implementation

No implementation, we were just adding test coverage.

## Step 6.4: Demonstrate passing test in terminal

# Step 7: Bonus Content

- Quick walkthrough of LogoutButtonTests, focusing on:
  - Dealing with lazy-loaded components
  - Controlling test paths using mocks, e.g. useAuthStore
  - Parameterized tests
  - Using beforeEach and afterEach for test setup and teardown
  - Point out the number of tests for even a simple component that is nothing more than a button with some basic behavior
- Touch on snapshot testing with GoogleLoginButton.test.tsx
