import {
  collection,
  doc,
  setDoc,
  query,
  where,
  limit,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@app-firebase';
import { BaseRepository } from './base/BaseRepository';
import type { Incident, IncidentCreateInput } from '@features/incidents/types';

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
