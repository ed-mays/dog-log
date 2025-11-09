# Dog Log — LLM Collaboration Guidelines

Date: 2025-11-08

Purpose: A fresh, practical guide for humans and LLMs collaborating on Dog Log. It encodes our current architecture and testing decisions (ADR-backed) and how to safely evolve the codebase with minimal churn.

What to optimize for:

- Small, focused changes with clear intent and tests.
- Respect the approved ADRs before introducing new patterns.
- Keep code feature-scoped, typed, testable, and i18n/flag ready.

---

## 1) Architecture Principles (ADR-backed)

- Data access layering (ADR-005):
  - Firestore access lives in src/repositories/\* and returns plain JS objects only.
  - Business logic lives in src/services/\* and depends on repositories.
  - UI (components, hooks, Zustand stores) talks to services only — never Firestore or repositories directly.
  - Reasoning: separation of concerns, easier testing/migration; see decisions/adr/005-data-access-strategy-with-services-and-repositories.md

- UI system (ADR-017):
  - Prefer Material UI (MUI) primitives and theming for new UI work.
  - Accessibility and Testing Library conventions apply.
  - See decisions/adr/017-adopt-material-design-ecosystem-for-UI.md

- Testing for feature flags and routing (ADR-024, ADR-028):
  - Cover flag off/on states for both UI gating and routes.
  - Prefer integration-style tests using @test-utils with MemoryRouter for flows; mock useNavigate only for isolated unit intent.
  - Always include a 404 route test and unauthenticated access checks where applicable.
  - See decisions/adr/024-TESTING-implement-rigorous-testing-for-feature-flags-and-routing.md and decisions/adr/028-TESTING-router-testing-guidance.md

---

## 2) Project Structure & Conventions

- Feature-first under src/features/<domain> for pages, components, hooks, and types.
- Shared stateless UI in src/components/common.
- Zustand stores in src/store (keep small and typed; prefer selectors: useStore(s => s.part)).
- Repositories in src/repositories, services in src/services.
- Styles: CSS modules in src/styles or colocated module.css.
- i18n namespaces live in src/locales/<lang>/<namespace>.json.
- One public component per file; colocate its styles and tests.
- When adding new TypeScript files, use .tsx.

Aliases (tsconfig.app.json):

- @components/_ → src/components/_
- @firebase → src/firebase.ts
- @i18n → src/i18n.ts
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

---

## 3) Testing Policy (Vitest + Testing Library)

General rules:

- Use @testing-library/user-event for interactions. Await all userEvent calls.
- For async appearance, use findBy*. Do not wrap getBy* in waitFor for simple presence.
- Prefer accessible queries in this order: getByRole → getByLabelText → getByPlaceholderText → getByText → getByTestId.
- Avoid snapshots. Assert meaningful, accessible output/state.
- Implement any skipped or commented-out tests.

Feature flags and routing (ADR-024, ADR-028):

- Add tests to prove UI is hidden/disabled when a flag is false and visible/active when true.
- For gated routes, verify redirect or “Feature Unavailable” when flag is false.
- Include tests for unauthenticated access redirects where relevant.
- Include a 404 test that navigates to a non-existent URL and checks the Not Found UI.
- Prefer integration tests with render from @test-utils and initialRoutes. Mock useNavigate only to verify “navigation intent” in isolated unit tests.

Mocking patterns:

- Zustand: vi.mock at top; provide injectable state per test. For per-test variants, use vi.doMock inside test with dynamic import and vi.resetModules() in beforeEach/afterEach.

Setup:

- Shared test i18n at src/testUtils/test-i18n.ts via the render wrapper.
- JSDOM environment; jest-dom matchers preloaded in vitest.setup.ts.
- Coverage output in coverage/; config/setup files excluded.

Scripts:

- npm run test, test:unit, test:integration, test:watch, test:coverage

---

## 4) Data & Side Effects

- Keep async side-effects inside store actions when practical.
- Prefer small service functions for fetch/CRUD; components call services via custom hooks where useful (e.g., usePetList).
- Never return Firestore SDK types from repositories/services; always plain objects with explicit types.

---

## 5) Internationalization (i18next)

- Namespaces: common, home, petList, petProperties.
- Default language: import from VITE_DEFAULT_LOCALE, fallback en.
- Add strings to src/locales/<lang>/<namespace>.json.
- In components: const { t } = useTranslation('<namespace>'); and t('key'). No hardcoded user-facing text.

---

## 6) Feature Flags

- See src/featureFlags/README.featureFlags.md for add/toggle/remove.
- Defaults from VITE\_\* envs; override in tests via <FeatureFlagsProvider initialFlags={{ ... }}> or render options.
- Query with useFeatureFlag('flag_name'). Use flags to gate routes and modular UI; keep legacy/new paths tidy.

---

## 7) Environment Variables (Vite)

- Use .env.local for local secrets. All runtime envs must be prefixed VITE\_.
- Example keys: VITE*APP_TITLE, VITE_DEFAULT_LOCALE, VITE_FLAG_COUNT_BUTTON, VITE_ADD_PET_ENABLED, VITE_FIREBASE*\*.
- Restart dev server after changes.

---

## 8) Linting, Formatting, Type Safety

- Keep TypeScript strict; add explicit types to public boundaries and store state.
- npm run lint, lint:fix, and format before commits.
- npm run build must pass locally.

---

## 9) PR Checklist

- [ ] Tests added/updated (flags/routing covered where applicable)
- [ ] npm run build passes
- [ ] Lint + format pass
- [ ] i18n ready (no hardcoded strings)
- [ ] Feature-first structure and path aliases used
- [ ] Flags added/updated for gated behavior
- [ ] ADR alignment verified (005, 017, 024, 028). If deviating, propose/update an ADR.

---

## 10) Working With This Guide (LLM-specific)

When you (LLM) make changes:

- Make the minimal change that satisfies the issue; prefer editing over large rewrites.
- Conform to ADRs and this guide. If a request conflicts, explain the conflict and propose the smallest compliant alternative.
- Co-locate tests next to code. Use @test-utils render wrapper. Add flag and router tests per ADRs when touching those areas.
- Keep commits/messages clear about intent and scope.

When proposing new patterns:

- Justify with trade-offs. If accepted, add or update an ADR under decisions/adr using the template in decisions/templates.

---

## 11) Troubleshooting

- Aliases not resolving: check tsconfig.app.json and restart Vite.
- Missing i18n key: verify namespace/key and that src/i18n.ts loads the namespace.
- Tests failing due to providers: import render from '@test-utils'.
- NO_I18NEXT_INSTANCE warning: render via @test-utils or wrap with I18nextProvider using src/testUtils/test-i18n.ts.

Welcome aboard — build small, test thoroughly, respect ADRs.
