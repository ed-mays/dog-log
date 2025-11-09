### High-level assessment

You have a solid test foundation: a project-wide render wrapper, feature-flag plumbing in tests, i18n wired, and a good split between unit tests (stores/services) and higher-level app routing tests. A few places can be tightened to reduce duplication, improve determinism, and align with the conventions in your guidelines.

Below are concrete improvement opportunities, grouped by theme, with small code examples you can drop in.

---

### 1) Make store-mocking consistent and DRY

I see three different patterns for mocking Zustand stores across tests:

- Per-file inline `vi.mock('@store/...', () => ({ useXStore: vi.fn() }))` (e.g., `App.test.tsx`, `App.authGuard.test.tsx`, `App.routing.test.tsx`).
- Direct selector-style mocks in-line (passing a `selector` param manually).
- A dedicated helper `createPetsStoreMock` (great!), but it’s not used everywhere; auth/ui equivalents exist via `createAuthStoreMock`/`createUiStoreMock` but aren’t used consistently across files.

Recommendations:

- Adopt one pattern project-wide: export factory functions for each store and always mock via those factories. You already have `@testUtils/mocks/mockStores` with `createPetsStoreMock` and `createAuthStoreMock`/`createUiStoreMock`. Use those everywhere (including `App.authGuard.test.tsx`, `App.routing.test.tsx`, feature tests) so tests remain readable and behaviorally consistent.
- Provide one-line helpers to wire the mock into `vi.mocked(useXStore)`, removing repetitive boilerplate.

Example helper (co-locate with `mockStores.ts`):

```ts
// src/testUtils/mocks/mockStoreInstallers.ts
import { vi } from 'vitest';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';
import {
  createAuthStoreMock,
  createPetsStoreMock,
  createUiStoreMock,
} from '@testUtils/mocks/mockStores';

export function installAuthStoreMock(
  overrides?: Parameters<typeof createAuthStoreMock>[0]
) {
  const mock = createAuthStoreMock(overrides);
  vi.mocked(useAuthStore).mockImplementation(mock.impl as any);
  return mock; // exposes actions/state for assertions
}

export function installPetsStoreMock(
  overrides?: Parameters<typeof createPetsStoreMock>[0]
) {
  const mock = createPetsStoreMock(overrides);
  vi.mocked(usePetsStore).mockImplementation(mock.impl as any);
  return mock;
}

export function installUiStoreMock(
  overrides?: Parameters<typeof createUiStoreMock>[0]
) {
  const mock = createUiStoreMock(overrides);
  vi.mocked(useUiStore).mockImplementation(mock.impl as any);
  return mock;
}
```

Usage:

```ts
// in tests
vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));
vi.mock('@store/ui.store', () => ({ useUiStore: vi.fn() }));

let petsMock, authMock, uiMock;
beforeEach(() => {
  vi.resetAllMocks();
  authMock = installAuthStoreMock({ user: { uid: 'u1' }, initializing: false });
  petsMock = installPetsStoreMock({ pets: [] });
  uiMock = installUiStoreMock({ loading: false });
});
```

This drops repetitive `createXStoreMock(...).impl as unknown as typeof useXStore` everywhere and standardizes the setup.

---

### 2) Avoid mixing alias variants in mocks

There are multiple forms in the codebase:

- `vi.mock('@store/auth.store', ...)`
- `vi.mock('@store/auth.store.ts', ...)`

This can cause subtle mismatches because `vitest` resolves based on specifier identity. Pick one (the alias without `.ts` is preferable) and standardize. A quick search shows both forms in different files (e.g., `LogoutButton.test.tsx`, `RoutePrefetcher.test.tsx`). Unify to `@store/<name>.store` everywhere.

---

### 3) Global mock of AuthBootstrap: keep it, but document the escape hatch

You already moved

```ts
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
```

into `vitest.setup.ts`. That’s good for suppressing cross-cutting side-effects in app-level tests, but it collides with unit tests for `AuthBootstrap` itself.

Recommendation:

- Add a short comment and a helper showing how to unmock in the module’s own tests (you’ve encountered this already). This makes the pattern discoverable.

Example comment to add in `vitest.setup.ts`:

```ts
// Note: unmock in a specific test via:
// vi.resetModules();
// vi.unmock('@features/authentication/AuthBootstrap');
// const { default: AuthBootstrap } = await import('@features/authentication/AuthBootstrap');
```

Optionally, add a test util:

```ts
// src/testUtils/unmockAuthBootstrap.ts
import { vi } from 'vitest';
export async function loadRealAuthBootstrap() {
  vi.resetModules();
  vi.unmock('@features/authentication/AuthBootstrap');
  return (await import('@features/authentication/AuthBootstrap')).default;
}
```

---

### 4) Normalize module graph reset strategy

Some files use `vi.resetAllMocks()` only; others also use `vi.resetModules()` and dynamic imports. Use a consistent rule:

- Only use `vi.resetModules()` when you are toggling mocks/unmocks or you need a fresh evaluation order (e.g., to bypass a global mock). Otherwise, prefer `vi.resetAllMocks()` to keep tests faster.
- Where you use `vi.resetModules()`, ensure all modules that depend on the mocked ones are re-imported dynamically after the reset, not statically at the top of the file. `App.routing.test.tsx` already follows this pattern; `App.test.tsx` keeps static imports (fine because it doesn’t toggle unmocking). Document this distinction in a short comment at the top of those files to prevent accidental regressions.

---

### 5) Strengthen and reuse the render wrapper

Your `@test-utils` wrapper is good. Two small upgrades can improve reuse and reduce in-test boilerplate:

- Add a `withUser`/`withFlags` convenience around `render` to minimize repeated auth-store + feature-flag setup for routing tests.
- Provide a typed `renderApp` helper that sets common defaults (`initialRoutes`, flags) so app-level tests are one-liners.

Example:

```ts
// src/testUtils/renderApp.tsx
import { render } from '@test-utils';
import App from '../App';

export function renderApp(options?: Parameters<typeof render>[1]) {
  return render(<App />, { initialRoutes: ['/pets'], ...options });
}
```

Now in tests:

```ts
renderApp({ featureFlags: { authEnabled: false } });
```

---

### 6) Prefer user-event consistently for interactions

Per your guidelines, interactions should use `@testing-library/user-event`. Scan and replace any `fireEvent` usage and ensure all `userEvent` calls are awaited. Also prefer `findBy*` for async appearance assertions; you’re already doing this in many places.

Checklist for consistency:

- `await userEvent.click(...)`/`await userEvent.type(...)`
- No `fireEvent` unless there’s a specific limitation
- Use `findByRole`/`findByText` for delayed elements instead of `waitFor(getBy...)`

---

### 7) Extract common route assertions into helpers

Routing tests repeat patterns like “unauthenticated user is redirected to Welcome” or “Feature not enabled page shows.” Consider small, intention-revealing helpers:

```ts
// src/testUtils/routes.ts
import { screen } from '@testing-library/react';

export async function expectWelcomePage() {
  await screen.findByRole('heading', { name: /welcome/i });
}

export async function expectFeatureUnavailable() {
  expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
}
```

This keeps individual tests focused on the preconditions and route, not repeating the same selectors/strings.

---

### 8) Keep store unit tests “real” by default

Your `auth.store.test.ts` uses the real store and mocks only the underlying `authService` methods. That’s perfect. To avoid future collisions with global mocks, keep the rule: “Never globally mock stores.” When a component test wants to control store state, mock the `useXStore` hook locally (as you do) and install a selector-compatible mock via the helpers.

---

### 9) Align on test file naming and placement

You already colocate tests next to components (great). Ensure file names consistently follow `Component.test.tsx` and `storeName.test.ts(x)` conventions. Where you have selector-focused tests (`auth.store.selectors.test.tsx`), the naming is clear—keep that pattern for any new selector modules.

---

### 10) Accessibility and i18n assertions

- You’re already using accessible queries in many spots (`findByRole`, `getByLabelText`). Keep user-facing assertions i18n-ready by avoiding hardcoded English text when possible. Prefer `data-testid` only as a last resort.
- For interactive widgets (modals, menus), add keyboard coverage: `Escape` closes, focus trap works, `aria-modal`, `aria-expanded` states, etc. This both improves robustness and catches regressions early.

---

### 11) Coverage thresholds vs. brittleness

Your coverage thresholds are strict (90% per-file). That’s fine, but guard against brittle tests by:

- Avoiding implementation-detail assertions (e.g., internal state from mocks) unless it’s a store unit test.
- Favoring observable behavior (rendered output, ARIA attributes, navigation changes) over spy call counts in component tests. Where call counts matter (e.g., side-effect deduping), test at the boundary and include a brief comment explaining why the count is meaningful.

---

### 12) Minor cleanup opportunities spotted

- `App.routing.test.tsx` mixes two describe blocks with slightly different import strategies; consider consolidating to one consistent beforeEach pattern. The second block re-imports `render` and `App` dynamically to be safe after `vi.resetModules()`—that’s correct for that style. If you keep both, add a comment distinguishing why the second suite uses dynamic imports.
- A few tests import `@store/... .ts` with the `.ts` suffix in mocks; standardize to the alias without extension (see item 2).

---

### Example: refactoring one suite end-to-end

Before:

```ts
vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));

let mockUseAuthStore: typeof useAuthStore;
let mockUsePetsStore: typeof usePetsStore;

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  const authStoreModule = await import('@store/auth.store');
  mockUseAuthStore = authStoreModule.useAuthStore;
  const petsStoreModule = await import('@store/pets.store');
  mockUsePetsStore = petsStoreModule.usePetsStore;

  (mockUseAuthStore as vi.Mock).mockImplementation(
    createAuthStoreMock({ user: null, initializing: false }).impl as any
  );
  (mockUsePetsStore as vi.Mock).mockImplementation(
    createPetsStoreMock({ pets: [] }).impl as any
  );
});
```

After (with installers):

```ts
vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));

import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';

let authMock, petsMock;

beforeEach(() => {
  vi.resetAllMocks();
  authMock = installAuthStoreMock({ user: null, initializing: false });
  petsMock = installPetsStoreMock({ pets: [] });
});
```

Result: fewer moving parts, clearer intention, and consistent across the codebase.

---

### Summary of recommended actions

- Standardize on factory-based store mocks with small installers; use them everywhere component tests mock stores.
- Keep the global `AuthBootstrap` mock, but document and provide a tiny helper to unmock for its unit test.
- Normalize alias usage (no `.ts` suffix in specifiers) and when to use `vi.resetModules()` vs `vi.resetAllMocks()`.
- Add tiny route and render helpers to reduce repetition in app/routing tests.
- Audit interactions for `user-event` usage and accessible queries; add targeted a11y keyboard tests for interactive components.

If you want, I can create the `mockStoreInstallers.ts` and `routes.ts` helpers and show how they would replace duplicated snippets across specific test files you pointed out.

---

### Adopted testing patterns (2025-11-09)

This project has adopted the following testing conventions and utilities. These patterns are now considered the
preferred approach for new and existing tests.

#### 1) Store mocking via installers (Zustand)

- Always declare store module mocks at the top of the test file so we can inject implementations.
- Use the installer helpers from `@testUtils/mocks/mockStoreInstallers` inside `beforeEach` (or per‑test) to provide a
  selector‑compatible implementation and expose `actions` for assertions.

Example:

```ts
// Top of file
vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));
vi.mock('@store/ui.store', () => ({ useUiStore: vi.fn() }));

import {
  installAuthStoreMock,
  installPetsStoreMock,
  installUiStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';

let petsMock: ReturnType<typeof installPetsStoreMock>;

beforeEach(() => {
  vi.resetAllMocks();
  petsMock = installPetsStoreMock({ pets: [] });
  installAuthStoreMock({ user: { uid: 'u1' }, initializing: false });
  installUiStoreMock({ loading: false, error: null });
});

// Later in the test
expect(petsMock.actions.fetchPets).toHaveBeenCalled();
```

Notes:

- Keep real store unit tests unmocked; use installers only in component/integration tests.

#### 2) Route/page assertion helpers

Use helpers from `@testUtils/routes` to express intent and reduce selector duplication:

```ts
import { expectPetListVisible, expectFeatureUnavailable, expectWelcomePage } from '@testUtils/routes';

render(<App />, { initialRoutes: ['/pets'] });
await expectPetListVisible();
```

Available helpers today:

- `expectWelcomePage()`
- `expectFeatureUnavailable()`
- `expectPetListVisible()`
- `expectNotFoundPage()`

#### 3) Unmock escape hatch for AuthBootstrap

`AuthBootstrap` is globally mocked in `vitest.setup.ts` to avoid cross‑cutting side effects in most tests. In the
component’s own suite, use the escape‑hatch pattern to load the real implementation and assert side‑effects at the
service boundary:

```ts
beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
});

it('subscribes once and cleans up on unmount', async () => {
  // 1) Unmock the component before importing it
  vi.unmock('@features/authentication/AuthBootstrap');

  // 2) Spy on the service boundary first to neutralize side‑effects
  const authServiceModule = await import('@services/auth/authService');
  const cleanup = vi.fn();
  const subscribeSpy = vi
    .spyOn(authServiceModule, 'subscribeToAuth')
    .mockReturnValue(cleanup);

  // 3) Dynamically import the real component after unmocking
  const { default: AuthBootstrap } = await import(
    '@features/authentication/AuthBootstrap'
  );

  // 4) Render and assert
  const { unmount } = render(<AuthBootstrap />);
  expect(subscribeSpy).toHaveBeenCalledTimes(1);
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
```

#### 4) Interaction and async query guidelines

- Prefer `@testing-library/user-event` for interactions; always `await` user actions.
- For async appearance, use `findBy*` queries instead of wrapping `getBy*` in `waitFor`.
- Use `waitFor` only for side‑effect synchronization (e.g., spies called, element disappears) when no accessible query
  expresses the state directly.

#### 5) Lint guardrails (Step 9)

ESLint enforces two rules in test files (`**/*.test.ts?(x)`):

- Disallow `vi.mock('… .ts')` specifiers — use aliases without the `.ts` extension.
- Disallow `fireEvent` imports and calls — use `@testing-library/user-event` instead.

See `eslint.config.js` for exact rules.

#### 6) Aliases and imports

- Use the configured aliases from `tsconfig.app.json` in tests and production code.
- When mocking with `vi.mock`, do not include a file extension in the specifier (e.g., `@store/auth.store`, not
  `@store/auth.store.ts`).

#### 7) Optional helpers

- If repeated app rendering boilerplate emerges, consider a thin `renderApp` wrapper under `src/testUtils/` that
  defaults common options. Keep it optional to preserve test clarity.

References:

- Plan: `docs/test-architecture-review.plan.md`
- Helpers: `src/testUtils/mocks/mockStoreInstallers.ts`, `src/testUtils/routes.tsx`
- Suite examples: `src/App*.test.tsx`, `src/features/authentication/AuthBootstrap.test.tsx`
