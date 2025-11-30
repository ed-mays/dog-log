# Dog Log — Developer Guidelines

Short, practical guidance to get productive quickly.

## 0. Implementation Standard [IMPORTANT]

- **Simple & Secure**: Start with the simplest implementation. Performance and security are first priorities.
- **Clarify**: Ask for clarification rather than guessing.
- **Dependencies**: Avoid new external dependencies unless absolutely necessary. State the reason if required.

## 1. Workflow & Commit Style [IMPORTANT]

- **Atomic Changes**: Break down large features into small, self-contained units of work. Avoid "big bang" changes.
- **Incremental Verification**: Verify each small change (e.g., a single component or hook) before proceeding to the next.
- **Granular Tasks**: Ensure items in `task.md` are granular. Each task should ideally represent one logical commit or small PR.
- **Test-Driven Development**: Wherever possible, follow standard Test-Driven Development practices.
- **Review Cycles**: Stop and request user review after each small, discrete unit of work. Do not proceed without approval.
- **Quality Gates**: Ensure every step has passing tests, green lint, and a successful build before requesting review.

## 2. Tech Stack

- **Core**: React 19, TypeScript (strict), Vite
- **State**: Zustand
- **Data**: Firestore (via repositories)
- **Testing**: Vitest, Testing Library
- **i18n**: i18next
- **Linting**: ESLint, Prettier

## 3. Project Structure

- `src/features/<domain>/*`: **Feature-first organization**. Contains pages, components, hooks, types.
- `src/components/common/*`: Shared, stateless UI.
- `src/repositories/*`: **Data access layer**. Encapsulates Firestore logic. Returns plain objects.
- `src/services/*`: **Business logic**. Uses repositories.
- `src/store/*`: Zustand stores.
- `src/locales/<lang>/*`: JSON translations.

**Key Rules**:

- Use `.tsx` for components.
- Colocate styles (`module.css`) and tests with components.
- Export minimal public APIs.
- Use aliases (e.g., `@features`, `@components`) defined in `tsconfig.app.json`.

## 4. Daily Scripts

- `npm run dev` / `dev:with-emulators`: Start dev server.
- `npm run test` / `test:unit` / `test:integration`: Run tests.
- `npm run lint` / `format`: Check code quality.
- `npm run build`: Production build.

## 5. Testing Best Practices

- **User Interactions**: Always use `user-event` (async). Avoid `fire-event`.
- **Queries**: Prioritize `getByRole`, `getByLabelText`. Use `findBy*` for async elements.
- **No Snapshots**: Write explicit assertions for meaningful output.
- **Mocking**: Use `vi.mock` for stores. Use `vi.doMock` + `resetModules` for unique component mocks.
- **Coverage**: Test error states, edge cases, feature flags, and accessibility.

## 6. State & Data (Zustand & Firestore)

- **Zustand**: Small, focused stores. Async side-effects in actions. Read via selectors.
- **Firestore Strategy**:
  - **Repository**: Raw CRUD (encapsulated in `src/repositories`).
  - **Service**: Business logic (uses repositories).
  - **Hook**: React integration (uses services).
  - **Component**: UI only (uses hooks).
  - _Never use Firestore SDK directly in components._

## 7. Internationalization

- Use `useTranslation` hook.
- Add keys to `src/locales/<lang>/<namespace>.json`.
- Default locale: `VITE_DEFAULT_LOCALE` (fallback: `en`).

## 8. Feature Flags & Env Vars

- **Flags**: Managed in `src/featureFlags`. Use `useFeatureFlag`.
- **Env Vars**: Prefix with `VITE_`. Local overrides in `.env.local`.
