import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePetMedicationStore } from './usePetMedicationStore';
import { petMedicationService } from '@services/petMedicationService';
import { useAuthStore } from '@store/auth.store';
import type {
  PetMedication,
  PetMedicationCreateInput,
} from '@features/medications/types';

vi.mock('@services/petMedicationService', () => ({
  petMedicationService: {
    getActivePetMedications: vi.fn(),
    addPetMedication: vi.fn(),
    updatePetMedication: vi.fn(),
    deactivatePetMedication: vi.fn(),
  },
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ user: { uid: 'user-1' } })),
  },
}));

describe('usePetMedicationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore.getState as Mock).mockReturnValue({
      user: { uid: 'user-1' },
    });
    usePetMedicationStore.setState({
      petMedications: {},
      isLoading: false,
      error: null,
    });
  });

  it('should fetch pet medications', async () => {
    const mockMeds = [
      { id: '1', petId: 'pet-1', active: true },
    ] as PetMedication[];
    vi.mocked(petMedicationService.getActivePetMedications).mockResolvedValue(
      mockMeds
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.fetchPetMedications('pet-1');
    });

    expect(petMedicationService.getActivePetMedications).toHaveBeenCalledWith(
      'user-1',
      'pet-1'
    );
    expect(result.current.petMedications['pet-1']).toEqual(mockMeds);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a pet medication', async () => {
    const newMed = { id: '2', petId: 'pet-1', active: true } as PetMedication;
    vi.mocked(petMedicationService.addPetMedication).mockResolvedValue(newMed);

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.addPetMedication('pet-1', {
        petId: 'pet-1',
        medicationDefinitionId: 'med-1',
        form: 'pill',
        route: 'oral',
        doseAmount: 1,
        doseUnit: 'tablet',
        scheduleType: 'onceDaily',
        scheduleConfig: { startDate: '2023-01-01' },
        active: true,
        createdBy: 'user-1',
      });
    });

    expect(petMedicationService.addPetMedication).toHaveBeenCalled();
    expect(result.current.petMedications['pet-1']).toContainEqual(newMed);
  });

  it('should update a pet medication', async () => {
    const initialMeds = [
      { id: '1', petId: 'pet-1', active: true },
    ] as PetMedication[];
    usePetMedicationStore.setState({
      petMedications: { 'pet-1': initialMeds },
    });

    const updatedMed = {
      id: '1',
      petId: 'pet-1',
      active: true,
      doseAmount: 2,
    } as PetMedication;
    vi.mocked(petMedicationService.updatePetMedication).mockResolvedValue(
      updatedMed
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.updatePetMedication('pet-1', '1', { doseAmount: 2 });
    });

    expect(petMedicationService.updatePetMedication).toHaveBeenCalledWith(
      'user-1',
      'pet-1',
      '1',
      { doseAmount: 2 }
    );
    expect(result.current.petMedications['pet-1']).toEqual([updatedMed]);
  });

  it('should deactivate a pet medication', async () => {
    const initialMeds = [
      { id: '1', petId: 'pet-1', active: true },
    ] as PetMedication[];
    usePetMedicationStore.setState({
      petMedications: { 'pet-1': initialMeds },
    });

    vi.mocked(petMedicationService.deactivatePetMedication).mockResolvedValue({
      id: '1',
      active: false,
    } as PetMedication);

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.deactivatePetMedication('pet-1', '1');
    });

    expect(petMedicationService.deactivatePetMedication).toHaveBeenCalledWith(
      'user-1',
      'pet-1',
      '1'
    );
    expect(result.current.petMedications['pet-1']).toEqual([]);
  });

  it('should handle errors', async () => {
    vi.mocked(petMedicationService.getActivePetMedications).mockRejectedValue(
      new Error('Fetch failed')
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.fetchPetMedications('pet-1');
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle add error', async () => {
    vi.mocked(petMedicationService.addPetMedication).mockRejectedValue(
      new Error('Add failed')
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await expect(
      act(async () => {
        await result.current.addPetMedication('pet-1', {
          petId: 'pet-1',
          medicationDefinitionId: 'med-1',
          form: 'pill',
          route: 'oral',
          doseAmount: 1,
          doseUnit: 'tablet',
          scheduleType: 'onceDaily',
          scheduleConfig: { startDate: '2023-01-01' },
          active: true,
          createdBy: 'user-1',
        });
      })
    ).rejects.toThrow('Add failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Add failed');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle update error', async () => {
    const initialMeds = [
      { id: '1', petId: 'pet-1', active: true },
    ] as PetMedication[];
    usePetMedicationStore.setState({
      petMedications: { 'pet-1': initialMeds },
    });

    vi.mocked(petMedicationService.updatePetMedication).mockRejectedValue(
      new Error('Update failed')
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await expect(
      act(async () => {
        await result.current.updatePetMedication('pet-1', '1', {
          doseAmount: 2,
        });
      })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Update failed');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle deactivate error', async () => {
    const initialMeds = [
      { id: '1', petId: 'pet-1', active: true },
    ] as PetMedication[];
    usePetMedicationStore.setState({
      petMedications: { 'pet-1': initialMeds },
    });

    vi.mocked(petMedicationService.deactivatePetMedication).mockRejectedValue(
      new Error('Deactivate failed')
    );

    const { result } = renderHook(() => usePetMedicationStore());

    await expect(
      act(async () => {
        await result.current.deactivatePetMedication('pet-1', '1');
      })
    ).rejects.toThrow('Deactivate failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Deactivate failed');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should not perform actions if user is not logged in', async () => {
    (useAuthStore.getState as Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => usePetMedicationStore());

    await act(async () => {
      await result.current.fetchPetMedications('pet-1');
    });
    expect(petMedicationService.getActivePetMedications).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.addPetMedication(
        'pet-1',
        {} as unknown as PetMedicationCreateInput
      );
    });
    expect(petMedicationService.addPetMedication).not.toHaveBeenCalled();
  });
});
