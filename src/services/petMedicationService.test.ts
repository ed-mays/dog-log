import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetMedicationService } from './petMedicationService';
import { PetMedicationRepository } from '@repositories/PetMedicationRepository';

vi.mock('@repositories/PetMedicationRepository');

describe('PetMedicationService', () => {
  let service: PetMedicationService;
  const userId = 'user1';
  const petId = 'pet1';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PetMedicationService();
  });

  it('getActivePetMedications instantiates repo and delegates', async () => {
    const mockGet = vi.fn().mockResolvedValue([]);
    vi.mocked(PetMedicationRepository).mockImplementation(
      () =>
        ({
          getActivePetMedications: mockGet,
        }) as unknown as PetMedicationRepository
    );

    await service.getActivePetMedications(userId, petId);

    expect(PetMedicationRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockGet).toHaveBeenCalled();
  });

  it('addPetMedication instantiates repo and delegates to createPetMedication', async () => {
    const input = {
      petId,
      medicationDefinitionId: 'med-def-1',
      form: 'pill' as const,
      route: 'oral' as const,
      doseAmount: 1,
      doseUnit: 'tablet' as const,
      scheduleType: 'onceDaily' as const,
      scheduleConfig: { startDate: '2026-01-01' },
      active: true,
      createdBy: userId,
    };
    const mockCreate = vi.fn().mockResolvedValue({ id: 'pm1', ...input });
    vi.mocked(PetMedicationRepository).mockImplementation(
      () =>
        ({
          createPetMedication: mockCreate,
        }) as unknown as PetMedicationRepository
    );

    await service.addPetMedication(userId, petId, input);

    expect(PetMedicationRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockCreate).toHaveBeenCalledWith(input);
  });

  it('updatePetMedication instantiates repo and delegates', async () => {
    const updates = { doseAmount: 2 };
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'pm1', ...updates });
    vi.mocked(PetMedicationRepository).mockImplementation(
      () =>
        ({
          updatePetMedication: mockUpdate,
        }) as unknown as PetMedicationRepository
    );

    await service.updatePetMedication(userId, petId, 'pm1', updates);

    expect(PetMedicationRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockUpdate).toHaveBeenCalledWith('pm1', updates);
  });

  it('deactivatePetMedication delegates with active=false', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'pm1', active: false });
    vi.mocked(PetMedicationRepository).mockImplementation(
      () =>
        ({
          updatePetMedication: mockUpdate,
        }) as unknown as PetMedicationRepository
    );

    await service.deactivatePetMedication(userId, petId, 'pm1');

    expect(PetMedicationRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockUpdate).toHaveBeenCalledWith('pm1', { active: false });
  });
});
