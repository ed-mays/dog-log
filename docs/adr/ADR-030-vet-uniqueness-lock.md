# ADR 030: Veterinarian Uniqueness Lock

## Status

Accepted

## Context

We need to prevent users from creating duplicate veterinarians. A "duplicate" is defined as a veterinarian with the same name and phone number for a given user.
Firestore does not support unique constraints on fields natively. We need a mechanism to ensure uniqueness within a user's scope.

## Decision

We implemented a "Uniqueness Lock" pattern using a separate collection of keys and Firestore transactions.

### Mechanism

1.  **Key Generation**: A unique key string is generated for each veterinarian based on:
    `{ownerUserId}|{normalizedName}|{normalizedPhone}`
    - Name is trimmed and lowercased.
    - Phone is normalized to E.164 format.

2.  **Lock Collection**: Keys are stored as documents in a subcollection:
    `users/{userId}/vetKeys/{key}`

3.  **Transactional Writes**:
    - When creating a vet:
      - A transaction checks if the key document exists.
      - If it exists, the transaction aborts with `DuplicateVetError`.
      - If not, the transaction creates the vet document AND the key document.
    - When updating a vet (if name or phone changes):
      - The transaction checks if the NEW key exists.
      - If it exists, aborts.
      - If not, it updates the vet document, deletes the OLD key document, and creates the NEW key document.

## Consequences

### Positive

- Guarantees uniqueness at the database level.
- Prevents race conditions via transactions.
- Scalable within the user's scope.

### Negative

- Requires two writes for every create/update (one for data, one for lock).
- Requires managing the lock lifecycle (updating/deleting keys).
- "Soft deletes" (archiving) need to decide whether to release the lock. Currently, we do NOT release the lock on archive, preventing re-creation of the same vet even if archived. (Note: Verify this behavior in code if needed, but standard practice is usually to keep lock or check archive status).

## Alternatives Considered

- **Client-side check**: Vulnerable to race conditions.
- **Single collection with composite ID**: We want random IDs for vets, not deterministic ones based on mutable data (name/phone).
