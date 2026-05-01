import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicationService } from './medicationService';
import { MedicationRepository } from '@repositories/MedicationRepository';

vi.mock('@repositories/MedicationRepository');

describe('MedicationService', () => {
  let service: MedicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MedicationService();
  });

  it('getMedications instantiates repo and calls getActiveList', async () => {
    const options = { orderBy: 'name' as const };
    const mockGetActiveList = vi.fn().mockResolvedValue([]);
    vi.mocked(MedicationRepository).mockImplementation(
      () =>
        ({
          getActiveList: mockGetActiveList,
        }) as unknown as MedicationRepository
    );

    await service.getMedications(options);

    expect(MedicationRepository).toHaveBeenCalledWith();
    expect(mockGetActiveList).toHaveBeenCalledWith(options);
  });

  it('addMedication instantiates repo and calls createMedication', async () => {
    const input = {
      name: 'Aspirin',
      defaultForm: 'pill' as const,
      defaultRoute: 'oral' as const,
      isArchived: false,
      createdBy: 'user-1',
    };
    const mockCreate = vi.fn().mockResolvedValue({ id: '1', ...input });
    vi.mocked(MedicationRepository).mockImplementation(
      () =>
        ({
          createMedication: mockCreate,
        }) as unknown as MedicationRepository
    );

    await service.addMedication(input);

    expect(MedicationRepository).toHaveBeenCalledWith();
    expect(mockCreate).toHaveBeenCalledWith(input);
  });

  it('updateMedication instantiates repo and calls updateMedication', async () => {
    const id = 'med1';
    const updates = { name: 'Aspirin Updated' };
    const mockUpdate = vi.fn().mockResolvedValue({ id, ...updates });
    vi.mocked(MedicationRepository).mockImplementation(
      () =>
        ({
          updateMedication: mockUpdate,
        }) as unknown as MedicationRepository
    );

    await service.updateMedication(id, updates);

    expect(MedicationRepository).toHaveBeenCalledWith();
    expect(mockUpdate).toHaveBeenCalledWith(id, updates);
  });

  it('archiveMedication instantiates repo and calls archive', async () => {
    const id = 'med1';
    const mockArchive = vi.fn().mockResolvedValue(undefined);
    vi.mocked(MedicationRepository).mockImplementation(
      () =>
        ({
          archive: mockArchive,
        }) as unknown as MedicationRepository
    );

    await service.archiveMedication(id);

    expect(MedicationRepository).toHaveBeenCalledWith();
    expect(mockArchive).toHaveBeenCalledWith(id);
  });
});
