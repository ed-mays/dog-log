## Dog Log

A modern **React** application scaffolded with **Vite** and written in **TypeScript**. It supports robust linting and
testing, and leverages modular path aliases and i18n. This project uses the latest React 19+ and popular state and
translation libraries.

---

### Project Structure

- **TypeScript** with strict type checking and modern bundler settings
- **Vite** for fast development & optimized builds
- Support for **path aliases**:
  - `@components/* → src/components/*`
  - `@firebase → src/firebase.ts`
  - `@i18n → src/i18n.ts`
  - `@store/* → src/store/*`
  - `@test-utils → src/test-utils.tsx`
  - `@testUtils/* → src/testUtils/*`
  - `@featureFlags/* → src/featureFlags/*`
  - `@features/* → src/features/*`
  - `@models/* → src/models/*`
  - `@repositories/* → src/repositories/*`
  - `@services/* → src/services/*`
  - `@styles/* → src/styles/*`
- See: docs/directory-structure-review.md for a focused directory structure review and proposals.
- Test setup with **Vitest** & **Testing Library**
- Linting & formatting with **ESLint** & **Prettier**
- Internationalization powered by **i18next** and **react-i18next**

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Available Scripts

| Script                       | Description                             |
| ---------------------------- | --------------------------------------- |
| `npm run dev`                | Start development server (Vite)         |
| `npm run dev:with-emulators` | Start dev server and Firebase emulators |
| `npm run build`              | Type-check & build for production       |
| `npm run preview`            | Preview local production build          |
| `npm run lint`               | Run ESLint for code linting             |
| `npm run lint:fix`           | Auto-fix lint issues                    |
| `npm run format`             | Format codebase with Prettier           |
| `npm run test`               | Run all tests (unit and integration)    |
| `npm run test:unit`          | Run only unit & component tests         |
| `npm run test:watch`         | Run unit tests in watch mode            |
| `npm run test:integration`   | Run only integration tests              |
| `npm run test:coverage`      | Run unit tests with code coverage       |
| `npm run start:firebase`     | Start Firebase emulators locally        |

---

### Firebase Emulators & Auth (Local Development)

1. Start Firebase emulators first in a dedicated terminal:

- `npm run start:firebase`
- Auth emulator runs on http://localhost:9099 and the Emulator UI will be available as configured in firebase.json.

2. In a second terminal, start the Vite dev server:

- `npm run dev`

3. The app auto-connects to the Auth emulator when running on `localhost` (see `src/firebase.ts`).
4. For test users, use the Emulator UI to create accounts. Do not use real accounts in local testing.

Notes:

- Ensure `.env.local` has your Firebase client config. These are client-side keys and not secrets, but treat them as
  credentials for your project configuration.
- Never commit real production credentials. If any key leaks, rotate/regenerate from the Firebase Console, update
  `.env.local`, and redeploy.

---

### Testing

- Uses **Vitest** for running fast TypeScript and component tests.
- **@testing-library/react**, **user-event**, and **jest-dom** for ergonomic, reliable UI/UX testing.
- Use the shared render wrapper which includes providers (i18n + feature flags):

  ```
  import { render, screen } from '@test-utils';

  render(<MyComponent />, { featureFlags: { addPetEnabled: true } });
  ```

- TypeScript test globals and matchers included by default.

---

### Linting & Formatting

- **ESLint** for linting React, TypeScript, accessibility, and prettier integration.
- **Prettier** for code style and consistency.

---

### Internationalization

- **i18next** & **react-i18next** with namespaced translations: `common`, `home`, `petList`, `petProperties`.
- Default language from Vite env: `VITE_DEFAULT_LOCALE` (fallback: `en`).
- In components: `const { t } = useTranslation('<namespace>');` and `t('key')`.
- Shared test i18n lives at `src/testUtils/test-i18n.ts` and is wired through the test render wrapper.

---

### Feature Flags

- Managed via a provider at `src/featureFlags/FeatureFlagsProvider` with defaults from Vite env vars (`VITE_*`).
- Query flags via `useFeatureFlag('<flagName>')`. Current flags include `petListEnabled` and `addPetEnabled`.
- In tests, override flags through the render wrapper:

  ```
  render(<App />, { featureFlags: { petListEnabled: false } });
  ```

---

### Path Aliases

- Configured in `tsconfig.app.json` (moduleResolution: "bundler").
- Aliases:
  - `@components/*` → `src/components/*`
  - `@firebase` → `src/firebase.ts`
  - `@i18n` → `src/i18n.ts`
  - `@store/*` → `src/store/*`
  - `@test-utils` → `src/test-utils.tsx`
  - `@testUtils/*` → `src/testUtils/*`
  - `@featureFlags/*` → `src/featureFlags/*`
  - `@features/*` → `src/features/*`
  - `@models/*` → `src/models/*`
  - `@repositories/*` → `src/repositories/*`
  - `@services/*` → `src/services/*`
  - `@styles/*` → `src/styles/*`
- Prefer extensionless imports with these aliases.

---

### Error Handling

- A top-level `ErrorBoundary` (localized) wraps the app. Customize fallback via `fallbackText` prop; default text comes
  from the `common` namespace.

---

## Tech Stack

- React 19
- TypeScript (strict)
- Vite
- Vitest + Testing Library
- Zustand (state)
- i18next/react-i18next (i18n)
- ESLint, Prettier

---

### License

This project is private and not currently intended for open-source distribution.

---

---

### Coverage Reports (HTML)

This project uses Vitest with the V8 coverage provider and generates an HTML coverage report for quick inspection.

How to generate coverage:

```bash
npm run test:coverage
```

Where to find the report:

- Output directory: `coverage/`
- Open the dashboard: `coverage/index.html`

Quick ways to open the report:

- macOS:
  ```bash
  open coverage/index.html
  ```
- Windows (PowerShell):
  ```powershell
  start .\coverage\index.html
  ```
- Linux:
  ```bash
  xdg-open coverage/index.html
  ```

Optional: serve the report via a local static server (useful if your browser blocks `file://` URLs):

```bash
npx http-server coverage -o
```

This will open the report at `http://localhost:8080` (port may vary).

Troubleshooting HTML coverage:

- Ensure versions are aligned (see `package.json`):
  - `vitest` and `@vitest/coverage-v8` should be compatible (we use the V8 provider).
- Configuration is defined in `vitest.config.ts` under `test.coverage`:
  - `provider: 'v8'`
  - `reporter: ['text', 'html']`
  - `all: true`, `include: ['src/**/*.{ts,tsx}']`, and a conservative `exclude` list to avoid non-source files.
- If the report looks stale or fails to open, try regenerating from a clean slate:
  ```bash
  rm -rf coverage && npm run test:coverage
  ```

The CI will enforce minimum per-file coverage thresholds (branches, functions, statements, and lines at ≥90%). See `decisions/adr/033-TESTING-minimum-test-coverage-thresholds.md` for rationale.

---

## CI/CD and Hosting

This project ships with a simple, robust GitHub Actions + Firebase Hosting setup. It enforces quality on pull requests and provides preview/staging deployments.

### Workflows

- CI (PR): `.github/workflows/ci-pr.yml`
  - Triggers on pull requests to `main`.
  - Steps: install → synthesize `.env` for tests → `lint` → `test:coverage` (90% gate via `vitest.config.ts`) → `build`.
  - Uploads HTML coverage artifact (`coverage/`).

- Deploy Preview (PR): `.github/workflows/deploy-preview.yml`
  - Triggers on pull requests to `main`.
  - Builds with DEV environment values and deploys a Firebase Hosting Preview Channel on the DEV project.
  - Posts/refreshes a comment with the preview URL on the PR.
  - Skips on forked PRs (secrets are not available to forks).

- Deploy Staging (main): `.github/workflows/deploy-staging.yml`
  - Triggers on pushes to `main`.
  - Builds with STAGING environment values and deploys to the staging Firebase project (live channel by default).

### Required checks and branch protection

- Protect `main`:
  - Require pull requests (block direct pushes).
  - Require passing checks: lint, tests (coverage gate), build.
  - Optionally, require conversation resolution.

### Environments and Firebase projects

- Separate Firebase projects recommended:
  - DEV: used for PR preview channels (e.g., `dog-log-dev-xxxx`).
  - STAGING: used for merges to `main` (e.g., `dog-log-staging-xxxx`).
- Enable Hosting in each project at least once (Firebase Console → Build → Hosting → Get started).
- The app is a SPA; Vite’s build output is `dist/`.
  - `firebase.json` is configured with `public: "dist"`, SPA rewrites (`/** → /index.html`), and caching headers.

### GitHub Actions configuration (vars and secrets)

Because Vite embeds `VITE_*` values at build time, the workflows synthesize a temporary `.env` before running `npm run test:coverage` and `npm run build`.

- Repository Variables (safe, non-secret — visible to CI):
  - DEV variables: `DEV_VITE_APP_TITLE`, `DEV_VITE_DEFAULT_LOCALE`, feature flags, and Firebase web config: `DEV_VITE_FIREBASE_API_KEY`, `DEV_VITE_FIREBASE_AUTH_DOMAIN`, `DEV_VITE_FIREBASE_PROJECT_ID`, `DEV_VITE_FIREBASE_STORAGE_BUCKET`, `DEV_VITE_FIREBASE_MESSAGING_SENDER_ID`, `DEV_VITE_FIREBASE_APP_ID`, `DEV_VITE_FIREBASE_MEASUREMENT_ID`.
  - STAGING variables: the same keys prefixed with `STG_...` (e.g., `STG_VITE_FIREBASE_PROJECT_ID`).
  - Optional convenience: `DEV_FIREBASE_PROJECT_ID` to reference the exact Firebase Project ID in workflows.

- Repository Secrets (sensitive):
  - `FIREBASE_SERVICE_ACCOUNT_DEV` → JSON key for a service account in the DEV project.
  - `FIREBASE_SERVICE_ACCOUNT_STAGING` → JSON key for a service account in the STAGING project.
  - Minimum roles for each service account: `Firebase Hosting Admin` + `Viewer` (optionally `Service Account Token Creator`).

- The workflows write a temporary `.env` like:
  ```bash
  {
    echo "VITE_APP_TITLE=${{ vars.DEV_VITE_APP_TITLE }}";
    echo "VITE_DEFAULT_LOCALE=${{ vars.DEV_VITE_DEFAULT_LOCALE }}";
    echo "VITE_FLAG_ADD_PET_ENABLED=${{ vars.DEV_VITE_FLAG_ADD_PET_ENABLED }}";
    echo "VITE_FIREBASE_API_KEY=${{ vars.DEV_VITE_FIREBASE_API_KEY }}";
    echo "VITE_FIREBASE_AUTH_DOMAIN=${{ vars.DEV_VITE_FIREBASE_AUTH_DOMAIN }}";
    echo "VITE_FIREBASE_PROJECT_ID=${{ vars.DEV_VITE_FIREBASE_PROJECT_ID }}";
    echo "VITE_FIREBASE_STORAGE_BUCKET=${{ vars.DEV_VITE_FIREBASE_STORAGE_BUCKET }}";
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${{ vars.DEV_VITE_FIREBASE_MESSAGING_SENDER_ID }}";
    echo "VITE_FIREBASE_APP_ID=${{ vars.DEV_VITE_FIREBASE_APP_ID }}";
    echo "VITE_FIREBASE_MEASUREMENT_ID=${{ vars.DEV_VITE_FIREBASE_MEASUREMENT_ID }}";
    echo "VITE_USE_EMULATORS=false";
  } > .env
  ```

### Firebase initialization in code (tests & CI friendly)

- `src/firebase.ts` uses lazy initialization to avoid SDK assertions during test imports.
- It reads `VITE_*` values and falls back to safe test strings if missing.
- Emulators connect only when `VITE_USE_EMULATORS === 'true'` (recommended only for local dev).

### Local development

- Put your local values in `.env.local` (gitignored). Example keys:
  - `VITE_APP_TITLE`, `VITE_DEFAULT_LOCALE`, feature flags
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
- Start emulators + dev server:
  - `npm run start:firebase` (emulators)
  - `npm run dev` (Vite)
- To deploy manually from your machine (once authenticated via `firebase login`):
  ```bash
  firebase use dev && npm run build && firebase deploy
  firebase use staging && npm run build && firebase deploy
  ```

### PR Previews and Staging behavior

- PR Previews: all same‑repo PRs deploy to a single permanent preview channel on the DEV project with a stable URL:
  - https://dog-log-dev-95fe5--preview.web.app
  - https://dog-log-dev-95fe5--preview.firebaseapp.com
    This stable domain is added to Firebase Auth → Authorized domains so Google sign‑in works on previews. Forked PRs are skipped by design (no secrets on forks).
- Staging: merges to `main` deploy to the STAGING project’s live channel (or a permanent `staging` channel if you choose to configure it).

### Coverage requirements

- The repository enforces a 90% coverage gate via `vitest.config.ts`.
- CI runs `npm run test:coverage`; if below threshold, the job fails.

### Troubleshooting CI/CD

- Firebase project not found / permission errors:
  - Ensure the workflow `projectId` exactly matches the Firebase Project ID from Console (IDs may have suffixes).
  - Verify `FIREBASE_SERVICE_ACCOUNT_DEV` JSON’s `project_id` matches and that the service account has the required roles.
  - Make sure Hosting is enabled in that project.

- `auth/invalid-api-key` during tests:
  - Ensure the CI workflow writes a `.env` before tests, or rely on the safe fallbacks in `src/firebase.ts`.

- Preview deploy 403 on forks:
  - Expected; previews intentionally skip forked PRs. The job is guarded to run only for same‑repo PRs.

- CSP / headers:
  - `firebase.json` can include security headers (CSP, Referrer-Policy, etc.). Tighten as needed for production.

### ADRs

See `/decisions/adr` for decisions related to:

- Hosting choice (Firebase Hosting over App Hosting)
- CI authentication method (service account JSON now, OIDC later)
- Environment variable strategy (build-time `VITE_*` via GitHub Actions variables)
- Branch protection and required checks
