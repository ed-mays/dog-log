# Implementation Plan: User Registration and Scoped Data

This plan outlines the tasks required to implement user registration and refactor data access to be user-specific, following the guidance in `feature-registration.spec.md` and `firestore-guidance.md`.


## IMPORTANT: After completing a task on this list, update this file to mark the task as done by replacing the leading brackets with `:white_check_mark:`

---

### Step 1: Refactor `PetRepository` for User-Scoped Data

This initial step aligns the data access layer with the new user-scoped Firestore structure (`users/{userId}/pets/{petId}`). All data operations will now require a user's ID, which is a foundational change for securing data.

-   :white_check_mark: **Task 1.1:** Update all methods in the `PetRepository` class (e.g., `getActivePets`, `createPet`) to accept a `userId` string as a new first argument.
-   :white_check_mark: **Task 1.2:** Modify the internal logic of the `PetRepository` methods to construct Firestore collection paths that include the provided `userId`, targeting `users/{userId}/pets`.
-   :white_check_mark: **Task 1.3:** Update the `createdBy` field in the `createPet` method to use the `userId` instead of a placeholder value.
-   :white_check_mark: **Task 1.4:** Revise the unit tests for `PetRepository` to pass a mock `userId` to the updated methods and assert that the correct user-specific collection paths are being accessed.

### Step 2: Update `pets.store` to be Auth-Aware

With the repository now requiring a `userId`, the `pets.store` must be updated to supply it. The store will now depend on the `auth.store` to get the current user's ID before performing any data operations.

-   :white_check_mark: **Task 2.1:** Modify the `fetchPets` and `addPet` actions within the `usePetsStore` Zustand store.
-   :white_check_mark: **Task 2.2:** Inside these actions, retrieve the current user's ID from the `useAuthStore`.
-   :white_check_mark: **Task 2.3:** Add logic to prevent data operations if no user is authenticated. For example, `fetchPets` should do nothing, and `addPet` should throw an error or fail silently.
-   :white_check_mark: **Task 2.4:** Update the tests for `pets.store` to mock an authenticated user state in `useAuthStore` to ensure the store's actions function correctly when a user is logged in.

### Step 3: Implement Conditional Rendering in `App.tsx` and Update `PrivateRoute`

This step implements the core user-facing authentication flow. `App.tsx` will now serve as the main entry point, conditionally rendering either the login UI for unauthenticated users or the main application routes for authenticated users.

-   [ ] **Task 3.1:** Modify `App.tsx` to retrieve the current `user` and `initializing` status from the `useAuthStore`.
-   [ ] **Task 3.2:** Implement conditional rendering logic within `App.tsx`:
    -   If `initializing` is true, display the `LoadingIndicator`.
    -   If a `user` is present, render the main application content, including the `AppRoutes` and the `LogoutButton`.
    -   If there is no `user` and `initializing` is false, render a "welcome" or "sign-in" UI that includes the `LoginButton`.
-   [ ] **Task 3.3:** Update the `PrivateRoute` component's logic. Instead of redirecting to `/welcome`, it should now render its `children` only if `authEnabled` is off. This simplifies its role, as `App.tsx` now handles the primary auth gate.
-   [ ] **Task 3.4:** Remove the `/welcome` route from `AppRoutes.tsx` as it is no longer needed.
-   [ ] **Task 3.5:** Update or create tests for `App.tsx` to verify that it correctly displays the loading state, the login UI for unauthenticated users, and the main app content for authenticated users.

### Step 4: Update Integration Tests

The final step is to update the end-to-end tests to reflect the new, complete authentication and data management flow. The "Add Pet" integration test will be updated to validate that a signed-in user can create a pet and that the data is correctly stored and retrieved for their session.

-   [ ] **Task 4.1:** Modify `AddPet.integration.test.tsx` to remove mocks for `PetRepository` and `pets.store`, allowing it to interact with the real implementations and the Firebase emulator.
-   [ ] **Task 4.2:** Ensure the test correctly simulates the full user flow: navigating to the add pet page, filling out the form, submitting it, and verifying that the new pet appears on the pet list for the authenticated user.
-   [ ] **Task 4.3:** Confirm that the test environment for Firebase is correctly configured to handle writes to the new user-scoped collection path (`users/{userId}/pets`).
-   [ ] **Task 4.4:** Update the test's cleanup logic to clear data from the user-specific subcollection in the Firestore emulator after each test run.
