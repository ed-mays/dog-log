# Plan to Capture User Data on Registration

This document outlines the plan to implement the user capture feature as described in
`capture-user-on-registration.feature.md`.

## IMPORTANT: As you complete tasks on this list, update the list to mark the task completed by adding :white_check_mark: to the task.

## :white_check_mark: 1. Create a `User` model

A `User` model will be created to represent the data stored in the `users` collection in Firestore.

- **File:** `src/models/User.ts`
- **Interface:** `User`
- **Properties:**
  - `id`: `string` (from Firebase Auth)
  - `email`: `string | null`
  - `displayName`: `string | null`
  - `photoURL`: `string | null`

## :white_check_mark: 2. Create a `UserRepository`

A new repository will be created to manage user data in Firestore, following the existing `petRepository` pattern.

- **File:** `src/repositories/userRepository.tsx`
- **Class:** `UserRepository`
- **Extends:** `BaseRepository<User>`
- **Methods:**
  - `get(id: string): Promise<User | undefined>`: Retrieves a user by their ID.
  - `create(user: User): Promise<void>`: Creates a new user document in the `users` collection.
- The repository will be a singleton.

## :white_check_mark: 3. Update Authentication Logic

The existing authentication logic will be modified to handle user creation on first login.

- **Location:** The file handling Google authentication success will be identified (likely containing calls to Firebase
  Auth).
- **Logic:**
  1. On successful authentication, the user's profile information will be retrieved from the authentication provider (
     Google).
  2. The `UserRepository.get()` method will be used to check if a user with the given ID already exists in the `users`
     collection.
  3. If the user does not exist, a new `User` object will be created and saved to Firestore using
     `UserRepository.create()`.

## :white_check_mark:4. Firestore `users` Collection

A new collection named `users` will be created in Firestore to store user data. This is a manual setup step to be
performed in the Firebase console.

## 5. Testing

- A new test file `src/repositories/userRepository.test.ts` will be created to unit test the `UserRepository`.
- Existing authentication tests (if any) will be updated to reflect the new user creation logic.
