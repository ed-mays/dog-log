# Directory Structure Review & Improvement Proposals

Scope: This review considers only files not ignored by .gitignore (ignoring node*modules, dist, dist-ssr, *.local, .idea, .vscode/\_ except extensions.json, coverage/, guide.md).

Current layout recap (high level):

- src/
  - components/common/\* (shared UI building blocks)
  - features/
    - authentication/\*
    - petManagement/\*
  - featureFlags/\* (provider, hooks, config)
  - repositories/\* (data access, Firestore adapters)
  - services/\* (app-facing service layer)
  - store/\* (Zustand stores)
  - styles/\* (CSS modules / global styles)
  - locales/<lang>/\* (i18n namespaces)
  - test-utils.tsx and testUtils/\* (testing helpers)
  - firebase.tsx (client init)
- docs/ (project documentation)
- config & tooling: vite.config.ts, vitest.config.ts, tsconfig.\*.json, eslint.config.js

Overall assessment:

- The project already follows a clear feature-first organization with shared UI in src/components/common. Aliases are configured and used widely. Tests are colocated with code. This aligns well with the stated Developer Guidelines.

Recommended improvements (incremental, low-risk):

1. Strengthen feature module consistency

- Within each feature (e.g., src/features/petManagement), adopt a consistent internal layout:
  - components/ — feature-specific presentational components
  - pages/ — route-level components
  - hooks/ — feature-scoped hooks (e.g., usePetList, useAddPet)
  - types.tsx — feature domain types
  - index.ts — minimal public API re-exports if the feature grows
- Benefits: Easier navigation, clear separation of page vs. component responsibilities, better tree-shaking via narrow public APIs.

2. Clarify cross-feature domain types

- If types are shared by multiple features (e.g., User, common enums), centralize them in src/models/ with stable exports. Keep strictly feature-specific types in the feature folder.
- Action: Audit for duplicate or cross-feature types and migrate shared ones into src/models/.

3. Enforce repository/service boundaries

- Keep Firestore SDK usage isolated in src/repositories/_ and only return plain JS/TS objects. Ensure src/services/_ compose these repository calls and expose app-specific behaviors.
- Action: Add lightweight unit tests that assert services do not leak Firestore types. Consider a simple lint rule or pattern checks in docs.

4. Public API barrels (index.ts) for growing modules

- For directories like src/featureFlags, src/services, or mature features, add an index.ts that re-exports the small public surface. Avoid deep relative imports in consumers; prefer alias + top-level entry.
- Example: export FeatureFlagsProvider, useFeatureFlag from @featureFlags.

5. Cross-cutting hooks directory (optional)

- If you have hooks used across multiple features (e.g., useDebouncedValue, useLocalStorage), create src/hooks/ for cross-cutting hooks. Keep feature-specific hooks inside their feature folders.

6. Styles structure

- Keep component/feature styles co-located using \*.module.css. Reserve src/styles/ for global tokens, CSS variables, and reset/base styles. If not already present, introduce a small README in src/styles describing the conventions.

7. i18n organization and lazy-loading

- Continue namespacing by feature (e.g., petList, petProperties). Consider lazy-loading namespaces along with route-based code-splitting for features to reduce initial bundle.
- Action: Confirm each feature’s route loads only the namespaces it needs.

8. Test output and reports

- test-output.json exists at the repo root. Consider moving CI artifacts to a dedicated reports/ folder (and gitignore it) or generating them in coverage/ (already ignored). This keeps the root tidy.
- Action: Add reports/ to .gitignore if adopted.

9. Docs consolidation

- The docs/ folder is valuable. Consider a short docs/architecture/README.md that links to: directory review (this file), data access strategy, testing strategy, and feature flags guide, to improve discoverability.

10. Alias enforcement and path hygiene

- Continue favoring aliases over deep relative paths. Add a brief ESLint rule or code review checklist item: “Use configured aliases for cross-folder imports.”

11. CI lint/test targets (if/when CI is added)

- Ensure CI includes: npm run lint, npm run test:coverage, and a path-length import check if desired. This enforces structural conventions over time.

Quick wins checklist

- [ ] Add per-feature subfolders (components/pages/hooks) where missing
- [ ] Create/verify index.ts barrels for featureFlags and any large features
- [ ] Move shared types to src/models/
- [ ] Add src/hooks/ for cross-feature hooks (only if truly cross-cutting)
- [ ] Move test-output.json to reports/ and ignore it, or configure tools to write into coverage/
- [ ] Add a short README in src/styles/ clarifying style conventions
- [ ] Audit imports for alias usage; fix remaining relative cross-folder imports

Notes on .gitignore alignment

- Already ignores coverage/ and build artifacts. If introducing reports/, add it to .gitignore. Keep guide.md ignored per current policy.

Summary
The structure is solid and modern. The proposals above focus on consistency, discoverability, and long-term maintainability: firming up feature internals, clarifying shared types, enforcing clean service boundaries, and keeping the repo root and imports tidy. Implement them incrementally to minimize churn.
