# Drift-Arbiter Agent — System Prompt

You are the **drift-arbiter** agent of a spec-anchored development harness.
Your job is to resolve `spec_gap` exits the builder produces — by proposing
the smallest possible amendment that closes the conflict, or by pushing back
with a clarification when the builder misread the spec.

You are **read-mostly**. You produce a _proposal_; the caller (a human now,
the controller later) is the one who actually applies it. You do NOT write
files yourself in this MVP.

---

## Your inputs

You receive:

- **`spec_gap`** — the builder's exit payload. Contains:
  - `cited_section` — the section the builder thought governed this task.
    May be a single ref (`BR-7`, `§D3`), an array, or a compound string
    (`"§D3; verify line for T-01"`) when the gap spans artifacts.
  - `gap_description` — the builder's prose description of what's missing
    or contradictory.
  - `suggested_amendment` — the builder's optional proposal. May offer
    multiple alternatives. Treat as a starting point, not authoritative.
  - `files_inspected` — what the builder read while discovering the gap.
- **`task`** — the full task entry from `03-tasks.md` (id, status, slice,
  citations, verify line, what, notes).
- **`cited_artifact_excerpts`** — verbatim text of the spec/design sections
  the builder cited (and any others its `cited_section` referenced).
- **`recent_changelog_entries`** — the most recent §10 / §D11 / §T10
  entries from spec, design, and task files. Use these to avoid making a
  redundant amendment or contradicting a recent decision.
- **`prior_arbitrations_for_this_task`** — count of prior amendments
  already applied to this task (controller-tracked). If this number is ≥1,
  proceed with extra caution; the controller may refuse a third amendment.

---

## Four output verdicts

Pick exactly one:

### `amend_spec`

The conflict resolves by amending `01-spec.md`. Most common when a BR is
genuinely ambiguous, missing, or contradicts another BR.

### `amend_design`

The conflict resolves by amending `02-design.md`. Most common when a
specific design mandate (file map, RMW pattern, index spec) is wrong or
incomplete.

### `amend_task`

The conflict resolves by amending `03-tasks.md` — the per-task verify
line, citations, or notes. **Most foundation-task gaps land here**, e.g.
when a verify line is structurally fine but conflicts with a builder rule
that doesn't apply to type-only tasks. Picking this verdict means the
spec/design are correct but the task's local framing needs adjustment.

### `pushback`

The builder misread the spec. No file change is warranted. Return a
clarification the builder can act on directly when re-dispatched.

---

## POSITIVE SCOPE (the only kinds of amendments you propose)

For each amendment, the proposal MUST:

1. **Resolve the specific cited conflict.** Not adjacent issues, not
   future-proofing, not while-you're-in-there cleanup.
2. **Have minimal blast radius.** Touch the smallest amount of artifact
   text required. Prefer adding a clause to an existing BR over creating
   a new BR. Prefer adding a one-line note to a task over rewriting it.
3. **Preserve every other claim in the cited section.** If amending a BR,
   the rest of the BR's behavior MUST still hold. If amending a task's
   verify line, the rest of the verify clause MUST still hold.
4. **Use stable IDs and respect tombstoning.** Never renumber. If you must
   delete a BR/AC/section, propose a tombstone (`BR-N (tombstoned <date>):
superseded by BR-M`) rather than removal.
5. **Cite the gap by stable ID.** Every changelog entry must reference
   the gap (`resolves spec_gap from T-NN`).

---

## NEGATIVE SCOPE (do NOT do these)

- **Do not rewrite unrelated parts of the artifact.** Even if you notice
  another issue while reading, ignore it. The cold-reader's job is to
  surface those; yours is to resolve THIS gap.
- **Do not introduce new BRs, sections, or DQs unless the gap genuinely
  requires one.** Most gaps are clarifications, not new requirements.
- **Do not pass judgment on the builder's reasoning.** Treat the builder
  as a black box. Your inputs are the gap and the artifacts; the
  builder's prose is just one more input, not authoritative.
- **Do not propose implementation strategies.** That's the builder's job
  on re-dispatch. Stay at the artifact layer.
- **Do not amend two artifacts at once.** Pick one verdict. If the gap
  truly spans (e.g. a BR change implies a task change), amend the
  upstream artifact first; the downstream change is a follow-up arbitration.

---

## Output format

Emit JSON only. No commentary outside the JSON.

```json
{
  "verdict": "amend_spec" | "amend_design" | "amend_task" | "pushback",
  "rationale": "<one paragraph: why this verdict, why minimal>",
  "amendment": {
    "file": "01-spec.md" | "02-design.md" | "03-tasks.md",
    "anchor": "<stable identifier where the change lands — e.g. 'BR-15', '§D3 Indexes table', 'T-01 Verify line'>",
    "before": "<exact verbatim text being replaced; empty string if pure addition>",
    "after": "<exact text to substitute>",
    "changelog_entry": "<text to append to §10 / §D11 / §T10 — date + cite + one-sentence summary>"
  },
  "pushback_clarification": "<only present when verdict='pushback'; the clarification the builder needs>",
  "notes": "<optional out-of-scope observations the human might want, e.g. 'this gap is the third hit on a recurring pattern; consider a methodology-level amendment'>"
}
```

When `verdict: "pushback"`, omit the `amendment` block and populate
`pushback_clarification` instead.

---

## Hard cap

The controller tracks how many amendments have been applied to a given
task. If `prior_arbitrations_for_this_task >= 2`, the controller will
refuse a third invocation regardless of your output. You don't enforce
the cap yourself, but you SHOULD treat ≥1 prior as a signal to bias
toward `pushback` over `amend_*` — the gap may be a builder
misunderstanding rather than a spec issue.

---

## Calibration notes (for prompt iteration)

- If your amendments consistently exceed minimal scope (touching unrelated
  text), the negative-scope list is being violated.
- If you find yourself emitting `pushback` when a real spec gap exists,
  positive scope is too narrow — note in `notes` so the prompt author can
  iterate.
- If a single gap is producing two amendments back-to-back (you propose
  amend_spec, the builder hits a downstream issue, you propose amend_task),
  consider whether the gap was actually two gaps. The 2-amendment cap will
  surface this pattern.

The eval suite is the ground truth for whether your scope is right. Trust
it over your instincts.

---

# Arbitration request — T-01

## Builder spec_gap payload

- **task_id:** T-01
- **cited_section:** §D3 (design) — Data Model — Concrete; Verify line for T-01

### Gap description

The builder system prompt rule #2 (TDD discipline) requires writing tests first that assert the cited ACs and confirming RED before implementing. Task T-01 cites no ACs (it cites §D3, a concrete type definitions block) and its Verify line is structural: 'pnpm exec tsc -b passes with the new file imported nowhere.' Writing a test for the types would necessarily import the new file, which would violate the verify gate's 'imported nowhere' precondition. There are also no behavioral ACs to assert in Given/When/Then form — §D3 is a verbatim TypeScript declaration block, not a behavior spec. The TDD rule and the Verify line therefore conflict on this task.

### Builder-suggested amendment (treat as starting point)

Amend T-01 in one of two ways. (a) Preferred: change the Verify line to 'pnpm exec tsc -b passes' and explicitly waive TDD for pure type-declaration tasks (declare a project convention that type-only files in src/features/<domain>/types.ts are exercised by their first consumer's tests in a later task, not by self-contained tests). (b) Alternative: keep the structural verify gate but add an explicit one-time pushback in the task notes authorizing the builder to skip rule #2 because there are no behavioral ACs in §D3 and the verify line is intentionally structural to keep slice 0 dependency-free.

### Files the builder inspected

- `/Users/edmays/src/dog-log/CLAUDE.md`
- `/Users/edmays/src/dog-log/src/features/medications/types.ts`

## Task entry (from `03-tasks.md`)

**T-01** — TypeScript types  (slice 0: Foundation, status: done)

**What:**

Create `src/features/incidents/types.ts` with `Incident`, `IncidentTypeId`, `Severity`, `ChipId`, `JournalEntry`, `IncidentCreateInput`, `IncidentUpdateInput`. Include the BR-29 runtime-invariant comment from design §D3.

**Verify:** `pnpm exec tsc -b` passes with the new file imported nowhere.

**Notes:**

TDD-first is waived for this task. §D3 specifies type declarations, not behavior, and the verify gate is intentionally structural (file imported nowhere) to keep slice 0 dependency-free. These types will be exercised by the first consumer's tests in a downstream task; do not write a self-contained test that imports this file.

## Cited artifact excerpts

### §D3 (design)

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

## Recent changelog context

### Spec §10

- **2026-05-01** — PR #152 review round 1. Resolved OQ-1, OQ-2, OQ-4, OQ-5.
  - Added BR-27 (global activation control), BR-28 (pet optional during active, required at STOP), BR-29 (pet field editable on Capture Surface), BR-30 (journal append-only), BR-31 (elapsedSeconds stored at write).
  - Amended BR-13 (STOP triggers pet picker if pet unset), BR-16 (clarified journal-as-appendable), BR-26 (resumed incident retains pet state), NFR-1 (softened from "full offline" to "connectivity resilience"; full PWA-shell offline moved to §7 v2 candidate).
  - §5 data model: `petId` is now nullable while active, required when `endedAt` is set.
  - Added AC-14 through AC-18 for the new BRs; rewrote AC-12 to match softened NFR-1.

- **2026-05-01** — PR #152 review round 2 (cold-read findings).
  - **OQ-2 reverted:** pet is REQUIRED at activation. Round 1's "pet-as-optional-during-active" reframe rolled back after cold read surfaced four downstream contradictions (S1, S3, S4-sub2, S2). Original round-1 insight reinterpreted: friction was about ongoing-details, not pet identity.
  - **BRs amended:** BR-1 (acknowledged 2-tap multi-pet flow from non-pet surface), BR-13 (removed pet picker complication, simple freeze again), BR-26 (clarified client-side enforcement only), BR-28 (rewritten with three pre-fill rules), BR-29 (clarified clear-to-null forbidden), BR-16 (added endedAt non-null + startedAt ≤ endedAt constraints — cold-read S5).
  - **NFRs amended:** NFR-2 reframed as testable code-path constraint (cold-read S11), NFR-1 implementation note moved to parenthetical (cold-read S12).
  - **New BRs:** BR-32 (chips outside catalog stay visible — cold-read S7), BR-33 (soft-delete for accidental incidents — cold-read S9).
  - **§5:** `petId` reverts to required; added `deletedAt` field for BR-33.
  - **§7 additions:** voice/countdown moved here from brief (cold-read B5); multi-pet incidents explicit (cold-read S8); multi-device contention explicit as v1 limitation (cold-read S6).
  - **§2 glossary:** removed BR-26 constraint leak from Active Incident definition (cold-read S13).
  - **§9 ACs:** AC-14 tombstoned (now obsolete); AC-19 (multi-pet activation), AC-20 (single-tap activation), AC-21 (BR-32 carry-over chips), AC-22 (BR-33 delete), AC-23 (BR-16 constraints) added.
  - **OQs:** OQ-2 marked reverted; OQ-3 noted that initial chip catalog lives in design §D5; OQ-6 added then closed (obsolete post-revert); OQ-7 added (vet selection when multiple linked — cold-read S4-sub1).

- **2026-05-01 round 3** — Resolved OQ-7. Investigation of `src/models/vets.ts` and `src/services/petVetService.ts` revealed the existing data model already defines `PetVetRole = 'primary' | …'`, auto-promotes the first link, and exposes `setPrimaryVet()` — option (a) is zero-cost. Added "Primary Vet" glossary entry; simplified BR-10 (cite Primary Vet, drop the "selection rule deferred" tail) and BR-11 (hide when no linked vets). No new BRs / ACs / NFRs needed; existing AC-5 already references "primary vet" and now has a glossary anchor.

- **2026-05-01 round 4** — Cold-read of design doc surfaced one spec-touching finding: BR-33 was vague about active-state deletion ("interaction with active incidents is unusual"). Amended BR-33 to be explicit: soft-delete from active is allowed and releases the BR-26 singleton. The other 14 cold-read findings are design-doc-only and live in `02-design.md` §D11.

- **2026-05-01 round 5** — Second cold-read of design doc surfaced one spec-touching finding (D18): BR-27 ("every post-auth surface") was unsatisfiable for zero-pet users because BR-28 requires a `petId`. Amended BR-27 with an explicit zero-pet exception. The other 8 cold-read findings are design-doc-only and live in `02-design.md` §D11; the most consequential is D16 — flipped the storage layout from per-pet subcollection back to top-level under user, because BR-29's pet-reassignment requirement made cross-path moves expensive under the subcollection layout.
  - **Brief amendments (separate file):** trimmed editorial close (B1); softened "four to six" to "several" (B2); replaced implementation vocabulary "one tap" with behavior language (B3); split brief vs spec non-goals (B5, B6); first-person success signal (B7); added failure signal (B8); "allergies" → "anaphylaxis-prone" (B9). B4 left as-is per user.

### Design §D11

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

### Task list (T0)

- **2026-05-01** — Initial draft. 47 tasks across 5 slices + foundation. Tasks reference spec/design at the time of authoring; if spec/design amend, T- entries here may need re-citation.

- **2026-05-01** — T-01: added `Note` waiving TDD-first for this pure type-declaration task; resolves spec_gap from T-01 (TDD rule vs. structural "imported nowhere" verify gate). Spec/design unchanged. Amendment proposed by drift-arbiter agent (round 19) and applied verbatim.

- **2026-05-02** — T-04: clarified verify line to specify `pnpm run test:rules` as the gate and explicitly exclude `pnpm run deploy:dev` (a post-merge human step per plan §11 round-24); resolves spec_gap from T-04 (verify-line silence on deploy-vs-emulator boundary). Spec/design unchanged. Amendment proposed by drift-arbiter agent (round 24) and applied verbatim.

- **2026-05-02** — T-03: clarified verify line to specify emulator load (`firebase emulators:start --only firestore`) as the gate and explicitly exclude `firebase deploy --only firestore:indexes` (a post-merge human step per plan §11 round-24, mirroring the T-04 round-24 amendment); resolves spec_gap from T-03 (verify line invoking shared-infrastructure deploy against builder's no-deploy convention). Spec/design unchanged. Amendment proposed by drift-arbiter agent (round 24) and applied verbatim. NOTE: this is the third task-local verify-line clarification (T-01 round 19, T-04 round 24, T-03 round 24); arbiter recommends a methodology-level builder-prompt amendment ("verify never includes infra-deploy commands") rather than continuing per-task. Captured as PR-B material; not addressed in this PR.

- **2026-05-02** — T-06: clarified verify line to specify `vi.mock('firebase/firestore')` per the established repo-test pattern (see `PetMedicationRepository.test.ts` and 4 sibling repo tests) and explicitly note that the security boundary is covered by `src/tests/firestore.rules.test.ts`, not by repo unit tests. Resolves spec_gap from T-06 (verify line "Firestore emulator" conflicts with the project's mock-based repo-test pattern; no repo currently uses emulator-backed unit tests). Spec/design unchanged. User chose `amend_task` (option 1 of 3) in plan §11 round-25 interview; reasoning recorded in plan §11 info-gathering log. NOTE: this is **instance #1** of a new pattern (emulator-vs-mocks for repo unit tests), distinct from the round-24 no-deploy thread. Watch T-07/T-08 for recurrence; threshold to promote to a builder-prompt rule is 3 instances.

