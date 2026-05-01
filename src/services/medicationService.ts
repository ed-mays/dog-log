import { MedicationRepository } from '@repositories/MedicationRepository';
import type {
  MedicationDefinition,
  MedicationDefinitionCreateInput,
  MedicationDefinitionUpdateInput,
} from '@features/medications/types';
import type { QueryOptions } from '@repositories/types';

export class MedicationService {
  async getMedications(
    options?: QueryOptions
  ): Promise<MedicationDefinition[]> {
    const repo = new MedicationRepository();
    return repo.getActiveList(options);
  }

  async addMedication(
    input: MedicationDefinitionCreateInput
  ): Promise<MedicationDefinition> {
    const repo = new MedicationRepository();
    return repo.createMedication(input);
  }

  async updateMedication(
    id: string,
    updates: MedicationDefinitionUpdateInput
  ): Promise<MedicationDefinition> {
    const repo = new MedicationRepository();
    return repo.updateMedication(id, updates);
  }

  async archiveMedication(id: string): Promise<void> {
    const repo = new MedicationRepository();
    await repo.archive(id);
  }
}

export const medicationService = new MedicationService();
