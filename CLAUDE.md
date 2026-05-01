# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned via `packageManager` field). Use `pnpm`, not npm.

- `pnpm run dev` — Vite dev server
- `pnpm run dev:with-emulators` — dev server + Firebase emulators (auth/firestore/storage)
- `pnpm run start:firebase` — Firebase emulators only
- `pnpm run build` — `tsc -b && vite build` (production build runs full type check)
- `pnpm run lint` / `pnpm run lint:fix` — ESLint
- `pnpm run format` — Prettier
- `pnpm run test` — all tests (unit + integration), via Vitest
- `pnpm run test:unit` — excludes `**/*.integration.test.tsx`
- `pnpm run test:integration` — only `**/*.integration.test.tsx`
- `pnpm run test:watch` — watch mode (unit only)
- `pnpm run test:coverage` — coverage (unit only)
- Run a single test: `pnpm exec vitest run path/to/file.test.tsx` (add `-t "name"` to filter by test name)
- Deploy: `pnpm run deploy:dev` / `pnpm run deploy:staging` (sets `firebase use` then deploys hosting + firestore.rules + storage)

Local Firebase Auth emulator runs on `localhost:9099`; the app auto-connects when running on `localhost` (see `src/firebase.ts`). Do not sign in with real accounts against the emulator.

## Architecture

**Stack:** React 19 + TypeScript (strict) + Vite, Zustand for state, MUI v7, Firebase (Firestore/Auth/Storage), i18next, react-router-dom v7.

### Layered data flow

Components must not call the Firestore SDK directly. The layering is:

```
Component → Hook → Service → Repository → Firestore
```

- **`src/repositories/*`** — raw CRUD against Firestore. Returns plain objects. Each entity has a repo (e.g. `petRepository`, `MedicationRepository`, `feedingRepository`, `vetRepository`, `petVetRepository`, `DoseLogRepository`, `userRepository`, `storageRepository`). Shared base utilities live in `repositories/base` and `repositories/utils`. `repositories/config.ts` centralizes collection names/paths.
- **`src/services/*`** — business logic; composes repositories. Includes `analytics/`, `auth/`, plus per-domain services (`petService`, `feedingService`, `vetService`, `petVetService`, `logService`, `remoteConfig`).
- **`src/store/*`** — Zustand stores, one per domain (`pets`, `feedings`, `auth`, `theme`, `ui`, `useMedicationStore`, `usePetMedicationStore`, `useDoseLogStore`). Async side-effects live in store actions; components read via selectors. `useResetStores` clears all stores (e.g. on sign-out).
- **`src/features/<domain>/*`** — feature-first organization with `pages/`, `components/`, `hooks/`, `types.ts`. Domains: `authentication`, `pets`, `medications`, `feedings`, `veterinarians`, `theme`, `misc`. Routes are wired through `RoutePrefetcher` per feature.
- **`src/components/common/*`** — shared stateless UI.

### Routing & app shell

- `src/main.tsx` boots the app; `src/App.tsx` provides theme/auth/i18n shells; `src/AppRoutes.tsx` declares routes. Auth-guarded routes are tested in `App.authGuard.test.tsx`.
- Per-feature `RoutePrefetcher` modules participate in route-level prefetching.

### Path aliases (configured in `tsconfig.app.json` + `vite.config.ts`)

`@components/*`, `@features/*`, `@app-firebase` (→ `src/firebase.ts`), `@i18n` (→ `src/i18n.ts`), `@models/*`, `@repositories/*`, `@services/*`, `@store/*`, `@styles/*`, `@featureFlags/*`, `@utils/*`, `@test-utils`, `@testUtils/*`. Prefer aliases over relative paths across feature/layer boundaries. Note: README.md previously documented `@firebase` — that name is not used; source imports `@app-firebase`.

### Feature flags & config

- `src/featureFlags/*` — use the `useFeatureFlag` hook; backed by Firebase Remote Config (`services/remoteConfig.ts`).
- Env vars must be prefixed `VITE_`. Default locale via `VITE_DEFAULT_LOCALE` (fallback `en`). Local overrides in `.env.local`.

### i18n

Translations in `src/locales/<lang>/<namespace>.json`. Components use the `useTranslation` hook; do not hardcode user-facing strings.

### Firestore security

`firestore.rules` and `storage.rules` are deployed alongside hosting. When changing data shape or access patterns, update rules and their tests (rules-unit-testing is a dev dep).

## Testing conventions

- Vitest + Testing Library + happy-dom (some suites use jsdom). Setup: `vitest.setup.ts`.
- Integration tests use the `.integration.test.tsx` suffix and are excluded from unit/watch/coverage runs.
- Use `user-event` (async) — avoid `fireEvent`.
- Prefer `getByRole` / `getByLabelText`; use `findBy*` for async UI.
- No snapshot tests — write explicit assertions.
- Mock Zustand stores with `vi.mock`; for component-specific overrides use `vi.doMock` + `resetModules`.
- Shared test helpers: `src/test-utils.tsx` (`@test-utils`) and `src/testUtils/*` (`@testUtils/*`).

## Health Stack

Tools used by `/health` to score code quality:

- typecheck: `pnpm exec tsc -b`
- lint: `pnpm run lint`
- test: `pnpm run test:unit`
- deadcode: `pnpm knip`

`pnpm knip` reports unused files, exports, types, and dependencies. Run before refactor PRs. Currently surfaces a backlog (~47 findings) — expected to drop as the layer-boundary cleanup completes. Use `pnpm knip:fix` cautiously (passes `--allow-remove-files`).

## Workflow conventions (from GEMINI.md)

- Atomic, incremental changes — break features into small commits/PRs; verify (tests + lint + build green) before requesting review.
- Avoid adding new external dependencies without justification.
- Prefer minimal public exports per module; colocate `*.module.css` and tests next to components.
- Husky + lint-staged run `pnpm run lint` on staged JS/TS files.
