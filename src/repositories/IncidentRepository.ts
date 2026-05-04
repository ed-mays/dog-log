import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@app-firebase';
import { BaseRepository } from './base/BaseRepository';
import type {
  Incident,
  IncidentCreateInput,
  JournalEntry,
  ChipId,
} from '@features/incidents/types';

// Per design §D3: top-level user-scoped collection (NOT a per-pet
// subcollection — BR-29 requires petId reassignment as a single-doc setDoc).
export class IncidentRepository extends BaseRepository<Incident> {
  readonly collectionPath: string;

  constructor(userId: string) {
    const path = `users/${userId}/incidents`;
    super(path);
    this.collectionPath = path;
  }

  // Accepts the minimal IncidentCreateInput per design §D3 (Pick<'petId' |
  // 'startedAt'>) plus the owner identity (userId duplicates BaseEntity's
  // createdBy by design — see §D3 comment). Fills nullable defaults for
  // type / severity / endedAt / deletedAt and empty arrays for chips /
  // journal so the persisted document has every field the rest of the
  // feature reads.
  async createIncident(
    input: IncidentCreateInput & { userId: string; createdBy: string }
  ): Promise<Incident> {
    return this.create({
      ...input,
      endedAt: null,
      type: null,
      severity: null,
      chips: [],
      journal: [],
      deletedAt: null,
    });
  }

  // Known-id write per design §D8 NFR-2: caller (incidentService / store)
  // generates the UUID synchronously so the timer can start before the
  // Firestore write resolves. Uses setDoc rather than BaseRepository.create
  // (which uses addDoc and a server-assigned id).
  async createIncidentWithId(
    id: string,
    input: IncidentCreateInput & { userId: string; createdBy: string }
  ): Promise<Incident> {
    try {
      const now = new Date();
      const fields = {
        ...input,
        endedAt: null,
        type: null,
        severity: null,
        chips: [],
        journal: [],
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const docRef = doc(db, this.collectionPath, id);
      await setDoc(docRef, this.entityToDocument(fields));
      return { id, ...fields } as Incident;
    } catch (error) {
      throw this.handleError(error, `createIncidentWithId(${id})`);
    }
  }

  // RMW per design §D3: read current journal, append, write back via setDoc
  // merge. Does NOT use arrayUnion — see §D3 rationale (order guarantee under
  // single-writer-per-incident invariant BR-26).
  async appendJournal(id: string, entry: JournalEntry): Promise<Incident> {
    try {
      const current = await this.getById(id);
      if (!current) {
        throw new Error(`Incident ${id} not found`);
      }
      const newJournal = [...current.journal, entry];
      const docRef = doc(db, this.collectionPath, id);
      await setDoc(docRef, { journal: newJournal }, { merge: true });
      return { ...current, journal: newJournal };
    } catch (error) {
      throw this.handleError(error, `appendJournal(${id})`);
    }
  }

  // RMW toggle per design §D3: adds chipId if absent, removes if present.
  // Does NOT use arrayUnion/arrayRemove — toggle requires a conditional that
  // array helpers cannot express (BR-7).
  async toggleChip(id: string, chipId: ChipId): Promise<Incident> {
    try {
      const current = await this.getById(id);
      if (!current) {
        throw new Error(`Incident ${id} not found`);
      }
      const next = current.chips.includes(chipId)
        ? current.chips.filter((c) => c !== chipId)
        : [...current.chips, chipId];
      const docRef = doc(db, this.collectionPath, id);
      await setDoc(docRef, { chips: next }, { merge: true });
      return { ...current, chips: next };
    } catch (error) {
      throw this.handleError(error, `toggleChip(${id})`);
    }
  }

  // Per BR-23: returns all non-deleted incidents for a pet, most recent first.
  // Soft-delete exclusion (deletedAt == null) is enforced at the query layer so
  // all callers (service, hooks, future T-32/T-34 paths) share the same semantics.
  async findByPetId(petId: string): Promise<Incident[]> {
    try {
      const colRef = collection(db, this.collectionPath);
      const q = query(
        colRef,
        where('petId', '==', petId),
        where('deletedAt', '==', null),
        orderBy('startedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) =>
        this.documentToEntity(d as QueryDocumentSnapshot<DocumentData>)
      );
    } catch (error) {
      throw this.handleError(error, `findByPetId(${petId})`);
    }
  }

  async findActiveForUser(): Promise<Incident | null> {
    try {
      const colRef = collection(db, this.collectionPath);
      const q = query(
        colRef,
        where('endedAt', '==', null),
        where('deletedAt', '==', null),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      return this.documentToEntity(
        snapshot.docs[0] as QueryDocumentSnapshot<DocumentData>
      );
    } catch (error) {
      throw this.handleError(error, 'findActiveForUser');
    }
  }
}
