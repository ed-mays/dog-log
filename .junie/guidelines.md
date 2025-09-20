# Dog Log — Developer Guidelines

Short, practical guidance to get productive quickly.

## 1. Tech Stack Snapshot
- React 19 + TypeScript (strict)
- Vite (dev/build), Vitest (+ Testing Library)
- Zustand (state)
- i18next + react-i18next (i18n)
- ESLint + Prettier

## 2. Project Structure & Conventions
- src/components/common/*: Reusable, stateless UI building blocks
- src/features/<domain>/*: Feature‑scoped pages, UI, and types (e.g., petManagement)
- src/store/*: Zustand stores and related types
- src/styles/*: CSS modules (prefer module.css for component/feature styles)
- src/locales/<lang>/*: Namespaced JSON translations
- src/featureFlags/*: Feature flag provider, config, and hooks
- src/test-utils.tsx: Preconfigured render wrapper for tests

Aliases (from tsconfig.app.json):
- @components/* → src/components/*
- @store/* → src/store/*
- @features/* → src/features/*
- @featureFlags/* → src/featureFlags/*
- @styles/* → src/styles/*
- @testUtils/* → src/testUtils/*

Guidelines:
- Favor feature-first organization under src/features/<domain>.
- When generating new TypeScript files, always use the .tsx extension
- Keep shared UI in src/components/common.
- One public component per file; colocate its styles and tests.
- Export minimal public APIs from index files when modules grow.

## 3. Scripts You’ll Use Daily
- npm run dev — start Vite dev server
- npm run build — type-check then build for production
- npm run preview — preview the production build locally
- npm run lint — run ESLint
- npm run lint:fix — auto-fix lint issues
- npm run format — format with Prettier
- npm run test — run unit/component tests (watch mode supported)
- npm run test:coverage — run tests and generate coverage (coverage/)

## 4. Testing Guidelines (Vitest + Testing Library)
- Prefer behavior-driven tests via @testing-library/react and user-event.
- Use the shared render wrapper for providers:
  import { render, screen } from '@/test-utils' or from src/test-utils; // alias/path as configured
- Keep tests next to code: Component.tsx and Component.test.tsx in same folder.
- Use getByRole and accessible queries; avoid brittle text selectors.
- Snapshot sparingly; assert meaningful behavior and state.

Setup notes:
- JSDOM environment, jest-dom matchers preloaded via vitest.setup.tsx.
- Coverage reports: coverage/ (HTML + text). Excludes config files and setup.

## 5. State & Data (Zustand)
- Create small, focused stores in src/store/ with typed state/actions.
- Keep async side-effects inside store actions when practical.
- Avoid leaking store shape across app; read via selectors: useStore(s => s.part).

## 6. Internationalization (i18next)
- Namespaces: common, home, petList, petProperties.
- Default language from Vite env: VITE_DEFAULT_LOCALE; fallback: en.
- Add translations under src/locales/<lang>/<namespace>.json.
- In components: const { t } = useTranslation('<namespace>'); and t('key').

## 7. Feature Flags
- See src/featureFlags/README.featureFlags.md for add/toggle/remove.
- Query flags with useFeatureFlag('flag_name').
- Gate routes/UI paths conditionally; keep legacy/new code tidy.

## 8. Environment Variables (Vite)
- Create .env.local for local-only values. Examples:
  VITE_DEFAULT_LOCALE=en
  VITE_PET_LIST_ENABLED=true
- All app-consumed env vars must be prefixed with VITE_.
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
- Tests can’t find providers: import render from src/test-utils.tsx.

Welcome aboard! Keep it simple, typed, and testable.
