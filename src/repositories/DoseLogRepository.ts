import { BaseRepository } from './base/BaseRepository';
import type {
  DoseLog,
  DoseLogCreateInput,
  DoseLogUpdateInput,
} from '@features/medications/types';
import { query, where, getDocs, collection, orderBy } from 'firebase/firestore';
import { db } from '@app-firebase';

export class DoseLogRepository extends BaseRepository<DoseLog> {
  constructor(userId: string, petId: string) {
    super(`users/${userId}/pets/${petId}/doseLogs`);
  }

  async createDoseLog(input: DoseLogCreateInput) {
    return this.create(input);
  }

  async updateDoseLog(id: string, updates: DoseLogUpdateInput) {
    return this.update(id, updates);
  }

  async getDoseLogsByMedicationId(petMedicationId: string) {
    const colRef = collection(db, this.collectionName);
    const q = query(
      colRef,
      where('petMedicationId', '==', petMedicationId),
      orderBy('timestampGiven', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.documentToEntity(doc));
  }

  async getAllDoseLogs() {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, orderBy('timestampGiven', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.documentToEntity(doc));
  }
}
