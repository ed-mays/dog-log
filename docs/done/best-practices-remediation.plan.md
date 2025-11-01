### What the best-practices.md expects (quick digest)

- Project baseline: React 19 + strict TS, Vite; `build` must type-check (`tsc -b && vite build`); use path aliases.
- Component patterns and state: Small, composable components; push logic into custom hooks; use Zustand when needed;
  avoid duplicate sources of truth.
- Data access: Keep Firestore behind repositories/services; return plain JS objects; hooks or stores should call
  services, not Firebase SDK.
- Routing: Use React Router; lazy-split routes and colocate loaders/adapters by feature.
- Performance: Measure first; add `React.lazy`/`Suspense` where it pays off.
- Testing: Vitest + Testing Library; coverage with `coverage-v8` and Istanbul instrumentation.
- Code quality: ESLint + Prettier; stable public interfaces; consistent aliases.
- i18n: Centralize i18next; avoid hardcoded strings; lazy-load namespaces per feature to reduce bundle size.
- Folder structure: Feature-first under `src/features/<domain>`; shared UI under `src/components/common`.
- Build/scripts: Standard scripts and fail builds on type errors/lints; ensure tsconfig paths align with Vite
  resolution.

---

### Where the project aligns well

- TypeScript strict mode enabled: `tsconfig.app.json` line 19 `"strict": true`.
- Build script type-checks first: `package.json` lines 9–10 uses `tsc -b && vite build`.
- Path aliases configured and Vite resolves them: `tsconfig.app.json` lines 25–40; `vite.config.ts` uses
  `vite-tsconfig-paths` (line 7); `vitest.config.ts` sets `resolve.alias` (lines 33–52).
- Firestore interactions abstracted through repositories/services:
  - `src/repositories/base/BaseRepository.ts` implements CRUD and converts Firestore `Timestamp` to `Date` (lines
    48–86) and vice versa (lines 92–114).
  - Services consume repositories: `src/services/petService.ts` and `src/services/auth/authService.ts`.
- Zustand used for shared client state and calls services (e.g., `src/store/pets.store.tsx` lines 24–37).
- React Router in use with feature-first routes: `src/AppRoutes.tsx`.
- Centralized i18n setup with namespaces: `src/i18n.ts`.
- Testing stack and shared test utils in place: `vitest.config.ts` sets JSDOM and coverage (lines 6–13); shared wrapper
  `src/test-utils.tsx`; test i18n `src/testUtils/test-i18n.ts`.

---

### Divergences from best-practices.md (with evidence)

1. Coverage instrumentation via Istanbul is not wired into Vite

- Best-practice: “Run vitest with coverage (coverage-v8) and instrument via vite-plugin-istanbul.”
- Evidence: `package.json` includes `vite-plugin-istanbul` (line 58), but `vite.config.ts` (lines 6–8) does not
  configure it, so no instrumentation.

2. Routes and feature pages are not lazy-loaded

- Best-practice: “Split routes lazily and colocate loaders/adapters near route components.”
- Evidence: `src/AppRoutes.tsx` imports pages synchronously (lines 4–8) and uses them directly. No `React.lazy` or
  `Suspense` is used.

3. i18n resources are eagerly loaded; namespaces aren’t lazy-loaded

- Best-practice: “Lazy-load namespaces when features/routes mount to reduce initial bundles.”
- Evidence: `src/i18n.ts` imports all `en` and `es` JSON files up-front (lines 4–12) and initializes with all
  resources (lines 14–34). Also, `ns` omits `petProperties` even though it is provided in `resources` (lines 31–33 vs.
  lines 7–12, 20–27).

4. Inconsistent use of path aliases for module boundaries

- Best-practice: “Keep imports clean with aliases tied to tsconfig and Vite config.”
- Evidence:
  - `src/App.tsx` uses relative path for feature flag hook: `./features/petManagement/RoutePrefetcher` (line 10) and
    `./featureFlags/useFeatureFlag` (line 2) instead of `@features/...` and `@featureFlags/...`.
  - `src/components/common/PrivateRoute.tsx` imports `useFeatureFlag` with a relative path
    `../../featureFlags/useFeatureFlag` (line 3).

5. Repository layer couples to Firebase Auth directly

- Best-practice: Repositories/services should have narrow, explicit interfaces; avoid cross-cutting global dependencies
  inside low-level modules when it increases coupling.
- Evidence: `src/repositories/base/BaseRepository.ts` reads current auth user during `create()` (lines 205–213) via
  `getAuth()` (line 29) to set `createdBy`. This makes the generic repository depend on Firebase Auth and a global
  state. Many projects prefer passing `createdBy` from the caller (service/store) to keep the repository pure and
  testable.

6. No route-level `Suspense`/prefetch for better UX

- Best-practice: Use `React.lazy` with `Suspense` for route and component-level splitting and combine with prefetching
  where it helps.
- Evidence: `src/main.tsx` and `src/AppRoutes.tsx` do not wrap routes in `Suspense`; `RoutePrefetcher` is present (
  `src/App.tsx` line 10) but page components are still eagerly loaded.

7. Minor i18n config inconsistency

- Best-practice: Keep namespaces aligned and stable.
- Evidence: `src/i18n.ts` registers `petProperties` resources (lines 7–12, 20–27) but the `ns` list excludes it (line
  31), which can cause missing key warnings when `defaultNS` fallback is not desired.

8. Duplicate alias definitions between `tsconfig.json` and `tsconfig.app.json`

- Best-practice: “Ensure tsconfig paths match vite-tsconfig-paths for consistent alias resolution.” Minimize duplication
  to avoid drift.
- Evidence: Aliases are defined in both `tsconfig.app.json` (lines 25–40) and `tsconfig.json` (lines 9–13) with
  overlapping but not identical sets. This can cause confusion for tooling that reads one file vs the other.

---

### Step-by-step remediation plan

#### [:white_check_mark:] 1) Add Istanbul instrumentation to Vite for coverage

- Why: Enables statement/branch coverage mapping that aligns with Vite transforms, per best-practices.
- How:
  - Update `vite.config.ts` to include the plugin and gate it by environment.
  - Example:

    ```ts
    // vite.config.ts
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tsconfigPaths from 'vite-tsconfig-paths';
    import istanbul from 'vite-plugin-istanbul';

    export default defineConfig(({ mode }) => ({
      plugins: [
        react(),
        tsconfigPaths(),
        istanbul({
          cypress: false,
          requireEnv: false,
          include: ['src/**/*.tsx', 'src/**/*.ts'],
          exclude: ['node_modules', 'src/testUtils/**', 'src/test-*.tsx'],
          extension: ['.tsx', '.ts'],
        }),
      ],
      define: {
        __DEV__: mode !== 'production',
      },
    }));
    ```

  - Keep `vitest.config.ts` coverage provider as V8 (already configured lines 9–13).

#### [:white_check_mark:] 2) Lazy-load routes and wrap in Suspense

- Why: Reduce initial bundle size and align with “split routes lazily.”
- How:
  - Convert page imports in `AppRoutes.tsx` to `React.lazy` and wrap route `element` with `Suspense` fallback.
  - Example:

    ```tsx
    // src/AppRoutes.tsx
    import { Navigate, Route, Routes } from 'react-router-dom';
    import { Suspense, lazy } from 'react';
    import { useFeatureFlag } from './featureFlags/useFeatureFlag';
    import { PrivateRoute } from '@components/common/PrivateRoute';
    import { useTranslation } from 'react-i18next';
    import { useAuthStore } from '@store/auth.store';

    const PetListPage = lazy(() => import('@features/pets/petListPage'));
    const AddPetPage = lazy(() => import('@features/pets/AddPetPage'));

    export function AppRoutes() {
      const enablePetList = useFeatureFlag('petListEnabled');
      const { t } = useTranslation('common');
      const { user } = useAuthStore();

      if (!user) {
        return (
          <Routes>
            <Route path="/welcome" element={<div>...</div>} />
            <Route path="*" element={<Navigate to="/welcome" />} />
          </Routes>
        );
      }

      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route
              path="/pets"
              element={
                enablePetList ? (
                  <PrivateRoute>
                    <PetListPage />
                  </PrivateRoute>
                ) : (
                  <Navigate to="/feature-unavailable" replace />
                )
              }
            />
            <Route
              path="/pets/new"
              element={
                <PrivateRoute>
                  <AddPetPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/pets" />} />
          </Routes>
        </Suspense>
      );
    }
    ```

  - Optionally add route-level prefetch via `link rel="prefetch"` when hovering menu items, or keep `RoutePrefetcher` if
    it already covers data.

#### [:white_check_mark:] 3) Lazy-load i18n namespaces per feature

- Why: Reduce initial bundle; align with “lazy-load namespaces when features mount.”
- How:
  - Switch `src/i18n.ts` to dynamic import of JSON per namespace/language or use `i18next-http-backend` for real files.
    With static JSON, you can do:

    ```ts
    // src/i18n.ts
    import i18n from 'i18next';
    import { initReactI18next } from 'react-i18next';

    i18n.use(initReactI18next).init({
      lng: import.meta.env.VITE_DEFAULT_LOCALE,
      fallbackLng: 'en',
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      resources: {
        /* keep only critical boot namespace like common */
      },
    });

    // Helper to lazy-load a namespace at runtime
    export async function loadNamespace(ns: string, lng = i18n.language) {
      const mod = await import(`./locales/${lng}/${ns}.json`);
      i18n.addResourceBundle(lng, ns, mod.default, true, true);
      return ns;
    }
    export default i18n;
    ```

  - In feature entry points (e.g., `petListPage`), call `loadNamespace('petList')` inside an effect or use
    `useTranslation('petList', { useSuspense: false })` after preloading.
  - Also fix the namespace list inconsistency by including `petProperties` in `ns` when needed or lazy-load it along
    with the feature that uses it.

#### [`:white_check_mark:]` 4) Standardize imports to use aliases consistently

- Why: Reinforces module boundaries and avoids brittle relative paths.
- How:
  - Change relative imports to aliases:
    - `src/App.tsx` line 2: `import { useFeatureFlag } from '@featureFlags/useFeatureFlag';`
    - `src/App.tsx` line 10: `import { RoutePrefetcher } from '@features/petManagement/RoutePrefetcher';`
    - `src/components/common/PrivateRoute.tsx` line 3: `import { useFeatureFlag } from '@featureFlags/useFeatureFlag';`
  - Add an ESLint rule or custom lint to discourage deep relative imports when an alias exists.

#### [:white_check_mark:] 5) Decouple BaseRepository from Firebase Auth

- Why: Keep repositories pure and testable; avoid relying on global auth state in a generic base.
- How:
  - Remove `getAuth()` usage from `BaseRepository.create` and require `createdBy` to be part of the `entityData` (
    provided by the caller).
  - Example refactor:
    ```ts
    // BaseRepository.ts (create)
    async create(entityData: Omit<T, keyof BaseEntity>): Promise<T> {
      try {
        const now = new Date();
        const newEntity = {
          ...entityData,
          createdAt: now,
          updatedAt: now,
        } as Record<string, unknown>;
        // assume createdBy is already present if needed
        const docData = this.entityToDocument(newEntity);
        await setDoc(doc(db, this.collectionName, newEntity.id as string), docData);
        return { id: newEntity.id, ...newEntity } as T;
      } catch (error) {
        throw this.handleError(error, 'create');
      }
    }
    ```
  - Populate `createdBy` in the service/store layer where you already have the authenticated user:
    ```ts
    // src/store/pets.store.tsx (before calling service)
    const newPet = await petService.addPet(user.uid, {
      ...pet,
      createdBy: user.uid,
    });
    ```
  - If you want to keep convenience, accept an optional `context` in repository methods (e.g., `{ userId }`) instead of
    reading from Firebase internally.

#### [:white_check_mark:] 6) Add Suspense boundary at the app shell and keep a consistent loading experience

- Why: Smooth UX around code-split boundaries.
- How:
  - Wrap `<AppRoutes />` with a `Suspense` fallback in `src/App.tsx` or keep it inside `AppRoutes` as shown above.
  - Reuse your existing `LoadingIndicator` as the fallback.

#### [:white_check_mark:] 7) Align i18n namespaces

- Why: Prevent missing-key warnings and inconsistent loading.
- How:
  - Ensure `ns` includes all base namespaces you intend to preload or remove them from preload:
    ```ts
    // src/i18n.ts
    ns: ['common', 'home', 'petList', 'petProperties'],
    ```
  - If adopting lazy-loading (step 3), keep `ns: ['common']` at boot and load others per feature.

#### 8) Consolidate alias definitions to a single source of truth

- Why: Avoid drift between `tsconfig.json`, `tsconfig.app.json`, Vitest config.
- How:
  - Prefer keeping all path aliases in `tsconfig.app.json` and remove duplicates from `tsconfig.json` (which currently
    repeats a subset on lines 9–13). Make sure tools (Vite, Vitest, ESLint) read the same tsconfig or propagate via
    plugins.
  - Keep `vite-tsconfig-paths` (already present) to honor tsconfig paths at build/runtime. In `vitest.config.ts`, you
    can often rely on `vite-tsconfig-paths` via `test.environment` config or import the plugin as well in Vitest’s Vite
    pipeline if needed. Alternatively, keep the explicit aliases but generate them from tsconfig to reduce manual drift.

---

### Optional improvements (good to have, measure first)

- Add route-level data loaders/hooks near pages (colocate fetch logic per feature). You already keep fetch in
  store/services; complement with hooks like `usePets()` that select from the store and abstract the fetch call on
  mount.
- Consider React 19’s features (e.g., `useOptimistic`) for forms once compatibility is clear.
- Add a11y smoke tests for keyboard nav on key pages and keep `eslint-plugin-jsx-a11y` rules enabled in CI.

---

### Acceptance checklist (what “done” looks like)

- Coverage instrumentation plugin active in Vite; `npm run test:coverage` produces instrumented HTML under `coverage/`.
- `AppRoutes` uses `React.lazy` and is wrapped in `Suspense` with `LoadingIndicator` fallback; initial JS bundle size
  drops for non-pet routes.
- i18n loads only `common` at boot; feature namespaces preload on demand without missing-key warnings.
- All imports use aliases (`@features`, `@featureFlags`, etc.); linters catch regressions.
- `BaseRepository` no longer reads auth directly; `createdBy` is supplied by callers (service/store) or via method
  context.
- Aliases are defined once (prefer `tsconfig.app.json`), and Vite/Vitest resolve via `vite-tsconfig-paths` without
  drift.

If you want, I can tailor the exact code changes file-by-file (diff-style) based on your preferred approach to i18n
lazy-loading (dynamic import vs. http-backend).
