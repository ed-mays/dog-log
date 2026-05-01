# Design: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01
> Brief: [`00-brief.md`](./00-brief.md) · Spec: [`01-spec.md`](./01-spec.md)

Every design decision below cites the spec section it satisfies (e.g. `[BR-7]`, `[NFR-3]`). If a design item has no citation, it is gold-plating or a missing requirement — fix the spec before adding it here.

---

## §D1 UX — Wireframes Annotated

The active-incident wireframes live at `~/.gstack/projects/ed-mays-dog-log/designs/pet-details-20260430-220703/wireframe-v3-incident.html` (live + post-stop two-up) and `wireframe-v4-incident-types.html` (type picker / chip catalog).

### v3 left panel (live, timer running)

| Element on screen                                   | Spec citation                              |
| --------------------------------------------------- | ------------------------------------------ |
| Pet header chip ("Banjo · ⚡ incident in progress") | BR-28 (pet visible & editable), BR-29      |
| Monospace timer hero with pulse dot                 | BR-3, NFR-3                                |
| Severity row: mild / moderate / severe              | BR-6, NFR-3                                |
| "Call vet" card with vet name + number              | BR-10, BR-11                               |
| Observation chip grid (rigid, salivating, …)        | BR-7, BR-19, BR-20                         |
| Journal textarea with auto-timestamp prefix         | BR-8, BR-9                                 |
| Big STOP button                                     | BR-12, BR-13                               |
| No confirmation dialog before activation            | BR-5 (matches the "no countdown" non-goal) |

### v3 right panel (post-stop)

| Element                                                                                | Spec citation                                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same surface stays open after STOP                                                     | BR-14                                                                                                                                                                         |
| Frozen timer relabeled as "duration"                                                   | BR-13                                                                                                                                                                         |
| Severity / chips / journal still tappable                                              | BR-16, BR-17                                                                                                                                                                  |
| Append-only journal continues; "— seizure ended —" is a journal entry, not a separator | BR-30                                                                                                                                                                         |
| "Keep observing" / "Save entry" CTAs                                                   | BR-14 (note: per the wireframe author, these are user-facing labels for "stay on this surface" vs "go back to pet view." The entry is _already_ persisted at STOP per BR-13.) |

### v4 — Type picker / chip catalog

| Element                                                                                       | Spec citation |
| --------------------------------------------------------------------------------------------- | ------------- |
| Type list (seizure, injury, vomiting, choking, allergic reaction, collapse, ingestion, other) | §5 type enum  |
| MRU sort per pet                                                                              | BR-21         |
| Chip catalog updates on type change                                                           | BR-19         |
| Already-toggled chips persist across type change                                              | BR-20         |
| Type selection on saved incident does not modify other fields                                 | BR-22         |

### Color & motion

The wireframe specifies a dark amber/red-tinted palette (`#1A0E08` background, `#FFEDEA` timer text, `#FF6B5C` accent) and a 1.4s pulse on the timer indicator. This matches NFR-4 (dark mode primary). The Caregiver theme (recently added; commit b79b359) provides an existing palette token we should map to rather than introduce new color constants.

---

## §D2 Architecture

Following the medications precedent (`src/features/medications/*`, `src/repositories/PetMedicationRepository.ts`, `src/services/petMedicationService.ts`, `src/store/usePetMedicationStore.ts`).

### File map

```
src/features/incidents/
  pages/
    ActiveIncidentPage.tsx              # /incidents/active route
    ActiveIncidentPage.test.tsx
    SavedIncidentPage.tsx               # /pets/:petId/incidents/:id route
    SavedIncidentPage.test.tsx
  components/
    IncidentTimer.tsx                   # monospace hero, ticks every 200ms
    IncidentTimer.test.tsx
    SeverityChips.tsx                   # 3-up grid (BR-6)
    SeverityChips.test.tsx
    ObservationChips.tsx                # type-aware grid (BR-7, BR-19)
    ObservationChips.test.tsx
    IncidentJournal.tsx                 # append-only textarea (BR-8, BR-9, BR-30)
    IncidentJournal.test.tsx
    VetCallCard.tsx                     # tel: link (BR-10, BR-11)
    VetCallCard.test.tsx
    ActivationPetPicker.tsx             # picker shown when global FAB is tapped on a non-pet-scoped surface for multi-pet users (BR-28 third rule)
    ActivationPetPicker.test.tsx
    StopButton.tsx                      # (BR-12, BR-13)
    IncidentHistoryList.tsx             # per-pet list (BR-23, BR-24, BR-25)
    IncidentHistoryList.test.tsx
  hooks/
    useActiveIncident.ts                # selector + actions (start, stop, mutate)
    useIncidentTimer.ts                 # rAF-driven elapsed seconds
  types.ts                              # Incident, IncidentType, Severity, ChipId
  chipCatalog.ts                        # static type→chips map (resolves OQ-3)

src/repositories/
  IncidentRepository.ts                 # CRUD against Firestore (NFR-8, BR-15)

src/services/
  incidentService.ts                    # business logic, composes repository

src/store/
  useIncidentStore.ts                   # Zustand: activeIncident + per-pet history maps

src/components/common/
  EmergencyActivationFab.tsx            # global FAB, mounted in App.tsx (BR-27, AC-18)
  EmergencyActivationFab.test.tsx
```

### Routes

Add to `src/AppRoutes.tsx`:

- `/incidents/active` → `ActiveIncidentPage` (auth-guarded; redirects to `/pets` if no active incident)
- `/pets/:petId/incidents/:incidentId` → `SavedIncidentPage` (auth-guarded; pet-scoped per BR-23/25)

Both gated behind a new `incidentsEnabled` feature flag, matching the existing pattern (`enableVets`, `enablePetList`, etc. in `src/AppRoutes.tsx:31-39`).

### Global activation FAB (BR-27, AC-18)

`EmergencyActivationFab` mounts in `src/App.tsx` outside the route tree so it survives navigation. Hidden when:

- user is unauthenticated
- the active route is `/incidents/active` (would be a no-op)
- `incidentsEnabled` flag is off
- the user has zero pets (no valid `petId` to activate against)

Built with MUI `<Fab>`, positioned bottom-right with `position: fixed`. Tap target ≥56×56 (BR-27, NFR-3).

**Tap behavior** (per BR-28's three rules):

| Surface                       | Pet count | Behavior                                                                                                 |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Pet-scoped (e.g. `/pets/:id`) | any       | Activate immediately with that pet (1 tap, AC-20).                                                       |
| Non-pet-scoped                | exactly 1 | Activate immediately with the only pet (1 tap, AC-20).                                                   |
| Non-pet-scoped                | 2+        | Open `ActivationPetPicker` as an MUI Dialog/Drawer; the pet tap IS the activation (2 taps total, AC-19). |

---

## §D3 Data Model — Concrete

### TypeScript

```ts
// src/features/incidents/types.ts
export type IncidentTypeId =
  | 'seizure'
  | 'injury'
  | 'vomiting'
  | 'choking'
  | 'allergic_reaction'
  | 'collapse'
  | 'ingestion'
  | 'other';

export type Severity = 'mild' | 'moderate' | 'severe';

// Opaque chip tag (BR-20). Stored as string; chip catalog defines which keys
// belong to which type, but stored chips are not foreign keys.
export type ChipId = string;

export interface JournalEntry {
  elapsedSeconds: number; // BR-9, BR-31 — stored at write, never recomputed
  text: string;
  addedAt: string; // ISO 8601 instant
}

export interface Incident {
  id: string;
  userId: string; // owner — drives security rules (NFR-8)
  petId: string; // BR-28 — required at all times (revert of round-1 reframe)
  startedAt: string; // ISO 8601 instant — set at activation (BR-2)
  endedAt: string | null; // ISO 8601 instant — set at STOP (BR-13)
  type: IncidentTypeId | null; // BR-4, BR-19
  severity: Severity | null; // BR-6
  chips: ChipId[]; // BR-7, BR-20 — ordered, deduped at write
  journal: JournalEntry[]; // BR-30 — append-only after STOP
  createdAt: string; // server-assigned (Firestore serverTimestamp)
  updatedAt: string; // server-maintained on every write (BR-18)
  deletedAt: string | null; // BR-33 — soft-delete timestamp; null when not deleted
}

export type IncidentCreateInput = Pick<Incident, 'petId' | 'startedAt'>;
export type IncidentUpdateInput = Partial<
  Omit<Incident, 'id' | 'userId' | 'createdAt' | 'petId'>
> & { petId?: string }; // pet may be reassigned but never cleared (BR-29)
```

Decision: `chips` is `ChipId[]`, not `Set<ChipId>`. Firestore stores arrays; the deduplication happens at the service layer (cite BR-20: "stored as opaque tag strings").

### Firestore layout

Incidents live in a per-pet subcollection, matching the existing project convention used by feedings, medications, and doseLogs (see `firestore.rules`).

```
users/{userId}/pets/{petId}/incidents/{incidentId}
  startedAt: timestamp
  endedAt: timestamp | null
  type: string | null
  severity: string | null
  chips: string[]
  journal: array<{ elapsedSeconds: number, text: string, addedAt: timestamp }>
  createdAt: timestamp (serverTimestamp)
  updatedAt: timestamp (serverTimestamp)
  deletedAt: timestamp | null   # BR-33 soft-delete
```

`petId` is implicit in the path; the in-memory `Incident` type still carries it for convenience but it is not stored as a field.

**Active-incident lookup across pets** (needed by BR-26 and DQ-2 hydration). Because incidents are now subcollections under each pet, a single query has to span all of a user's pets. See **DQ-6** below for the open choice between (i) a Firestore collection-group query and (ii) a pointer doc at the user level.

**Indexes needed:**

| Index                                                                                 | Query it serves                                                    | Spec citation |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| Single-field `startedAt desc` (auto-created)                                          | Per-pet history list, most recent first                            | BR-23, BR-24  |
| Collection-group index on `incidents.endedAt` + `startedAt desc`                      | Active-incident lookup across all of a user's pets (DQ-6 option i) | BR-26         |
| Single-field `deletedAt asc` (for `where('deletedAt', '==', null)` filter on history) | Hide soft-deleted incidents from history                           | BR-23, BR-33  |

userId scope is implicit in the path; no userId field is needed in the index keys or stored on the document.

---

## §D4 State machine

```
            ┌────────────┐
            │   (none)   │  no active incident exists
            └─────┬──────┘
                  │  Emergency Activation (BR-1, BR-2, BR-28)
                  │  → write Incident with startedAt=now, endedAt=null,
                  │    petId=(scoped pet | only pet | picker selection)
                  ▼
            ┌────────────┐
            │   active   │  timer ticks, fields editable, BR-26 enforces singleton
            └─────┬──────┘
                  │  STOP (BR-12, BR-13) → freeze timer, set endedAt = now
                  ▼
            ┌────────────┐
            │  stopped   │  same surface; BR-14, BR-16 still apply forever
            └────────────┘
```

There is no terminal "archived" state in v1. Stopped incidents remain mutable forever (BR-16); the only guardrail is BR-30 (existing journal entries are immutable, but you can append).

---

## §D5 Open Design Questions

These are _design_ OQs, distinct from spec OQs. They must resolve before Phase 4 (tasks).

- **DQ-1** — ✅ **Resolved 2026-05-01 round 3** by spec OQ-2 revert (option c above). Spec BR-28 now requires `petId` at activation, eliminating the petless-incident case. Incidents live in the per-pet subcollection per project convention (`users/{userId}/pets/{petId}/incidents/...`). See §D3.
- **DQ-2** — Active-incident hydration on app load. If a caregiver starts an incident, backgrounds the tab, and re-opens later, the active state must resume. Proposal: on auth-success boot, `useIncidentStore` runs a one-shot lookup (mechanism per DQ-6) for any incident with `endedAt == null && deletedAt == null` for the current user; if found, set as active and navigate to `/incidents/active`. **Needs confirm.**
- **DQ-3** — FAB visibility on `/incidents/active`. Proposal: hide (no-op). Alternative: repurpose as a "STOP" alias. **Needs confirm.**
- **DQ-4** — Journal commit cadence. Per BR-9 the elapsed-time prefix implies line-break is the commit boundary. Proposal: a journal entry is appended on Enter; in-progress text in the textarea is held in component state (lost on tab close — explicit tradeoff). Alternative: also commit on 5s idle. **Needs confirm.**
- **DQ-5** — Initial chip catalog content (resolves spec OQ-3). Proposed v1 sets in `chipCatalog.ts`:

```ts
seizure:           rigid, salivating, unconscious, vocalizing, paddling, incontinence, blind, thirsty
injury:            bleeding, limping, swelling, vocalizing, exposed_wound, foreign_object
vomiting:          food, bile, blood, foam, undigested, repeated
choking:           coughing, gagging, blue_gums, panicking, object_visible, collapsed
allergic_reaction: facial_swelling, hives, itching, vomiting, breathing_difficulty, lethargy
collapse:          unresponsive, brief_loss, weak_pulse, pale_gums, recovered_quickly
ingestion:         known_substance, unknown_substance, vomited_already, lethargic, drooling
other:             (no curated chips; chips can still be entered as free-text in v2)
```

`other` has no chip catalog in v1 — the journal is the only structured data for that type. **Needs confirm or revision** (this is content, not architecture — easy to iterate).

- **DQ-6** — _New, added round 3._ **Active-incident lookup mechanism.** Now that incidents live in per-pet subcollections (per resolved DQ-1), finding "the active incident for this user" must span all of the user's pets. Two viable mechanisms:
  - **(i) Collection-group query.** `db.collectionGroup('incidents').where('endedAt', '==', null).where('deletedAt', '==', null).limit(1)` scoped by Firestore rules to the current user. Pros: no extra writes, no chance of pointer/data drift, single source of truth. Cons: requires a collection-group index (one-time Firestore console step), slightly heavier than a single-doc read, and the rules need a check that the matched docs belong to the current user.
  - **(ii) Pointer doc.** A document at `users/{userId}/state/activeIncident` storing `{ petId, incidentId }` updated on activation and STOP. Pros: O(1) read, no collection-group index. Cons: two writes per activation/STOP must stay in sync; if the pointer falls out of sync (offline edge case), the lookup lies; introduces a new state surface to maintain.
  - _Recommendation: (i)_ — collection-group queries are well-supported, the index is a known one-time cost, and there's no synchronization risk. **Needs confirm before tasks phase.**
- **DQ-7** — _New, added round 3._ **ActivationPetPicker presentation.** When the global FAB on a non-pet-scoped surface is tapped by a multi-pet user (BR-28 third rule), what UI affordance handles the second tap? Options: MUI `<Dialog>` modal, MUI `<Drawer>` (bottom sheet), or a transient inline pop-over near the FAB. Wireframes don't address this. _Recommendation: bottom `<Drawer>`_ — thumb-reachable on mobile (NFR-3) and matches the urgency tone better than a centered modal. **Needs confirm before tasks phase.**

---

## §D6 i18n Keys

All strings live in `src/locales/{en,es}/common.json`. New top-level namespace `incidents`:

```jsonc
{
  "incidents": {
    "activate": "Start incident",
    "activeBadge": "incident in progress",
    "timer": {
      "running": "{{elapsed}} elapsed",
      "duration": "{{duration}} duration",
    },
    "severity": { "mild": "mild", "moderate": "moderate", "severe": "severe" },
    "callVet": "Call vet",
    "callVetMissing": null, // intentionally absent — BR-11 hides, doesn't show empty state
    "stop": "STOP",
    "stopSubcaption": "end timer · keep journaling",
    "petPickerTitle": "Which pet?",
    "petPickerHelp": "Tap to assign this incident to a pet.",
    "petPickerCancel": "Not yet",
    "journal": {
      "label": "What you're seeing",
      "auto": "timestamps every line",
      "placeholder": "Start typing — each line auto-stamps with elapsed time.",
    },
    "history": {
      "title": "Past incidents",
      "empty": "No incidents recorded for this pet.",
      "untyped": "untyped",
      "noJournal": "",
    },
    "types": {
      "seizure": "Seizure",
      "injury": "Injury",
      "vomiting": "Vomiting",
      "choking": "Choking",
      "allergic_reaction": "Allergic reaction",
      "collapse": "Collapse",
      "ingestion": "Ingestion",
      "other": "Other",
    },
    "chips": {
      "rigid": "Rigid",
      "salivating": "Salivating",
      "unconscious": "Unconscious",
      // … one key per ChipId from §D5
    },
  },
}
```

NFR-7 reminder: tone stays neutral. No "Great job logging!" or success microcopy.

---

## §D7 Firestore Rules Diff

Add inside the existing `match /users/{userId}/pets/{petId}` block in `firestore.rules`, alongside the `feedings`, `medications`, and `doseLogs` subcollections:

```rules
match /incidents/{incidentId} {
  allow read, write: if isOwner(userId);
}
```

This matches the project convention (existing subcollections use `allow read, write: if isOwner(userId)` with no per-field validation — see `firestore.rules:18–28`). Document-level invariants (BR-13's `endedAt` constraint, BR-16's `startedAt ≤ endedAt`, BR-28's required `petId`) are enforced client-side, consistent with how feedings/medications/doseLogs are handled today.

The collection-group lookup for active incidents (DQ-6 option i) requires that the rule above is sufficient — and it is, because Firestore evaluates collection-group queries against each matched document's path-bound rule. Cross-user matches are blocked because the path's `{userId}` doesn't match the requester.

Rules-test additions live in the existing rules-test setup (location to confirm during Phase 4 task breakdown). Test cases derived from AC-13 (cross-user reject) and BR-26 client-side enforcement check.

---

## §D8 Performance Notes

- **NFR-2 (200ms tap-to-timer)** — The activation flow MUST start the timer client-side _before_ the Firestore write resolves. Concretely:
  1. FAB tap → Zustand action `startIncident({ petId })` synchronously generates a UUID, sets `activeIncident.startedAt = Date.now()`, navigates to `/incidents/active`.
  2. The `IncidentTimer` component reads `startedAt` and renders immediately — this is the 200ms-budget path.
  3. In an effect, `incidentService.create()` writes to Firestore with the same id. Failure here surfaces as a non-blocking toast.

- **NFR-1 (connectivity resilience)** — Enable Firestore SDK persistent cache (`persistentLocalCache`) in `src/firebase.ts`. The SDK queues writes and replays on reconnect. No bespoke offline queue.

- **Timer cadence** — Render the timer with `requestAnimationFrame` updating a state hook every ~250ms (visible second resolution per BR-3, but smoother to the eye). Do not store ticks in Firestore; `startedAt` is the source of truth and elapsed is computed.

---

## §D9 Accessibility (NFR-6)

- `IncidentTimer` wrapped in `aria-live="polite"` on the elapsed-time text only — _not_ the milliseconds — so screen readers don't get flooded.
- All chips (`SeverityChips`, `ObservationChips`) are MUI `<Chip>` rendered as toggle buttons (`role="button"`, `aria-pressed`).
- STOP button has `aria-label` matching `incidents.stop`. Big visual size satisfies NFR-3 mobile target; `aria-label` covers screen-reader names.
- Vet call action is a real `<a href="tel:...">`, not a button — invokes the OS dialer reliably and is accessible by default.
- Journal `<textarea>` has an associated `<label>` (visually present per wireframe).

---

## §D10 Verification Plan (preview)

These are integration / smoke tests we'll wire up in Phase 5–6. Each AC from §9 of the spec maps to one or more here:

- **Component tests** (Vitest + Testing Library): SeverityChips toggle behavior (AC-2), ObservationChips toggle without type (AC-3), JournalEntry append produces correct elapsedSeconds (AC-4, AC-16, AC-17), VetCallCard hidden when no phone (AC-5).
- **Integration tests** (`*.integration.test.tsx`): Full activation → STOP flow against Firestore emulator (AC-1, AC-6, AC-14), pet reassignment (AC-15), cross-user rules block (AC-13).
- **Manual smoke** under `pnpm run dev:with-emulators`: connectivity-loss path (AC-12), FAB visible everywhere post-auth (AC-18), latency feels ≤200ms (NFR-2).

Coverage target: 80% lines for `src/features/incidents/**` and 100% of `IncidentRepository` methods (per CLAUDE.md testing conventions).

---

## §D11 Design Changelog

- **2026-05-01** — Initial draft. Open: DQ-1, DQ-2, DQ-3, DQ-4, DQ-5.
- **2026-05-01 round 3** — Re-sync after spec OQ-2 revert and OQ-7 closure.
  - **DQ-1 closed:** incidents move to per-pet subcollection (`users/{userId}/pets/{petId}/incidents/...`) matching project convention; the top-level recommendation in §D3 was rewritten.
  - **§D2:** `PetPicker.tsx` renamed to `ActivationPetPicker.tsx` (purpose changed from STOP-time pet picker to multi-pet activation picker); FAB tap-behavior table added.
  - **§D3:** TypeScript `petId` no longer nullable; added `deletedAt` field; Firestore layout rewritten for subcollection; indexes simplified (single-field `startedAt desc` is automatic per-pet; cross-pet active lookup needs collection-group index per DQ-6).
  - **§D4:** state machine simplified (no pet-null branch; STOP just freezes).
  - **§D7 rules diff:** simplified to one-line `allow read, write: if isOwner(userId)` matching project convention; client enforces invariants, consistent with feedings/medications/doseLogs.
  - **DQ-6 added:** active-incident lookup mechanism (collection-group query vs pointer doc). Recommendation: collection-group.
  - **DQ-7 added:** ActivationPetPicker presentation (Dialog vs Drawer vs popover). Recommendation: Drawer.
  - **OQ-7 closure (spec):** "Primary Vet" reuses existing `PetVetRole === 'primary'`; no design changes needed because the existing `petVetService.setPrimaryVet()` plus `petVetRepository.setPrimaryForPet()` already do the work. Incident's vet-call card reads `petVets.where(role == 'primary').first()` for the active incident's pet.
