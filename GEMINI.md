# Dog Log — Developer Guidelines

Short, practical guidance to get productive quickly.

## 0. Implementation standard [IMPORTANT]

- DO NOT over engineer things. Start with the simplest implementation.
- Always keep the performance and security as a first priority.
- Ask for any clarification rather just guessing things if you are not clear about anything.

## Regarding Dependencies:

- Avoid introducing new external dependencies unless absolutely necessary.
- If a new dependency is required, please state the reason.

## 1. Tech Stack Snapshot

- React 19 + TypeScript (strict)
- Vite (dev/build), Vitest (+ Testing Library)
- Zustand (state)
- i18next + react-i18next (i18n)
- ESLint + Prettier

## 2. Project Structure & Conventions

- src/components/common/\*: Reusable, stateless UI building blocks
- src/features/<domain>/\*: Feature‑scoped pages, UI, and types (e.g., petManagement)
- src/store/\*: Zustand stores and related types
- src/styles/\*: CSS modules (prefer module.css for component/feature styles)
- src/locales/<lang>/\*: Namespaced JSON translations
- src/featureFlags/\*: Feature flag provider, config, and hooks
- src/services/\*: Data/service layer modules (API calls, adapters)
- src/test-utils.tsx: Preconfigured render wrapper for tests
- src/testUtils/test-i18n.tsx: Shared test i18n setup

Aliases (from tsconfig.app.json):

- @App → src/App.tsx
- @components/_ → src/components/_
- @firebase → src/firebase.tsx
- @store/_ → src/store/_
- @test-utils → src/test-utils.tsx
- @testUtils/_ → src/testUtils/_
- @featureFlags/_ → src/featureFlags/_
- @features/_ → src/features/_
- @models/_ → src/models/_
- @repositories/_ → src/repositories/_
- @services/_ → src/services/_
- @styles/_ → src/styles/_
- @utils/_ → src/utils/_

Guidelines:

- Favor feature-first organization under src/features/<domain>.
- When generating new TypeScript files, always use the .tsx extension
- Keep shared UI in src/components/common.
- One public component per file; colocate its styles and tests.
- Export minimal public APIs from index files when modules grow.

## 3. Scripts You’ll Use Daily

- npm run dev — start Vite dev server
- npm run def:with-emulators — start Vite dev server with firebase emulators
- npm run build — type-check then build for production
- npm run preview — preview the production build locally
- npm run lint — run ESLint
- npm run lint:fix — auto-fix lint issues
- npm run format — format with Prettier
- npm run test — run unit/component tests (watch mode supported)
- npm run test:coverage — run tests and generate coverage (coverage/)

## 4. Testing Guidelines (Vitest + Testing Library)

When writing or refactoring tests, please adhere to the following conventions to ensure consistency, reliability, and maintainability.

1.  **Prefer `user-event` for Interactions**: Always use `@testing-library/user-event` for simulating user interactions (e.g., `userEvent.click`, `userEvent.type`). Avoid `@testing-library/fire-event` as it does not fully replicate real user browser behavior. All `user-event` calls are asynchronous and must be `await`ed.

2.  **Use `findBy*` for Async Elements**: For asserting the appearance of an element that is not present immediately, prefer `findBy*` queries (e.g., `await screen.findByRole(...)`). Avoid wrapping `getBy*` queries in `waitFor` for simple presence checks.

3.  **Prioritize Accessible Queries**: Query elements in a way that reflects user experience. The preferred query order is:
    1.  `getByRole` (with an accessible name if possible, e.g., `{ name: /submit/i }`)
    2.  `getByLabelText`
    3.  `getByPlaceholderText`
    4.  `getByText`
    5.  `getByTestId` (use this as a last resort when no other accessible query is suitable).

4.  **Avoid Snapshot Testing**: Do not use snapshot tests (`.toMatchSnapshot()`, `asFragment()`). Instead, write explicit assertions that check for specific, meaningful output, such as visible text, ARIA attributes, or component state. This makes tests more robust and less brittle, especially with i18n.

5.  **Implement Skipped or Commented Tests**: If you encounter skipped (`test.skip`) or commented-out tests, your task is to implement them. These represent important scenarios that need coverage.

6.  **Follow Consistent Mocking Patterns**:
    - For Zustand stores, use `vi.mock` at the top of the test file. Provide a mock implementation that allows state to be injected for each test.
    - If a test requires a unique mock implementation that differs from other tests in the same file, use `vi.doMock` inside the test block, followed by a dynamic `await import()` of the component under test. Remember to call `vi.resetModules()` in a `beforeEach` or `afterEach` block to ensure test isolation.

7.  **Expand Test Coverage**: Go beyond "happy path" scenarios. Add tests for:
    - **Error States**: What happens when a service call fails or returns an error?
    - **Edge Cases**: Test with empty lists, invalid inputs, or unusual data shapes.
    - **Feature Flags**: Verify that UI elements and routes are correctly enabled or disabled based on feature flag states.
    - **Accessibility (a11y)**: For interactive components like modals, assert that focus is managed correctly, keyboard navigation works (e.g., `Escape` key closes the modal), and relevant ARIA attributes (`aria-modal`) are present.

**General Conventions:**

- Use the shared render wrapper from `@test-utils` for providers (i18n + feature flags).
- Keep tests next to code: `Component.tsx` and `Component.test.tsx` in the same folder.
- Create unit tests while implementing functionality, not afterward.
- In tests, prefer `test(...)` to `it(...)`.

Setup notes:

- Shared test i18n lives at src/testUtils/test-i18n.tsx (wired through the render wrapper).
- JSDOM environment, jest-dom matchers preloaded via vitest.setup.tsx.
- Coverage reports: coverage/ (HTML + text). Excludes config files and setup.

## 5. State & Data (Zustand)

- Create small, focused stores in src/store/ with typed state/actions.
- Keep async side-effects inside store actions when practical.
- Prefer a small data/service layer in src/services/\* to encapsulate fetch logic.
- Avoid leaking store shape across app; read via selectors: useStore(s => s.part).

## 6. Data Access Strategy: Firestore

**Principle:**  
All interactions with Firestore must be abstracted through a service/repository layer (e.g., src/services) and custom
hooks. React components, stores, and business logic should never depend directly on Firestore APIs or objects.

**Patterns:**

- Use repository modules (in `src/services`) to encapsulate all Firestore CRUD logic (`getUser`, `savePet`, etc.) and
  always return plain JavaScript objects.
- Create custom React hooks (e.g., `usePetList`) that call the repository functions and expose application data, not
  Firestore types.
- Provide repositories to the app through context providers if stateful or cross-feature access is needed.
- Never expose Firestore types, Snapshots, or References outside service modules.
- Strictly type all repository and hook outputs for reliable, testable contracts.

**When To Use This Strategy:**

- When building new features that need app or user Place all data-fetching and saving logic inside a dedicated
  repository/service module and use from hooks or components.
- When refactoring legacy code: Move Firestore calls out of components and consolidate them in service modules. Update
  hooks to call these services.
- When doing unit or integration testing: Mock repository functions, not Firestore SDK access, making tests
  backend-independent.
- When considering migration or backend changes: Abstracting Firestore lets you swap data sources by updating only the
  repository logic.
- Whenever sharing business logic or data transformations: Keep these in services or hooks, not inside UI components.

**Example:**

```typescript
// src/services/petService.ts
export const petService = {
  getList: async () => {
    /* Firestore query logic */
  },
  addPet: async (pet) => {
    /* Firestore add logic */
  },
};

// src/features/pets/usePetList.ts
import { useEffect, useState } from 'react';
import { petService } from '@services/petService';

export function usePetList() {
  const [pets, setPets] = useState([]);
  useEffect(() => {
    petService.getList().then(setPets);
  }, []);
  return pets;
}
```

**Summary:**  
Always access Firestore through abstracted repository/service modules and custom hooks, never directly in components.
This keeps your codebase maintainable, testable, and flexible for future changes.

## 6. Internationalization (i18next)

- Namespaces: common, home, petList, petProperties.
- Default language from Vite env: VITE_DEFAULT_LOCALE; fallback: en.
- Add translations under src/locales/<lang>/<namespace>.json.
- In components: const { t } = useTranslation('<namespace>'); and t('key').

## 7. Feature Flags

- See src/featureFlags/README.featureFlags.md for add/toggle/remove.
- Defaults come from Vite env vars (VITE\_\*); override per-test via <FeatureFlagsProvider initialFlags={{ ... }}> or
  render options.
- Query flags with useFeatureFlag('flag_name').
- Gate routes/UI paths conditionally; keep legacy/new code tidy.

## 8. Environment Variables (Vite)

- Create .env.local for local-only values. Examples:
  VITE_APP_TITLE=Dog-Log
  VITE_DEFAULT_LOCALE=en
  VITE_FLAG_COUNT_BUTTON=false
  VITE_ADD_PET_ENABLED=true
  VITE_FIREBASE_API_KEY=''
  VITE_FIREBASE_AUTH_DOMAIN=''
  VITE_FIREBASE_PROJECT_ID=''
  VITE_FIREBASE_STORAGE_BUCKET=''
  VITE_FIREBASE_MESSAGING_SENDER_ID=''
  VITE_FIREBASE_APP_ID=''
  VITE_FIREBASE_MEASUREMENT_ID=''
- All app-consumed env vars must be prefixed with VITE\_.
- Restart the dev server after changing env vars.

## 9. Linting, Formatting, and Type Safety

- Run npm run lint and npm run format before commits.
- Keep TypeScript strict and fix warnings early.
- Prefer explicit types on store state and public function boundaries.

## 10. Pull Requests — Quick Checklist

- [ ] Unit/component tests added/updated; coverage still reasonable
- [ ] npm run lint and npm run format pass
- [ ] Screens and strings are i18n-ready (no hardcoded user-facing text)
- [ ] Follows feature-first structure and uses aliases
- [ ] Feature flags added/updated when introducing gated behavior

## 11. Troubleshooting

- Alias import not resolving: ensure path matches tsconfig.app.json and restart Vite.
- i18n key missing: verify namespace/key and locale file loaded in src/i18n.tsx.
- Tests can’t find providers: import render from '@test-utils'.
- Test i18n warning (NO_I18NEXT_INSTANCE): render via '@test-utils' or wrap with I18nextProvider and a shared i18n
  instance (src/testUtils/test-i18n.tsx).

Welcome aboard! Keep it simple, typed, and testable.

## 12. Additional References

- `docs/requirements.md` contains a high level description of the application's features. This is an evolving document.
- `README.md` contains additional documentation about the project structure and related details.
