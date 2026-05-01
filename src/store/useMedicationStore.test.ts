import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMedicationStore } from './useMedicationStore';
import { medicationService } from '@services/medicationService';
import type { MedicationDefinition } from '@features/medications/types';

vi.mock('@services/medicationService', () => ({
  medicationService: {
    getMedications: vi.fn(),
    addMedication: vi.fn(),
    updateMedication: vi.fn(),
    archiveMedication: vi.fn(),
  },
}));

describe('useMedicationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMedicationStore.setState({
      medications: [],
      isLoading: false,
      error: null,
    });
  });

  it('should fetch medications', async () => {
    const mockMeds = [
      { id: '1', name: 'Aspirin' },
      { id: '2', name: 'Benadryl' },
    ];
    vi.mocked(medicationService.getMedications).mockResolvedValue(
      mockMeds as MedicationDefinition[]
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.fetchMedications();
    });

    expect(medicationService.getMedications).toHaveBeenCalledWith({
      orderBy: 'name',
    });
    expect(result.current.medications).toEqual(mockMeds);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a medication', async () => {
    const newMed = { id: '3', name: 'Claritin' };
    vi.mocked(medicationService.addMedication).mockResolvedValue(
      newMed as MedicationDefinition
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.addMedication({
        name: 'Claritin',
        defaultForm: 'pill',
        defaultRoute: 'oral',
        isArchived: false,
        createdBy: 'user-1',
      });
    });

    expect(medicationService.addMedication).toHaveBeenCalled();
    expect(result.current.medications).toContainEqual(newMed);
  });

  it('should handle errors', async () => {
    vi.mocked(medicationService.getMedications).mockRejectedValue(
      new Error('Fetch failed')
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.fetchMedications();
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle add medication error', async () => {
    vi.mocked(medicationService.addMedication).mockRejectedValue(
      new Error('Add failed')
    );

    const { result } = renderHook(() => useMedicationStore());

    await expect(
      act(async () => {
        await result.current.addMedication({
          name: 'Claritin',
          defaultForm: 'pill',
          defaultRoute: 'oral',
          isArchived: false,
          createdBy: 'user-1',
        });
      })
    ).rejects.toThrow('Add failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Add failed');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should update a medication', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    const updatedMed = { id: '1', name: 'Aspirin Updated' };
    vi.mocked(medicationService.updateMedication).mockResolvedValue(
      updatedMed as MedicationDefinition
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.updateMedication('1', { name: 'Aspirin Updated' });
    });

    expect(medicationService.updateMedication).toHaveBeenCalledWith('1', {
      name: 'Aspirin Updated',
    });
    expect(result.current.medications).toEqual([updatedMed]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle update medication error', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    vi.mocked(medicationService.updateMedication).mockRejectedValue(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useMedicationStore());

    await expect(
      act(async () => {
        await result.current.updateMedication('1', { name: 'Aspirin Updated' });
      })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Update failed');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should archive a medication', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
      { id: '2', name: 'Benadryl' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    vi.mocked(medicationService.archiveMedication).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.archiveMedication('1');
    });

    expect(medicationService.archiveMedication).toHaveBeenCalledWith('1');
    expect(result.current.medications).toEqual([{ id: '2', name: 'Benadryl' }]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle archive medication error', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    vi.mocked(medicationService.archiveMedication).mockRejectedValue(
      new Error('Archive failed')
    );

    const { result } = renderHook(() => useMedicationStore());

    await expect(
      act(async () => {
        await result.current.archiveMedication('1');
      })
    ).rejects.toThrow('Archive failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Archive failed');
    });
    expect(result.current.isLoading).toBe(false);
  });
});
