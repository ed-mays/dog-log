import { ArchivableBaseRepository } from './base/BaseRepository';
import { db } from '@firebase';
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Vet } from '@models/vets';

export class DuplicateVetError extends Error {
  code = 'DUPLICATE_VET' as const;
  constructor(
    message = 'A veterinarian with this name and phone already exists'
  ) {
    super(message);
    this.name = 'DuplicateVetError';
  }
}

export class VetRepository extends ArchivableBaseRepository<Vet> {
  private readonly userId: string;

  constructor(userId: string) {
    super(`users/${userId}/vets`);
    this.userId = userId;
  }

  /**
   * Create vet with uniqueness lock on key: owner|_normName|_e164Phone
   */
  async createVet(
    input: Omit<Vet, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Vet> {
    const key = `${input.ownerUserId}|${input._normName}|${input._e164Phone}`;
    const keysCol = collection(db, `users/${this.userId}/vetKeys`);
    const keyRef = doc(keysCol, key);
    const vetsCol = collection(db, this.collectionName);

    return runTransaction(db, async (trx) => {
      const existing = await trx.get(keyRef);
      if (existing.exists()) {
        throw new DuplicateVetError();
      }
      // create vet doc first to get id
      const now = new Date();
      const vetData: Omit<Vet, 'id'> = {
        ...input,
        createdAt: now,
        updatedAt: now,
      } as Omit<Vet, 'id'>;
      const vetDocRef = doc(vetsCol);
      // write vet
      trx.set(
        vetDocRef,
        this.entityToDocument(vetData as unknown as Record<string, unknown>)
      );
      // write key lock
      trx.set(keyRef, {
        ownerUserId: input.ownerUserId,
        vetId: vetDocRef.id,
        createdAt: now,
      });

      // return entity
      return {
        id: vetDocRef.id,
        ...(vetData as object),
      } as Vet;
    });
  }

  /**
   * Update vet; if name or phone changed, adjust uniqueness lock accordingly
   */
  async updateVet(id: string, updates: Partial<Omit<Vet, 'id'>>): Promise<Vet> {
    // Fetch current to compute keys
    const current = await this.getById(id);
    if (!current) throw new Error('Vet not found');

    const willChangeKey =
      (updates._normName && updates._normName !== current._normName) ||
      (updates._e164Phone && updates._e164Phone !== current._e164Phone);

    if (!willChangeKey) {
      return this.update(id, updates as Partial<Omit<Vet, 'id'>>);
    }

    const oldKey = `${current.ownerUserId}|${current._normName}|${current._e164Phone}`;
    const newKey = `${current.ownerUserId}|${updates._normName ?? current._normName}|${updates._e164Phone ?? current._e164Phone}`;

    const keysCol = collection(db, `users/${this.userId}/vetKeys`);
    const oldKeyRef = doc(keysCol, oldKey);
    const newKeyRef = doc(keysCol, newKey);
    const vetRef = doc(db, this.collectionName, id);

    return runTransaction(db, async (trx) => {
      // ensure new key does not exist
      const newKeySnap = await trx.get(newKeyRef);
      if (newKeySnap.exists()) {
        throw new DuplicateVetError();
      }
      // update vet
      const updatedAt = new Date();
      const updatePayload = this.entityToDocument({
        ...(updates as Record<string, unknown>),
        updatedAt,
      });
      trx.update(vetRef, updatePayload);
      // delete old key and create new key
      trx.delete(oldKeyRef);
      trx.set(newKeyRef, {
        ownerUserId: current.ownerUserId,
        vetId: id,
        createdAt: updatedAt,
      });

      const updatedSnap = await getDoc(vetRef);
      return this.documentToEntity(
        updatedSnap as unknown as QueryDocumentSnapshot<DocumentData>
      );
    });
  }

  async listVets(): Promise<Vet[]> {
    // simple list; user-scoped by path
    return this.getList();
  }
}
