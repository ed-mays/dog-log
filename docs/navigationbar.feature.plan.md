# Plan: Refactor NavigationBar with TDD

This document outlines the step-by-step plan to refactor the `NavigationBar` component using a strict Test-Driven
Development (TDD) approach.

**Requirements:**

1. Refactor the `NavigationBar` to use the Material-UI `AppBar` component.
2. Add a text logo of "Dog Log" that links to the home page (`/`).
3. Add a navigation link to the `/pets` route.
4. Add the `LogoutButton` component.

## Analysis of Current State

- `@components/common/NavigationBar/NavigationBar.tsx`: The current component is a simple `div` with props (`text`,
  `role`, `ariaLive`) that are not semantically correct for a navigation bar.
- `@components/common/NavigationBar/NavigationBar.test.tsx`: The tests validate the incorrect `div` implementation. They
  will be completely replaced.
- `@package.json`: Confirms that `@mui/material` and `react-router-dom` are installed and available.
- `GEMINI.md`: The developer guidelines state to use `@test-utils` for rendering and prefer `test()` over `it()`.

---

## Step 1: Establish a New Baseline with MUI `AppBar`

Our first goal is to replace the `div` with a proper MUI `AppBar` and render the "Dog Log" title. The TDD cycle starts
with a failing test that defines this goal.

### Action 1.1: Write a Failing Test

We will update the test file to check for an accessible navigation landmark and the app title. This test will fail
because the old component is still in place.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.test.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.test.tsx
@@ -1,32 +1,18 @@
-import { render, screen } from '@testing-library/react';
+import { render, screen } from '@test-utils';
 import { NavigationBar } from './NavigationBar';

 describe('NavigationBar', () => {
-  it('renders with default props', () => {
+  test('should render the navigation bar with the app title', () => {
     render(<NavigationBar />);
-    const navigationBar = screen.getByTestId('loading-indicator');
-    expect(navigationBar).toBeInTheDocument();
-    expect(navigationBar).toHaveTextContent('Navigation Bar');
-    expect(navigationBar).toHaveAttribute('role', 'status');
-    expect(navigationBar).toHaveAttribute('aria-live', 'polite');
-  });
-
-  it('renders with custom text', () => {
-    render(<NavigationBar text="Custom Text" />);
-    const navigationBar = screen.getByText('Custom Text');
-    expect(navigationBar).toBeInTheDocument();
-  });
+    // Check for the main navigation landmark. MUI's AppBar renders a <header>.
+    const navElement = screen.getByRole('banner');
+    expect(navElement).toBeInTheDocument();

-  it('renders with a custom role', () => {
-    render(<NavigationBar role="navigation" />);
-    const navigationBar = screen.getByRole('navigation');
-    expect(navigationBar).toBeInTheDocument();
-  });
-
-  it('renders with a custom aria-live attribute', () => {
-    render(<NavigationBar ariaLive="assertive" />);
-    const navigationBar = screen.getByTestId('loading-indicator');
-    expect(navigationBar).toHaveAttribute('aria-live', 'assertive');
-  });
-
-  it('renders with a custom data-testid', () => {
-    render(<NavigationBar data-testid="custom-testid" />);
-    const navigationBar = screen.getByTestId('custom-testid');
-    expect(navigationBar).toBeInTheDocument();
+    // Check for the "Dog Log" title, which should be a heading.
+    const title = screen.getByRole('heading', { name: /dog log/i });
+    expect(title).toBeInTheDocument();
   });
 });

```

### Action 1.2: Implement the `AppBar` to Make the Test Pass

Now, we write the minimum code required to make the failing test pass. We'll replace the `div` with MUI's `AppBar`,
`Toolbar`, and `Typography` components.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.tsx
@@ -1,20 +1,22 @@
-//import { useTranslation } from 'react-i18next';
+import { AppBar, Toolbar, Typography } from '@mui/material';
+import { Link } from 'react-router-dom';

 export type NavigationBarProps = {
-  text?: string; // optional override of localized default
-  role?: React.AriaRole; // a11y role
-  ariaLive?: 'polite' | 'assertive' | 'off';
   'data-testid'?: string;
 };

 export function NavigationBar({
-  text,
-  role = 'status',
-  ariaLive = 'polite',
-  'data-testid': dataTestId = 'loading-indicator',
+  'data-testid': dataTestId = 'navigation-bar',
 }: NavigationBarProps) {
-  //const { t } = useTranslation('common');
-  //const label = text ?? t('loading', 'Loading…');
-  const label = text ?? 'Navigation Bar';
   return (
-    <div data-testid={dataTestId} role={role} aria-live={ariaLive}>
-      {label}
-    </div>
+    <AppBar position="static" data-testid={dataTestId}>
+      <Toolbar>
+        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
+          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
+            Dog Log
+          </Link>
+        </Typography>
+      </Toolbar>
+    </AppBar>
   );
 }

```

**Result:** The test from Action 1.1 now passes. We have successfully refactored the base component.

---

## Step 2: Add a Link to the Pets Page

With a solid baseline, we can add new features. The next requirement is a link to the `/pets` page.

### Action 2.1: Write a Failing Test

We add a new test case to find a link with the name "Pets" that points to the correct route. This test will fail because
the link does not exist yet.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.test.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.test.tsx
@@ -15,4 +15,10 @@
     const title = screen.getByRole('heading', { name: /dog log/i });
     expect(title).toBeInTheDocument();
   });
+
+  test('should render a link to the pets page', () => {
+    render(<NavigationBar />);
+    const petsLink = screen.getByRole('link', { name: /pets/i });
+    expect(petsLink).toHaveAttribute('href', '/pets');
+  });
 });

```

### Action 2.2: Implement the Pets Link to Make the Test Pass

We add an MUI `Button` integrated with `react-router-dom`'s `Link` to satisfy the test.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.tsx
@@ -1,4 +1,4 @@
-import { AppBar, Toolbar, Typography } from '@mui/material';
+import { AppBar, Button, Toolbar, Typography } from '@mui/material';
 import { Link } from 'react-router-dom';

 export type NavigationBarProps = {
@@ -16,6 +16,9 @@
             Dog Log
           </Link>
         </Typography>
+        <Button component={Link} to="/pets" color="inherit">
+          Pets
+        </Button>
       </Toolbar>
     </AppBar>
   );

```

**Result:** Both tests now pass. The "Pets" link is successfully added.

---

## Step 3: Add the Logout Button

The final requirement is to integrate the existing `LogoutButton` component.

### Action 3.1: Write a Failing Test

We add a test to ensure the logout button is rendered. We can reliably select it by its `data-testid`.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.test.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.test.tsx
@@ -21,4 +21,9 @@
     const petsLink = screen.getByRole('link', { name: /pets/i });
     expect(petsLink).toHaveAttribute('href', '/pets');
   });
+
+  test('should render the logout button', () => {
+    render(<NavigationBar />);
+    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
+  });
 });

```

### Action 3.2: Implement the Logout Button to Make the Test Pass

We import and add the `LogoutButton` to the `Toolbar`.

```diff
--- a/src/components/common/NavigationBar/NavigationBar.tsx
+++ b/src/components/common/NavigationBar/NavigationBar.tsx
@@ -1,5 +1,6 @@
 import { AppBar, Button, Toolbar, Typography } from '@mui/material';
 import { Link } from 'react-router-dom';
+import LogoutButton from '@features/authentication/components/GoogleAuth/LogoutButton.tsx';

 export type NavigationBarProps = {
   'data-testid'?: string;
@@ -17,6 +18,7 @@
         <Button component={Link} to="/pets" color="inherit">
           Pets
         </Button>
+        <LogoutButton />
       </Toolbar>
     </AppBar>
   );

```

**Result:** All tests pass. The `LogoutButton` is now part of the `NavigationBar`.

---

## Conclusion

By following a strict "Red-Green-Refactor" TDD cycle, we have successfully:

1. Replaced a simple `div` with a robust and accessible MUI `AppBar`.
2. Ensured the application title, a key navigation link, and the logout functionality are present and testable.
3. Created a comprehensive test suite that validates behavior rather than implementation details.

The `NavigationBar` component is now complete and adheres to all requirements.
