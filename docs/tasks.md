# Dog Log — Improvement Tasks Checklist

A single, actionable backlog to modernize and harden the codebase. Check items off as you complete them. Order is intentional: start with quick wins that reduce churn, then proceed to type safety, state/data flow, and so on.

6. [ ] Add explicit props typing for shared UI components
   - [ ] Audit `src/components/common/*` and add/verify explicit prop interfaces with clear optionality and defaults
   - [ ] Export minimal public APIs via index files if modules grow

7. [ ] Stabilize Zustand store usage patterns
   - [ ] Update components/pages to select actions via stable selectors, e.g., `const fetchPets = usePetsStore(s => s.fetchPets)` and use with proper effect deps
   - [ ] Ensure store state selectors are narrow to reduce re-renders

8. [ ] Normalize store error typing and handling
   - [ ] Change store `error` to `unknown | string` and introduce `toErrorMessage(err: unknown): string`
   - [ ] Ensure UI renders friendly, localized error messages using the helper

9. [x] Trim artificial delays in async actions
  - [x] Remove `setTimeout(2000)` from `fetchPets` (or similar) for faster dev/test loops
  - [x] Simulate latency in tests as needed instead of production code

10. [x] Centralize test i18n setup
    - [x] Move feature-scoped `mocki18n.tsx` to a shared test i18n (e.g., `src/testUtils/test-i18n.tsx`)
    - [x] Wire it through `src/test-utils.tsx` so all tests share consistent i18n
    - [x] Remove local duplicates

11. [ ] Localize common UI strings
    - [ ] Localize Loading and Error indicators using the `common` namespace with sensible defaults
    - [ ] Allow overriding labels via props; support `role`/`aria-live` for a11y

12. [ ] i18n namespace hygiene
    - [ ] Ensure each component uses a primary namespace (`useTranslation('<ns>')`)
    - [ ] Reference other namespaces via options only when necessary `{ ns: '...' }`

13. [ ] Improve ConfirmModal accessibility
    - [ ] Add `aria-labelledby` tied to a visible heading
    - [ ] Trap focus within the modal and set an initial focus target
    - [ ] Support ESC to close when aligned with design
    - [ ] Use i18n-backed button labels (fallbacks from `common.yes`/`common.no`)

14. [ ] Fix link/button semantics in PetList
    - [ ] Avoid nesting a `<button>` inside a `<Link>`; use a single appropriate interactive element

15. [ ] Strengthen table semantics
    - [ ] Ensure table headers use `<th scope="col">` and rows use `<th scope="row">` if applicable

16. [ ] Feature flags consistency
    - [ ] Unify configuration source (prefer Vite `VITE_` env vars or provider props; avoid mixing with `localStorage`)
    - [ ] Normalize naming (e.g., `petListEnabled`, `addPetEnabled`) and update `FeatureFlag` union accordingly
    - [ ] Provide a test helper to render with custom flags via `<FeatureFlagsProvider initialFlags={...}>`

17. [ ] Routing and navigation hygiene
    - [ ] Confirm default routes and fallback behavior; localize any "feature unavailable" screens
    - [ ] Consider preloading pets on route enter (route loader or page-level hook) to reduce loading flicker

18. [ ] Improve PetForm API
    - [ ] Replace imperative `setDirty` prop with derived internal dirty state and optional `onDirtyChange?(boolean)` callback
    - [ ] Consider exposing controlled props (`value`/`onChange`) for reuse, while keeping a simple uncontrolled default

19. [ ] Enhance common components for a11y
    - [ ] Support `aria-live` and roles for loading/error components; provide ergonomic defaults

20. [ ] Testing quality improvements
    - [ ] Prefer `@testing-library/user-event` over `fireEvent` where realistic interactions are needed
    - [ ] Add a11y-focused tests for modal focus trapping and table header roles/names
    - [ ] Increase coverage around feature-flagged UI and store error paths

21. [ ] ESLint ruleset hardening
    - [ ] Add/enforce rules for import consistency, hooks exhaustive-deps, accessibility, and prefer named exports
    - [ ] Resolve resulting lint warnings; add suppressions only with justification

22. [ ] Vite/TypeScript config hygiene
    - [ ] Ensure all documented aliases exist (`@components/*`, `@store/*`, `@features/*`, `@featureFlags/*`, `@styles/*`, `@testUtils/*`)
    - [ ] Prefer extensionless imports and confirm `moduleResolution: "bundler"` where appropriate

23. [ ] Prettier and editor consistency
    - [ ] Verify Prettier settings and add `.editorconfig` if missing to align editor behavior

24. [ ] Robust ID generation strategy
    - [ ] Use `crypto.randomUUID()` for runtime; provide a small utility to inject deterministic IDs in tests

25. [ ] Introduce a data/service layer
    - [ ] Extract fetch logic to a service module to ease backend migration and facilitate `msw`-based test stubs

26. [ ] Add an Error Boundary
    - [ ] Implement a top-level error boundary with localized fallback UI
    - [ ] Add tests covering rendering on thrown errors

27. [ ] Documentation updates
    - [ ] Update README and developer guidelines to reflect finalized conventions (imports, testing, i18n, feature flags)

Notes:
- Keep PRs small and thematic; update tests with each change.
- Follow feature-first organization and path aliases.
- Avoid breaking public component APIs; deprecate and migrate gradually where necessary.
