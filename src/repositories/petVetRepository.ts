import { BaseRepository } from './base/BaseRepository';
import { db } from '@firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { PetVetLink, PetVetRole } from '@models/vets';

export class PetVetRepository extends BaseRepository<PetVetLink> {
  constructor(userId: string) {
    super(`users/${userId}/petVets`);
  }

  async listLinksByPet(petId: string): Promise<PetVetLink[]> {
    const col = collection(db, this.collectionName);
    const q = query(col, where('petId', '==', petId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.documentToEntity(d));
  }

  async listLinksByVet(vetId: string): Promise<PetVetLink[]> {
    const col = collection(db, this.collectionName);
    const q = query(col, where('vetId', '==', vetId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.documentToEntity(d));
  }

  async upsertLink(
    input: Omit<PetVetLink, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<PetVetLink> {
    const now = new Date();
    if (input.id) {
      return this.update(input.id, { ...input, updatedAt: now } as Partial<
        Omit<PetVetLink, 'id'>
      >);
    }
    const toCreate = { ...input, createdAt: now, updatedAt: now } as Omit<
      PetVetLink,
      'id'
    >;
    return this.create(toCreate);
  }

  async deleteLink(id: string): Promise<void> {
    return this.delete(id);
  }

  async getLinkById(id: string): Promise<PetVetLink | null> {
    return this.getById(id);
  }

  /**
   * Transactionally set a single primary vet for a pet.
   * Demotes the existing primary to its previousNonPrimaryRole if present, otherwise 'other'.
   * Also stores previousNonPrimaryRole on the new primary link for future restoration.
   */
  async setPrimaryForPet(
    petId: string,
    newPrimaryLinkId: string
  ): Promise<void> {
    const col = collection(db, this.collectionName);
    const newPrimaryRef = doc(col, newPrimaryLinkId);
    const currentPrimaryQuery = query(
      col,
      where('petId', '==', petId),
      where('role', '==', 'primary')
    );

    await runTransaction(db, async (trx) => {
      // Load new primary link
      const newPrimarySnap = await trx.get(newPrimaryRef);
      if (!newPrimarySnap.exists()) {
        throw new Error('New primary link not found');
      }
      const newPrimary = this.documentToEntity(
        newPrimarySnap as unknown as QueryDocumentSnapshot<DocumentData>
      );

      // Find current primary (if any)
      const currPrimarySnap = await getDocs(currentPrimaryQuery);
      const currPrimaryDoc = currPrimarySnap.docs.find(
        (d) => d.id !== newPrimaryLinkId
      );

      // Promote new primary: set previousNonPrimaryRole to its current role if not primary
      const previousRole: PetVetRole | undefined = newPrimary.role;
      const promoteUpdates: Partial<PetVetLink> = {
        role: 'primary',
        previousNonPrimaryRole:
          previousRole && previousRole !== 'primary'
            ? (previousRole as Exclude<PetVetRole, 'primary'>)
            : newPrimary.previousNonPrimaryRole,
        updatedAt: new Date(),
      };
      trx.update(
        newPrimaryRef,
        this.entityToDocument(
          promoteUpdates as unknown as Record<string, unknown>
        )
      );

      // Demote old primary if exists
      if (currPrimaryDoc) {
        const curr = this.documentToEntity(
          currPrimaryDoc as unknown as QueryDocumentSnapshot<DocumentData>
        );
        const demotedRole: Exclude<PetVetRole, 'primary'> =
          (curr.previousNonPrimaryRole ?? 'other') as Exclude<
            PetVetRole,
            'primary'
          >;
        const demoteUpdates: Partial<PetVetLink> = {
          role: demotedRole,
          updatedAt: new Date(),
        };
        const currRef = doc(col, currPrimaryDoc.id);
        trx.update(
          currRef,
          this.entityToDocument(
            demoteUpdates as unknown as Record<string, unknown>
          )
        );
      }
    });
  }
}
