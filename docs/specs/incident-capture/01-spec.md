# Spec: Incident Capture

> Status: draft · Owner: Ed Mays · Created: 2026-05-01
> Brief: [`00-brief.md`](./00-brief.md)

## §1 Summary

The Incident Capture surface lets a caregiver record a pet medical event in real time with one-tap entry, auto-tracked duration, and never-required fields. An incident is the generalized primitive (seizures, injuries, GI events, allergic reactions, etc.) and supports type-specific observations without forcing type selection up front. Captured entries remain editable forever so the caregiver can refine or reclassify after talking to a vet.

## §2 Glossary

| Term                     | Definition                                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Incident**             | A discrete medical event for a single pet, with a start time, duration, optional type, optional severity, optional observation tags, and optional free-text journal. The atomic unit this feature operates on.               |
| **Incident Type**        | A classification of the incident (e.g. seizure, injury, vomiting, choking, allergic reaction, collapse, ingestion, other). Always optional; mutable post-hoc.                                                                |
| **Severity**             | A coarse caregiver-assigned rating: `mild`, `moderate`, `severe`. Optional and mutable.                                                                                                                                      |
| **Observation Chip**     | A single-tap-toggleable tag attached to an incident, scoped to its current type (e.g. for a seizure: "loss of consciousness", "blindness", "thirst after"). The chip catalog per type is curated, not user-extensible in v1. |
| **Journal Entry**        | A timestamped free-text line appended to an incident's journal. Each line auto-stamps with the elapsed time at write.                                                                                                        |
| **Active Incident**      | An incident whose timer has been started and STOP has not yet been pressed. At most one active incident may exist per user at any time.                                                                                      |
| **Capture Surface**      | The single screen the caregiver interacts with for an incident, both during and after the event.                                                                                                                             |
| **Emergency Activation** | Any user action that creates a new incident and starts its timer in the same gesture (one tap, no intervening confirmation).                                                                                                 |

## §3 User Stories

- **US-1** — As a caregiver mid-event, I tap one control and a timer starts immediately so I never lose seconds fumbling.
- **US-2** — As a caregiver during an incident, I tap a severity chip with one hand to record how bad it is without typing.
- **US-3** — As a caregiver during an incident, I tap observation chips relevant to what I'm seeing without choosing a type first.
- **US-4** — As a caregiver during an incident, I can dump free-text notes into a journal that auto-stamps each line with elapsed time.
- **US-5** — As a caregiver during an incident, I can call the pet's vet with one tap from the same surface.
- **US-6** — As a caregiver, I tap STOP to mark the event ended; the timer freezes and the entry is saved.
- **US-7** — As a caregiver, after STOP I can keep adding chips, journal lines, severity, and a type to the same entry without leaving the surface.
- **US-8** — As a caregiver, I can re-open a saved incident days, weeks, or months later and edit any field, including changing the type after a vet's diagnosis.
- **US-9** — As a caregiver, I can see a chronological list of past incidents per pet so I can spot patterns and brief a vet.
- **US-10** — As a caregiver, when I select an incident type, the observation chips update to that type's curated set without losing chips I had already tapped.

## §4 Behavioral Requirements

### Capture & timing

- **BR-1** — The system MUST allow the caregiver to create a new incident in a single user gesture (≤1 tap from any post-auth surface).
- **BR-2** — The incident timer MUST start at the moment of the creation gesture, before any network or persistence operation completes.
- **BR-3** — The timer MUST display elapsed time live, with second-level resolution, while the incident is active.
- **BR-4** — The system MUST NOT require the user to select an Incident Type before starting the timer.
- **BR-5** — The system MUST NOT show a confirmation prompt or countdown before starting the timer (deferred per brief non-goals).

### Active-incident editing

- **BR-6** — During an active incident, severity MUST be settable, changeable, and clearable by single-tap chip interaction.
- **BR-7** — During an active incident, observation chips MUST be toggleable (on/off) by single-tap, with no required minimum.
- **BR-8** — During an active incident, the caregiver MUST be able to append to a free-text journal field.
- **BR-9** — Each journal append MUST auto-prefix with the elapsed time at the moment of append (HH:MM:SS from start).
- **BR-10** — During an active incident, the system MUST surface a one-tap call action for the pet's primary vet IF a vet phone number exists on file; the action MUST resolve to the platform's `tel:` handler.
- **BR-11** — The call action MUST be hidden (not disabled) when no vet phone number is on file.

### STOP & post-event

- **BR-12** — A STOP action MUST be available throughout the active incident.
- **BR-13** — On STOP, the timer MUST freeze at the current elapsed time and the incident MUST persist with `endedAt = now`. If the incident has no `petId` set at STOP, the system MUST prompt for pet selection inline; STOP does not complete until a pet is selected. Cancelling the prompt MUST leave the incident active (timer resumes).
- **BR-14** — On STOP, the surface MUST remain open with all fields editable; the user MUST NOT be navigated away.
- **BR-15** — Persistence on STOP MUST tolerate offline conditions: the entry MUST be locally durable and sync when connectivity returns. (See §6 NFR-1.)

### Indefinite editability

- **BR-16** — A saved incident MUST remain editable for severity, type, observation chips, pet, start time, and end time, with no time limit. "Editable for journal" means _appendable_ per BR-29; existing journal entries are immutable.
- **BR-17** — Editing a saved incident MUST NOT require a separate "edit mode"; any field is directly tappable on the same surface.
- **BR-18** — The system MUST record `updatedAt` on every persisted change but MUST NOT surface "edited" indicators to the caregiver.

### Type & chip behavior

- **BR-19** — When an Incident Type is selected (or changed) on an active or saved incident, the observation chip catalog MUST update to that type's set.
- **BR-20** — Chips already toggled-on MUST be preserved across a type change even if they are not in the new type's curated catalog (i.e. chip values are stored as opaque tags, not foreign keys to a per-type chip table).
- **BR-21** — The Type picker MUST sort types by most-recently-used for the current pet first, then alphabetically.
- **BR-22** — Selecting a Type on an existing incident MUST NOT modify any other field.

### List & history

- **BR-23** — The system MUST provide a per-pet chronological list of incidents, most recent first.
- **BR-24** — The list MUST show: start time, duration, type (or "untyped"), severity (or blank), and a one-line excerpt of the journal (or blank).
- **BR-25** — Tapping a list entry MUST open the same Capture Surface used during the live event, with all fields editable per BR-16.

### Concurrency

- **BR-26** — At most one Active Incident MAY exist per user across all their pets at any time. Attempting Emergency Activation while one is already active MUST resume the existing active incident, including its current pet-set/unset state.

### Activation surface (added 2026-05-01, OQ-1)

- **BR-27** — Emergency Activation MUST be reachable via a global control on every post-auth surface (e.g. a persistent floating action button). The control MUST NOT be hidden behind navigation or scrolling.

### Pet assignment (added 2026-05-01, OQ-2)

- **BR-28** — `petId` is OPTIONAL during an active incident: the timer, severity, observation chips, and journal MUST function with no pet set. `petId` MUST be set before STOP completes (see BR-13). When Emergency Activation occurs from a pet-scoped surface (e.g. a pet's detail page), `petId` MUST be pre-filled to that pet; otherwise it starts unset.
- **BR-29** — The pet field MUST be settable, changeable, and clearable on the Capture Surface like other editable fields, both during the active incident and on saved incidents (subject to BR-13's constraint that a stopped incident always has a pet).

### Journal immutability (added 2026-05-01, OQ-4)

- **BR-30** — Journal entries are append-only. Once written, an entry's `text`, `elapsedSeconds`, and `addedAt` MUST NOT be edited or deleted in v1. New entries MAY be appended to a stopped incident at any time; their `elapsedSeconds` is computed against the incident's `startedAt` at the moment of append.

### Time-edit semantics (added 2026-05-01, OQ-5)

- **BR-31** — `elapsedSeconds` on each journal entry is stored at write time and MUST NOT be recomputed. If a caregiver later edits `startedAt` on a saved incident, existing journal entries retain their original `elapsedSeconds` values; they are historical observations, not derivatives of `startedAt`.

## §5 Data Model

Logical shape only — Firestore layout, indexes, and TypeScript types are deferred to design.

**Incident**

- `id` — string, system-assigned
- `petId` — string, OPTIONAL while incident is active; REQUIRED when `endedAt` is non-null (per BR-13, BR-28).
- `userId` — string, required (owning caregiver, for security rules)
- `startedAt` — instant, required
- `endedAt` — instant, optional (null while active)
- `type` — string enum value, optional. Allowed values: `seizure`, `injury`, `vomiting`, `choking`, `allergic_reaction`, `collapse`, `ingestion`, `other`. (Initial v1 set; new types are spec changes, not user input.)
- `severity` — enum, optional: `mild | moderate | severe`
- `chips` — set<string>, possibly empty. Stored as opaque tag strings (per BR-20).
- `journal` — ordered list of `{ elapsedSeconds: int, text: string, addedAt: instant }`
- `createdAt` — instant, server-assigned
- `updatedAt` — instant, server-maintained

**Type Catalog (static, in code, not Firestore)**

- Per type: display label (i18n key), default chip set (list of `{ id, i18n key }`).
- Initial chip sets are spec-defined; resolved in design phase.

**Per-Pet Type-Recency (derived, not stored separately)**

- Most-recently-used type per pet is computed by querying the pet's incidents ordered by `startedAt desc`. No separate denorm needed in v1; revisit if list size makes this slow.

**Relationships**

- Incident → Pet (many-to-one)
- Incident → Vet phone (read-only, looked up via existing pet→vet relationship)

## §6 Non-Functional Requirements

- **NFR-1 (Connectivity resilience)** — Brief network interruptions (seconds-to-minutes) MUST NOT lose in-flight data: in particular, taps on severity/chips, journal appends, and STOP MUST be queued locally and synced when connectivity returns, and the UI MUST NOT block on network round-trips. Full airplane-mode-from-cold-start is OUT of scope for v1; it is recorded as a v2 candidate (see §7). The Firestore SDK's built-in offline persistence is sufficient to meet the v1 bar — no separate service worker / PWA shell required.
- **NFR-2 (Latency)** — From the user's tap to timer first frame visibly running, the median delay MUST be ≤200ms on a mid-range mobile device.
- **NFR-3 (One-thumb operation)** — All controls on the Capture Surface MUST be reachable and tappable with a single thumb on a 6.1" portrait phone screen. Minimum tap target 44×44 CSS px.
- **NFR-4 (Dark mode primary)** — The Capture Surface MUST render correctly in the existing dark theme; light and caregiver themes MUST also work but dark is the design target (per memory file).
- **NFR-5 (i18n)** — All user-visible strings MUST be in `src/locales/{en,es}/common.json`; no hardcoded copy. Type and chip labels are i18n keys.
- **NFR-6 (Accessibility)** — Severity, chip, and STOP controls MUST have accessible names; the timer MUST be announced as a live region (polite) so screen readers can hear updates without flooding.
- **NFR-7 (Tone)** — No streak/gamification UI. No "drafts" framing. No "X days since last incident" counters. Historical entries may belong to a deceased pet — copy MUST stay neutral and respectful (per memory file).
- **NFR-8 (Security)** — Firestore rules MUST restrict incident reads/writes to the owning `userId`. A caregiver MUST NOT be able to read or write incidents for a pet they don't own.

## §7 Out of Scope (v1)

- Voice dictation into the journal.
- A confirmation countdown before Emergency Activation.
- Native iOS, Apple Watch, Siri Shortcuts, or any platform leap.
- A "drafts" inbox or "needs-details" flag on incomplete entries.
- Streak metrics or any gamification.
- User-extensible chip catalogs (chips per type are spec-defined in v1).
- User-extensible Incident Type list.
- Sharing an incident with a vet by email/PDF/link.
- Multi-user collaborative editing of the same active incident (e.g. two caregivers in the same household).
- Photo or video attachments inside an incident.
- Capture-grid home surface and status strip — _separate feature, separate spec._ Incident Capture covers the Capture Surface itself and the per-pet history list; the grid that launches it is downstream.
- Full-offline / airplane-mode operation from cold start (PWA shell, service worker). Recorded as a v2 candidate; v1 ships with Firestore SDK's built-in connectivity resilience only (see NFR-1).

## §8 Open Questions

- **OQ-1** — ✅ **Resolved 2026-05-01** (PR #152): option (a) — global FAB always visible post-auth. Codified as BR-27.
- **OQ-2** — ✅ **Resolved 2026-05-01** (PR #152): pet is itself an editable field, optional during the active incident, required at STOP. Codified as BR-28, BR-29 and BR-13 amendment. The "select pet from non-pet-scoped surface" friction is sidestepped because the caregiver doesn't have to pick at activation — they pick when convenient, and STOP enforces it.
- **OQ-3** — Open. What is the v1 chip catalog per Incident Type? Memory file gives examples for seizure ("blindness", "thirst after"); the rest need to be enumerated. _Content work, not architecture — resolves during design phase._
- **OQ-4** — ✅ **Resolved 2026-05-01** (PR #152): journal is append-only after STOP. Existing entries never edited or deleted in v1; new entries can be appended at any time. Codified as BR-30.
- **OQ-5** — ✅ **Resolved 2026-05-01** (PR #152): `elapsedSeconds` is stored at write time and never recomputed, even if `startedAt` is later edited. Codified as BR-31.

## §9 Acceptance Criteria

Each AC corresponds to one or more user stories and behavioral requirements. These become the names of integration / component tests. Phrased Given/When/Then.

- **AC-1 (US-1, BR-1, BR-2, NFR-2)** — _Given_ a signed-in caregiver on any post-auth surface, _when_ they perform Emergency Activation, _then_ the Capture Surface opens and a running timer is visible within 200ms.
- **AC-2 (US-2, BR-6)** — _Given_ an active incident, _when_ the caregiver taps a severity chip, _then_ that severity is recorded; tapping the same chip again clears it; tapping a different one replaces it.
- **AC-3 (US-3, BR-7, BR-4)** — _Given_ an active incident with no Type selected, _when_ the caregiver taps observation chips, _then_ the chips toggle without forcing a Type choice.
- **AC-4 (US-4, BR-8, BR-9)** — _Given_ an active incident running for 1m32s, _when_ the caregiver appends a journal line, _then_ the line is recorded with `elapsedSeconds = 92`.
- **AC-5 (US-5, BR-10, BR-11)** — _Given_ an active incident for a pet whose primary vet has a phone number, _when_ the caregiver taps the call action, _then_ the platform's `tel:` handler is invoked with that number. _Given_ no vet phone is on file, _then_ the call action is not rendered.
- **AC-6 (US-6, BR-13, BR-14)** — _Given_ an active incident, _when_ the caregiver taps STOP, _then_ the timer freezes, the incident persists with `endedAt = now`, and the surface stays open with all fields still editable.
- **AC-7 (US-7, BR-16, BR-17)** — _Given_ a stopped incident still on screen, _when_ the caregiver adds a chip, edits severity, or appends to the journal, _then_ the change persists without entering a separate edit mode.
- **AC-8 (US-8, BR-16, BR-22)** — _Given_ a saved incident from 30 days ago, _when_ the caregiver opens it and changes Type from "seizure" to "syncope-other", _then_ the Type updates and severity, chips, and journal are unchanged.
- **AC-9 (US-9, BR-23, BR-24, BR-25)** — _Given_ a pet with three saved incidents, _when_ the caregiver opens the pet's incident history, _then_ they see all three most-recent-first with start time, duration, type, severity, and journal excerpt; tapping one opens the Capture Surface for that incident.
- **AC-10 (US-10, BR-19, BR-20)** — _Given_ an active incident with type "seizure" and chips A, B (where B is seizure-specific), _when_ the caregiver changes Type to "injury", _then_ the chip catalog shows injury chips and chips A, B remain attached to the incident.
- **AC-11 (BR-26)** — _Given_ an active incident already exists, _when_ the caregiver performs Emergency Activation, _then_ the existing active incident is resumed rather than a second one created.
- **AC-12 (NFR-1, BR-15)** — _Given_ an active incident on a device that loses connectivity for 60 seconds mid-event, _when_ the caregiver taps chips, appends a journal line, and taps STOP during the outage, _then_ the UI responds without blocking and all queued changes sync to Firestore once connectivity returns. (Cold-start airplane mode is out of scope per §7.)
- **AC-13 (NFR-8)** — _Given_ caregiver A signed in, _when_ caregiver A attempts to read or write an incident owned by caregiver B, _then_ Firestore rules reject the operation.
- **AC-14 (BR-13, BR-28)** — _Given_ an active incident with no `petId` set, _when_ the caregiver taps STOP, _then_ a pet picker appears inline; selecting a pet completes STOP with that `petId`; cancelling the picker leaves the incident active and the timer running.
- **AC-15 (BR-29, BR-16)** — _Given_ a saved incident with `petId = X`, _when_ the caregiver changes the pet to Y, _then_ the incident is now associated with Y; severity, type, chips, and journal are unchanged; the incident no longer appears in pet X's history list.
- **AC-16 (BR-30)** — _Given_ a stopped incident with three journal entries, _when_ the caregiver appends a fourth entry, _then_ the new entry is added with `elapsedSeconds` computed against `startedAt`; the original three entries are unchanged. Attempting to edit or delete an existing entry has no effect (no UI affordance exposed).
- **AC-17 (BR-31)** — _Given_ a saved incident with `startedAt = T0` and a journal entry with `elapsedSeconds = 90`, _when_ the caregiver edits `startedAt` to `T0 + 30s`, _then_ the journal entry's `elapsedSeconds` remains 90.
- **AC-18 (BR-27)** — _Given_ the caregiver is on any post-auth surface (pet detail, settings, history list, etc.), _when_ they look for the activation control, _then_ a global activation control is present and reachable without scrolling or opening a menu.

## §10 Spec Changelog

- **2026-05-01** — Initial draft.
- **2026-05-01** — PR #152 review round 1. Resolved OQ-1, OQ-2, OQ-4, OQ-5.
  - Added BR-27 (global activation control), BR-28 (pet optional during active, required at STOP), BR-29 (pet field editable on Capture Surface), BR-30 (journal append-only), BR-31 (elapsedSeconds stored at write).
  - Amended BR-13 (STOP triggers pet picker if pet unset), BR-16 (clarified journal-as-appendable), BR-26 (resumed incident retains pet state), NFR-1 (softened from "full offline" to "connectivity resilience"; full PWA-shell offline moved to §7 v2 candidate).
  - §5 data model: `petId` is now nullable while active, required when `endedAt` is set.
  - Added AC-14 through AC-18 for the new BRs; rewrote AC-12 to match softened NFR-1.
