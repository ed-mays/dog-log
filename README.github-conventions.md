## GitHub Issue Organization Guidelines

To approximate Agile hierarchy (epic > feature > story) in GitHub Issues:

- **Labels**  
  Tag issues with labels such as `epic`, `feature`, or `story` to indicate their role in the hierarchy. Use additional labels for type (bug, enhancement), component (frontend, backend), and status (todo, in progress, review).

- **Milestones**  
  Group issues using milestones based on delivery goals (e.g., release, sprint). You can use milestones for broader time-based groupings and epics as labels, or designate major initiatives as milestones.

- **Issue Linking**  
  Create an "epic" issue and reference related "feature" or "story" issues within its description using task lists or markdown links:

  ```
  - [ ] #123 Add login functionality
  - [ ] #124 Build logout process
  ```

  This enables quick navigation and clear relationships between items.

- **Templates and Conventions**  
  Maintain consistent label naming conventions and consider issue templates for each hierarchy layer to ensure clarity and completeness.

- **Triaging and Assignment**  
  Regularly review unassigned issues, triage, and assign owners to encourage accountability and avoid backlog clutter.

For more advanced hierarchy and backlog management, consider using GitHub Projects Beta or tools like Zenhub for native epic/story relationships.

## GitHub Issue Organization Guidelines

To approximate Agile hierarchy (epic > feature > story) in GitHub Issues:

- **Labels**  
  Tag issues with labels such as `epic`, `feature`, or `story` to indicate their role in the hierarchy. Use additional labels for type (bug, enhancement), component (frontend, backend), and status (todo, in progress, review).

- **Milestones**  
  Group issues using milestones based on delivery goals (e.g., release, sprint). You can use milestones for broader time-based groupings and epics as labels, or designate major initiatives as milestones.

- **Issue Linking**  
  Create an "epic" issue and reference related "feature" or "story" issues within its description using task lists or markdown links:

  ```
  - [ ] #123 Add login functionality
  - [ ] #124 Build logout process
  ```

  This enables quick navigation and clear relationships between items.

- **Templates and Conventions**  
  Maintain consistent label naming conventions and consider issue templates for each hierarchy layer to ensure clarity and completeness.

- **Triaging and Assignment**  
  Regularly review unassigned issues, triage, and assign owners to encourage accountability and avoid backlog clutter.

For more advanced hierarchy and backlog management, consider using GitHub Projects Beta or tools like Zenhub for native epic/story relationships.

---

## Testing Conventions (Unit/Component/Integration)

Short, practical rules for writing tests in this repo. See `docs/test-architecture-review.md` for details and examples.

- Store mocking (Zustand):
  - At top of test files, declare store module mocks so we can inject implementations:
    ```ts
    vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
    vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));
    vi.mock('@store/ui.store', () => ({ useUiStore: vi.fn() }));
    ```
  - Install selector-compatible implementations with installers in `beforeEach`:
    ```ts
    import {
      installAuthStoreMock,
      installPetsStoreMock,
      installUiStoreMock,
    } from '@testUtils/mocks/mockStoreInstallers';
    beforeEach(() => {
      vi.resetAllMocks();
      installAuthStoreMock({ user: { uid: 'u1' }, initializing: false });
      installPetsStoreMock({ pets: [] });
      installUiStoreMock({ loading: false });
    });
    ```
  - Keep store unit tests real (no installers for store unit tests).

- Route/page assertion helpers:
  - Prefer intention-revealing helpers from `@testUtils/routes` over repeated selectors:
    ```ts
    import { expectPetListVisible, expectFeatureUnavailable } from '@testUtils/routes';
    render(<App />, { initialRoutes: ['/pets'] });
    await expectPetListVisible();
    ```

- AuthBootstrap escape hatch (when testing real component):
  - Globally, `AuthBootstrap` is mocked in `vitest.setup.ts`. In its own test suite, unmock + dynamically import the real module and spy on the service first:
    ```ts
    vi.resetModules();
    vi.unmock('@features/authentication/AuthBootstrap');
    const authSvc = await import('@services/auth/authService');
    vi.spyOn(authSvc, 'subscribeToAuth').mockReturnValue(() => {});
    const { default: AuthBootstrap } = await import(
      '@features/authentication/AuthBootstrap'
    );
    ```

- Interaction and async query rules:
  - Use `@testing-library/user-event` for interactions and always `await` them.
  - Use `findBy*` for async appearance; reserve `waitFor` for side-effect synchronization or disappearance.

- Lint guardrails (enforced in tests):
  - No `.ts` extension in `vi.mock` specifiers (use aliases like `@store/auth.store`).
  - Do not import or use `fireEvent`; use `@testing-library/user-event`.

References:

- Detailed guide: `docs/test-architecture-review.md`
- Helpers: `src/testUtils/mocks/mockStoreInstallers.ts`, `src/testUtils/routes.tsx`
