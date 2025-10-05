# Capture User Data on Registration

The application only supports login with Google. When a user logs in for the first time, I want to capture their userID and other details so that I can reference them in firestore.

## Technical Notes
- This feature introduces the `users` collection in Firestore
- This feature should be implemented following existing patterns, including a repository layer for managing users in firestore.

## Acceptance Criteria

**Scenario: User logs in for the first time**
Given a user logging in for the first time
When authentication succeeds
Then the user's ID is written to the `users` collection in firestore.

**Scenario: Existing user logs in**
Given a user that has already logged in once
When authentication succeeds
Then a duplicate user record is not created in the `users` collection.
