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

# Step 0: Finished product

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
- Note test count in terminal as a starting point (137)

# Step 3: Base navigation bar structure

- AC:
  - Component uses Material UI AppBar and Toolbar
  - Component is fixed to the top of the page
  - Component is branded with "Dog Log" and branding includes a material `Pets` icon
  - Component is correctly adorned with aria properties

## Step 3.1: Failing test

```tsx
// src/components/common/NavigationBar/NavigationBar.test.tsx
test('renders a fixed primary navigation bar with brand', () => {
  renderWithRouter(<NavigationBar />);

  // The nav container
  const nav = screen.getByRole('navigation', { name: /primary/i });
  expect(nav).toBeInTheDocument();

  // Brand heading text
  const heading = within(nav).getByRole('heading', { name: /dog log/i });
  expect(heading).toBeInTheDocument();

  // Brand acts as a home link
  const brandLink = within(nav).getByRole('link', { name: /dog log/i });
  expect(brandLink).toHaveAttribute('href', '/');
});
```

## Step 3.2: Demonstrate failing test in terminal

## Step 3.3: Minimal implementation

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

# Step 4: Implement "Pets" Navigation Link

- AC:
  - Component contains a link that navigates to the "Pets" route when clicked

## Step 4.1: Failing test

```tsx
// append to NavigationBar.test.tsx

test('renders a link to the Pets page', () => {
  renderWithRouter(<NavigationBar />);
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

test('renders the LogoutButton in the navigation bar', async () => {
  renderWithRouter(<NavigationBar />);
  const button = await screen.findByTestId('logout-button');
  expect(button).toBeInTheDocument();
});
```

## Step 5.2: Demonstrate failing test in terminal

## Step 5.3: Minimal implementation

```tsx
// src/components/common/NavigationBar/NavigationBar.tsx
// TODO: This import sucks and should be shortened.
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

## Step 6.2: Demonstrate failing test in terminal

## Step 6.3: Minimal implementation

No implementation, we were just adding test coverage.

## Step 6.4: Demonstrate passing test in terminal
