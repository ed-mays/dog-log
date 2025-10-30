## Quick orienting facts for AI coding agents

This file contains the concrete, repo-specific rules and pointers to make focused, correct edits in the Dog Log app.

- Tech stack: React 19 + TypeScript (strict), Vite, Zustand for state, i18next, Vitest + Testing Library.
- Key directories: `src/` (app code), `src/store/` (Zustand stores, `*.store.tsx`), `src/features/`, `src/repositories/`, `src/services/`, `src/testUtils/`.

## High-level architecture / data flow

- UI components in `src/components` and `src/features/*` call into domain services/repositories in `src/services` / `src/repositories`.
- Global state uses Zustand stores in `src/store/*` which export hooks like `usePetsStore`, `useAuthStore` and expect selector functions: e.g. tests call `usePetsStore((s) => s.pets)` or pass a `selector` to mock implementations.
- Firebase integration is initialized in `src/firebase.tsx` and automatically connects to the local Auth emulator when running on `localhost`.

## Developer workflows & commands (must mention explicitly)

- Install: `npm install`
- Dev server: `npm run dev`
- Dev with emulators: `npm run dev:with-emulators` (or start emulators first: `npm run start:firebase` then `npm run dev`)
- Build/type-check: `npm run build`
- Tests: `npm run test` (Vitest). Watch: `npm run test:watch`. Coverage: `npm run test:coverage`.
- Lint: `npm run lint`; auto-fix: `npm run lint:fix`; format: `npm run format`.

When making changes that affect runtime behavior or integration tests, start the Firebase emulators (`npm run start:firebase`) before running integration flows.

## Test & mocking conventions (concrete examples)

- Use the shared test render wrapper from `src/test-utils.tsx` / `@test-utils` so providers (i18n, feature flags) are applied. Example:

  render(<MyComponent />, { featureFlags: { addPetEnabled: true } });

- Mock stores with Vitest `vi.mock('@store/...')` and provide implementations like seen in `src/App.test.tsx`:

  const mockUsePetsStore = usePetsStore as vi.Mock;
  mockUsePetsStore.mockImplementation((selector) => selector ? selector(state) : state);

  This pattern is used repeatedly — keep mocked stores returning either `selector(state)` or the raw state object.

- For UI assertions prefer Testing Library queries (e.g. `screen.getByTestId('pet-list')`) and `waitFor` for async UI effects.

## Path aliases and imports

- Path aliases are defined in `tsconfig.app.json` — prefer alias imports such as `@store/pets.store`, `@services/*`, `@features/*` over deep relative paths.

## Feature flags & i18n

- Feature flags are provided by `src/featureFlags/FeatureFlagsProvider` and read via `useFeatureFlag('<flagName>')`.
- In tests, override flags through the render wrapper: `render(<App />, { featureFlags: { petListEnabled: false } });`.
- i18n namespaces live under `locales/` and the shared test i18n setup is `src/testUtils/test-i18n.tsx`.

## Safety, env, and secrets

- Local Firebase config belongs in `.env.local`. Do not commit real credentials. The README documents emulator ports and startup steps.

## Editing guidance for AI agents (do this on every PR)

- Run unit tests locally: `npm run test` and `npm run test:coverage` for changed code.
- Fix lint issues with `npm run lint:fix` before committing.
- When changing store shape or selectors, update tests that mock those stores (search for `vi.mock('@store/` and follow the `selector ? selector(state) : state` pattern).
- For changes touching Firebase integration or auth flows, prefer to run emulators and add integration tests rather than change emulator wiring.

## Files to consult for examples and patterns

- `src/App.test.tsx` — store-mocking and render examples
- `src/test-utils.tsx` and `src/testUtils/test-i18n.tsx` — test wrappers and i18n test wiring
- `src/firebase.tsx` — emulator detection and initialization
- `src/featureFlags/FeatureFlagsProvider` — feature flag defaults and provider
- `tsconfig.app.json` — path alias mappings

## Keep edits small and explicit

- Prefer small PRs that change one subsystem (UI, store, service) and include tests.
- If you can't run emulators in CI, limit changes to pure unit-tested behavior and document why an integration test was skipped.

If anything in this guidance is unclear or you'd like additional examples (e.g., a failing test to reproduce a bug), tell me which area to expand and I'll iterate.
