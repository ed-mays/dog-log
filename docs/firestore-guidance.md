# Firestore Data Structure and Evolution Strategy

## Overview

This document describes and rationalizes the Firestore model for the Dog Log app, ensuring scalability, security, and flexibility as the application grows[35][81][77][7].

---

## Desired Data Structure

- **Rooted by User:**  
  All user-specific data is scoped beneath each user document.

```
users/{userId}/pets/{petId}
```

- **Pets as Subcollection:**  
  Each user document has a `pets` subcollection containing individual pet documents.
- **Feedings/Recurrences as Array:**  
  Recurrent pet events, like feedings, are stored as arrays within their respective pet documents for simplicity and performance—while the data volume is manageable.

```
// users/{userId}/pets/{petId}
{
"name": "Snoopy",
"species": "dog",
"feedings": [
{
"time": "2025-10-01T07:00:00Z",
"type": "breakfast"
},
{
"time": "2025-10-01T18:00:00Z",
"type": "dinner"
}
]
}
```

---

## Rationale

- **User Scoping:**
  - Provides clear ownership and access separation.
  - Greatly simplifies security rules, since each user's data is naturally namespaced[35][7].
- **Start Simple:**
  - Embedding recurrent data as arrays inside pet documents is efficient for low-to-moderate volumes and minimizes read/write cost and code complexity[81].
- **Easy Migration Path:**
  - Should arrays like `feedings` grow too large for a single document (thousands of events, or approaching 1 MB), they can be moved to a subcollection model:
  ```
    users/{userId}/pets/{petId}/feedings/{feedingId}
  ```

  - This is a recommended technique for evolving Firestore data models as your app scales[81][35][77].

---

## Migration Strategy

1. **Monitor Size:**
   - Periodically evaluate typical and max array sizes per pet.
   - Ensure continued compliance with Firestore’s 1 MB document limit and performance best practices.
2. **Planned Refactor:**
   - When necessary, write a migration script to move existing array entries into a `feedings` subcollection.
   - Update queries/UI to use the new structure. Abstract collection access in code to smooth over this swap[77].
3. **Future-Proofing:**
   - Favor code interfaces (custom hooks/selectors) that allow for implementation swapping with minimal UI code change.

---

## Example: Potential Future Model

```
// users/{userId}/pets/{petId}/feedings/{feedingId}
{
"time": "2025-10-01T07:00:00Z",
"type": "breakfast"
}
```

---

## References

- [Firestore Data Modeling Best Practices][35]
- [Subcollection vs Array Structure][81]
- [Firestore Migration Patterns][77]
- [Firebase Data Model Guide][7]

```

Sources
```
