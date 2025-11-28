# Medication Log Feature Implementation Plan

This plan outlines the steps to implement the medication log feature, enabling users to manage a medication catalog, configure medications for pets, and log doses.

## Goal Description

Implement a system to track pet medications. This includes:

1.  A shared **Medication Catalog** (definitions of drugs).
2.  **Per-Pet Configurations** (prescriptions/schedules for specific pets).
3.  **Dose Logging** (recording when a medication was given).

## User Review Required

> [!NOTE]
> No breaking changes are expected. The feature is additive.

## Proposed Changes

### Domain & Data Layer

#### [NEW] [types.ts](file:///Users/edmays/src/dog-log/src/features/medications/types.ts)

- Define `MedicationDefinition`, `PetMedication`, `DoseLog` interfaces.
- Define Enums: `MedicationForm`, `MedicationRoute`, `DoseUnit`, `ScheduleType`, `DoseStatus`.

#### [NEW] [MedicationRepository.ts](file:///Users/edmays/src/dog-log/src/repositories/MedicationRepository.ts)

- CRUD for `MedicationDefinition`.

#### [NEW] [PetMedicationRepository.ts](file:///Users/edmays/src/dog-log/src/repositories/PetMedicationRepository.ts)

- CRUD for `PetMedication`.

#### [NEW] [DoseLogRepository.ts](file:///Users/edmays/src/dog-log/src/repositories/DoseLogRepository.ts)

- CRUD for `DoseLog`.

### State Management (Zustand)

#### [NEW] [useMedicationStore.ts](file:///Users/edmays/src/dog-log/src/store/useMedicationStore.ts)

- Manage `MedicationDefinition` state.

#### [NEW] [usePetMedicationStore.ts](file:///Users/edmays/src/dog-log/src/store/usePetMedicationStore.ts)

- Manage `PetMedication` state.
- Selectors for active medications.

#### [NEW] [useDoseLogStore.ts](file:///Users/edmays/src/dog-log/src/store/useDoseLogStore.ts)

- Manage `DoseLog` state.

### UI Components

#### [NEW] [MedicationCatalogDialog.tsx](file:///Users/edmays/src/dog-log/src/features/medications/components/MedicationCatalogDialog.tsx)

- Dialog to search/select or create new `MedicationDefinition`.

#### [NEW] [PetMedicationForm.tsx](file:///Users/edmays/src/dog-log/src/features/medications/components/PetMedicationForm.tsx)

- Form to configure a medication for a pet (schedule, dose, etc.).

#### [NEW] [DoseLogForm.tsx](file:///Users/edmays/src/dog-log/src/features/medications/components/DoseLogForm.tsx)

- Form to log a dose.

#### [NEW] [PetMedicationsPage.tsx](file:///Users/edmays/src/dog-log/src/features/medications/pages/PetMedicationsPage.tsx)

- List of active/inactive medications for a pet.
- Entry point for adding new medications.

### Integration

#### [MODIFY] [App.tsx](file:///Users/edmays/src/dog-log/src/App.tsx)

- Add routes:
  - `/pets/:petId/medications`
  - `/pets/:petId/medications/new`
  - `/pets/:petId/medications/:petMedicationId/edit`
  - `/pets/:petId/medications/:petMedicationId/log`

#### [MODIFY] [PetDetailsPage.tsx](file:///Users/edmays/src/dog-log/src/features/pets/pages/PetDetailsPage.tsx)

- Add "Medications" tab or link to `PetMedicationsPage`.

## Verification Plan

### Automated Tests

- **Unit Tests**:
  - Repositories: Mock Firestore and verify CRUD operations.
  - Stores: Verify state updates and selectors.
  - Components: Test rendering, form validation, and user interactions using `user-event`.
- **Integration Tests**:
  - Test the full flow: Create Definition -> Assign to Pet -> Log Dose.

### Manual Verification

1.  Navigate to a Pet's details.
2.  Go to Medications.
3.  Add a new medication (creating a new definition in the process).
4.  Verify it appears in the list.
5.  Log a dose for today.
6.  Verify the dose is recorded.
