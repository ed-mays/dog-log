# Dog Log Feature Set
Dog Log is a pet management application that enables users to keep track of important data about their pets.

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
### Firebase Cloud Storage
### Firebase Authentication with Google
-[x] install firebase in app
-[x] install firebase emulators globally on dev machine
-[x] initialize emulators for project
-[x] add `start:firebase` script to package.json to start emulator
-[x] implement sign up component and flow
-[x] implement login component and flow
-[x] implement logout flow
-[x] protect routes with react router
-[x] display public welcome page to logged-out users
-[ ] update documentation in .junie/guidelines.md

### Other Social Logins
### Logging with Google Cloud Logging

•	Allow users to create, update, and delete individual “dog log” entries, each containing:
•	Timestamp
•	Optional notes
•	Metadata (custom properties/fields, e.g., activity type or health event).
•	List all log entries with sorting and filtering options by date, activity, or other metadata.
•	Edit or remove log entries inline or via modals/dialogs.
•	Show visual summaries or analytics (e.g., charts or counts of activity types per week).
