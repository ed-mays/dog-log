## Coverage gaps and scenarios to add

### Authentication and routing

- `authEnabled=false` should bypass auth pages/guards.
- 404 route: navigate to an unknown path and assert not found screen.
- Localization of route titles or nav labels if applicable.

### PetList behaviors

- Add flow: clicking “Add Pet” navigates to new-pet route (fix skipped test using router or by asserting the form).
- Keyboard accessibility: focus lands on confirm dialog, `Escape` closes cancelably, `Tab` traps focus.
- Sorting/filtering/pagination if present.

### AddPetPage flows

- Happy path: type into inputs with `userEvent.type`, submit, assert `addPet` called with normalized values, then
  navigation to `/pets`.
- Cancel when dirty: opens confirm modal; Accept navigates, Decline stays.
- Validation errors: required fields, date limits, error messages readable by screen readers (`role='alert'`/
  `aria-live`).

### Feature flags

- Per-flag matrix for key screens: verify hidden buttons don’t exist and routes are gated with localized messages.

### i18n

- Prefer behavior checks; for translation presence, a small smoke test per namespace verifying a couple of keys render
  in `en` and one alternate locale using `withLocale`.
- Add a test util that fails-fast when a key is missing in non-default locales (optional).

### Data layer

- Error mapping for additional cases (network/unavailable/timeouts) beyond `permission-denied` and `not-found`.
- Query builders: ensure `orderBy`, `limit` combinations are passed to Firestore mock as expected if you have helpers.
- Date serialization/deserialization of more nested shapes and `undefined` fields.

## Utility and helper improvements (ergonomics)

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
    // src/testUtils/mocks/mockZustand.ts
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

### Prioritized action plan

2. Utility consolidation

- Create a `setup()` pattern in tests returning `{ user, ...screen }` and any useful spies.

3. Fix and unskip scenarios

- `PetList` add flow: confirm navigation or presence of add form without mocking `useNavigate` (integration-style) or
  with clear unit-test assertions.
- `AddPetPage` submit/cancel/dirty flows using user-event and dialog assertions.

4. [In GitHub] Expand coverage on cross-cutting concerns

- Routing: unauthenticated redirects, 404 route, `authEnabled=false` behavior.
- i18n: one per-namespace sanity test in `en` and one alternate locale using `withLocale`.
- a11y: dialog focus, keyboard interactions, `role='alert'` messaging.

5. Data layer robustness

- Add tests for additional error codes/unknown errors mapping and nested date handling.
- If you have query helpers, assert correct Firestore function composition via mocks.

6. Sustaining quality

- [:white_check_mark:]Add ESLint plugins: `eslint-plugin-testing-library` and `eslint-plugin-jest-dom` with recommended
  configs to enforce
  best practices.
- Set/adjust coverage thresholds in `vitest.config.ts` (e.g., 80% lines/branches) and add `npm run test:coverage` to
  CI.

### Optional enhancements

- Consider one MSW-backed integration test suite (or Firestore emulator as you already have in
  `AddPet.integration.test.tsx`) for end-to-end flows in the pets feature.
- Add Axe (or jest-axe) a11y checks for key screens in a few smoke tests.

### Deliverables checklist (what I can do next, if you want)

- Add routing edge tests and one focused a11y test for the confirm dialog.
