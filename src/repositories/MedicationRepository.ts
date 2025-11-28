import { ArchivableBaseRepository } from './base/BaseRepository';
import type {
  MedicationDefinition,
  MedicationDefinitionCreateInput,
  MedicationDefinitionUpdateInput,
} from '@features/medications/types';

export class MedicationRepository extends ArchivableBaseRepository<MedicationDefinition> {
  constructor() {
    super('medicationDefinitions');
  }

  async createMedication(input: MedicationDefinitionCreateInput) {
    return this.create(input);
  }

  async updateMedication(id: string, updates: MedicationDefinitionUpdateInput) {
    return this.update(id, updates);
  }
}
