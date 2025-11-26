### Goal

Adopt the new reusable testing patterns (store mock installers, shared route assertions, normalized mocking strategy) consistently across the repo with low risk, strong determinism, and minimal churn.

### Principles to follow

- Keep store unit tests real (no global store mocks). Mock stores only in component tests and always via installers.
- Use one canonical import specifier form with aliases (no “.ts” suffix in mocks/imports).
- Prefer `user-event` for all interactions and `findBy*` for async queries.
- Hide cross-cutting side effects behind global mocks only if they benefit the majority of suites; provide an escape hatch for the few that need the real implementation.

---

### Incremental rollout plan

Each step is independently shippable. We’ll stop after any step if regressions appear and fix forward.

1. Repository prep and confirmation (1 PR)

- Confirm global mocks: keep `AuthBootstrap` mocked in `vitest.setup.ts`. Add a one-liner comment with the unmock pattern (already captured in docs/test-architecture-review.md; we will also add a tiny test util if desired).
- Confirm the newly added helpers exist and export paths are stable:
  - `@testUtils/mocks/mockStoreInstallers`
  - `@testUtils/routes`
- Sanity-run: `pnpm run lint && pnpm run test:unit` to establish a green baseline (already green per your note).

2. Normalize alias usage for mocks/imports (repo-wide mechanical change; 1 PR)

- Goal: remove any `.ts` suffix in mocked specifiers and imports (e.g., `@store/x.store.ts` → `@store/x.store`).
- Sweep only test files and mocks. No production code semantics change.
- Add a lightweight ESLint rule (if you’re open to it) or a lint pattern to catch `vi.mock("*.ts")` in test files (optional; can be a future step). For now, add a codemod search-and-replace checklist.
- Verify: `pnpm run test:unit` still green.

3. Standardize store mocking in app-level tests (2–3 PRs)

- Target: `src/App.test.tsx`, `src/App.authGuard.test.tsx`, `src/App.routing.test.tsx` (already updated), then all top-level feature routing/entry tests if present.
- Pattern:
  - At the top of each suite that needs store control:
    - `vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }))` (and same for pets/ui as needed).
    - In `beforeEach`, call `vi.resetAllMocks()` and install via `installAuthStoreMock`, `installPetsStoreMock`, `installUiStoreMock`.
  - Use `@testUtils/routes` helpers for assertions (`expectWelcomePage`, etc.).
- Verify: tests unaffected semantically; fewer lines and higher consistency.

4. Apply the installers to feature-level component tests (per-domain sweeps; multiple small PRs)

- For each feature under `src/features/*`, sweep its tests:
  - Replace ad-hoc selector mocks or inline store-shape objects with `installXStoreMock` pattern.
  - If a test asserts on specific actions (e.g., `fetchPets` called), use the returned `mock.actions` where available (e.g., pets) or keep boundary assertions via UI.
- Keep adjustments incremental per domain (e.g., `pets/`, `authentication/`, `common/`).
- Verify: run `pnpm run test:unit` after each feature sweep.

5. Unmock escape hatch for AuthBootstrap tests (1 PR)

- In `AuthBootstrap.test.tsx` or the suite that exercises the real component:
  - Use: `vi.resetModules(); vi.unmock('@features/authentication/AuthBootstrap'); const { default: AuthBootstrap } = await import('@features/authentication/AuthBootstrap');`
  - Ensure spies (e.g., on `authService`) are set up before rendering.
- Optionally add a tiny helper: `@testUtils/unmockAuthBootstrap` exposing `loadRealAuthBootstrap()`.

6. Interaction API sweep: use `user-event` consistently (1–2 PRs)

- Replace any `fireEvent` usages with `await userEvent.*` equivalents.
- Replace `waitFor(getBy...)` used purely for presence with `findBy*` queries.
- Ensure all `userEvent` calls are awaited.

7. Render helpers adoption (optional but recommended; 1 PR)

- Add `src/testUtils/renderApp.tsx`:
  - `export function renderApp(options) { return render(<App />, { initialRoutes: ['/pets'], ...options }); }`
- Use this helper in app-level tests to further reduce boilerplate. Keep it optional to avoid over-abstraction if a test needs fine-grained control.

8. Route/page assertion helpers adoption across routing suites (1–2 PRs)

- Replace repeated selectors with `@testUtils/routes` helpers in all routing-related test files.
- Extend helpers as needed (e.g., `expectAddPetFormVisible`, `expectWelcomeRedirectToPets`), but keep them intention-revealing and minimal.

9. Lint/consistency automation (1 PR; optional but valuable)

- Add custom ESLint rules or simple lint patterns to:
  - Flag `vi.mock` with `*.ts` specifiers in tests.
  - Warn on direct `fireEvent` usage.
  - Optionally, provide a rule for missing `await` on `userEvent` calls (if a rule/plugin is available; otherwise rely on reviews).

10. Documentation and examples (1 PR)

- Update `docs/test-architecture-review.md` with “adopted patterns” and short code snippets.
- Add a short section in `README.github-conventions.md` or `src/testUtils/README.md` showing the installer pattern, route helpers, and unmock escape hatch.

11. Continuous verification and pruning (ongoing)

- After each PR, run `pnpm run lint` and `pnpm run test:unit` (CI should enforce).
- Remove any obsolete per-file utilities that are now superseded by the installers/routes helpers.
- Watch coverage thresholds; ensure no accidental dips by keeping behavior-centric assertions.

---

### Concrete checklists per step

Step 2 – Alias normalization

- [ ] Search `vi.mock('**.ts'` in `src/**/*.test.ts?(x)`.
- [ ] Replace with alias without extension.
- [ ] Sanity-run tests.

Step 3/4 – Store mocking standardization

- [ ] Ensure top-of-file `vi.mock('@store/x.store', () => ({ useXStore: vi.fn() }))` exists for each used store.
- [ ] In `beforeEach`: `vi.resetAllMocks(); installXStoreMock({ ...defaults })`.
- [ ] Replace hand-rolled selector functions with installer usage.
- [ ] Keep store unit tests untouched (no installers there).

Step 5 – AuthBootstrap escape hatch

- [ ] In its unit test: `vi.resetModules(); vi.unmock('...'); const mod = await import('...')`.
- [ ] Configure spies on dependencies before render.

Step 6 – Interaction API sweep

- [ ] Replace `fireEvent` → `userEvent`.
- [ ] Ensure all `userEvent` calls are awaited.
- [ ] Replace `waitFor(getBy...)` with `findBy*` for presence.

Step 7/8 – Helpers adoption

- [ ] Introduce `renderApp` and migrate app-level tests where it reduces boilerplate.
- [ ] Replace repeated route assertions with helpers.

Step 9 – Lint automation (optional)

- [ ] Add lint rules/patterns; document in `eslint.config.js`.

---

### Open questions / decisions for you

1. Global mocks

- Keep `AuthBootstrap` globally mocked (current setup) and rely on unmock + dynamic import in its suite? Or do you prefer per-file mocks to avoid dynamic imports? My recommendation: keep global for convenience; unmock only where needed.

2. Render helper

- Do you want a shared `renderApp` helper that defaults `initialRoutes` and potentially enables easy flag overrides, or prefer explicit `render(<App />)` everywhere? I lean toward adding it for app-level suites only.

3. Lint enforcement

- Are you open to adding ESLint rules to enforce: no `.ts` suffix in `vi.mock` specifiers; no `fireEvent`; `await` required on `userEvent`? If yes, I’ll draft minimal rules or plugin recommendations.

4. Scope of feature sweeps

- Should we migrate all feature suites in one PR per feature folder (e.g., `features/pets`, `features/authentication`), or smaller PRs per 2–3 files to keep reviews light?

5. Additional helpers

- Would you like me to add a small `withUser` convenience that installs an authenticated auth store with reasonable defaults (UID, etc.) for routing tests, or keep the explicit `installAuthStoreMock({ user: ... })` calls for clarity?

6. Coverage guardrails

- Are you comfortable keeping the current per-file thresholds (90%) through this refactor? If any flaky tests appear during the migration, we’ll fix the tests rather than weakening thresholds.

---

### Success criteria

- All tests pass with the standardized patterns.
- No test depends on `.ts`-suffixed specifiers for mocks/imports.
- All interactive tests use `user-event` and `findBy*` for async appearance.
- Store unit tests remain real and deterministic; component tests use installers consistently.
- Documentation reflects the adopted patterns; reviewers have a clear checklist.

If you confirm the decisions (especially items 1–5), I’ll proceed by drafting the first PRs for steps 2 and 3 (alias normalization + finalizing app-level suites).
