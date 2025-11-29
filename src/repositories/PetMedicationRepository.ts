import { BaseRepository } from './base/BaseRepository';
import type {
  PetMedication,
  PetMedicationCreateInput,
  PetMedicationUpdateInput,
} from '@features/medications/types';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@app-firebase';

export class PetMedicationRepository extends BaseRepository<PetMedication> {
  constructor(userId: string, petId: string) {
    super(`users/${userId}/pets/${petId}/medications`);
  }

  async createPetMedication(input: PetMedicationCreateInput) {
    return this.create(input);
  }

  async updatePetMedication(id: string, updates: PetMedicationUpdateInput) {
    return this.update(id, updates);
  }

  async getActivePetMedications() {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PetMedication[];
  }
}
