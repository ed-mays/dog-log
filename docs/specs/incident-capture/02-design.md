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
    PetPicker.tsx                       # inline pet picker for STOP (BR-13, BR-28)
    PetPicker.test.tsx
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

Built with MUI `<Fab>`, positioned bottom-right with `position: fixed`. Tap target ≥56×56 (BR-27, NFR-3).

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
  petId: string | null; // BR-28 — null while active is allowed; required when endedAt is set (BR-13)
  startedAt: string; // ISO 8601 instant — set at activation (BR-2)
  endedAt: string | null; // ISO 8601 instant — set at STOP (BR-13)
  type: IncidentTypeId | null; // BR-4, BR-19
  severity: Severity | null; // BR-6
  chips: ChipId[]; // BR-7, BR-20 — ordered, deduped at write
  journal: JournalEntry[]; // BR-30 — append-only after STOP
  createdAt: string; // server-assigned (Firestore serverTimestamp)
  updatedAt: string; // server-maintained on every write (BR-18)
}

export type IncidentCreateInput = Pick<Incident, 'startedAt'> &
  Partial<Pick<Incident, 'petId'>>;
export type IncidentUpdateInput = Partial<
  Omit<Incident, 'id' | 'userId' | 'createdAt'>
>;
```

Decision: `chips` is `ChipId[]`, not `Set<ChipId>`. Firestore stores arrays; the deduplication happens at the service layer (cite BR-20: "stored as opaque tag strings").

### Firestore layout

**Pending decision (DQ-1, see §D5):** incidents live in a top-level-per-user collection, NOT a per-pet subcollection. _Recommended, not yet confirmed by user._

```
users/{userId}/incidents/{incidentId}
  petId: string | null
  startedAt: timestamp
  endedAt: timestamp | null
  type: string | null
  severity: string | null
  chips: string[]
  journal: array<{ elapsedSeconds: number, text: string, addedAt: timestamp }>
  createdAt: timestamp (serverTimestamp)
  updatedAt: timestamp (serverTimestamp)
```

**Why top-level:** BR-28 makes `petId` optional during the active phase. A subcollection path like `users/{userId}/pets/{petId}/incidents/...` cannot represent a petless incident. A top-level-per-user collection with a nullable `petId` field handles both states without a migration on STOP.

**Indexes needed:**

| Index                                       | Query it serves                                                             | Spec citation |
| ------------------------------------------- | --------------------------------------------------------------------------- | ------------- |
| `(petId asc, startedAt desc)` (composite)   | Per-pet history list, most recent first                                     | BR-23, BR-24  |
| `(endedAt asc, startedAt desc)` (composite) | "Find the active incident for this user" — `endedAt == null`, return latest | BR-26         |
| Single-field `petId asc`                    | List by pet without ordering, fallback                                      | —             |

The userId scope is already implicit in the collection path (`users/{userId}/incidents`), so no userId field needed in the index keys.

---

## §D4 State machine

```
            ┌────────────┐
            │   (none)   │  no active incident exists
            └─────┬──────┘
                  │  Emergency Activation (BR-1, BR-2)
                  │  → write Incident with startedAt=now, endedAt=null,
                  │    petId=(scoped pet | null)
                  ▼
            ┌────────────┐
            │   active   │  timer ticks, fields editable, BR-26 enforces singleton
            └─────┬──────┘
                  │  STOP (BR-12) — if petId == null, prompt picker (BR-13)
                  │  → set endedAt = now
                  ▼
            ┌────────────┐
            │  stopped   │  same surface; BR-14, BR-16 still apply forever
            └────────────┘
```

There is no terminal "archived" state in v1. Stopped incidents remain mutable forever (BR-16); the only guardrail is BR-30 (existing journal entries are immutable, but you can append).

---

## §D5 Open Design Questions

These are _design_ OQs, distinct from spec OQs. They must resolve before Phase 4 (tasks).

- **DQ-1** — **Tension between spec and project convention.** Spec BR-28 makes `petId` optional during the active phase. Project convention (firestore.rules `users/{userId}/pets/{petId}/...` and PetMedicationRepository) is per-pet subcollections, which can't represent a petless incident. Three resolution paths:
  - (a) **Top-level under user**, nullable `petId`. Cleanest fit for BR-28; one collection, one query for active-incident lookup; rules are simple. Departs from the per-pet-subcollection convention.
  - (b) **Subcollection** `users/{userId}/pets/{petId}/incidents/...` for assigned + a sibling `users/{userId}/unassignedIncidents/...` for petless, with a write-time migration on STOP. Preserves convention for the assigned case but adds a moving-document migration path with non-trivial failure modes.
  - (c) **Spec amendment**: walk back BR-28 to require `petId` at activation (e.g. force a one-tap pet picker as the activation gesture for users with >1 pet, pre-fill for single-pet users). Preserves convention completely; gives up the "pick pet when convenient" insight from PR #152 round 1.
  - _Recommendation: (a). Worth user input before locking._
- **DQ-2** — Active-incident hydration on app load. If a caregiver starts an incident, backgrounds the tab, and re-opens later, the active state must resume. Proposal: on auth-success boot, `useIncidentStore` runs a one-shot query `incidents where endedAt == null` and, if a result exists, sets it as the active incident and the app navigates to `/incidents/active`. **Needs confirm.**
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

Add inside the `match /users/{userId}` block in `firestore.rules` (after existing `match /pets/{petId}` block, before `match /vets/{vetId}`):

```rules
match /incidents/{incidentId} {
  allow read: if isOwner(userId);

  // Create: must be the owner; userId field must equal the path's userId.
  allow create: if isOwner(userId)
    && request.resource.data.userId == userId
    && request.resource.data.startedAt is timestamp
    && (request.resource.data.petId == null
        || request.resource.data.petId is string);

  // Update: must be the owner; userId is immutable; if endedAt is being set,
  // petId must be a non-null string (enforces BR-13 server-side, not just client).
  allow update: if isOwner(userId)
    && request.resource.data.userId == resource.data.userId
    && (request.resource.data.endedAt == null
        || request.resource.data.petId is string);

  allow delete: if isOwner(userId);
}
```

Rules-test additions live in `firestore.rules.test.ts` (or wherever the existing rules tests live — confirm during Phase 4 task breakdown). Test cases derived from AC-13 (cross-user reject) plus the BR-13 server-side enforcement above.

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

- **2026-05-01** — Initial draft. Resolved DQ-1 (top-level storage). Open: DQ-2, DQ-3, DQ-4, DQ-5.
