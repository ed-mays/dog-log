# Tasks: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01
> Brief: [`00-brief.md`](./00-brief.md) · Spec: [`01-spec.md`](./01-spec.md) · Design: [`02-design.md`](./02-design.md)

Each task cites at least one spec section and one design section. Each has a `Verify:` line. Tasks are ordered to keep `main` green and grouped into vertical slices: every slice ships an end-to-end smoke-testable improvement.

**Open DQs at time of authoring** (will need confirmation but do not block tasks structurally):

- **DQ-4** journal commit cadence — using recommended Enter-only commit; affects T-22.
- **DQ-5** chip catalog v1 content — using proposed v1 sets from design §D5; affects T-19.
- **DQ-8** theme color tokens vs wireframe palette — designer confirm needed; affects only Phase 6 visual QA, not any task structure.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked.

---

## Slice 0 — Foundation

Groundwork that has zero user-visible effect but unblocks all downstream slices.

### `[ ]` T-01 — TypeScript types

- **Cite:** spec §5 (data model); design §D3 (TypeScript types)
- **What:** Create `src/features/incidents/types.ts` with `Incident`, `IncidentTypeId`, `Severity`, `ChipId`, `JournalEntry`, `IncidentCreateInput`, `IncidentUpdateInput`. Include the BR-29 runtime-invariant comment from design §D3.
- **Verify:** `pnpm exec tsc -b` passes with the new file imported nowhere.

### `[ ]` T-02 — Feature flag

- **Cite:** spec §6 NFR-5 (flag-gated rollout follows project pattern); design §D2 (`incidentsEnabled` flag)
- **What:** Add `incidentsEnabled` flag to `src/featureFlags/` + Firebase Remote Config defaults (off in prod, on in dev/staging initially).
- **Verify:** `useFeatureFlag('incidentsEnabled')` returns false by default; flipping the dev flag flips the value. Pattern matches existing `vetsEnabled`.

### `[ ]` T-03 — Firestore indexes

- **Cite:** design §D3 indexes table
- **What:** Add composite indexes to `firestore.indexes.json`: `(petId asc, deletedAt asc, startedAt desc)` for history; `(endedAt asc, deletedAt asc)` for active-lookup.
- **Verify:** `firebase deploy --only firestore:indexes` succeeds against the dev project; indexes show as building/built in Firestore console.

### `[ ]` T-04 — Firestore rules

- **Cite:** spec NFR-8; design §D7
- **What:** Add `match /incidents/{incidentId} { allow read, write: if isOwner(userId); }` inside the `match /users/{userId}` block in `firestore.rules`. Match the project convention (one-line ownership rule).
- **Verify:** Rules-tests cover (a) owner can read/write own incident, (b) other user cannot read/write someone else's. Existing rules-test setup is the pattern.

### `[ ]` T-05 — i18n key scaffolding

- **Cite:** spec NFR-5; design §D6
- **What:** Add `incidents` namespace shell to `src/locales/en/common.json` and `src/locales/es/common.json` with all keys from design §D6 except chip-specific ones. Spanish translations can be one-line LATER stubs marked `// TODO i18n-es` per project pattern.
- **Verify:** `useTranslation('common')` resolves all the new keys with no missing-key console warnings.

---

## Slice 1 — Minimum viable activation (one-tap → timer → STOP → saved)

Goal after this slice: a single-pet user can tap a global FAB, see a running timer, tap STOP, and the entry persists to Firestore. No severity, no chips, no journal yet — just the spine.

### `[ ]` T-06 — IncidentRepository (basic CRUD)

- **Cite:** spec §5; design §D2 file map, §D3 layout
- **What:** Create `src/repositories/IncidentRepository.ts` extending `BaseRepository<Incident>` against path `users/${userId}/incidents`. Methods: `create(input)`, `get(id)`, `update(id, partial)`, `findActiveForUser()` (returns null if none). Follow `PetMedicationRepository` pattern.
- **Verify:** Unit tests against Firestore emulator: create → get round-trip; update changes only specified fields; `findActiveForUser` returns the one incident with `endedAt == null && deletedAt == null`.

### `[ ]` T-07 — incidentService (basic)

- **Cite:** spec BR-2 (timer at moment of gesture), BR-13 (STOP), BR-26 (singleton); design §D2
- **What:** Create `src/services/incidentService.ts` with `createIncident({ petId, startedAt })`, `stopIncident(id)`, `findActiveIncident()`. Composes `IncidentRepository`. Generates client-side UUID synchronously; persists in background.
- **Verify:** Unit tests with a mocked repository: `createIncident` returns a fully-formed Incident with synchronous startedAt; `stopIncident` sets endedAt; `findActiveIncident` returns at most one.

### `[ ]` T-08 — useIncidentStore (active-incident slice)

- **Cite:** spec BR-2, BR-26; design §D2 store
- **What:** Create `src/store/useIncidentStore.ts` with `activeIncident` state, `startIncident({ petId })` action (synchronous state update + async persist), `stopIncident()` action. Hydration action `hydrateActiveIncident()` for auth boot (T-29).
- **Verify:** Store tests: `startIncident` synchronously sets state; `stopIncident` clears active and sets endedAt on the prior active.

### `[ ]` T-09 — useIncidentTimer hook

- **Cite:** spec BR-3 (live elapsed); design §D8 timer cadence
- **What:** Create `src/features/incidents/hooks/useIncidentTimer.ts`. Reads `startedAt` from a passed-in incident; uses `requestAnimationFrame` to update a state hook every ~250ms; returns formatted elapsed (HH:MM:SS).
- **Verify:** Hook test: given `startedAt = Date.now() - 65_000`, returned elapsed is `00:01:05`. With fake timers advancing 250ms, the hook re-renders.

### `[ ]` T-10 — IncidentTimer component

- **Cite:** spec BR-3, NFR-6 (a11y polite live region); design §D9
- **What:** Create `src/features/incidents/components/IncidentTimer.tsx`. Renders the elapsed value with monospace styling (Caregiver theme tokens). Wraps the elapsed text (not milliseconds) in `aria-live="polite"`.
- **Verify:** Component test: renders elapsed text; has `aria-live="polite"`; uses theme typography.

### `[ ]` T-11 — StopButton component

- **Cite:** spec BR-12, BR-13; design §D2 file map
- **What:** Create `src/features/incidents/components/StopButton.tsx`. Calls `useIncidentStore.stopIncident` on tap. Has accessible name from i18n `incidents.stop`.
- **Verify:** Component test: tap fires the store action; `aria-label` matches the i18n value.

### `[ ]` T-12 — IncidentCaptureSurface (minimum)

- **Cite:** spec BR-14, BR-25 (same surface live and post-stop); design §D2
- **What:** Create `src/features/incidents/components/IncidentCaptureSurface.tsx`. Initial form: takes an Incident prop, renders `<IncidentTimer>` and `<StopButton>` only. (Severity, chips, journal, vet card added in slice 2.)
- **Verify:** Component test: renders timer and STOP given an active incident; renders timer (no STOP) given a stopped incident.

### `[ ]` T-13 — ActiveIncidentPage

- **Cite:** spec BR-1, BR-14; design §D2 routes
- **What:** Create `src/features/incidents/pages/ActiveIncidentPage.tsx`. Reads `activeIncident` from store; renders `<IncidentCaptureSurface>`. Redirects to `/pets` (or shows empty state) if no active incident.
- **Verify:** Component test: renders the surface when an active incident exists; redirects when none.

### `[ ]` T-14 — EmergencyActivationFab (single-pet only)

- **Cite:** spec BR-1, BR-27, BR-28 (rules 1+2 only — pet-scoped or single-pet); design §D2 FAB tap-behavior table (rows 2 + 3)
- **What:** Create `src/components/common/EmergencyActivationFab.tsx`. Hidden per the four hide-conditions from design §D2. Tap behavior: pre-fill petId from a pet-scoped surface (read from route params); for non-pet-scoped surface with exactly one pet, use that pet. **Multi-pet picker deferred to T-23.** **Resume short-circuit deferred to T-25.**
- **Verify:** Component test: tap with petId fires `startIncident` synchronously and navigates to `/incidents/active`. Hidden when unauthenticated, when on `/incidents/active`, when flag off.

### `[ ]` T-15 — Routes + App.tsx mount

- **Cite:** spec BR-27 (global FAB); design §D2 routes
- **What:** Add `/incidents/active` route to `AppRoutes.tsx` (flag-gated). Mount `<EmergencyActivationFab>` in `src/App.tsx` outside the route tree.
- **Verify:** Authenticated user sees FAB on every post-auth route except `/incidents/active`. Tapping FAB navigates to `/incidents/active`. `pnpm run build` passes.

### `[ ]` T-16 — Slice 1 smoke

- **Cite:** AC-1, AC-6, AC-18, AC-20
- **What:** Manual smoke under `pnpm run dev:with-emulators`: sign in → tap FAB on a pet detail page → timer runs → tap STOP → entry persists in Firestore emulator. Verify with the emulator UI.
- **Verify:** All four ACs pass in manual run; emulator shows the document at `users/{u}/incidents/{id}` with correct fields.

---

## Slice 2 — Mid-event editing (severity, chips, journal, vet call)

### `[ ]` T-17 — incidentService extensions (mutations)

- **Cite:** spec BR-6 (severity), BR-7 (chips), BR-8 (journal), BR-9 (timestamp prefix), BR-19 (type change), BR-22 (type doesn't modify others); design §D3 RMW append semantics
- **What:** Add to `incidentService`: `setSeverity`, `clearSeverity`, `toggleChip`, `appendJournal` (computes elapsedSeconds against incident.startedAt at call time per BR-31), `setType`, `clearType`. All use repository methods that wrap RMW per design §D3.
- **Verify:** Unit tests for each method; tests cover the BR-22 invariant (changing type leaves severity, chips, journal untouched) and BR-31 (elapsedSeconds stored at write time, not recomputed).

### `[ ]` T-18 — IncidentRepository RMW extensions

- **Cite:** spec BR-30 (append-only); design §D3 RMW pattern
- **What:** Add `appendJournal(id, entry)`, `toggleChip(id, chipId)` to repository. Implement read-modify-write per design §D3 pseudocode. Do NOT use `arrayUnion` / `arrayRemove`.
- **Verify:** Unit test: append on a journal of length 3 produces length 4 with new entry last. Toggle on a chip set adds if absent, removes if present, preserves rest.

### `[ ]` T-19 — chipCatalog.ts content [DQ-5]

- **Cite:** spec OQ-3; design §D5 proposed v1 sets
- **What:** Create `src/features/incidents/chipCatalog.ts` with the proposed v1 sets from design §D5 (seizure / injury / vomiting / choking / allergic_reaction / collapse / ingestion / other). Each chip has `{ id, i18nKey }`.
- **Verify:** Type-check passes; importing the catalog returns the expected 8 type entries with their chip arrays.
- **Notes:** [DQ-5] If the v1 sets are revised, only this file changes.

### `[ ]` T-20 — Add chip i18n keys

- **Cite:** spec NFR-5; design §D6
- **What:** Add `incidents.chips.*` keys to `src/locales/en/common.json` (one per ChipId from T-19); Spanish `// TODO i18n-es` stubs.
- **Verify:** `useTranslation` resolves every chip key.

### `[ ]` T-21 — SeverityChips component

- **Cite:** spec BR-6, NFR-3 (one-thumb), NFR-6 (a11y `aria-pressed`); design §D9
- **What:** Create `src/features/incidents/components/SeverityChips.tsx`. 3-up MUI grid (mild / moderate / severe). Toggle behavior: tap selected = clear; tap other = replace. Calls `incidentService.setSeverity` / `clearSeverity` via store.
- **Verify:** Component test: AC-2 Given/When/Then.

### `[ ]` T-22 — IncidentJournal component [DQ-4]

- **Cite:** spec BR-8, BR-9, BR-30 (append-only); design §D5 DQ-4 resolution (Enter-only commit; uncommitted text is component-local)
- **What:** Create `src/features/incidents/components/IncidentJournal.tsx`. Textarea that auto-focuses on mount per memory file. On Enter, calls `incidentService.appendJournal` with the current line as text; clears the input. In-progress text is component state. Auto-prefixes display of past entries with their stored elapsed time.
- **Verify:** Component test: AC-4 Given/When/Then. Plus: backspace doesn't lose committed lines; multi-line paste creates one entry not many (decision: paste up to first newline becomes one entry, rest stays in input).
- **Notes:** [DQ-4] If we add 5s-idle commit later, this component changes.

### `[ ]` T-23 — ObservationChips component

- **Cite:** spec BR-7, BR-19 (catalog updates on type change), BR-20 (carry-over storage), BR-32 (carry-over chips visible); design §D5 chip catalog
- **What:** Create `src/features/incidents/components/ObservationChips.tsx`. Reads `chipCatalog[incident.type]` to render the curated set. Renders any toggled-on chips NOT in the current catalog as a separate "carried over" group above or below curated chips, also toggleable.
- **Verify:** Component tests: AC-3 (toggle without type), AC-21 (carry-over chips after type change).

### `[ ]` T-24 — VetCallCard component

- **Cite:** spec BR-10 (Primary Vet), BR-11 (hide when none); design §D2 file map
- **What:** Create `src/features/incidents/components/VetCallCard.tsx`. Reads the Primary Vet for the incident's pet via `useGetPrimaryVetForPet(petId)` (small new hook). Renders an `<a href={`tel:${phone}`}>` (real anchor, not button — accessible by default and triggers OS dialer reliably). Hidden when no Primary Vet.
- **Verify:** Component test: AC-5 Given/When/Then. Plus: when pet has no vets, component renders nothing.

### `[ ]` T-25 — IncidentCaptureSurface (full)

- **Cite:** spec BR-14 (single surface); design §D2 IncidentCaptureSurface
- **What:** Extend the surface (T-12) to compose `<SeverityChips>`, `<ObservationChips>`, `<VetCallCard>`, `<IncidentJournal>` plus the existing Timer + STOP. Same component renders in both active and stopped states (post-STOP, STOP becomes a frozen-duration label and "Save entry" / "Keep observing" CTAs appear per wireframe).
- **Verify:** Component test: full-surface render in both active and stopped states; STOP click freezes timer and surface stays mounted (BR-14).

### `[ ]` T-26 — Slice 2 smoke

- **Cite:** AC-2, AC-3, AC-4, AC-5, AC-7, AC-21
- **What:** Manual smoke: full active-incident workflow. Tap severity chips, observation chips, type a journal line and hit Enter, change type and verify carry-over chips, tap vet to dial.
- **Verify:** All listed ACs pass in manual run.

---

## Slice 3 — Multi-pet, history, resume

### `[ ]` T-27 — ActivationPetPicker component

- **Cite:** spec BR-28 (multi-pet rule), BR-1 (≤2 taps), NFR-3 (one-thumb); design §D5 DQ-7 (bottom Drawer)
- **What:** Create `src/features/incidents/components/ActivationPetPicker.tsx`. MUI bottom `<Drawer>`. Lists user's pets with thumbnail + name. Tapping a pet IS the activation (calls `startIncident({ petId })` and navigates).
- **Verify:** Component test: shows all user's pets; tapping a pet creates incident with that petId.

### `[ ]` T-28 — EmergencyActivationFab (multi-pet + resume)

- **Cite:** spec BR-1, BR-26 (resume short-circuit), BR-28 (all three rules); design §D2 FAB tap-behavior table
- **What:** Extend FAB (T-14): if active incident exists in store, navigate to `/incidents/active` (resume — top row of table); if multi-pet user on non-pet-scoped surface, open `<ActivationPetPicker>`; otherwise existing slice-1 behavior.
- **Verify:** Component test: AC-11 (resume), AC-19 (multi-pet picker), AC-20 (single-tap fast path). All three FAB rows tested.

### `[ ]` T-29 — Auth-boot active-incident hydration

- **Cite:** spec BR-26; design §D5 DQ-2 resolution
- **What:** On `useAuthStore` "signed-in" transition, call `useIncidentStore.hydrateActiveIncident()` which queries `incidentService.findActiveIncident()` and sets store state if non-null. Do **not** auto-navigate.
- **Verify:** Test: simulate page reload while a Firestore emulator has an active incident → store hydrates with it. No navigation occurs.

### `[ ]` T-30 — ResumeIncidentBanner component + global mount

- **Cite:** spec BR-26; design §D5 DQ-2 (banner approach)
- **What:** Create `src/features/incidents/components/ResumeIncidentBanner.tsx`. Visible whenever `useIncidentStore.activeIncident != null` AND the current route ≠ `/incidents/active`. Tap → navigate to `/incidents/active`. Dismissible per session, NOT per active-incident. Mount in `src/App.tsx` adjacent to the FAB.
- **Verify:** Component test: appears given an active incident on a non-active route; vanishes on `/incidents/active`; dismiss persists for the session.

### `[ ]` T-31 — IncidentHistoryList component

- **Cite:** spec BR-23, BR-24, BR-25; design §D2
- **What:** Create `src/features/incidents/components/IncidentHistoryList.tsx`. Takes `petId`. Queries `incidentService.listForPet(petId)` (add this method). Renders rows: start time, duration, type label or "untyped", severity or blank, journal one-line excerpt or blank. Tap → navigate to `/pets/:petId/incidents/:id`.
- **Verify:** Component test: AC-9 Given/When/Then. List excludes soft-deleted.

### `[ ]` T-32 — SavedIncidentPage + route

- **Cite:** spec BR-25 (same surface re-opened); design §D2 routes
- **What:** Create `src/features/incidents/pages/SavedIncidentPage.tsx`. Loads incident by id (route param), renders `<IncidentCaptureSurface>` in stopped mode. Add `/pets/:petId/incidents/:incidentId` route to `AppRoutes.tsx` (flag-gated).
- **Verify:** AC-8 (re-open and edit), AC-15 (pet reassignment) — both pass in component tests.

### `[ ]` T-33 — Wire history list into PetDetailsPage

- **Cite:** spec BR-23
- **What:** Add `<IncidentHistoryList petId={petId}>` section to `src/features/pets/pages/PetDetailsPage.tsx`. Title and section spacing per project conventions.
- **Verify:** Manual: navigating to a pet detail page shows history if any incidents exist.

### `[ ]` T-34 — incidentService.getRecentTypesForPet (BR-21)

- **Cite:** spec BR-21
- **What:** Add `getRecentTypesForPet(petId, limit=10)` to `incidentService`. Uses the existing per-pet history index. Returns ordered list of distinct type IDs by most-recent first. Used by the type picker in T-35.
- **Verify:** Unit test: given 3 incidents [seizure, injury, seizure] in time order, returns `[seizure, injury]`.

### `[ ]` T-35 — Type picker UI (within IncidentCaptureSurface)

- **Cite:** spec BR-21 (MRU sort); design §D1 v4 wireframe
- **What:** Add a Type picker affordance to `<IncidentCaptureSurface>`. Renders types sorted by `getRecentTypesForPet` first, then alphabetically. On select, calls `incidentService.setType`.
- **Verify:** Component test: AC-10 (type change preserves chips per BR-20 + BR-32).

### `[ ]` T-36 — Slice 3 smoke

- **Cite:** AC-8, AC-9, AC-10, AC-11, AC-15, AC-19, AC-20, AC-21
- **What:** Manual smoke: multi-pet activation, history list, re-open and edit, pet reassignment, resume after page reload.
- **Verify:** All listed ACs pass in manual run.

---

## Slice 4 — Lifecycle (delete, time-edit constraints, error states)

### `[ ]` T-37 — Soft-delete in repository + service

- **Cite:** spec BR-33; design §D4 (state machine extension)
- **What:** Add `softDelete(id)` to `IncidentRepository` (sets `deletedAt = now`). Add `softDeleteIncident(id)` to `incidentService` that also clears `useIncidentStore.activeIncident` if the deleted incident was active (BR-33 releases BR-26 singleton).
- **Verify:** Unit test: soft-delete from active state hides from history AND clears active. AC-22 (hidden from history; data retained; BR-26 freed).

### `[ ]` T-38 — DeleteIncidentAction component

- **Cite:** spec BR-33, NFR-7 (respectful tone)
- **What:** Create `src/features/incidents/components/DeleteIncidentAction.tsx`. Mounted on `<IncidentCaptureSurface>` (small, discoverable but not prominent). Confirms via MUI `<Dialog>` with respectful copy ("Remove this incident? It can't be undone."). Calls service softDelete on confirm.
- **Verify:** Component test: confirms before deleting; cancel does nothing; confirm calls service.

### `[ ]` T-39 — Time-edit constraints (AC-23)

- **Cite:** spec BR-16 amended (endedAt non-null only; startedAt ≤ endedAt); AC-23
- **What:** Add validation in `incidentService.updateIncident()` for the two BR-16 invariants. Surface as a typed error the UI can render inline (not a toast).
- **Verify:** Unit test: AC-23 — clearing endedAt rejected; setting startedAt > endedAt rejected.

### `[ ]` T-40 — Permanent-failure error state on activation

- **Cite:** spec NFR-2; design §D8 orphan-handling
- **What:** When `incidentService.create()` throws a non-transient error (Firestore rules misconfigured, quota, schema), surface a recoverable error state on `<IncidentCaptureSurface>` with a Retry affordance. Timer keeps running locally so observation isn't lost. STOP is responsible for retrying create + stop together if create has not succeeded.
- **Verify:** Test using a mocked service that throws permanent error: error state appears with retry; tapping retry re-attempts; STOP without successful create attempts both.

### `[ ]` T-41 — Slice 4 smoke

- **Cite:** AC-22, AC-23
- **What:** Manual smoke: delete an incident, attempt invalid time edits, simulate permanent failure (e.g. temporarily mis-rule firestore.rules) and verify retry behavior.
- **Verify:** All listed ACs pass; retry path produces correct UX.

---

## Slice 5 — Verification & close

### `[ ]` T-42 — Integration tests

- **Cite:** spec §9 ACs; design §D10 verification plan
- **What:** Add `*.integration.test.tsx` files covering the integration cases listed in design §D10: full activation→STOP under emulator (AC-1, AC-6), single-tap activation (AC-20), multi-pet picker activation (AC-19), resume-existing on second activation (AC-11), pet reassignment (AC-15), soft-delete-of-active (AC-22 extension), cross-user rules block (AC-13), connectivity-loss path (AC-12).
- **Verify:** `pnpm run test:integration` passes; each AC has a named test.

### `[ ]` T-43 — Coverage check

- **Cite:** CLAUDE.md testing conventions (80% target)
- **What:** Run `pnpm run test:coverage` for `src/features/incidents/**` and `src/repositories/IncidentRepository.ts`. Add tests for any uncovered branches.
- **Verify:** ≥80% line coverage for incidents feature; 100% for repository methods.

### `[ ]` T-44 — Walk every AC

- **Cite:** spec §9 (all 23 ACs minus AC-14 tombstoned)
- **What:** Walk every AC. For each, point to the test that asserts it. Gaps → file as a follow-up task, do not hand-wave.
- **Verify:** Spreadsheet/checklist with every AC mapped to a test name. Zero gaps.

### `[ ]` T-45 — Manual end-to-end smoke

- **Cite:** design §D10 manual smoke list
- **What:** Run `pnpm run dev:with-emulators`. Walk the full flow: tap SOS from various surfaces → verify multi-pet picker if applicable → live editing → STOP → re-open from history → reassign pet → soft-delete → verify hidden. Also: simulate connectivity loss; verify NFR-2 latency feels right.
- **Verify:** Notes capturing each scenario's behavior. Any surprises = follow-up task.

### `[ ]` T-46 — Spec status flip + brief outcome

- **Cite:** plan Phase 6 close
- **What:** Edit `01-spec.md` header: `Status: draft → shipped (commit <sha>)`. Append `## Outcome` section to `00-brief.md`: did the success signal hold? (Author note from running it on real-world incidents — or its absence — is fair.)
- **Verify:** Spec header updated; brief has an outcome paragraph; PR ready to merge.

### `[ ]` T-47 — Optional follow-up agent

- **Cite:** plan Phase 6 optional
- **What:** Schedule a 2-week post-ship review agent that checks app analytics (or Firestore directly) for: incident-creation rate, abandonment-after-STOP rate, soft-delete rate. Compare to brief's failure signal.
- **Verify:** Agent scheduled; trigger date 14 days post-merge.

---

## §T0 Tasks Changelog

- **2026-05-01** — Initial draft. 47 tasks across 5 slices + foundation. Tasks reference spec/design at the time of authoring; if spec/design amend, T- entries here may need re-citation.
