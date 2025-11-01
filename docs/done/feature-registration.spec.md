# Feature Specification: User Registration and Authentication

### 1. Feature Overview

This specification details the process for an unauthenticated user to register for a new account and sign in. The
implementation will leverage the existing Google Sign-In flow, which serves as both registration (for first-time users)
and authentication (for returning users). This approach aligns with the project's "start with the simplest
implementation" guideline and utilizes the established `authService` and `auth.store` abstractions.

The user's identity and credentials will be securely managed by Firebase Auth, with the application only handling the
user's session state.

### 2. User Flow

The end-to-end user registration and login journey is as follows:

1. **Accessing a Protected Route:** A new, unauthenticated user attempts to access a protected route like `/pets`.
2. **Redirection to Welcome Page:** The `PrivateRoute` component detects the lack of an authenticated session and
   redirects the user to the `/welcome` page, preserving the original intended location.
3. **Sign-In Prompt:** The `WelcomePage` component renders, displaying a "Continue with Google" button.
4. **Initiating Authentication:** The user clicks the `GoogleLoginButton`. This triggers the `signInWithGoogle` action
   in the `auth.store`.
5. **Firebase Auth Popup:** The `authService` is called, which invokes Firebase's `signInWithPopup` method, presenting
   the user with Google's standard authentication dialog.
6. **Account Creation/Authentication:**

- **New User:** The user selects their Google account. Firebase Auth automatically creates a new user profile in the
  project's backend.
- **Returning User:** Firebase Auth authenticates the existing user.

7. **State Update:** Upon successful authentication, the `onAuthStateChanged` listener (initialized by `AuthBootstrap`)
   fires. The `authService` maps the `FirebaseUser` to the application's `AppUser` type, and the `auth.store` is updated
   with the user's session data.
8. **Redirection to App:** The `WelcomePage`, now detecting an authenticated user in the `auth.store`, redirects the
   user back to their originally requested page (e.g., `/pets`).

### 3. Technical Implementation Details

This feature will be implemented by leveraging and reinforcing the existing architectural layers. No new dependencies
are required.

#### 3.1 UI Components

- **/src/features/authentication/WelcomePage.tsx**:
  This component serves as the primary entry point for unauthenticated users. It is responsible for:
  - Displaying a welcome message and a call to action to sign in.
  - Rendering the `GoogleLoginButton`.
  - Redirecting the user to the main application area (e.g., `/pets`) once the `user` object is populated in the
    `auth.store`.

- **/src/components/common/Auth/GoogleLoginButton.tsx**: A reusable button that:
  - Triggers the `signInWithGoogle` action from the `auth.store`.
  - Is disabled and shows a busy state while the authentication process is `initializing`.
  - Handles and displays localized text from the `common` i18n namespace.

- **/src/components/common/PrivateRoute.tsx**: This route guard is critical for the flow. It will:
  - Check the `authEnabled` feature flag.
  - Check the `initializing` and `user` state from the `auth.store`.
  - Render a `LoadingIndicator` while the initial auth state is being determined.
  - Redirect to `/welcome` if no user is authenticated, passing the original `location` in the route state for a
    seamless redirect upon login.

#### 3.2 State Management (Zustand)

- **/src/store/auth.store.ts**: This store remains the single source of truth for authentication state.
  - `user: AppUser | null`: Holds the currently authenticated user's data.
  - `initializing: boolean`: Tracks the initial `onAuthStateChanged` listener status.
  - `signInWithGoogle: () => Promise<void>`: The action that UI components will call. It delegates the call to the
    `authService`.
  - `initAuthListener: () => void`: This action sets up the subscription to Firebase's auth state changes, ensuring the
    store is always in sync.

#### 3.3 Service Layer (Abstraction)

- **/src/services/auth/authService.ts**: This module correctly abstracts all Firebase Auth interactions, as per the
  developer guidelines.
  - **`signInWithGoogle()`**: This function will orchestrate the sign-in process by:
    1. Calling `ensurePersistence()` to set `browserLocalPersistence`.
    2. Calling Firebase's `signInWithPopup()`.
    3. Returning the mapped `AppUser` object upon success or re-throwing the error on failure.
  - **`mapUser()`**: A utility to transform the `FirebaseUser` object into the application-specific `AppUser` type,
    preventing Firebase types from leaking into the app.
  - **`subscribeToAuth()`**: This function wraps `onAuthStateChanged` and provides a clean callback interface for the
    `auth.store` to use.

### 4. Security & Data Storage

- **Credential Storage:** All user credentials and sensitive tokens are managed exclusively by Firebase Auth. The
  client-side application never handles or stores passwords or refresh tokens directly.
- **Session Persistence:** The `authService` explicitly sets `browserLocalPersistence`. This ensures that a user's
  session is securely persisted across browser tabs and reloads, providing a smooth user experience.
- **Data Isolation:** While this specification focuses on authentication, the established repository pattern (
  `PetRepository`) ensures that future data access can be secured. Firestore Security Rules will be configured to grant
  users read/write access only to their own data, using the `uid` from their auth token for validation.

### 5. Testing Strategy

The existing testing patterns will be maintained:

- **Unit Tests (`authService.test.ts`, `auth.store.test.ts`):** Firebase Auth will be completely mocked to test the
  service layer and store logic in isolation.
- **Component Tests (`GoogleLoginButton.test.tsx`, `WelcomePage.test.tsx`):** The `auth.store` will be mocked to
  simulate different states (e.g., `initializing`, `user: null`, `user: AppUser`) and verify the UI renders correctly.
- **Integration Tests (`App.authGuard.test.tsx`):** High-level tests will render the `App` component and assert that
  routing behavior is correct based on mocked authentication states, confirming that `PrivateRoute` works as expected.
