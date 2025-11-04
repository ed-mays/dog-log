### What I looked at

I reviewed the places that couple UI visibility and routing to auth state and feature flags:

- `src/App.tsx`
- `src/AppRoutes.tsx`
- `src/components/common/PrivateRoute.ts`
- `src/featureFlags/hooks/useFeatureFlag.ts`
- `src/test-utils.tsx`
- `src/store/auth.store.ts`

### Summary — Your hunch is largely correct

You have multiple, slightly different checks for “is the user allowed to see this?” scattered across the app. That
duplication creates divergent render trees and timing windows (especially around `initializing` and Suspense), which
makes tests brittle. The biggest offenders:

- Duplicated auth gating in three places: `App.tsx` (header), `AppRoutes.tsx` (whole router), and `PrivateRoute.ts` (per
  route).
- Inconsistent interpretation of the `authEnabled` flag. In some places, `authEnabled=false` acts like “bypass auth,”
  but the header still requires `user && authEnabled`, which hides navigation even though routes are accessible.
- Multiple loading surfaces: `AppRoutes.tsx` shows `<LoadingIndicator />` while auth initializes; `App.tsx` also
  conditionally shows `<LoadingIndicator />` for `appLoading && !initializing`. That opens timing windows where tests
  see different UIs depending on microtasks.
- `Suspense` + `lazy` routes introduce an additional async layer; combined with the above, this increases test flakiness
  if assertions use `getBy*` instead of `findBy*` or if gating conditions differ per component.

### Findings in detail

- `App.tsx`
  - Renders the `NavigationBar` only when `user && authEnabled`:
    ```ts
    {user && authEnabled && (
      <header aria-label="user-controls">
        <NavigationBar />
      </header>
    )}
    ```
    If `authEnabled=false` (bypass mode), a signed-out user will still see routes (per `PrivateRoute` and `AppRoutes`)
    but won’t see the header. This is inconsistent and complicates tests.
  - Loading indicator is tied to a separate `ui.store` flag and excludes `initializing`:
    ```ts
    {appLoading && !initializing && <LoadingIndicator />}
    ```
- `AppRoutes.tsx`
  - Centralizes the primary auth flow: if `initializing`, show spinner; if `!user`, render welcome/redirect routes;
    otherwise render authenticated routes.
  - Also wraps feature-gated pages in `<PrivateRoute>` even though the routing already branched on `user`.
- `PrivateRoute.ts`
  - Allows children when `!authEnabled || user`:
    ```ts
    if (!authEnabled || user) return children; // bypass or allow
    return null; // blocks rendering (no redirect)
    ```
  - This is a third, slightly different contract from `AppRoutes` and `App.tsx`.
- `test-utils.tsx`
  - Good defaults (all flags true) and an escape hatch to set specific flags. But because gating logic is duplicated,
    tests often need to set both auth store state and feature flags to get consistent UI, increasing friction and
    brittleness.

### Why this causes brittle tests

- Small differences in gating logic create different DOM trees at different times: sometimes a route renders, sometimes
  it renders `null`, sometimes it redirects.
- Tests that assert presence/absence of elements like the navigation bar need to know a matrix of conditions (
  authEnabled, user, initializing). When those conditions are checked differently across components, test intent becomes
  unclear and fragile to refactors.
- Having multiple loading indicators driven by different stores means the UI can flicker between states, and assertions
  race those transitions unless you consistently use `await screen.findBy*`.

### Simplifications to reduce brittleness

1. Introduce a single derived concept: "isAuthenticated"

- Define a hook that unifies the contract “user is allowed to proceed.”
- Behavior: if `authEnabled=false`, treat the app as always authenticated; otherwise require `user`.
- Example:

  ```ts
  // src/features/authentication/hooks/useIsAuthenticated.ts
  import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
  import { useAuthStore } from '@store/auth.store';

  export function useIsAuthenticated() {
    const authEnabled = useFeatureFlag('authEnabled');
    const user = useAuthStore((s) => s.user);
    return !authEnabled || !!user;
  }
  ```

- Use this everywhere that currently mixes `authEnabled` and `user` checks.

2. Pick ONE place to gate on auth for routing

- The cleanest is to keep it at the router level (`AppRoutes.tsx`) and remove `PrivateRoute` entirely.
- With a unified `useIsAuthenticated`, `AppRoutes` can be:

  ```tsx
  // Pseudocode in AppRoutes.tsx
  const isAuthenticated = useIsAuthenticated();
  const { initializing } = useAuthStore();

  if (initializing) return <LoadingIndicator />;

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Navigate to="/pets" replace />} />
            <Route path="/welcome" element={<Navigate to="/pets" replace />} />
            {/* feature redirects remain, but no PrivateRoute */}
            <Route
              path="/pets"
              element={
                enablePetList ? (
                  <PetListPage />
                ) : (
                  <Navigate to="/feature-unavailable" replace />
                )
              }
            />
            <Route
              path="/pets/new"
              element={
                enableAddPet ? (
                  <AddPetPage />
                ) : (
                  <Navigate to="/feature-unavailable" replace />
                )
              }
            />
            <Route
              path="/pets/:id/edit"
              element={
                enablePetActions ? (
                  <EditPetPage />
                ) : (
                  <Navigate to="/feature-unavailable" replace />
                )
              }
            />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route
              path="/pets/*"
              element={<Navigate to="/welcome" replace />}
            />
          </>
        )}
        <Route
          path="/feature-unavailable"
          element={<div>{t('featureNotEnabled', 'Feature not enabled')}</div>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
  ```

- Delete `PrivateRoute` or keep it as a thin wrapper that only redirects (not returns `null`) and is used consistently.

3. Make header logic consistent with the routing contract

- If the app is “authenticated” under the same rule, render the `NavigationBar` for that same condition.
- Replace `user && authEnabled` with `useIsAuthenticated()`:
  ```tsx
  const isAuthenticated = useIsAuthenticated();
  {
    isAuthenticated && (
      <header aria-label="user-controls">
        <NavigationBar />
      </header>
    );
  }
  ```

4. Consolidate loading indicators

- Today, `AppRoutes` shows a spinner during auth `initializing`; `App.tsx` shows a spinner for
  `appLoading && !initializing`.
- Decide on one canonical place for the auth-loading spinner (ideally `AppRoutes` since routing depends on it).
- If `appLoading` refers to other background work, consider a single top-level `GlobalLoadingIndicator` that merges both
  signals to avoid flicker:
  ```tsx
  const { initializing } = useAuthStore();
  const appLoading = useUiStore((s) => s.loading);
  const showSpinner = initializing || appLoading;
  {
    showSpinner && <LoadingIndicator />;
  }
  ```
- In tests, prefer stubbing `initializing=false` to eliminate timing windows, unless you are explicitly testing the
  initializing screen.

5. Keep feature flag decisions local to the route element

- You already redirect gated routes to `/feature-unavailable`. That’s good. With `useIsAuthenticated` and no
  `PrivateRoute`, you remove one layer of conditionals.

6. Testing patterns to de-flake tests

- Add a test helper to set auth store state in a single line. For example, a small utility that mocks `useAuthStore`
  selector calls with `{ user, initializing }` and resets between tests. Your repo already uses
  `vi.mock('@store/auth.store'...)` in several places—wrap that pattern in a consistent helper so each test can declare
  its desired state succinctly.
- Default test state should be stable and “ready”: `initializing=false`. Only set `initializing=true` in tests that
  verify the loading screen.
- Always use `findBy*` for elements that appear after lazy loading or gating changes. Given `Suspense` and auth
  transitions, avoid `getBy*` immediately after render.
- Prefer route-level tests for gated pages. For example:

  ```ts
  // Happy path, authenticated
  render(<AppRoutes />, { initialRoutes: ['/pets'] });
  expect(await screen.findByRole('heading', { name: /pets/i })).toBeVisible();

  // Unauthenticated path
  mockAuth({ user: null, initializing: false });
  render(<AppRoutes />, { initialRoutes: ['/pets'] });
  await screen.findByText(/welcome/i);

  // Feature disabled
  render(<AppRoutes />, { initialRoutes: ['/pets'], featureFlags: { petListEnabled: false } });
  await screen.findByText(/feature not enabled/i);
  ```

### Expected impact

- A single source of truth (`useIsAuthenticated`) removes divergent logic and makes component conditions predictable.
- Eliminating `PrivateRoute` (or making it a pure redirect wrapper) and consolidating loading indicators reduces
  transient states that tests can race against.
- Tests become simpler to set up: you specify `user`, `initializing`, and flag overrides once; the same rule governs
  both header and routes.

### Quick checklist to implement

- [ ] Add `useIsAuthenticated` hook.
- [ ] Update `App.tsx` to show the header based on `isAuthenticated`.
- [ ] Update `AppRoutes.tsx` to gate solely via `isAuthenticated`; remove `PrivateRoute` wrappers.
- [ ] Remove `PrivateRoute` (or convert it to a simple redirecting component and use it consistently, but not together
      with router-level gating).
- [ ] Decide on one place for auth-loading spinner and unify logic for `appLoading` vs `initializing`.
- [ ] Add/standardize a test helper to set the auth store shape; make `initializing=false` the default in tests.
- [ ] Replace any remaining `getBy*` on async UI with `findBy*`.

If you’d like, I can outline the minimal diffs to apply these changes or propose a `mockAuth` helper for your tests that
mirrors your existing `@test-utils` pattern.
