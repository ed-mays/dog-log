### What I reviewed

I sampled representative tests and utilities across the repo to understand patterns and gaps:

- Test setup utilities:
  - `vitest.setup.tsx`
  - `src/test-utils.tsx` (custom render with i18n + feature flags + MemoryRouter)
- App-level tests:
  - `src/App.test.tsx`
  - `src/App.routing.test.tsx`
- Feature tests (pets + auth):
  - `src/features/pets/components/PetList.test.tsx`
  - `src/features/pets/pages/AddPetPage.test.tsx`
  - `src/features/authentication/pages/WelcomePage.test.tsx`
- Data layer tests:
  - `src/repositories/base/BaseRepository.test.tsx`
- Flags hook:
  - `src/featureFlags/hooks/useFeatureFlag.test.tsx`

Below is a plan to improve test quality, consistency, and alignment with React 19 + Vitest best practices.

### Strengths observed

- Good shared render wrapper (`@test-utils`) that wires i18n, feature flags, and router with `initialRoutes`.
- Tests mostly colocated with code and use Testing Library queries.
- Feature flags are considered in tests (e.g., gating `petListEnabled` / `addPetEnabled`).
- Repository tests isolate Firestore by mocking SDK calls and cover transformation helpers.

### Issues and opportunities (with examples)

1. Overuse of `waitFor` where `findBy*` would be cleaner

- Example: `src/App.test.tsx` waits for elements via `waitFor` but these are discoverable via `findByTestId`/
  `findByRole`. Prefer direct `findBy*` to simplify and reduce flakiness.

2. Mixing `fireEvent` with `userEvent` and non-user-like interactions

- Example: `AddPetPage.test.tsx` uses `fireEvent` and attempts to set `.textContent` on inputs. Replace with
  `userEvent.type`, `userEvent.click`, etc., to simulate real user behavior.

3. Skipped and commented-out tests indicate unmet scenarios

- `PetList.test.tsx` has `test.skip` for add flow and relies on navigation side-effects.
- `AddPetPage.test.tsx` contains commented scenarios for submit/cancel/dirty modal flows. These are valuable paths and
  should be restored with better utilities.

4. Inconsistent mocking patterns

- Both `vi.mock` at module scope and `vi.doMock` in-test appear (`AddPetPage.test.tsx`). Module rewire requires
  `vi.resetModules` and dynamic import. Prefer stable patterns:
  - Default: `vi.mock` at top + inject state via selectors/spies.
  - If per-test mock variations are needed, use `vi.doMock` + dynamic `await import()` after resetting modules.

5. Assertions tied to implementation details or data-testid when accessible queries exist

- Example: `WelcomePage.test.tsx` uses `data-testid` for login button and snapshots; prefer role-based queries (
  `getByRole('button', { name: /sign in/i })`) and explicit assertions over snapshots.

6. Snapshot testing used where behavior checks would be clearer

- `WelcomePage.test.tsx` uses `asFragment()` snapshot in two locales. Favor explicit assertions for visible text and
  important ARIA states. Snapshots tend to be brittle for i18n content.

7. Async store mocking is hand-rolled in each test

- `PetList.test.tsx` builds a small state machine for `updatePet` and `deletePet`. This is good, but repeated patterns
  across files could be abstracted into small helpers/factories.

8. Limited a11y behavior assertions

- Confirm dialogs are checked for presence/absence but not focus trap order, `aria-modal`, ESC to close, or keyboard
  activation of buttons.

9. Flag and routing coverage can expand

- You test `petListEnabled=false` at `/pets`. Consider more navigation edges: unknown routes (404), unauthenticated
  redirect, `authEnabled=false` behavior, and locale-specific route titles.

10. Data-layer: happy-path focused; more error-paths and mapping edge cases could be covered

- `BaseRepository.test.tsx` covers mapping and specific error codes; consider IO errors, partial entity shapes, and
  ordering/limit/query composition helpers if present.

### React 19 + Vitest best-practice guidelines to adopt

- Prefer `user-event` over `fireEvent` for user interactions; always `await` user-event calls.
- Prefer `findBy*` for async presence, `queryBy*` for absence, and avoid wrapping simple existence checks in `waitFor`.
- Use accessible queries first: `getByRole` with `name` options over `getByTestId`.
- Avoid snapshots for routine component output; write explicit assertions for behavior and important text.
- Arrange-Act-Assert (AAA) structure, with concise `setup()` helpers that return screen handles when useful.
- Stable mocking strategy:
  - For Zustand stores exported as hooks, `vi.mock` the module and re-implement `useStore((s) => selector)` to select
    from a provided test state.
  - If a test needs different implementations, isolate via `vi.resetModules()` and `await import()` the SUT after
    setting up mocks.
- Keep tests independent of locales when possible by using roles and accessible names; when verifying translations, use
  your `withLocale` helper and assert a few key strings rather than snapshotting whole trees.
- For router tests, prefer rendering with `initialRoutes` and asserting on screen and `history` where necessary. Mocking
  `useNavigate` is fine for unit tests; for integration-style tests, prefer real navigation.
- Clean up: Vitest + RTL auto-clean between tests; no need for manual DOM cleanup. Use `vi.clearAllMocks()` or
  `vi.resetAllMocks()` in `beforeEach` as you already do.

### Consistency conventions to standardize

- File naming: `{Component|Hook|Module}.test.tsx` colocated with the unit under test. Integration tests:
  `{Feature}.integration.test.tsx`.
- Top-level `describe` names mirror the SUT (e.g., `describe('PetList', ...)`). Sub-describes for states (
  `when flags disabled`, `when delete fails`).
- Test names in present tense, describing observable behavior: `it('navigates to edit page on Edit click', ...)`.
- Queries order preference: `getByRole`/`findByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` →
  `getByTestId` (last resort).
- Always import `render, screen` from `@test-utils` to ensure providers are present. Use `initialRoutes` and
  `featureFlags` via render options.
- Keep `userEvent.setup()` inside each test or within `setup()` helper to ensure fresh timers and avoid cross-test
  leakage.

### Coverage gaps and scenarios to add

- Authentication and routing
  - Redirect unauthenticated users away from protected routes.
  - `authEnabled=false` should bypass auth pages/guards.
  - 404 route: navigate to an unknown path and assert not found screen.
  - Localization of route titles or nav labels if applicable.

- PetList behaviors
  - Add flow: clicking “Add Pet” navigates to new-pet route (fix skipped test using router or by asserting the form).
  - Keyboard accessibility: focus lands on confirm dialog, `Escape` closes cancelably, `Tab` traps focus.
  - Error banners are dismissible if applicable.
  - Sorting/filtering/pagination if present.

- AddPetPage flows
  - Happy path: type into inputs with `userEvent.type`, submit, assert `addPet` called with normalized values, then
    navigation to `/pets`.
  - Cancel when dirty: opens confirm modal; Accept navigates, Decline stays.
  - Validation errors: required fields, date limits, error messages readable by screen readers (`role='alert'`/
    `aria-live`).

- Feature flags
  - Per-flag matrix for key screens: verify hidden buttons don’t exist and routes are gated with localized messages.

- i18n
  - Prefer behavior checks; for translation presence, a small smoke test per namespace verifying a couple of keys render
    in `en` and one alternate locale using `withLocale`.
  - Add a test util that fails-fast when a key is missing in non-default locales (optional).

- Data layer
  - Error mapping for additional cases (network/unavailable/timeouts) beyond `permission-denied` and `not-found`.
  - Query builders: ensure `orderBy`, `limit` combinations are passed to Firestore mock as expected if you have helpers.
  - Date serialization/deserialization of more nested shapes and `undefined` fields.

### Utility and helper improvements (ergonomics)

- Router helpers
  - Add `renderWithRoutes(ui, { initialRoutes })` thin wrapper around your existing `render` if you find yourself
    mocking `useNavigate`. For integration tests, avoid mocking and assert on the presence of route-driven components.
  - Provide `getHistory()` if you switch to `createMemoryRouter` in the future.

- Store mocking helpers
  - Create small factories in `src/testUtils/factories/`:
    - `makePet(overrides)` data builder (you already hand-roll one in `PetList.test.tsx`).
    - `mockPetsStore(stateOverrides)` returns a `usePetsStore` mock that respects selectors.
  - Example selector-friendly mock:
    ```ts
    // src/testUtils/mocks/mockZustand.tsx
    export function makeZustandSelectorMock<TState>(state: TState) {
      return (selector?: (s: TState) => unknown) =>
        selector ? selector(state) : state;
    }
    ```

- i18n helpers
  - Keep `withLocale` (already exported) and prefer role-based queries to minimize coupling to translations.

- User-event setup
  - Patternize within `setup()` functions:
    ```ts
    const user = userEvent.setup();
    // return { user, ...screenQueries }
    ```

### Examples: refactoring current tests

- Replace `waitFor` with `findBy` (from `src/App.test.tsx`):

  ```ts
  // Before
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  // After
  renderComponent();
  expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  ```

- Replace `fireEvent` and `.textContent` in `AddPetPage.test.tsx`:

  ```ts
  const user = userEvent.setup();
  render(<AddPetPage />);

  await user.type(screen.getByLabelText(/name/i), 'Rover');
  await user.type(screen.getByLabelText(/breed/i), 'Hound');
  await user.click(screen.getByRole('button', { name: /ok/i }));

  await waitFor(() => expect(addPetMock).toHaveBeenCalledWith({
    name: 'Rover',
    breed: 'Hound',
    // birthDate: expect.any(Date) // if controlled by form defaults or user input
  }));

  expect(mockNavigate).toHaveBeenCalledWith('/pets');
  ```

- Refactor `WelcomePage.test.tsx` away from snapshots and test IDs:
  ```ts
  render(<WelcomePage />);
  expect(await screen.findByRole('heading', { name: /welcome to dog log!/i })).toBeVisible();
  expect(screen.getByText(/please sign in to continue\./i)).toBeVisible();
  expect(screen.getByRole('button', { name: /sign in|log in/i })).toBeEnabled();
  ```

### Prioritized action plan

1. Quick wins (low effort, high impact)

- Replace `waitFor` presence checks with `findBy*` across current tests.
- Switch `fireEvent` and direct DOM mutations to `userEvent` interactions.
- Remove snapshot assertions; replace with role-based, explicit assertions.
- Standardize on role-first queries; demote `data-testid` to last resort.

2. Utility consolidation

- Add `testUtils/factories` with `makePet` and a `mockZustand` helper.
- Create a `setup()` pattern in tests returning `{ user, ...screen }` and any useful spies.

3. Fix and unskip scenarios

- `PetList` add flow: confirm navigation or presence of add form without mocking `useNavigate` (integration-style) or
  with clear unit-test assertions.
- `AddPetPage` submit/cancel/dirty flows using user-event and dialog assertions.

4. Expand coverage on cross-cutting concerns

- Routing: unauthenticated redirects, 404 route, `authEnabled=false` behavior.
- i18n: one per-namespace sanity test in `en` and one alternate locale using `withLocale`.
- a11y: dialog focus, keyboard interactions, `role='alert'` messaging.

5. Data layer robustness

- Add tests for additional error codes/unknown errors mapping and nested date handling.
- If you have query helpers, assert correct Firestore function composition via mocks.

6. Sustaining quality

- Add ESLint plugins: `eslint-plugin-testing-library` and `eslint-plugin-jest-dom` with recommended configs to enforce
  best practices.
- Set/adjust coverage thresholds in `vitest.config.ts` (e.g., 80% lines/branches) and add `npm run test:coverage` to
  CI.

### Optional enhancements

- Consider one MSW-backed integration test suite (or Firestore emulator as you already have in
  `AddPet.integration.test.tsx`) for end-to-end flows in the pets feature.
- Add Axe (or jest-axe) a11y checks for key screens in a few smoke tests.

### Deliverables checklist (what I can do next, if you want)

- [:white_check_mark:] Apply the quick wins as a minimal PR: replace `waitFor` → `findBy`, `fireEvent` → `userEvent`,
  remove snapshots, and update queries in the files listed above.
- [:white_check_mark:] Introduce `testUtils/factories` and `mockZustand` helpers; refactor `PetList` and `AddPetPage`
  tests to use them.
- Restore the skipped/commented tests for the add and cancel flows with robust, user-centric interactions.
- Add routing edge tests and one focused a11y test for the confirm dialog.
- Add testing ESLint plugins and, if desired, a coverage threshold in Vitest config.

If you’d like, I can start by refactoring one target file (e.g., `AddPetPage.test.tsx`) to demonstrate the updated
patterns, then proceed feature-by-feature.
