import { DoseLogRepository } from '@repositories/DoseLogRepository';
import type {
  DoseLog,
  DoseLogCreateInput,
  DoseLogUpdateInput,
} from '@features/medications/types';

export class DoseLogService {
  async getAllDoseLogs(userId: string, petId: string): Promise<DoseLog[]> {
    const repo = new DoseLogRepository(userId, petId);
    return repo.getAllDoseLogs();
  }

  async getDoseLogsByMedicationId(
    userId: string,
    petId: string,
    petMedicationId: string
  ): Promise<DoseLog[]> {
    const repo = new DoseLogRepository(userId, petId);
    return repo.getDoseLogsByMedicationId(petMedicationId);
  }

  async addDoseLog(
    userId: string,
    petId: string,
    input: DoseLogCreateInput
  ): Promise<DoseLog> {
    const repo = new DoseLogRepository(userId, petId);
    return repo.createDoseLog(input);
  }

  async updateDoseLog(
    userId: string,
    petId: string,
    doseLogId: string,
    updates: DoseLogUpdateInput
  ): Promise<DoseLog> {
    const repo = new DoseLogRepository(userId, petId);
    return repo.updateDoseLog(doseLogId, updates);
  }

  async deleteDoseLog(
    userId: string,
    petId: string,
    doseLogId: string
  ): Promise<void> {
    const repo = new DoseLogRepository(userId, petId);
    return repo.delete(doseLogId);
  }
}

export const doseLogService = new DoseLogService();
