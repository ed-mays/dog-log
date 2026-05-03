# Design: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01
> Brief: [`00-brief.md`](./00-brief.md) · Spec: [`01-spec.md`](./01-spec.md)

Every design decision below cites the spec section it satisfies (e.g. `[BR-7]`, `[NFR-3]`). If a design item has no citation, it is gold-plating or a missing requirement — fix the spec before adding it here.

---

## §D1 UX — Wireframes Annotated

The active-incident wireframes live at `~/.gstack/projects/ed-mays-dog-log/designs/pet-details-20260430-220703/wireframe-v3-incident.html` (live + post-stop two-up) and `wireframe-v4-incident-types.html` (type picker / chip catalog).

### v3 left panel (live, timer running)

| Element on screen                                   | Spec citation                         |
| --------------------------------------------------- | ------------------------------------- |
| Pet header chip ("Banjo · ⚡ incident in progress") | BR-28 (pet visible & editable), BR-29 |
| Monospace timer hero with pulse dot                 | BR-3, NFR-3                           |
| Severity row: mild / moderate / severe              | BR-6, NFR-3                           |
| "Call vet" card with vet name + number              | BR-10, BR-11                          |
| Observation chip grid (rigid, salivating, …)        | BR-7, BR-19, BR-20                    |
| Journal textarea with auto-timestamp prefix         | BR-8, BR-9                            |
| Big STOP button                                     | BR-12, BR-13                          |

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

The wireframe specifies a dark amber/red-tinted palette and a 1.4s pulse on the timer indicator. This matches NFR-4 (dark mode primary). The existing `caregiverTheme` (`src/features/theme/theme.ts`, commit b79b359) maps cleanly:

| Wireframe color        | Caregiver theme token                    | Match                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background `#1A0E08`   | `palette.background.default = '#1A1208'` | not exact — green channel differs by 4 hex digits. **Open: confirm with the wireframe author whether this difference is acceptable, or whether the theme token should be updated to `#1A0E08`.** Tracked as DQ-8.                  |
| Body text `#F4E9D8`    | `palette.text.primary = '#F4E9D8'`       | exact                                                                                                                                                                                                                              |
| Timer accent `#FF6B5C` | `palette.error.main = '#FF6B5C'`         | exact                                                                                                                                                                                                                              |
| Timer text `#FFEDEA`   | `palette.text.primary = '#F4E9D8'`       | not exact — if the difference matters at the timer-hero scale, add a new semantic token `palette.incident.timerText` to the Caregiver theme rather than introducing a one-off in the component. Tracked as DQ-8 with the bg color. |

No new ad-hoc color constants in components. Either tokens already match (exact rows) or the theme is updated (DQ-8). The `error.main` token is reused as the urgency accent — semantically odd in MUI's typical model but matches dog-log's recent intent to make this theme caregiver-coded.

---

## §D2 Architecture

Following the medications precedent (`src/features/medications/*`, `src/repositories/PetMedicationRepository.ts`, `src/services/petMedicationService.ts`, `src/store/usePetMedicationStore.ts`).

### File map

```
src/features/incidents/
  pages/
    ActiveIncidentPage.tsx              # /incidents/active route — loads activeIncident from store, renders <IncidentCaptureSurface>
    ActiveIncidentPage.test.tsx
    SavedIncidentPage.tsx               # /pets/:petId/incidents/:id route — loads incident by id, renders <IncidentCaptureSurface>
    SavedIncidentPage.test.tsx
  components/
    IncidentCaptureSurface.tsx          # SHARED surface used by both pages (BR-14, BR-25 — same surface live, post-stop, re-opened)
    IncidentCaptureSurface.test.tsx
    IncidentTimer.tsx                   # monospace hero, ticks every ~250ms (see §D8)
    IncidentTimer.test.tsx
    SeverityChips.tsx                   # 3-up grid (BR-6)
    SeverityChips.test.tsx
    ObservationChips.tsx                # type-aware grid (BR-7, BR-19, BR-32)
    ObservationChips.test.tsx
    IncidentJournal.tsx                 # append-only textarea (BR-8, BR-9, BR-30)
    IncidentJournal.test.tsx
    VetCallCard.tsx                     # tel: link (BR-10, BR-11)
    VetCallCard.test.tsx
    ActivationPetPicker.tsx             # bottom-Drawer picker shown when global FAB is tapped on a non-pet-scoped surface for multi-pet users (BR-28 third rule, DQ-7 resolution)
    ActivationPetPicker.test.tsx
    StopButton.tsx                      # (BR-12, BR-13)
    StopButton.test.tsx
    DeleteIncidentAction.tsx            # soft-delete trigger (BR-33)
    DeleteIncidentAction.test.tsx
    ResumeIncidentBanner.tsx            # global persistent banner offering to navigate to active incident (DQ-2 resolution)
    ResumeIncidentBanner.test.tsx
    IncidentHistoryList.tsx             # per-pet list (BR-23, BR-24, BR-25)
    IncidentHistoryList.test.tsx
  hooks/
    useActiveIncident.ts                # selector + actions (start, stop, mutate, delete)
    useActiveIncident.test.ts
    useIncidentTimer.ts                 # rAF-driven elapsed seconds
    useIncidentTimer.test.ts
  types.ts                              # Incident, IncidentType, Severity, ChipId
  chipCatalog.ts                        # static type→chips map (resolves OQ-3)

src/repositories/
  IncidentRepository.ts                 # CRUD against Firestore (NFR-8, BR-15)

src/services/
  incidentService.ts                    # business logic, composes repository
                                        # — exposes getRecentTypesForPet(petId, limit=10): IncidentTypeId[]
                                        #   for BR-21's MRU-per-pet sort. Implementation: query per-pet history
                                        #   (composite index already covers it), map to types, dedupe preserving order.

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
- the active route is `/incidents/active` (DQ-3 resolution: hidden — no-op there; the active surface itself owns navigation)
- `incidentsEnabled` flag is off
- the user has zero pets (per BR-27's round-5 zero-pet exception, added in spec to make this design behavior consistent with the requirement)

Built with MUI `<Fab>`, positioned bottom-right with `position: fixed`. Tap target ≥56×56 (BR-27, NFR-3).

**Tap behavior** (per BR-26 short-circuit and BR-28's three rules):

| Pre-condition              | Surface                       | Pet count | Behavior                                                                                                                   |
| -------------------------- | ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Active incident exists** | any                           | any       | Navigate to `/incidents/active` (resume — BR-26, AC-11). All other rules below skip.                                       |
| No active incident         | Pet-scoped (e.g. `/pets/:id`) | any       | Activate immediately with that pet (1 tap, AC-20).                                                                         |
| No active incident         | Non-pet-scoped                | exactly 1 | Activate immediately with the only pet (1 tap, AC-20).                                                                     |
| No active incident         | Non-pet-scoped                | 2+        | Open `ActivationPetPicker` as an MUI bottom Drawer (DQ-7 resolution); the pet tap IS the activation (2 taps total, AC-19). |

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

import type { BaseEntity } from '@repositories/types';

export interface JournalEntry {
  elapsedSeconds: number; // BR-9, BR-31 — stored at write, never recomputed
  text: string;
  addedAt: Date; // BR-30 instant of append
}

// Extends BaseEntity to align with project-wide repository contract
// (every other entity in src/repositories/ follows this convention via
// BaseRepository<T extends BaseEntity>). BaseEntity provides:
//   id: string; createdAt: Date; updatedAt: Date; createdBy: string;
// The Firestore layout below stores these as Timestamps; BaseRepository's
// documentToEntity / entityToDocument converters handle the round-trip.
export interface Incident extends BaseEntity {
  userId: string; // owner — drives security rules (NFR-8); duplicates createdBy for query convenience
  petId: string; // BR-28 — required at all times (revert of round-1 reframe)
  startedAt: Date; // set at activation (BR-2)
  endedAt: Date | null; // set at STOP (BR-13)
  type: IncidentTypeId | null; // BR-4, BR-19
  severity: Severity | null; // BR-6
  chips: ChipId[]; // BR-7, BR-20 — ordered, deduped at write
  journal: JournalEntry[]; // BR-30 — append-only after STOP
  deletedAt: Date | null; // BR-33 — soft-delete timestamp; null when not deleted
}

export type IncidentCreateInput = Pick<Incident, 'petId' | 'startedAt'>;
export type IncidentUpdateInput = Partial<
  Omit<Incident, 'id' | 'userId' | 'createdAt' | 'createdBy' | 'petId'>
> & { petId?: string }; // pet may be reassigned but never cleared (BR-29)
// Note: BR-29's "never cleared" invariant is enforced at runtime in
// incidentService.update() — the type allows `petId?: string`, which still
// admits a malformed `''` or a cast `null`. Tests in incidentService.test.ts
// MUST cover the rejection path.
```

Decision: `chips` is `ChipId[]`, not `Set<ChipId>`. Firestore stores arrays; the deduplication happens at the service layer (cite BR-20: "stored as opaque tag strings").

### Firestore layout

Incidents live in a top-level collection under the user — **not** a per-pet subcollection. `petId` is a stored field, not a path segment.

```
users/{userId}/incidents/{incidentId}
  petId: string                 # stored, not in path — enables BR-29 reassignment as a single setDoc
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

**Why top-level (departs from project convention).** The project convention is per-pet subcollections (feedings, medications, doseLogs). Incidents differ structurally: BR-29 requires that the pet linked to an incident be _reassignable_ on a saved incident. Under a per-pet subcollection layout, `petId` would be in the path, so reassignment would mean a transactional copy-to-new-path + delete-from-old-path operation across two documents — risk of partial failure, two history-cache invalidations, complex repository surface. Under the top-level layout, reassignment is a one-line `setDoc({petId: newPetId})` and BR-29 is trivially correct. This rationale is logged in §D11 round 5 (cold-read finding D16) and was the third visit to the layout question — round 1 chose top-level, round 2/3 reverted to subcollection, round 5 reverted back to top-level on BR-29 grounds.

**Active-incident lookup** (needed by BR-26 and DQ-2 hydration) is a simple query on the user's incidents collection: `where('endedAt', '==', null).where('deletedAt', '==', null).limit(1)` — no collection-group query needed because the user scope is the path. **DQ-6 is therefore closed by this layout choice.**

**Indexes needed.** Top-level layout under user means each query filters by stored fields (including `petId`); userId is implicit in the path. Composite indexes:

| Query                                                                                                                                          | Composite index                              | Spec citation       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------- |
| Per-pet history list, hiding deleted, most recent first: `where('petId', '==', X).where('deletedAt', '==', null).orderBy('startedAt', 'desc')` | `(petId asc, deletedAt asc, startedAt desc)` | BR-23, BR-24, BR-33 |
| Active-incident lookup for current user: `where('endedAt', '==', null).where('deletedAt', '==', null).limit(1)`                                | `(endedAt asc, deletedAt asc)`               | BR-26, BR-33        |
| Per-pet recent-types lookup for BR-21 MRU sort: `where('petId', '==', X).where('deletedAt', '==', null).orderBy('startedAt', 'desc').limit(N)` | _Reuses the per-pet history index._          | BR-21               |

These indexes MUST be declared in `firestore.indexes.json` before the feature ships; Firestore returns `failed-precondition` with a console URL on first execution if a required index is missing, so the gap surfaces in integration tests.

**Journal/chips append semantics.** `journal` and `chips` are arrays. We use **read-modify-write inside the SDK queue**, encapsulated in repository methods so callers cannot accidentally use array helpers:

```ts
// Pseudocode
async appendJournal(id, entry) {
  const current = await get(id);
  await setDoc(id, { journal: [...current.journal, entry] }, { merge: true });
}
async toggleChip(id, chipId) {
  const current = await get(id);
  const next = current.chips.includes(chipId)
    ? current.chips.filter(c => c !== chipId)
    : [...current.chips, chipId];
  await setDoc(id, { chips: next }, { merge: true });
}
```

- Why not `arrayUnion` for chips: dedupes by deep equality but cannot toggle; toggle is required by BR-7.
- Why not `arrayUnion` for journal: doesn't preserve append order across concurrent writers.
- Why RMW is safe here: BR-26 enforces a single-writer-per-incident invariant on a single client; the SDK's offline queue serializes writes per-client; cross-device contention is a documented v1 limitation in spec §7. (If a future v2 enables multi-device concurrent active incidents, this strategy must be re-evaluated.)

---

## §D4 State machine

```
            ┌────────────┐
            │   (none)   │  no active incident exists
            └─────┬──────┘
                  │  Emergency Activation (BR-1, BR-2, BR-28)
                  │  → write Incident with startedAt=now, endedAt=null,
                  │    deletedAt=null, petId=(scoped | only | picker)
                  ▼
            ┌────────────┐                                    ┌──────────────┐
            │   active   │ ── soft-delete (BR-33) ──────────▶│   deleted    │
            └─────┬──────┘   (sets deletedAt;                 │              │
                  │           releases BR-26 singleton)       │ hidden from  │
                  │  STOP (BR-12, BR-13)                      │ history;     │
                  │  → freeze timer, set endedAt = now        │ no UI to     │
                  ▼                                            │ restore in   │
            ┌────────────┐                                    │ v1; data     │
            │  stopped   │ ── soft-delete (BR-33) ──────────▶│ retained     │
            └────────────┘   (sets deletedAt)                  └──────────────┘
                same surface; BR-14, BR-16 still apply forever
```

There is no terminal "archived" state in v1. Stopped incidents remain mutable forever (BR-16); the only guardrail is BR-30 (existing journal entries are immutable, but you can append). `deleted` is a one-way terminal state from the user's perspective (no UI affordance to un-delete in v1) but the document is retained.

---

## §D5 Open Design Questions

These are _design_ OQs, distinct from spec OQs. They must resolve before Phase 4 (tasks).

- **DQ-1** — ✅ **Resolved 2026-05-01 round 3** by spec OQ-2 revert (option c above). Spec BR-28 now requires `petId` at activation, eliminating the petless-incident case. _Round 3 chose per-pet subcollection per project convention; **round 5 reversed this** to top-level under user — see DQ-1's reopening-and-flip in round 5 changelog (D16) and revised §D3._
- **DQ-2** — ✅ **Resolved 2026-05-01 round 4.** Active-incident hydration: on auth-success boot, `useIncidentStore` runs a one-shot lookup (mechanism per DQ-6) for any incident with `endedAt == null && deletedAt == null` for the current user; if found, hydrate it into store state and render a persistent `ResumeIncidentBanner` on every authenticated page offering "Resume incident → /incidents/active". The app does NOT auto-navigate, so a caregiver opening the app to do something else isn't yanked away. The banner is dismissible-per-session (not persistently dismissible — the active incident is never gone until STOP or delete).
- **DQ-3** — ✅ **Resolved 2026-05-01 round 4.** FAB hidden on `/incidents/active`. The active surface owns its own STOP/delete affordances; a duplicate FAB would be a no-op or worse, a foot-gun (re-tap creates confusion). Cited in §D2 FAB hide-conditions.
- **DQ-4** — Journal commit cadence. Per BR-9 the elapsed-time prefix implies line-break is the commit boundary. Proposal: a journal entry is appended on Enter; in-progress text in the textarea is held in component state (lost on tab close — explicit tradeoff). NFR-1 covers _committed_ journal entries; uncommitted textarea text is component-local and is NOT in scope for connectivity-loss resilience. Alternative: also commit on 5s idle. **Needs confirm.**
- **DQ-5** — Initial chip catalog content (resolves spec OQ-3). **Note: this DQ also blocks the `incidents.chips.*` i18n keys in §D6** — closing it unblocks both `chipCatalog.ts` content and the i18n-keys file. Proposed v1 sets in `chipCatalog.ts`:

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

- **DQ-6** — ✅ **Resolved 2026-05-01 round 5.** Dissolved by the storage-layout flip back to top-level (D16). With incidents in `users/{userId}/incidents/...`, the active-lookup is a simple single-collection query — no collection-group needed, no pointer doc needed. See revised §D3.
- **DQ-7** — ✅ **Resolved 2026-05-01 round 5.** ActivationPetPicker uses an MUI bottom `<Drawer>`. Thumb-reachable on mobile (NFR-3); matches urgency tone better than a centered modal; preserves the rest of the app surface visible behind it (less context-loss than a Dialog). Confirmed at the same time as DQ-6 closure.
- **DQ-8** — _New, added round 5 (cold-read D20)._ Caregiver theme color tokens partially differ from the wireframe palette (`background.default = #1A1208` vs wireframe `#1A0E08`; no exact `text.primary` match for the timer-text `#FFEDEA`). Two paths: (a) accept the differences (designer signed off implicitly via the existing theme), (b) update the theme tokens to match the wireframe exactly and/or add a new `palette.incident.timerText` token. **Needs author/designer confirm — not blocking tasks phase but blocking pixel-accurate visual QA.**

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
    // No `callVetMissing` key — BR-11 hides the action entirely when no Primary Vet is linked; no empty-state copy is needed. (Encoding the absence as `null` here would cause i18next to fall back to the key string.)
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

**Deferrals (v1 foundation scope):**

- `incidents.chips.*` keys are NOT added in the foundation i18n task. They are deferred to T-20 (chip rendering), which is gated on DQ-5 closing (final ChipId catalog). The §D11 round-4 cross-reference under DQ-5 already notes this dependency; this entry makes the deferral visible to consumers of §D6 directly. Until then, the `incidents.chips` subtree is intentionally absent from `common.json` — `useTranslation` calls against chip keys must not occur in foundation-slice code.
- The JSONC example above uses `//` comments for editorial clarity, but real `src/locales/es/common.json` is strict JSON and cannot carry inline `// TODO i18n-es` markers. For v1, Spanish entries under `incidents.*` MAY be one-line English-value stubs (i.e. the same string as the `en` value). Translation-quality work is tracked as a dedicated post-foundation task and is not blocking for foundation completion. This is a scoped, time-boxed exception to NFR-5 coverage and applies only to the new `incidents` namespace; pre-existing namespaces are unchanged.

---

## §D7 Firestore Rules Diff

Add inside the existing `match /users/{userId}` block in `firestore.rules`, at the same nesting level as the per-pet block:

```rules
match /incidents/{incidentId} {
  allow read, write: if isOwner(userId);
}
```

This matches the project convention (existing user-scoped collections like `vets`, `petVets`, `vetKeys` use `allow read, write: if isOwner(userId)` with no per-field validation — see `firestore.rules:31-41`). The rule does NOT validate `petId` references — a buggy client could write an incident with a `petId` that doesn't correspond to one of the user's pets. This is consistent with the project's posture; tasks phase will rely on the client's `useIncidentStore` selectors to filter incidents by valid pets when rendering history.

Document-level invariants (BR-13's `endedAt` constraint, BR-16's `startedAt ≤ endedAt`, BR-28's required `petId`, BR-29's no-clear) are enforced client-side, consistent with how feedings/medications/doseLogs are handled today. **Trust note:** AC-23's rejections (clearing `endedAt`, `startedAt > endedAt`) are therefore a _client-side contract_. A malicious or buggy client signed in with the user's credentials could write invalid documents; the rule above only prevents _cross-user_ access. This is consistent with project posture but worth stating so tasks phase doesn't assume server-side validation.

Rules-test additions live in the existing rules-test setup (location to confirm during Phase 4 task breakdown). Test cases derived from AC-13 (cross-user reject) and BR-26 client-side enforcement check.

---

## §D8 Performance Notes

- **NFR-2 (no-await activation path)** — The activation flow MUST start the timer client-side _before_ the Firestore write resolves. Concretely:
  1. FAB tap → Zustand action `startIncident({ petId })` synchronously generates a UUID, sets `activeIncident.startedAt = Date.now()`, navigates to `/incidents/active`.
  2. The `IncidentTimer` component reads `startedAt` and renders immediately — this is the no-await path.
  3. In an effect, `incidentService.create()` writes to Firestore with the same id. Transient failure (e.g. offline) is handled by the Firestore SDK's persistent cache (NFR-1) — the write replays on reconnect. **Permanent failure** (rules misconfigured, quota exceeded, schema rejection) MUST surface a recoverable error state on the Capture Surface with a retry affordance; the timer keeps running locally so observation data isn't lost. STOP MUST NOT silently succeed against a never-persisted document — if the create has not yet succeeded by STOP, STOP retries the create + STOP write together and surfaces the same error state on permanent failure.

- **NFR-1 (connectivity resilience)** — Enable Firestore SDK persistent cache (`persistentLocalCache`) in `src/firebase.ts`. The SDK queues writes and replays on reconnect. No bespoke offline queue.

- **Timer cadence** — Render the timer with `requestAnimationFrame` updating a state hook every ~250ms (visible second resolution per BR-3, but smoother to the eye). Do not store ticks in Firestore; `startedAt` is the source of truth and elapsed is computed. (File-map comment on `IncidentTimer.tsx` aligned to 250ms in §D2.)

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

- **Component tests** (Vitest + Testing Library): SeverityChips toggle behavior (AC-2), ObservationChips toggle without type (AC-3), carry-over chips visible after type change (AC-21), JournalEntry append produces correct elapsedSeconds (AC-4, AC-16, AC-17), VetCallCard hidden when no Primary Vet (AC-5), DeleteIncidentAction soft-deletes and hides from history (AC-22), end-time validation rejects clear and rejects `startedAt > endedAt` (AC-23), ResumeIncidentBanner appears when active incident exists.
- **Integration tests** (`*.integration.test.tsx`): Full activation → STOP flow against Firestore emulator (AC-1, AC-6), single-tap activation from pet-scoped surface (AC-20), 2-tap multi-pet activation from non-pet-scoped surface (AC-19), resume-existing on second activation (AC-11), pet reassignment as single setDoc (AC-15), soft-delete of active incident releases BR-26 singleton (AC-22 extension), cross-user rules block (AC-13).
- **Manual smoke** under `pnpm run dev:with-emulators`: connectivity-loss path (AC-12), FAB visible everywhere post-auth (AC-18) and hidden on `/incidents/active` and for zero-pet users (BR-27 exception), latency feels ≤200ms (NFR-2).

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
- **2026-05-01 round 4** — Cold-read of design doc surfaced 15 findings (2 CRITICAL, 2 HIGH, 9 MEDIUM, 2 LOW). Fixes:
  - **CRITICAL D8 (indexes):** rewrote §D3 Indexes table — composite `(deletedAt asc, startedAt desc)` for history; collection-group composite `(endedAt asc, deletedAt asc)` for active-lookup. Single-field indexes don't satisfy multi-filter queries; this would have been deployment-blocking.
  - **CRITICAL D5 (DQ-3 self-contradiction):** closed DQ-3 — FAB hidden on `/incidents/active`. §D5 entry resolved; §D2 hide-condition list cites it.
  - **HIGH D4 (page-sharing):** added `IncidentCaptureSurface.tsx` shared component to file map; both pages just do data-loading and render it.
  - **HIGH D9 (state machine omits soft-delete):** rewrote §D4 diagram with `deleted` terminal pseudo-state reachable from both `active` and `stopped`. Spec BR-33 amended in parallel commit to make active-state delete explicit (frees BR-26 singleton).
  - **MEDIUM D1:** removed wrong-scope BR-5 row from §D1 v3 left panel (BR-5 is about activation, not the active state).
  - **MEDIUM D2 (palette claim):** verified by reading `src/features/theme/theme.ts` — `caregiverTheme` tokens map cleanly to wireframe colors (`background.default = #1A1208 ≈ #1A0E08`, `text.primary = #F4E9D8 exact`, `error.main = #FF6B5C exact`). §D1 color section now cites specific tokens with a match table.
  - **MEDIUM D3 (test files):** added `StopButton.test.tsx`, `useActiveIncident.test.ts`, `useIncidentTimer.test.ts`, plus tests for new components added this round.
  - **MEDIUM D6 (FAB zero-pet hide):** §D2 now derives this from BR-27 + BR-28 with explicit citation.
  - **MEDIUM D7 (TypeScript runtime invariant):** added comment in §D3 noting BR-29 enforcement is in `incidentService.update()` not the type system.
  - **MEDIUM D10 (DQ-4 vs NFR-1):** added boundary sentence — committed entries covered by NFR-1; uncommitted textarea text is component-local.
  - **MEDIUM D11 (DQ-2 hydration scope):** changed proposal — hydrate active state but do NOT auto-navigate; render persistent `ResumeIncidentBanner` on every authenticated page. Added component to file map. DQ-2 marked resolved.
  - **MEDIUM D13 (NFR-2 orphan permanent failure):** added explicit handling — recoverable error state with retry; STOP retries create+stop together if create hasn't persisted; never silently accept orphan.
  - **MEDIUM D14 (DQ-5 blocks i18n):** added cross-reference in DQ-5 entry noting it also blocks `incidents.chips.*` keys in §D6.
  - **LOW D12 (timer cadence):** aligned file-map comment to ~250ms (matching §D8 narrative).
  - **LOW D15 (trust note):** added to §D7 — AC-23 invariants are client-side; rules only block cross-user.
- **2026-05-01 round 5** — Second cold-read of design doc surfaced 9 findings (2 CRITICAL, 2 HIGH, 5 MEDIUM). Fixes:
  - **CRITICAL D16 (storage layout):** flipped from per-pet subcollection back to top-level `users/{userId}/incidents/{id}` with `petId` as stored field. BR-29 reassignment is now a one-line `setDoc` instead of a transactional cross-path move. Departs from project convention but is structurally justified by BR-29's reassignment requirement (logged in §D3 rationale). DQ-6 (active-incident lookup mechanism) dissolved — no collection-group needed; user-scoped collection is path-implicit. Indexes table rewritten: `(petId, deletedAt, startedAt desc)` for history; `(endedAt, deletedAt)` for active-lookup.
  - **CRITICAL D17 (BR-26 resume-existing missing from FAB tap-behavior table):** added a top row to the table — any surface, any pet count, active incident exists → navigate to `/incidents/active`. AC-11 now has its design analog.
  - **HIGH D18 (zero-pet FAB silently overrode spec):** chose spec amendment. BR-27 amended in spec to add explicit zero-pet exception; §D2 hide-condition cite updated to point at the BR-27 exception rather than a derivation.
  - **HIGH D19 (4 DQs open against the §D5 gate):** resolved by closing DQ-6, DQ-7 in this round (DQ-6 dissolved; DQ-7 picked bottom Drawer). DQ-4 and DQ-5 still open but tracked.
  - **MEDIUM D20 (color contradiction):** rewrote §D1 color table. Honest about the `#1A0E08` vs `#1A1208` mismatch and the no-exact-match for `#FFEDEA`. Added DQ-8 to track the designer-confirmation question rather than handwaving.
  - **MEDIUM D21 (Firestore array semantics):** added explicit RMW pattern in §D3 with pseudocode for `appendJournal` and `toggleChip`; called out why `arrayUnion` is wrong for both; documented the single-writer-per-incident assumption that makes RMW safe.
  - **MEDIUM D22 (verification gaps):** added AC-19, AC-20, AC-21, AC-22, AC-23 + carry-over chip test + resume-existing test + soft-delete-of-active test to §D10.
  - **MEDIUM D23 (BR-21 implementation home):** added `incidentService.getRecentTypesForPet(petId, limit=10)` to file map with implementation note; index already covered by the per-pet history composite.
  - **MEDIUM D24 (i18n null shape):** dropped the `callVetMissing: null` key; replaced with a JSON comment documenting the deliberate absence.
  - **§D7 rules:** match path moved from `/users/{userId}/pets/{petId}/incidents/...` to `/users/{userId}/incidents/...` (top-level), matching the new layout. Convention citation updated to point at vets/petVets/vetKeys (which are also user-scoped non-pet subcollections) rather than feedings/medications/doseLogs.
  - **DQ-8 added:** Caregiver theme color tokens vs wireframe palette mismatches need designer confirmation. Not blocking tasks phase but blocking pixel-accurate visual QA.
- **2026-05-02 round 24** — Amended §D6 to add an explicit Deferrals note covering (a) `incidents.chips.*` deferred to T-20 pending DQ-5, and (b) Spanish English-value stubs as a scoped v1 exception (real JSON cannot carry the JSONC `// TODO i18n-es` marker shown in the example). Resolves spec_gap from T-05 (cold-reader vetoed on the §D6/NFR-5 silent-resolution; both deferrals were in T-05's task body but not in cited design). Drift-arbiter agent's first `amend_design` verdict (round 24); applied verbatim. No other §D6 content changed.
- **2026-05-02 round 25** — Amended §D3 TypeScript interface to extend `BaseEntity` and use `Date` for all timestamp fields (`startedAt`, `endedAt`, `deletedAt`, plus inherited `createdAt`/`updatedAt`), aligning with the project-wide repository contract (every other entity in `src/repositories/` extends `BaseEntity`; `BaseRepository`'s converters round-trip Date ↔ Firestore Timestamp). Added `createdBy: string` (inherited from `BaseEntity`); `userId` retained as a separate stored field because it's both the owner and the query-convenience field for security rules (NFR-8). Updated `IncidentCreateInput`/`IncidentUpdateInput` to omit `createdBy`. `JournalEntry.addedAt` also flipped string → Date for symmetry; in-array Date storage is fine because the array entries are plain objects converted by `BaseRepository`'s recursive `convertTimestamps`/`convertDates` walkers. Resolves spec_gap from T-06 (the as-shipped Incident type from T-01 used ISO strings, which contradicted §D3's "Follow `PetMedicationRepository` pattern" instruction — `PetMedicationRepository` extends `BaseRepository<T extends BaseEntity>` which requires Date). Five rounds of design cold-reads (rounds 1, 3, 4, 5, 24) missed this; surfaced by builder pre-flight on T-06 (round 25). Drift-arbiter `amend_design`; T-01's `src/features/incidents/types.ts` updated in the same PR as a paired chore commit. No spec change. No behavior change. **Methodology note:** this is the second `amend_design` verdict (after round 24's §D6 deferrals); both surfaced from the foundation/early-slice work where types were defined ahead of consumers. Carry-over candidate fixture for PR-B per-verdict arbiter cases.
- **2026-05-02 round 31** — Amended §D2 file map: added a post-STOP store invariant comment to `useIncidentStore.ts` clarifying that `stopIncident()` sets `endedAt` on `activeIncident` rather than nulling it; `activeIncident` clears to null only on `startIncident()`, explicit user dismissal from the stopped surface, or auth sign-out. Resolves spec_gap from T-13 (round-31 cold-reader HIGH #3: silent design choice on BR-14 — `stopIncident()` nulling `activeIncident` caused `ActiveIncidentPage` to redirect on STOP, violating BR-14). Drift-arbiter `amend_design` verdict (third `amend_design` ever; first to be applied via the live `harness arbitrate-run` dispatch). T-08's `stopIncident()` implementation (already shipped in PR #170) updated in the same PR as a paired chore commit to align with the new invariant before T-13 re-dispatch.
