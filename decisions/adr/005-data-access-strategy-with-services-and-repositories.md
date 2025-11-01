TITLE: Data Access via Service and Repository Layers

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The application needs a clear and maintainable strategy for interacting with its data source (Firestore). Directly
accessing data from UI components leads to tight coupling and makes the code difficult to test and refactor.

DECISION:
We will implement a layered data access architecture. All direct interactions with Firestore will be encapsulated within
`Repository` modules located in `src/repositories/`. These repositories will return plain JavaScript objects. `Service`
modules in `src/services/` will consume these repositories to implement business logic. UI components, hooks, and stores
will only interact with the service layer, never directly with repositories or Firestore APIs.

CONSEQUENCES:

- **Positive**:
  - Strong separation of concerns between UI, business logic, and data access.
  - Decouples the application from the specific data source (Firestore), making future migrations easier.
  - Simplifies testing, as repositories and services can be easily mocked.
  - Centralizes data fetching and business logic, improving code reuse and maintainability.
- **Negative**:
  - Introduces additional layers of abstraction, which can increase boilerplate for simple CRUD operations.
  - Requires discipline from the team to avoid bypassing the service layer.

ALTERNATIVES CONSIDERED:

- **Direct data access from components/hooks**: This is simpler for small projects but leads to highly coupled,
  untestable, and unmaintainable code as the application grows.
- **Using only a service layer**: This is a viable option, but separating repositories provides a cleaner abstraction
  for raw data access versus business operations.

AUTHOR: Gemini

RELATED:

- `src/repositories/`
- `src/services/`
