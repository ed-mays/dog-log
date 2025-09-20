# Dog Log — Modernization & Code Quality Improvement Plan

A prioritized, actionable backlog to align the codebase with modern React (19), TypeScript (strict), testing, i18n, accessibility, and state management best practices.

Notes
- Keep changes incremental; add tests alongside refactors.
- Follow the project’s developer guidelines (feature-first, aliases, co-located tests/styles).
- Prefer small PRs grouped by theme below.

## Priority 0 — Quick Wins (Low risk, high consistency)
- Normalize test utils imports across tests
  - Use `@/test-utils` or `@testUtils/*` alias consistently instead of mixed relative forms like `test-utils.tsx`.
- Standardize `data-testid` usage in public component APIs
  - Replace the non-standard `'data-TestId'` prop in `PetList` with a conventional `dataTestId` prop or forward `data-testid` via `...rest`.
  - Update tests accordingly.
- Remove hardcoded IDs
  - In `AddPetPage`, replace `id: '3'` with a proper id generator (e.g., `crypto.randomUUID()`), or delegate id creation to the store.
- Align import style
  - Avoid mixing imports with `.tsx` extensions and extensionless imports. Pick one convention (recommended: extensionless with path aliases) and apply consistently.

## Priority 1 — Type Safety & Shared Types
- Consolidate `Pet` types
  - `PetForm.tsx` and `petListTypes.tsx` define `Pet` separately; unify a single `Pet` type (e.g., under `src/features/petManagement/types.tsx` or `src/store/types.tsx`).
  - Ensure store and components import the same `Pet` type.
- Public component typing
  - Add explicit props types to all public components in `src/components/common/*` with clear optionality and defaults.

## Priority 2 — State Management & Data Flow (Zustand)
- Make store actions stable/selectable
  - In `petListPage.tsx`, prefer `const fetchPets = usePetsStore((s) => s.fetchPets);` and call in `useEffect(() => { fetchPets(); }, [fetchPets]);` to keep hook usage idiomatic.
- Error typing and handling
  - Store `error` could be `unknown | string`; introduce a helper to normalize errors (`toErrorMessage(err)`), and ensure consumers render user-friendly messages.
- Async behavior in tests
  - Reduce artificial `setTimeout(2000)` in `fetchPets` for faster dev/tests; simulate network latency in tests instead.

## Priority 3 — i18n Improvements
- Centralize test i18n
  - Move the feature-scoped `mocki18n.tsx` into a shared test i18n setup (e.g., `src/testUtils/test-i18n.tsx`) and use it from `src/test-utils.tsx`, removing duplication.
- i18n for common UI
  - Localize `LoadingIndicator` (“Loading…”) and `ErrorIndicator` (“Error…”) using `common` namespace defaults; maintain ability to override via props.
- Namespaces hygiene
  - Ensure components declare a single responsible namespace (`useTranslation('<ns>')`) and only reference other namespaces via `{ ns: '...' }` when necessary.

## Priority 4 — Accessibility (a11y) & Semantics
- ConfirmModal a11y
  - Add `aria-labelledby` and tie it to a heading; ensure focus is trapped inside the modal and initial focus lands on a sensible control.
  - Add `onKeyDown` handler for ESC to close, if consistent with design.
  - Ensure buttons are labeled via i18n (`acceptLabel`, `declineLabel` fallbacks from `common.yes/no`).
- Link/Button semantics
  - In `PetList`, avoid nesting a `<button>` inside a `<Link>`. Prefer a link styled as a button or a button that navigates (with `useNavigate`).
- Table semantics
  - Verify the `th`/`scope` attributes for better screen reader support (e.g., `scope="col"`).

## Priority 5 — Feature Flags Consistency
- Unify configuration source
  - Standardize on Vite env (VITE_*) for all flags, or inject via provider props; avoid mixing with `localStorage` in `featureFlags.config.tsx`.
- Naming conventions
  - Ensure flags use a cohesive naming scheme (e.g., `petListEnabled`, `addPetEnabled`) and update `FeatureFlag` union accordingly.
- Testing utilities
  - Provide a helper to render with custom flags in tests (e.g., `<FeatureFlagsProvider initialFlags={...}>`) to avoid brittle mocks.

## Priority 6 — Routing & Navigation
- Route protection & redirection
  - Confirm default routes and fallback behaviors are consistent; ensure “feature unavailable” page strings are i18n’d.
- Data prefetching
  - Consider preloading pets on route enter (loader) or via a page-level hook to avoid flashing states.

## Priority 7 — Component APIs & Composition
- PetForm API
  - Avoid `setDirty` prop by deriving dirty state internally and emitting `onDirtyChange?(boolean)`, which is optional.
  - Consider controlled vs. uncontrolled patterns; expose `value`/`onChange` for form reuse.
- Common components
  - For `LoadingIndicator` and `ErrorIndicator`, allow `aria-live` attributes and roles for assistive tech.

## Priority 8 — Testing Quality
- Prefer user-event over fireEvent where possible for more realistic interactions.
- Strengthen a11y tests
  - Use `getByRole` with accessible names for modal and table headers.
- Increase coverage around feature flags (UI gated paths) and store error paths.

## Priority 9 — Tooling & Config
- ESLint rules
  - Add rules to prevent default exports where not needed, enforce import consistency, hooks exhaustive-deps, and a11y rules.
- Vite/TS config hygiene
  - Ensure aliases include all documented ones and remove unused; prefer extensionless imports with `moduleResolution: "bundler"`.
- Prettier config alignment
  - Ensure consistent settings across IDEs; add editorconfig if missing.

## Priority 10 — Future Enhancements
- ID generation
  - Use `crypto.randomUUID()` or a small utility for deterministic IDs in tests.
- Data layer
  - Abstract fetching into a service layer to ease migration to real backend (e.g., Firebase) and facilitate msw-based test stubs.
- Error boundaries
  - Add a top-level error boundary with a localized fallback UI.

---

Implementation Notes
- Make changes incrementally, keeping PRs focused (one theme per PR).
- Update tests with each change; prefer `@/test-utils` wrapper for providers (i18n, feature flags).
- Avoid breaking APIs; where necessary, deprecate and migrate gradually.
