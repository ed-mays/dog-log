### Slice 0 — Flags, navigation, and empty pages (foundation)

- Scope
  - Introduce `vetsEnabled` and `vetLinkingEnabled` feature flags.
  - Add gated routes and a nav item for Vets.
  - Scaffold empty pages: `VetListPage`, `AddVetPage`, `EditVetPage` displaying basic titles via i18n.
- User-Facing Result
  - When `vetsEnabled=true`, users see a “Vets” nav and can open `/vets`, `/vets/add`, and `/vets/:id/edit` (empty states).
- Data/Logic
  - None yet (no repositories/services implemented).
- UI
  - MUI pages with headings only; neutral copy.
- Flags/Routing
  - Routes and nav gated by `vetsEnabled`.
  - No pet linking UI yet.
- i18n
  - Namespace `veterinarians` created with `title`, `actions.add`, and placeholder texts.
- Telemetry
  - None (optional to add route-view events later).
- Tests (ADR-024/028)
  - Routing: `/vets` renders when `vetsEnabled=true`, blocked/redirected when `false`.
  - Include a 404 test for unknown route.
  - Verify nav item visibility toggles with flag.

---

### Slice 1 — Vet models, repositories, and services (no UI wiring yet)

- Scope
  - Define types `Vet`, `PetVetLink` with `ownerUserId`, `_normName`, `_e164Phone` (plain objects only).
  - Implement `VetRepository` with duplicate-prevention using a uniqueness-lock doc (`vetKeys/{owner|name|phone}`) in a transaction.
  - Implement `PetVetRepository` for join links.
  - Implement `VetService` (phone/name normalization, create/update/archive) and `PetVetService` with primary rules.
- User-Facing Result
  - None yet in UI; foundation enables mocking in subsequent slices.
- Data/Logic
  - Duplicate key: `ownerUserId + '|' + _normName + '|' + _e164Phone`.
  - Preserve previous role on primary demotion: when setting a new primary, demote the old primary back to its prior non-primary role if it had one; otherwise set to `'other'`.
  - Auto-primary: first link for a pet becomes `'primary'`.
- UI
  - None in this slice.
- Flags/Routing
  - No change.
- i18n
  - Add error key `error.duplicate` and validation keys for name/phone.
- Telemetry (anonymized)
  - Service-level no-op analytics API calls (mockable): `vet_created`, `vet_updated`, `vet_archived`, `vet_link_created`, `vet_link_deleted`, `vet_primary_set`.
- Tests
  - Unit tests for `VetService` and `PetVetService`: normalization, duplicate prevention reactions, auto-primary, and primary swap with demotion preserving previous role.
  - Repository tests (or adapter-mocked) verifying unique-lock behavior on create/update.

---

### Slice 2 — Vet CRUD UI (list + add/edit) with duplicate handling

- Scope
  - Build `VetForm` with MUI fields: name (required), phone (required), plus optional fields (email, website, clinic, address, specialties, notes).
  - Implement `VetListPage` with basic search (client-side) and empty state.
  - Implement `AddVetPage`/`EditVetPage` wiring to `VetService`.
  - Surface duplicate error with neutral copy using `t('veterinarians:error.duplicate')`.
- User-Facing Result
  - Users can create and edit vets (scoped to their account). Duplicate creation is blocked with clear error.
- Data/Logic
  - Use `VetService` methods; keep objects plain.
- UI
  - Accessible labels/order; neutral copy; form validation for required fields.
- Flags/Routing
  - Pages visible only when `vetsEnabled=true`.
- i18n
  - Flesh out `veterinarians` keys for fields and validation.
- Telemetry
  - Fire `vet_created` and `vet_updated` on submit success.
- Tests
  - Form validation: missing name/phone blocks submit and shows errors.
  - Duplicate: mock `VetService.createVet` to throw a Duplicate error → UI shows i18n error.
  - List shows created vet after navigation/refresh.

---

### Slice 3 — VetSelector and pet UI linking (basic add/remove)

- Scope
  - Create `VetSelector` (MUI Autocomplete): async search via `VetService.searchVets(term)`; option to “Create new vet…” opening `VetForm` in a modal.
  - Integrate into `PetForm`: a “Linked veterinarians” section to add/remove links.
  - Show chips in `PetCard` and a list in Pet Detail with link to vet page.
- User-Facing Result
  - From a pet’s form, users can link existing vets or create new ones on the fly, and remove links.
  - Pet list cards display each linked vet’s name and role (neutral copy).
- Data/Logic
  - Use `PetVetService.linkVetToPet`/`unlinkVetFromPet`.
  - Auto-primary when first link is added.
- UI
  - `PetForm`: section only when `vetsEnabled && vetLinkingEnabled`.
  - `PetCard`: renders concise “Name — Role” chips; ensure accessible text.
  - Pet Detail: shows linked vets and navigable links to `/vets/:id/edit`.
- Flags/Routing
  - Linking UI gated by both flags.
- i18n
  - Keys: `link.add`, `link.role.*`.
- Telemetry
  - `vet_link_created`, `vet_link_deleted` events on operations.
- Tests
  - With flags off: no linking UI in `PetForm`/no chips in `PetCard`.
  - With flags on: add via selector, observe chip appears; remove, chip disappears.
  - Pet Detail has links to vet edit.

---

### Slice 4 — Role management with single-primary enforcement (UI controls)

- Scope
  - In `PetForm`, add a role dropdown per link (`primary`, `specialist`, `emergency`, `other`).
  - Changing a link to `primary` calls `PetVetService.setPrimaryVet` which promotes selected link, and demotes the previous primary while preserving its prior non-primary role if available, else `'other'`.
- User-Facing Result
  - Users can explicitly set a primary vet. Only one primary is maintained.
- Data/Logic
  - Encoded in `PetVetService.setPrimaryVet` transactional rule.
- UI
  - Update chips and form to reflect roles immediately upon change.
- Flags/Routing
  - Still gated by both flags for pet linking UI.
- i18n
  - Role labels already defined.
- Telemetry
  - `vet_primary_set` on primary changes.
- Tests
  - Start with two linked vets: switching primary updates roles accordingly.
  - Verify previous primary’s role reverts to its last non-primary role when available.

---

### Slice 5 — Search polish, performance, and counts (optional enhancement)

- Scope
  - Improve `VetListPage` search (e.g., search `name`, `clinicName`, and `specialties`). Client-side for MVP.
  - Optionally display count of linked pets per vet (lazy-load or on expand to avoid heavy queries).
- User-Facing Result
  - Easier vet discovery; optional visibility into usage.
- Data/Logic
  - Optional `PetVetRepository.listLinksByVet` to derive counts.
- UI
  - Add a subtle counter badge on `VetCard` if enabled.
- Flags/Routing
  - No change.
- i18n
  - Add `list.countLinkedPets` if showing counts.
- Telemetry
  - `vet_search` with `termLength` anonymized.
- Tests
  - Search filters correctly; if counts shown, verify count rendering with mocked links.

---

### Slice 6 — Hardening, telemetry verification, and docs

- Scope
  - Validate analytics calls are fired and are no-ops under tests.
  - Add edge-case handling in services (e.g., trimming whitespace, idempotent linking).
  - Update README or ADR notelets summarizing the uniqueness-lock approach and primary rule.
- User-Facing Result
  - Stable behavior with clean errors and no duplicate vets.
- Data/Logic
  - Minor refinements only.
- UI
  - Final copy pass to ensure neutrality and i18n coverage.
- Flags/Routing
  - Ready to keep flags on per environment; consider defaulting on in dev.
- i18n
  - Fill any missing keys; ensure no hardcoded strings.
- Telemetry
  - Confirm events emitted on key flows.
- Tests
  - Coverage for error branches (e.g., duplicate on update, link idempotency).

---

### Acceptance Criteria Summary (per slice)

- Slice 0: Flags gate nav and routes; 404 covered.
- Slice 1: Services/repositories enforce duplicate prevention and primary rules with tests.
- Slice 2: Users can add/edit vets; duplicates blocked with neutral error; UI i18n.
- Slice 3: Users can link vets to pets; chips show “Name — Role” on Pet cards; Pet Detail links to vet.
- Slice 4: Users can set a single primary; previous primary’s prior role is preserved when demoted.
- Slice 5: Search polish and optional linked-pet counts work without performance regressions.
- Slice 6: Telemetry verified, docs updated, and robustness checks added.

---

### Implementation Notes (tie-back to ADRs and conventions)

- ADR-005 (services/repositories): All Firestore logic in repositories; services return plain objects. No UI directly touches repositories.
- ADR-017 (MUI): Use MUI for `VetForm`, `VetListPage`, chips, and Autocomplete.
- ADR-024/028 (tests): Integration tests with `@test-utils`, MemoryRouter, feature flags on/off, and 404s.
- Feature-first structure: `src/features/veterinarians/{pages,components,hooks}` plus `src/services/vets/*` and `src/repositories/vets/*`.
- i18n: `veterinarians` namespace with neutral copy; no hardcoded text.
- Flags: `VITE_VETS_ENABLED`, `VITE_VET_LINKING_ENABLED` mapped to `useFeatureFlag('vetsEnabled'|'vetLinkingEnabled')`.
- Phone normalization: best-effort; store entered `phone` plus `_e164Phone`.
- Duplicate prevention: uniqueness-lock docs retained on archive for invariant stability.

---

### Suggested PR Breakdown

1. PR1 (Slice 0): Flags + routes + empty pages + routing tests.
2. PR2 (Slice 1): Models + repositories + services + unit tests (duplicate + primary rules).
3. PR3 (Slice 2): VetForm + List/Add/Edit wiring + CRUD tests.
4. PR4 (Slice 3): VetSelector + PetForm integration + PetCard chips + Pet Detail links + linking tests.
5. PR5 (Slice 4): Role dropdown + single-primary enforcement + tests.
6. PR6 (Slice 5): Search polish (+optional counts) + tests.
7. PR7 (Slice 6): Telemetry assertions + docs + robustness tests.

This plan delivers user-visible value in each step, keeps changes small and testable, and respects your decisions on role demotion and neutral copy on Pet list cards.
