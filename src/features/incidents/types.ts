// Incident capture feature — TypeScript types per spec §5 and design §D3.
// This file is intentionally not imported anywhere yet (slice 0 foundation).
// Downstream tasks will import these types and exercise them via tests.

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
  petId: string; // BR-28 — required at all times
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

// BR-29's "never cleared" invariant is enforced at runtime in
// incidentService.update() — the type allows `petId?: string`, which still
// admits a malformed `''` or a cast `null`. Tests in incidentService.test.ts
// MUST cover the rejection path.
export type IncidentUpdateInput = Partial<
  Omit<Incident, 'id' | 'userId' | 'createdAt' | 'petId'>
> & { petId?: string };
