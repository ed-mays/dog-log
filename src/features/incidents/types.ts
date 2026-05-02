// Incident capture feature — TypeScript types per spec §5 and design §D3.
// This file is intentionally not imported anywhere yet (slice 0 foundation).
// Downstream tasks will import these types and exercise them via tests.

import type { BaseEntity } from '@repositories/types';

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
  addedAt: Date; // BR-30 instant of append
}

// Extends BaseEntity to align with project-wide repository contract
// (every other entity in src/repositories/ follows this convention via
// BaseRepository<T extends BaseEntity>). BaseEntity provides:
//   id: string; createdAt: Date; updatedAt: Date; createdBy: string;
export interface Incident extends BaseEntity {
  userId: string; // owner — drives security rules (NFR-8); duplicates createdBy for query convenience
  petId: string; // BR-28 — required at all times
  startedAt: Date; // set at activation (BR-2)
  endedAt: Date | null; // set at STOP (BR-13)
  type: IncidentTypeId | null; // BR-4, BR-19
  severity: Severity | null; // BR-6
  chips: ChipId[]; // BR-7, BR-20 — ordered, deduped at write
  journal: JournalEntry[]; // BR-30 — append-only after STOP
  deletedAt: Date | null; // BR-33 — soft-delete timestamp; null when not deleted
}

export type IncidentCreateInput = Pick<Incident, 'petId' | 'startedAt'>;

// BR-29's "never cleared" invariant is enforced at runtime in
// incidentService.update() — the type allows `petId?: string`, which still
// admits a malformed `''` or a cast `null`. Tests in incidentService.test.ts
// MUST cover the rejection path.
export type IncidentUpdateInput = Partial<
  Omit<Incident, 'id' | 'userId' | 'createdAt' | 'createdBy' | 'petId'>
> & { petId?: string };
