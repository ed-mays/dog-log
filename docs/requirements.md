# Dog Log Feature Set

Dog Log is a pet management application that enables users to keep track of important data about their pets.

# Technical MVP

The goal of the technical MVP is to establish architectural patterns and best practices to support further development of the application.

## Architecture and Stack

- UI is implemented in React with typescript
- State is managed with Zustand, ideally via an abstraction layer
- Backend is managed in Firestore, via a repository abstraction
  - For local development, use the Firestore emulator
- Authentication is managed in Firebase Auth, ideally via an abstraction layer
  - For local development, use the Firebase emulator
- Testing is via vitest and jest-dom

## Authentication and Security

- The user must be able to sign in with Google
- The user can only view their own data

## Data Storage

- Data will be stored in Firebase

## Feature Flags

- The application will leverage feature flags to enable continuous delivery

## Testing

- Unit and integration tests exist and are up to date
- Ideally follow test-driven patterns

---

# Future: Do not consider for now.

## User-Facing Features

The user must be able to:

- Register for a dog log account using a social login of their choosing
- Delete their dog log account
- Log into the application with their credentials
- Log out of the application if signed in

### Sign Up/Register

### Login/Logout

### User Profile

### Pet Management

Pet Management is the heart of the application. Users will be able to:

- View a list of all pets
- View a list of archived pets
- View a selected pet's details
- Add a new pet
- Edit an existing pet
- Archive an existing pet
  - This is effectively a soft-delete of the pet

### Health Management

Pet owners need a way to track health-related details about their pets.

#### Vet Visit Log

- View a list of all vet visits for all pets
- View a list of vet visits for a selected pet
- Add a new vet visit for a selected pet
- View details of an existing vet visit for a selected pet

#### Vaccination Log

- View a list of all vaccinations for all pets
- View a list of all vaccinations for a selected pet
- Add a new vaccination for a selected pet
- Edit an existing vaccination for a selected pet
- View details of a specific vaccination for a selected pet

#### Medication Log

- View a list of all medications for all pets
- View a list of all vaccinations for a selected pet
- Add a new vaccination for a selected pet
- Edit an existing vaccination for a selected pet
- View details of a specific vaccination for a selected pet

#### Emergency Log

### Feeding Management

### Photo Gallery

### Reporting

#### Pet Dossier

#### Medical History

#### Vaccination History

#### Care Instructions

## Technical Features

### Firebase Data Layer

#### Firebase Data Layer Infrastructure

-[x] Firestore is initialized in a dedicated module (`src/firebase.tsx`), with no direct imports in features or components. -[x] Consolidate PetList types into `features/petManagement/types.tsx` -[ ] A generic base repository/service pattern is established in `src/services/`, ready to support feature-specific modules. -[ ] TypeScript interfaces for entities and repository outputs are defined in a shared domain/types location. -[ ] Custom React hooks are implemented to encapsulate data fetching and mutations, depending only on service modules, not on Firestore SDK. -[ ] All components and stores interact with Firestore data strictly through the approved service modules and hooks. -[ ] Sample unit or integration tests are provided, demonstrating testability of the data layer with mocked data. -[ ] Developer documentation explains the data access pattern, directory layout, and usage conventions for future features.

#### CRUD: Pet Management Feature

-[ ] `petService` (in `src/services/`) implements create, read, update, and archive logic for pets using Firestore. -[ ] Entity types and repository outputs are strictly typed and documented. -[ ] Custom hooks (`usePetList`, `useAddPet`, `useEditPet`, `useArchivePet`) are provided for pet-related data operations, using the service only. -[ ] Components for pet management display, editing, and archiving use only the hooks to interact with pet data. -[ ] CRUD operations work as specified: list all pets, view pet details, add, edit, and archive pets (soft delete). -[ ] Unit/integration tests validate proper CRUD operation and behavior of hooks/services with mocked pet data. -[ ] Example or pattern documentation is updated to show how upcoming features should use the established CRUD/data access approach.

### Firebase Authentication with Google

-[x] install firebase in app -[x] install firebase emulators globally on dev machine -[x] initialize emulators for project -[x] add `start:firebase` script to package.json to start emulator -[x] implement sign up component and flow -[x] implement login component and flow -[x] implement logout flow -[x] protect routes with react router -[x] display public welcome page to logged-out users -[ ] update documentation in .junie/guidelines.md

### Other Social Logins

### Logging with Google Cloud Logging

-[ ] Allow users to create, update, and delete individual “dog log” entries, each containing: -[ ] Timestamp -[ ] Optional notes -[ ] Metadata (custom properties/fields, e.g., activity type or health event). -[ ] List all log entries with sorting and filtering options by date, activity, or other metadata. -[ ] Edit or remove log entries inline or via modals/dialogs. -[ ] Show visual summaries or analytics (e.g., charts or counts of activity types per week).
