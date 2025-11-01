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
  - `@i18n → src/i18n.tsx`
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
- Shared test i18n lives at `src/testUtils/test-i18n.tsx` and is wired through the test render wrapper.

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
  - `@i18n` → `src/i18n.tsx`
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
