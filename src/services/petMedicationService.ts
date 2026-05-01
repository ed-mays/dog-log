import { PetMedicationRepository } from '@repositories/PetMedicationRepository';
import type {
  PetMedication,
  PetMedicationCreateInput,
  PetMedicationUpdateInput,
} from '@features/medications/types';

export class PetMedicationService {
  async getActivePetMedications(
    userId: string,
    petId: string
  ): Promise<PetMedication[]> {
    const repo = new PetMedicationRepository(userId, petId);
    return repo.getActivePetMedications();
  }

  async addPetMedication(
    userId: string,
    petId: string,
    input: PetMedicationCreateInput
  ): Promise<PetMedication> {
    const repo = new PetMedicationRepository(userId, petId);
    return repo.createPetMedication(input);
  }

  async updatePetMedication(
    userId: string,
    petId: string,
    medicationId: string,
    updates: PetMedicationUpdateInput
  ): Promise<PetMedication> {
    const repo = new PetMedicationRepository(userId, petId);
    return repo.updatePetMedication(medicationId, updates);
  }

  async deactivatePetMedication(
    userId: string,
    petId: string,
    medicationId: string
  ): Promise<PetMedication> {
    const repo = new PetMedicationRepository(userId, petId);
    return repo.updatePetMedication(medicationId, { active: false });
  }
}

export const petMedicationService = new PetMedicationService();
