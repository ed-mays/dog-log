import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMedicationStore } from './useMedicationStore';
import { MedicationRepository } from '@repositories/MedicationRepository';
import type { MedicationDefinition } from '@features/medications/types';

// Mock Repository
vi.mock('@repositories/MedicationRepository');

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
    (MedicationRepository.prototype.getActiveList as Mock).mockResolvedValue(
      mockMeds
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.fetchMedications();
    });

    expect(result.current.medications).toEqual(mockMeds);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a medication', async () => {
    const newMed = { id: '3', name: 'Claritin' };
    (MedicationRepository.prototype.createMedication as Mock).mockResolvedValue(
      newMed
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

    expect(result.current.medications).toContainEqual(newMed);
  });

  it('should handle errors', async () => {
    (MedicationRepository.prototype.getActiveList as Mock).mockRejectedValue(
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
    (MedicationRepository.prototype.createMedication as Mock).mockRejectedValue(
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
    (MedicationRepository.prototype.updateMedication as Mock).mockResolvedValue(
      updatedMed
    );

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.updateMedication('1', { name: 'Aspirin Updated' });
    });

    expect(result.current.medications).toEqual([updatedMed]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle update medication error', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    (MedicationRepository.prototype.updateMedication as Mock).mockRejectedValue(
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

    (MedicationRepository.prototype.archive as Mock).mockResolvedValue({
      id: '1',
      isArchived: true,
    });

    const { result } = renderHook(() => useMedicationStore());

    await act(async () => {
      await result.current.archiveMedication('1');
    });

    expect(result.current.medications).toEqual([{ id: '2', name: 'Benadryl' }]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle archive medication error', async () => {
    const initialMeds = [
      { id: '1', name: 'Aspirin' },
    ] as MedicationDefinition[];
    useMedicationStore.setState({ medications: initialMeds });

    (MedicationRepository.prototype.archive as Mock).mockRejectedValue(
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
