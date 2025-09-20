# Firebase Authentication with Google — Implementation Checklist

The following actionable tasks are ordered to take you from architecture decisions through implementation, testing, and documentation. Check each box as you complete it.

1. [x] Confirm Firebase project and local emulator setup
   - [x] Verify firebase.json has Auth emulator enabled on port 9099 and UI enabled (already present)
   - [x] Ensure `npm run start:firebase` runs emulators successfully
   - [x] Document emulator startup flow for developers (emulators first, then `npm run dev`)

2. [x] Validate environment variables for Firebase
   - [x] Ensure .env/.env.local include VITE_ Firebase keys used in src/firebase.tsx
   - [x] Add a README note about not committing secrets and how to rotate/regenerate keys if leaked
   - [x] Confirm measurementId is optional and handled defensively in code

3. [x] Define core Auth architecture and module boundaries
   - [x] Decide on state holder: a lightweight AuthContext + hook or a Zustand store (consistent with existing state approach)
     - State holder will be zustand store
   - [x] Choose Google sign-in method (signInWithPopup for web; optionally signInWithRedirect for mobile)
     - Sign-in method will be signInWithPopup
   - [x] Define minimal public API for auth module: signInWithGoogle(), signOut(), useAuthUser(), useAuthStatus()

4. [x] Implement Firebase auth provider wiring
   - [x] Create `src/services/auth/authService.tsx` to encapsulate Google provider, sign-in, sign-out, and onAuthStateChanged subscription
   - [x] Use `GoogleAuthProvider` and `setPersistence(auth, browserLocalPersistence)` to persist sessions across reloads
   - [x] Ensure emulator connection is respected (already supported via src/firebase.tsx)
   - [ ] Implement appropriate unit tests for auth service and provider
5. 
6. [x] Create application-level Auth state
   - [ ] If using Context: `src/features/authentication/AuthProvider.tsx` that subscribes to onAuthStateChanged and exposes user/loading/error
   - [x] If using Zustand: `src/store/auth.store.tsx` with user, initializing, error, actions: initAuthListener(), signInWithGoogle(), signOut()
   - [x] Export typed User shape derived from Firebase `User` with a minimal app-facing model (uid, displayName, email, photoURL)

6. [x] Initialize Auth at app startup
   - [x] Wrap `<App />` with `<AuthProvider>` (or call store.initAuthListener()) in `src/main.tsx`
   - [x] Ensure splash/loading state is shown while auth status is resolving
   - [ ] Implement unit tests for app startup changes
   - 
7. [x] Build UI components for the flows
   - [x] Implement `src/features/authentication/SignupComponent.tsx` to trigger Google sign-up/sign-in (file currently empty)
   - [x] Create `LoginButton` and `LogoutButton` common components under `src/components/common/Auth/`
   - [x] Add error and loading states with accessible status text
   - [x] Localize UI strings via i18n (namespace: `common` or `authentication`)
   - [ ] Implement unit tests for the flow implementation and components
   
8. [x] Create a public Welcome page for logged-out users
   - [x] `src/features/authentication/WelcomePage.tsx` explaining the app with a prominent “Continue with Google” button
   - [x] i18n keys for header, subtitle, call-to-action, and error strings

9. [x] Protect private routes with React Router
   - [x] Add a `PrivateRoute` wrapper or use element guards that check auth state and redirect unauthenticated users to `/welcome`
   - [x] Update `src/App.tsx` routes so `/pets` and related pages are private
   - [x] Ensure redirect preserves the intended destination (via `state.from`), and return users after login

10. [ ] Wire login, signup, and logout flows end-to-end
    - [x] Signup/Login: invoke `signInWithPopup(new GoogleAuthProvider())`, handle errors (popup blocked, canceled, network)
    - [x] Display logout button on all screens if user is logged in
    - [x] Logout: call `signOut(auth)` and route to `/welcome`
    - [ ] Handle first-time users vs returning users (optional profile enrichment hook)

11. [ ] Handle auth persistence, refresh, and edge cases
    - [x] Set `browserLocalPersistence` and verify session recovery on reload
    - [x] Show a minimal in-app loading indicator while restoring auth
    - [x] Gracefully handle `onAuthStateChanged` null user scenarios

12. [x] Feature flags (optional but recommended)
    - [x] Add `VITE_AUTH_ENABLED` and wire a flag `authEnabled` in feature flags provider
    - [x] If disabled, always show `/welcome` with explanatory message and hide auth buttons

13. [ ] Accessibility and UX polish
    - [ ] Ensure buttons have proper roles, labels, and focus states
    - [ ] Keyboard navigation flows through Welcome and any dialogs
    - [ ] Provide clear, localized error messages from Firebase error codes

14. [ ] Testing — unit and component tests (Vitest + Testing Library)
    - [ ] Unit test authService: signIn and signOut call Firebase methods; mock Firebase auth
    - [ ] Test AuthProvider/Zustand store: initial state, state after onAuthStateChanged, error propagation
    - [ ] Test SignupComponent/LoginButton/LogoutButton: behaviors, disabled state, errors, i18n strings
    - [ ] Router protection tests: unauthenticated users redirected to `/welcome`; authenticated users access `/pets`
    - [ ] Coverage for edge cases: popup blocked, cancel, network errors

15. [ ] Developer experience
    - [ ] Add `npm run dev:with-emulators` script to concurrently start emulators and Vite (optional)
    - [ ] Note emulator UI URL and how to add test users when needed

16. [ ] Security and configuration hardening
    - [ ] Verify only Google provider is enabled for now (console); document how to toggle other providers later
    - [ ] Ensure no privileged server-side actions depend on client auth only (document future rules for Firestore/Storage)
    - [ ] Plan for token verification if adding a backend (out of scope, note in docs)

17. [x] Internationalization
    - [x] Add/verify translations for authentication strings in `src/locales/<lang>/common.json` or `authentication.json`
    - [ ] Ensure tests render via shared i18n test utilities

18. [x] Telemetry/logging (optional)
    - [x] Minimal logging for auth success/failure (console or adapter), avoiding PII

19. [x] Documentation updates
    - [ ] Update `docs/requirements.md` checklist items for auth progress
    - [x] Add a brief “Authentication” section to README with setup and usage
    - [ ] If applicable, update `.junie/guidelines.md` per requirements

20. [ ] Final verification
    - [ ] Manual QA: login, logout, refresh handling, route protection, i18n
    - [ ] Run `npm run lint`, `npm run format`, and `npm run test:coverage` to ensure quality gates pass
