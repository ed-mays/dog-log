This iteration will define a shared medication catalog plus per-pet medication configs and a simple dose log UI, without reminders.

## Domain model

Master medication catalog (shared across pets):

- MedicationDefinition:
  - id: string
  - name: string
  - defaultForm: "pill" | "liquid" | "chew" | "injection" | "topical" | "other"
  - defaultRoute: "oral" | "topical" | "subcutaneous" | "intramuscular" | "other"
  - defaultStrengthDescription?: string
  - notes?: string
  - isArchived: boolean

Per-pet configuration:

- PetMedication:
  - id: string
  - petId: string
  - medicationDefinitionId: string
  - customLabel?: string (e.g. “Morning flea pill”)
  - form: same enum as definition (defaults from MedicationDefinition)
  - route: same enum (defaults from MedicationDefinition)
  - strengthDescription?: string
  - doseAmount: number (allow decimals for partial doses)
  - doseUnit: "tablet" | "mL" | "drop" | "capsule" | "scoop" | "spray" | "other"
  - scheduleType:
    - "onceDaily"
    - "twiceDaily"
    - "everyXHours"
    - "everyXDays"
    - "weekly"
    - "monthly"
    - "custom"
  - scheduleConfig:
    - timesOfDay?: string[] (HH:mm in local time)
    - intervalHours?: number
    - intervalDays?: number
    - weekdays?: number[] (0–6, for weekly)
    - startDate: ISO date (local)
    - endDate?: ISO date (for temporary meds)
    - notes?: string
  - active: boolean

Dose logging:

- DoseLog:
  - id: string
  - petId: string
  - petMedicationId: string
  - timestampGiven: ISO datetime (local, locale-aware in UI)
  - timestampScheduled?: ISO datetime
  - amountGiven: number
  - doseUnit: string
  - status: "given" | "skipped" | "missed" | "vomited" | "otherIssue"
  - givenBy?: string
  - notes?: string

Zustand store slices should keep catalog and pet-level configs separate, with selectors that derive a pet’s “active meds” and “today’s scheduled doses” for top-level views. [1][2]

## Schedule templates

Templates (for create/edit PetMedication):

- Once daily:
  - scheduleType: "onceDaily"
  - require one timeOfDay
- Twice daily:
  - scheduleType: "twiceDaily"
  - require two timesOfDay
- Every X hours:
  - scheduleType: "everyXHours"
  - require intervalHours and optional first timeOfDay
- Every X days:
  - scheduleType: "everyXDays"
  - require intervalDays and first date/time
- Weekly:
  - scheduleType: "weekly"
  - require weekdays[] and timeOfDay
- Monthly:
  - scheduleType: "monthly"
  - require day of month and timeOfDay (can live inside scheduleConfig as dayOfMonth)

All date/time inputs and displays must use the user’s locale via your existing i18n/time formatting approach. [1]

## React store and types

Suggested slices (using @store/\* alias): [1]

- medicationCatalogSlice:
  - state:
    - medicationDefinitions: Record<string, MedicationDefinition>
  - actions:
    - addMedicationDefinition(payload)
    - updateMedicationDefinition(id, patch)
    - archiveMedicationDefinition(id)
- petMedicationsSlice:
  - state:
    - petMedicationsByPetId: Record<string, PetMedication[]>
  - actions:
    - addPetMedication(petId, payload)
    - updatePetMedication(id, patch)
    - deactivatePetMedication(id)
- doseLogsSlice:
  - state:
    - doseLogsByPetId: Record<string, DoseLog[]>
  - actions:
    - addDoseLog(petId, payload)
    - updateDoseLog(id, patch) (for corrections)
  - selectors:
    - selectPetMedications(petId)
    - selectActivePetMedications(petId)
    - selectDoseLogsForPet(petId, range?)
    - selectDoseLogsForPetMedication(petMedicationId)

All domain types should live in a shared types module (e.g. src/store/medications/types.ts) to avoid circular imports. [1]

## UI flows and components

High-level routes (using react-router-dom): [2]

- /pets/:petId/medications
- /pets/:petId/medications/:petMedicationId
- /pets/:petId/medications/:petMedicationId/log-dose

Key components (via @components alias): [1]

- MedicationCatalogDialog:
  - List existing MedicationDefinitions with search.
  - “New medication” flow for adding to the catalog.
  - Used inside “Add medication for pet” when picking “Flea Pills” etc.
- PetMedicationsPage:
  - Fetch petMedicationsByPetId[petId].
  - Display:
    - Active meds list.
    - Button: “Add medication”.
    - Link: “Past medications” (inactive).
- PetMedicationForm:
  - Steps:
    - Pick from MedicationCatalogDialog or “Create new medication definition”.
    - Configure dose (doseAmount, doseUnit, strengthDescription).
    - Choose schedule template and fill scheduleConfig.
    - Set startDate, optional endDate.
  - Validations:
    - endDate >= startDate when present.
    - doseAmount > 0.
    - required template-specific fields present.
- DoseLogForm:
  - Props: petId, petMedicationId.
  - Fields:
    - datetime (defaults to now, editable).
    - amountGiven (default from PetMedication, allow decimals).
    - status (default “given”).
    - notes.
  - Submits to addDoseLog.

A localized summary string should be computed per PetMedication, e.g. “1 tablet, twice daily until Jan 10”, using translation keys and date-fns/Intl for formatting. [1]

## Medications vs doses table

| Concept              | Scope        | Purpose                          | Example                            |
| -------------------- | ------------ | -------------------------------- | ---------------------------------- |
| MedicationDefinition | App-wide     | Name and defaults for a drug     | “Flea Pills” definition            |
| PetMedication        | Per pet      | How that pet takes the drug      | “Flea Pills, 1 tablet daily”       |
| DoseLog              | Per pet dose | Record of what actually happened | “Flea pill given today at 8:05 AM” |

If you want, the next step can be drafting the exact TypeScript interfaces plus a first cut of the Zustand slices and a skeleton of the main components in your folder layout.
