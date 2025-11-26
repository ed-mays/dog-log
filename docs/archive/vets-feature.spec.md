### Scope Recap (your choices → implementation rules)

- Tenancy/scope: Vets are user-scoped (per authenticated user). We’ll add `ownerUserId` to vet records and scope all queries by the current user.
- Primary vet: Exactly one primary per pet. Linking a new primary auto-demotes the existing primary. If only one vet is linked for a pet, it’s automatically primary.
- Duplicates: Block creation when the unique key matches. Key = `name + phone` (phone required when using uniqueness). We’ll normalize/trim and case-fold for comparison; phone normalized to E.164 (or best-effort, falling back to trimmed digits).
- Address/phone validation: Free-form for MVP; we’ll only normalize phone.
- Permissions: Any authenticated user can create/edit vets in their own scope.
- Notes/attachments: Defer to later (not MVP).
- Emergency vet: Use link role `emergency`.
- Imports: Defer to later (not MVP).
- Surfacing in UI: Global “Vets” section in nav; Pet list cards show name + role for linked vets; Pet detail links to each vet’s full detail.
- Telemetry: Include anonymized events for key actions.

---

### Data Model (plain objects only)

```ts
// src/models/vets.ts
export type VetId = string;

export type Vet = {
  id: VetId; // doc id
  ownerUserId: string; // user-scoped; derived from auth
  name: string; // required
  phone: string; // required when using uniqueness (MVP: required)
  email?: string;
  website?: string;
  clinicName?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string; // state/province
    postalCode?: string;
    country?: string; // ISO code if available
  };
  specialties?: string[];
  notes?: string;
  createdAt: number; // ms epoch
  updatedAt: number;
  archived?: boolean; // soft delete

  // Normalized fields to support duplicate prevention and basic search
  _normName: string; // lowercased/trimmed
  _e164Phone: string; // best-effort E.164; fallback to digits-only
};

export type PetVetLinkId = string;

export type PetVetLink = {
  id: PetVetLinkId;
  petId: string;
  vetId: VetId;
  role: 'primary' | 'specialist' | 'emergency' | 'other';
  notes?: string;
  createdAt: number;
  updatedAt: number;
};
```

Rationale:

- `ownerUserId` ensures user scoping.
- `_normName` and `_e164Phone` power uniqueness checks and search without returning Firestore-specific types.

---

### Duplicate-Prevention Strategy (Firestore-friendly)

Firestore lacks unique indexes; we’ll use a lightweight “uniqueness lock” collection.

- Unique key: `ownerUserId + '|' + _normName + '|' + _e164Phone`.
- Repository performs a transaction:
  1. Compute key.
  2. Create a doc in `vetKeys/{key}` with `{ ownerUserId, vetId }`.
  3. If `vetKeys/{key}` exists, abort with a `DuplicateVetError`.
  4. On success, create the `vets` doc.
- On update that changes `name` or `phone`: transaction that deletes old key doc (if changed) and creates new key doc, with the same collision check.
- On archive: keep key (prevents “replace” duplicates) or delete? For MVP we’ll keep it to avoid churn. We can add “merge/restore” flows later.

---

### Repositories (per ADR-005)

```ts
// src/repositories/vets/VetRepository.ts
export interface VetRepository {
  listVets(params?: { query?: string; limit?: number }): Promise<Vet[]>; // scoped to current user
  getVetById(id: VetId): Promise<Vet | null>; // validates ownerUserId
  createVet(
    input: Omit<
      Vet,
      'id' | 'createdAt' | 'updatedAt' | '_normName' | '_e164Phone'
    >
  ): Promise<Vet>;
  updateVet(
    id: VetId,
    patch: Partial<Omit<Vet, '_normName' | '_e164Phone'>>
  ): Promise<Vet>;
  archiveVet(id: VetId): Promise<void>;
}

// src/repositories/vets/PetVetRepository.ts
export interface PetVetRepository {
  listLinksByPet(petId: string): Promise<PetVetLink[]>;
  listLinksByVet(vetId: VetId): Promise<PetVetLink[]>;
  upsertLink(
    input: Omit<PetVetLink, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<PetVetLink>;
  deleteLink(id: string): Promise<void>;
}
```

Implementation notes:

- `listVets`: filter by `ownerUserId`. For `query`, simple client-side filtering on `name`, `clinicName`, `specialties` is fine for MVP.
- Duplicate key transaction handled inside `createVet`/`updateVet` when relevant fields are present.

---

### Services (business logic)

```ts
// src/services/vets/VetService.ts
export type CreateVetInput = {
  name: string;
  phone: string; // required
  email?: string;
  website?: string;
  clinicName?: string;
  address?: Vet['address'];
  specialties?: string[];
  notes?: string;
};

export type UpdateVetInput = Partial<CreateVetInput> & { archived?: boolean };

export interface VetService {
  searchVets(term: string): Promise<Vet[]>; // used by selector
  getVet(id: VetId): Promise<Vet | null>;
  createVet(input: CreateVetInput): Promise<Vet>; // normalizes + duplicate check via repo
  updateVet(id: VetId, patch: UpdateVetInput): Promise<Vet>;
  archiveVet(id: VetId): Promise<void>;
}

// src/services/vets/PetVetService.ts
export interface PetVetService {
  getPetVets(petId: string): Promise<Array<{ link: PetVetLink; vet: Vet }>>;
  linkVetToPet(
    petId: string,
    vetId: VetId,
    role?: PetVetLink['role'],
    notes?: string
  ): Promise<PetVetLink>; // auto-primary if first link

  unlinkVetFromPet(linkId: string): Promise<void>;

  setPrimaryVet(petId: string, vetId: VetId): Promise<void>; // enforces one primary
}
```

Business rules implemented in `PetVetService`:

- On `linkVetToPet`:
  - If it’s the first link for `petId`, set role to `'primary'` regardless of input.
  - If `role === 'primary'`, demote any existing primary link for that pet (change to `'other'` or keep previous role? MVP: demote to `'other'`).
- On `setPrimaryVet`:
  - In a transaction, demote old primary and promote the specified link to primary. Idempotent if already primary.

Phone normalization in `VetService`:

- Try E.164 using a lightweight library if already present; otherwise, strip non-digits, keep leading `+` when present. Store both `phone` as entered and `_e164Phone` normalized.

---

### UI (feature-first under `src/features/veterinarians`)

- Pages
  - `VetListPage.tsx`: Searchable list of user’s vets; actions: Add, Edit. Show count of linked pets per vet if available (optional derived via `listLinksByVet`).
  - `AddVetPage.tsx` / `EditVetPage.tsx`: Uses `VetForm` with required `name` and `phone`; dedupe error feedback.
- Components
  - `VetForm.tsx`: MUI `TextField`s; validation for required `name` and `phone`; helper text for format; i18n
  - `VetCard.tsx`: summary view used in vet list and embedded in pet detail.
  - `VetSelector.tsx`: async MUI Autocomplete for linking; can “Create new vet…” via modal using `VetForm`.

- Pet integration
  - `PetList`/`PetCard`: Show chips like `Dr. Smith — Primary`, `Metro ER — Emergency` (source: links + vets). Keep it concise for card size; use accessible labels.
  - `PetDetail`: Show list of linked vets with role and a link to the vet’s edit/detail page.
  - `PetForm`: A “Linked veterinarians” section (behind flags) with `VetSelector` to add, list of current links, inline role dropdown, delete icon. Changing a role to `Primary` triggers `setPrimaryVet`.

- Navigation & routing
  - Add “Vets” to main nav (flag-gated).
  - Routes (flag-gated by `vetsEnabled`): `/vets`, `/vets/add`, `/vets/:id/edit`.
  - Pet linking UI gated by `vetsEnabled && vetLinkingEnabled`.

- Accessibility & i18n: No hardcoded strings; use the `veterinarians` namespace with keys below.

---

### Feature Flags

- `VITE_VETS_ENABLED` → `useFeatureFlag('vetsEnabled')`
- `VITE_VET_LINKING_ENABLED` → `useFeatureFlag('vetLinkingEnabled')`

Gating rules remain as proposed: vet pages and nav need `vetsEnabled`; pet UI needs both flags.

---

### i18n Keys (initial)

```json
{
  "title": "Veterinarians",
  "list.empty": "No veterinarians yet",
  "actions.add": "Add veterinarian",
  "actions.save": "Save",
  "actions.cancel": "Cancel",
  "form.name.label": "Name",
  "form.phone.label": "Phone",
  "form.email.label": "Email",
  "form.website.label": "Website",
  "form.clinicName.label": "Clinic name",
  "form.address.line1": "Address line 1",
  "form.address.line2": "Address line 2",
  "form.address.city": "City",
  "form.address.region": "State/Province",
  "form.address.postalCode": "Postal code",
  "form.address.country": "Country",
  "form.specialties.label": "Specialties",
  "form.notes.label": "Notes",
  "validation.name.required": "Name is required",
  "validation.phone.required": "Phone is required",
  "error.duplicate": "A veterinarian with this name and phone already exists",
  "link.add": "Link a veterinarian",
  "link.role.primary": "Primary",
  "link.role.specialist": "Specialist",
  "link.role.emergency": "Emergency",
  "link.role.other": "Other"
}
```

---

### Telemetry (anonymized)

We’ll use a minimal analytics abstraction (if one exists; otherwise stub via a service). Events (no PII):

- `vet_created` { hasClinicName: boolean }
- `vet_updated` { changedPhone: boolean }
- `vet_archived` {}
- `vet_link_created` { role: string }
- `vet_link_deleted` {}
- `vet_primary_set` {}
- `vet_search` { termLength: number }

All events include common metadata (user id hashed or omitted; timestamp; app version if available). Ensure this is optional/no-op in tests.

---

### Testing Plan (Vitest + Testing Library; ADR-024/028 compliant)

- Flags and routes
  - `/vets` with `vetsEnabled=false` → redirect/unavailable message.
  - `/vets` with `vetsEnabled=true` → list renders. Include a 404 route test for bogus path.
- Vet CRUD
  - `VetForm` requires `name` and `phone`; shows duplicate error when repo throws `DuplicateVetError`.
  - `createVet` normalizes phone; verify service calls repository with `_e164Phone` populated (mock repo).
- Duplicate prevention
  - Repository transaction mock: when `vetKeys` doc exists, throw; UI surfaces i18n error string.
- Linking
  - With flags off, no linking UI in `PetForm`/`PetCard`.
  - With both flags on: add vet via `VetSelector`, assert new chip shows; remove link; set role to primary and verify demotion of prior primary.
  - Auto-primary when first link added.
- Pet list and detail surfaces
  - `PetCard` displays linked vet chips with role labels (only name + role). Accessible via `getByRole('listitem')` or `getByText` with `name`.
  - `PetDetail` includes links to vet edit pages.
- i18n
  - All user-facing strings come from `veterinarians` namespace.

Mocking patterns per your guide: services mocked; render via `@test-utils` with MemoryRouter and `FeatureFlagsProvider` overrides.

---

### PR Breakdown (small, focused)

1. Foundation: flags, routes, models, stubs

- Add flags `vetsEnabled`, `vetLinkingEnabled` and gate nav + routes.
- Add models `Vet`, `PetVetLink`.
- Create empty pages `VetListPage`, `AddVetPage`, `EditVetPage` and show a title.
- Add i18n namespace scaffold for `veterinarians`.
- Tests: routing + flags (on/off), 404.

2. Repositories + services with duplicate prevention

- Implement `VetRepository` with uniqueness lock on `vetKeys/{key}` via transaction.
- Implement `PetVetRepository`.
- Implement `VetService` (normalization) and `PetVetService` (primary rules).
- Unit tests for services and repos (mock Firestore adapter where applicable).

3. Vet CRUD UI

- `VetForm`, `VetListPage`, `AddVetPage`, `EditVetPage` with validation.
- Show duplicate error surfaced from service.
- Tests: form validation, create/update happy paths.

4. Pet linking UI

- `VetSelector` with async search, inline “Create new vet…” modal.
- Integrate in `PetForm`; show chips on `PetCard`; links on `PetDetail`.
- Enforce primary rules on role change.
- Tests: linking flows, primary demotion, pet list card content assertions.

5. Telemetry

- Add analytics service calls in create/update/archive/link/setPrimary/search.
- Tests: verify calls (mock analytics) without leaking PII.

Each PR runs `npm run build`, lint/format, and adds/updates tests.

---

### Trade-offs and future-ready notes

- Uniqueness lock documents can leave tombstones if we ever allow un-archiving as “duplicate replacements”. We kept keys on archive to maintain invariant. If later we want merges, we’ll add a merge flow and reconcile keys.
- Phone normalization is best-effort without adding a heavy dependency now; we can swap in a proper library later.
- Counting linked pets per vet may require either client aggregation or a lightweight Cloud Function if the list grows; MVP can fetch per vet lazily on card expand or omit the count.

---

### What I need from you to proceed

- Confirm demotion role target: when a vet loses primary, set to `'other'` (as proposed) or keep its previous non-primary role (e.g., `'specialist'` → stays `'specialist'`)? I recommend preserving previous role if available, only switching from primary to whatever it was before; otherwise `'other'`.
- Confirm UI copy tone for duplicate error and any additional fields in `VetCard` you’d like surfaced on Pet cards (e.g., clinic name).

If this looks good, I’ll convert this into a task checklist for the initial PR and draft the ADR notelets referencing ADR-005/017/024/028 for the new feature scope and duplicate key strategy.
