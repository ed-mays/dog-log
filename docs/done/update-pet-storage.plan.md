# Plan: Update Pet Storage to Firestore Subcollection

This document outlines the plan to refactor the application's data layer to store pets as a subcollection of the `users`
collection in Firestore. This change will follow the existing architectural pattern of `Store -> Service -> Repository`.

### :white_check_mark: 1. `petRepository.ts` (Data Layer)

- **Goal:** Make the repository capable of targeting a user-specific subcollection.
- **Change:** Modify the `PetRepository` class. It should no longer be a singleton.
- **Action:** Update its constructor to accept a `userId: string`.
- **Action:** Inside the constructor, dynamically set the collection path to `users/${userId}/pets`.

### :white_check_mark: 2. `petService.ts` (Business Logic Layer)

- **Goal:** Orchestrate pet-related operations and business logic for a specific user.
- **Change:** Refactor the `petService` to act as the intermediary between the application and the `PetRepository`.
- **Action:** Update service methods like `getPets` and `addPet` to accept a `userId`.
- **Action:** Inside these methods, create a _new instance_ of the `PetRepository`, passing the `userId` to its
  constructor (e.g., `new PetRepository(userId)`). This ensures every database operation is correctly scoped to the
  user.

### 3. `pets.store.tsx` (State Management Layer)

- **Goal:** Manage the state of the current user's pets and interact with the `petService`.
- **Change:** Decouple the store from the `petRepository`.
- **Action:** Create a `loadPets` action. This action will:
  1. Get the current user's ID from the `auth.store`.
  2. Call the `petService.getPets(userId)` method.
  3. Update its internal state with the returned pets.
- **Action:** Update other actions (e.g., `addPet`, `updatePet`) to call the corresponding methods on the `petService`,
  always passing the required `userId`.
- **Action:** Create a `clearPets` action to reset the state.

### 4. `auth.store.tsx` (Orchestration Hook)

- **Goal:** Trigger the loading and clearing of pet data in response to authentication state changes.
- **Change:** Integrate the `pets.store`'s actions into the authentication lifecycle.
- **Action:** On successful login, after the user state is set, call the `pets.store.loadPets()` action.
- **Action:** On logout, call the `pets.store.clearPets()` action to ensure no stale data remains.
