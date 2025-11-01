TITLE: Use Firestore as the Backend Database

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The application requires a persistent, scalable, and real-time capable database to store user and application data, such
as pet profiles. The choice of database technology is a critical architectural decision that impacts data modeling,
query capabilities, and the overall backend infrastructure.

DECISION:
We will use Google Cloud Firestore as the primary backend database. All backend data will be stored in Firestore, and
the application will interact with it through a dedicated service and repository layer. Firebase Emulators will be used
for local development and testing.

CONSEQUENCES:

- **Positive**:
  - As a fully managed, serverless database, it eliminates the need for server provisioning and maintenance.
  - Real-time data synchronization capabilities are built-in, which can simplify the development of reactive features.
  - Scales automatically to meet demand.
  - The security model is robust and integrates well with Firebase Authentication.
- **Negative**:
  - Query capabilities are more limited compared to SQL databases (e.g., no JOINs), which can require data
    denormalization and more complex data modeling.
  - Vendor lock-in with the Google Cloud ecosystem.
  - Cost can be unpredictable and is based on reads/writes/deletes, which requires careful monitoring.

ALTERNATIVES CONSIDERED:

- **Relational Database (e.g., PostgreSQL)**: Offers powerful querying and data integrity but requires server
  management (or a managed service like AWS RDS) and is not inherently real-time.
- **Other NoSQL Databases (e.g., MongoDB)**: Offers similar document-based storage but lacks the deep integration with
  the Firebase ecosystem (Auth, Emulators) that Firestore provides.

AUTHOR: Gemini

RELATED:

- `src/repositories/`
- `firebase.json`
