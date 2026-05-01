import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoseLogService } from './doseLogService';
import { DoseLogRepository } from '@repositories/DoseLogRepository';

vi.mock('@repositories/DoseLogRepository');

describe('DoseLogService', () => {
  let service: DoseLogService;
  const userId = 'user1';
  const petId = 'pet1';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DoseLogService();
  });

  it('getAllDoseLogs instantiates repo and delegates', async () => {
    const mockGet = vi.fn().mockResolvedValue([]);
    vi.mocked(DoseLogRepository).mockImplementation(
      () => ({ getAllDoseLogs: mockGet }) as unknown as DoseLogRepository
    );

    await service.getAllDoseLogs(userId, petId);

    expect(DoseLogRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockGet).toHaveBeenCalled();
  });

  it('getDoseLogsByMedicationId delegates with the medication id', async () => {
    const mockGet = vi.fn().mockResolvedValue([]);
    vi.mocked(DoseLogRepository).mockImplementation(
      () =>
        ({ getDoseLogsByMedicationId: mockGet }) as unknown as DoseLogRepository
    );

    await service.getDoseLogsByMedicationId(userId, petId, 'pm1');

    expect(DoseLogRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockGet).toHaveBeenCalledWith('pm1');
  });

  it('addDoseLog instantiates repo and delegates to createDoseLog', async () => {
    const input = {
      petId,
      petMedicationId: 'pm1',
      timestampGiven: new Date().toISOString(),
      amountGiven: 1,
      doseUnit: 'tablet' as const,
      status: 'given' as const,
      createdBy: userId,
    };
    const mockCreate = vi.fn().mockResolvedValue({ id: 'dl1', ...input });
    vi.mocked(DoseLogRepository).mockImplementation(
      () => ({ createDoseLog: mockCreate }) as unknown as DoseLogRepository
    );

    await service.addDoseLog(userId, petId, input);

    expect(DoseLogRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockCreate).toHaveBeenCalledWith(input);
  });

  it('updateDoseLog delegates', async () => {
    const updates = { notes: 'gave with food' };
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'dl1', ...updates });
    vi.mocked(DoseLogRepository).mockImplementation(
      () => ({ updateDoseLog: mockUpdate }) as unknown as DoseLogRepository
    );

    await service.updateDoseLog(userId, petId, 'dl1', updates);

    expect(DoseLogRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockUpdate).toHaveBeenCalledWith('dl1', updates);
  });

  it('deleteDoseLog delegates to delete', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.mocked(DoseLogRepository).mockImplementation(
      () => ({ delete: mockDelete }) as unknown as DoseLogRepository
    );

    await service.deleteDoseLog(userId, petId, 'dl1');

    expect(DoseLogRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockDelete).toHaveBeenCalledWith('dl1');
  });
});
