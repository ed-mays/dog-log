# Dog Log — Improvement Tasks Checklist

A single, actionable backlog to modernize and harden the codebase. Check items off as you complete them. Order is
intentional: start with quick wins that reduce churn, then proceed to type safety, state/data flow, and so on.

1. [x] Normalize test utilities imports

- [x] Replace mixed imports (`test-utils.tsx`, `../../test-utils.tsx`) with the configured alias import:
      `@/test-utils` or `@testUtils/*` consistently across all tests
- [x] Update path alias configuration if needed to support the chosen import form

2. [x] Standardize data-testid handling in public components

- [x] Replace non-standard `data-TestId` prop in PetList with conventional handling:
  - [x] Either accept `dataTestId?: string` and render as `data-testid`
  - [ ] Or forward arbitrary `data-testid` via `...rest` props
- [x] Update PetList tests to match the new prop shape and behavior

3. [x] Remove hardcoded IDs in AddPetPage

- [x] Replace `id: '3'` with `crypto.randomUUID()` or delegate ID generation to the pets store layer
- [x] Update tests to assert deterministic behavior (e.g., mock `randomUUID` or store function)

4. [x] Align import style

- [x] Prefer extensionless imports with path aliases; remove explicit `.tsx` extensions where used
- [x] Ensure tsconfig uses modern resolution compatible with Vite (e.g., `moduleResolution: "bundler"") and aliases
      cover documented prefixes

5. [x] Consolidate Pet types into a single source of truth

- [x] Create `src/features/petManagement/types.ts` (or `src/store/types.ts`) exporting `Pet`
- [x] Update `PetForm.tsx`, `petListTypes.tsx`, and any other consumers to import the unified `Pet` type
- [x] Remove duplicate or divergent Pet type declarations

6. [x] Add explicit props typing for shared UI components

- [x] Audit `src/components/common/*` and add/verify explicit prop interfaces with clear optionality and defaults
- [x] Export minimal public APIs via index files if modules grow

7. [x] Stabilize Zustand store usage patterns

- [x] Update components/pages to select actions via stable selectors, e.g.,
      `const fetchPets = usePetsStore(s => s.fetchPets)` and use with proper effect deps
- [x] Ensure store state selectors are narrow to reduce re-renders

8. [x] Normalize store error typing and handling

- [x] Change store `error` to `unknown | string` and introduce `toErrorMessage(err: unknown): string`
- [x] Ensure UI renders friendly, localized error messages using the helper

9. [x] Trim artificial delays in async actions

- [x] Remove `setTimeout(2000)` from `fetchPets` (or similar) for faster dev/test loops
- [x] Simulate latency in tests as needed instead of production code

10. [x] Centralize test i18n setup

- [x] Move feature-scoped `mocki18n.tsx` to a shared test i18n (e.g., `src/testUtils/test-i18n.ts`)
- [x] Wire it through `src/test-utils.tsx` so all tests share consistent i18n
- [x] Remove local duplicates

11. [x] Localize common UI strings

- [x] Localize Loading and Error indicators using the `common` namespace with sensible defaults
- [x] Allow overriding labels via props; support `role`/`aria-live` for a11y

12. [x] i18n namespace hygiene

- [x] Ensure each component uses a primary namespace (`useTranslation('<ns>')`)
- [x] Reference other namespaces via options only when necessary `{ ns: '...' }`

13. [x] Improve ConfirmModal accessibility

- [x] Add `aria-labelledby` tied to a visible heading
- [x] Trap focus within the modal and set an initial focus target
- [x] Support ESC to close when aligned with design
- [x] Use i18n-backed button labels (fallbacks from `common.yes`/`common.no`)

14. [x] Fix link/button semantics in PetList

- [x] Avoid nesting a `<button>` inside a `<Link>`; use a single appropriate interactive element

15. [x] Strengthen table semantics

- [x] Ensure table headers use `<th scope="col">` and rows use `<th scope="row">` if applicable

16. [x] Feature flags consistency

- [x] Unify configuration source (prefer Vite `VITE_` env vars or provider props; avoid mixing with `localStorage`)
- [x] Normalize naming (e.g., `petListEnabled`, `addPetEnabled`) and update `FeatureFlag` union accordingly
- [x] Provide a test helper to render with custom flags via `<FeatureFlagsProvider initialFlags={...}>`

17. [x] Routing and navigation hygiene

- [x] Confirm default routes and fallback behavior; localize any "feature unavailable" screens
- [x] Consider preloading pets on route enter (route loader or page-level hook) to reduce loading flicker

18. [x] Improve PetForm API

- [x] Replace imperative `setDirty` prop with derived internal dirty state and optional `onDirtyChange?(boolean)`
      callback
- [x] Consider exposing controlled props (`value`/`onChange`) for reuse, while keeping a simple uncontrolled default

19. [x] Enhance common components for a11y

- [x] Support `aria-live` and roles for loading/error components; provide ergonomic defaults

20. [x] Testing quality improvements

- [x] Prefer `@testing-library/user-event` over `fireEvent` where realistic interactions are needed
- [x] Add a11y-focused tests for modal focus trapping and table header roles/names
- [x] Increase coverage around feature-flagged UI and store error paths

21. [ ] ESLint ruleset hardening

- [ ] Add/enforce rules for import consistency, hooks exhaustive-deps, accessibility, and prefer named exports
- [ ] Resolve resulting lint warnings; add suppressions only with justification

22. [x] Vite/TypeScript config hygiene

- [x] Ensure all documented aliases exist (`@components/*`, `@store/*`, `@features/*`, `@featureFlags/*`, `@styles/*`,
      `@testUtils/*`)
- [x] Prefer extensionless imports and confirm `moduleResolution: "bundler"` where appropriate

23. [x] Prettier and editor consistency

- [x] Verify Prettier settings and add `.editorconfig` if missing to align editor behavior

24. [x] Robust ID generation strategy

- [x] Use `crypto.randomUUID()` for runtime; provide a small utility to inject deterministic IDs in tests

25. [x] Introduce a data/service layer

- [x] Extract fetch logic to a service module to ease backend migration and facilitate `msw`-based test stubs

26. [x] Add an Error Boundary

- [x] Implement a top-level error boundary with localized fallback UI
- [x] Add tests covering rendering on thrown errors

27. [x] Documentation updates

- [x] Update README and developer guidelines to reflect finalized conventions (imports, testing, i18n, feature flags)
- [x] Create CHANGELOG.md and populate it with a summary of each task in this document.

28. [x] Fix test warnings

- [x] Fix `NO_I18NEXT_INSTANCE` warnings

Notes:

- Keep PRs small and thematic; update tests with each change.
- Follow feature-first organization and path aliases.
- Avoid breaking public component APIs; deprecate and migrate gradually where necessary.
