# Changelog

All notable changes to this project are documented here. This file summarizes the checklist items from `docs/tasks.md` as they were implemented.

## Unreleased

- Documentation updates: README and guidelines aligned with finalized conventions (imports, testing, i18n, feature flags). Created CHANGELOG.md.

## Completed Improvements

1. Normalize test utilities imports — unified on `@/test-utils`/`@testUtils/*` across tests.
2. Standardize data-testid handling in public components — PetList now accepts `dataTestId` rendered as `data-testid`; tests updated.
3. Remove hardcoded IDs — `AddPetPage` uses robust id generation (`generateId` with `crypto.randomUUID()` fallback). Tests mock deterministically.
4. Align import style — extensionless imports with path aliases; tsconfig updated for bundler resolution.
5. Consolidate Pet types — single `Pet` type exported from feature types; consumers updated.
6. Add explicit props typing for shared UI components — audited and typed common components.
7. Stabilize Zustand store usage — narrow selectors and stable action selection patterns.
8. Normalize store error typing/handling — `error: unknown | string | null` + `toErrorMessage`; friendly localized error rendering.
9. Trim artificial delays — removed simulated timeouts from async actions; tests simulate latency if needed.
10. Centralize test i18n setup — shared `src/testUtils/test-i18n.tsx`; wired via render wrapper; removed duplicates.
11. Localize common UI strings — Loading/Error indicators use `common` namespace; support role/aria-live and text overrides.
12. i18n namespace hygiene — components declare a primary namespace and use `{ ns: '...' }` only when needed.
13. Improve ConfirmModal a11y — aria-labelledby with visible heading, focus trap, ESC to close, i18n-backed labels.
14. Fix link/button semantics in PetList — no nested interactive elements; use a single link styled as button.
15. Strengthen table semantics — `<th scope="col">` for headers; tests verify columnheader roles and names.
16. Feature flags consistency — unified on Vite env, normalized names (`petListEnabled`, `addPetEnabled`), test helper to override flags.
17. Routing & navigation hygiene — localized feature-unavailable route; prefetch pets on /pets routes.
18. Improve PetForm API — derive dirty state internally and expose `onDirtyChange?`; support controlled `value`/`onChange`.
19. Enhance common components for a11y — added roles and aria-live defaults.
20. Testing quality improvements — prefer `user-event`; added a11y-focused tests; increased coverage of flags and error paths.
21. ESLint ruleset hardening — pending.
22. Vite/TypeScript config hygiene — confirmed aliases and bundler module resolution.
23. Prettier and editor consistency — added `.editorconfig`.
24. Robust ID generation strategy — utility with test override; uses `crypto.randomUUID()` when available.
25. Introduce data/service layer — extracted fetching to `services/pets.service` with tests.
26. Add an Error Boundary — top-level boundary with localized fallback; tests added.
27. Documentation updates — this README and CHANGELOG updates.
28. Fix test warnings — resolved `NO_I18NEXT_INSTANCE` by using shared render wrapper.
