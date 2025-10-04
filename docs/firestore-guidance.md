# Firebase Document Store Best Practices for React Applications

Based on the Dog Log project stack (React 19, TypeScript, Vite, Zustand) and Firebase integration, here are the key best practices for using document stores effectively[7][6][43][3][24][25][11][23][38][41][40][27][4].

---

## Understanding Document Store Architecture

Document stores like Firestore differ from relational databases. Instead of tables and rows, you use **collections** containing **documents**—lightweight records with key-value pairs and support for complex nested data structures. Each document has a maximum size of 1 MB and can contain up to 20,000 fields[7][43].

---

## Data Modeling Patterns

### Collection Design

- **One Collection per Entity:**
  - `users`: user profiles and settings
  - `dogs`: individual dog profiles
  - `logs`: activity logs and entries
  - `events`: scheduled events or reminders  
    [6]

- **Document IDs:**  
  Use meaningful identifiers or allow Firestore to auto-generate. Avoid sequential IDs like `dog1`, `dog2`, as these create hotspots and impact performance[9].

### Nested Data vs Subcollections

- **Nested Arrays:**  
  Use when data has reasonable limits. For a dog log, storing daily activities as an array within a log document works, since a single day won’t hit Firestore’s limits[23]:

