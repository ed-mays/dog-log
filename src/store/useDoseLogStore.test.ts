import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDoseLogStore } from './useDoseLogStore';
import { doseLogService } from '@services/doseLogService';
import type { DoseLog, DoseLogCreateInput } from '@features/medications/types';
import { useAuthStore } from '@store/auth.store';
import type { AuthState } from '@store/auth.store';

vi.mock('@services/doseLogService', () => ({
  doseLogService: {
    getAllDoseLogs: vi.fn(),
    getDoseLogsByMedicationId: vi.fn(),
    addDoseLog: vi.fn(),
    updateDoseLog: vi.fn(),
    deleteDoseLog: vi.fn(),
  },
}));
vi.mock('@store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { uid: 'test-user' },
    })),
  },
}));

describe('useDoseLogStore', () => {
  const petId = 'test-pet';

  beforeEach(() => {
    useDoseLogStore.setState({
      doseLogs: {},
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: { uid: 'test-user' },
    } as unknown as AuthState);
  });

  it('should not fetch if user is not logged in', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
    } as unknown as AuthState);
    await useDoseLogStore.getState().fetchDoseLogs(petId);
    expect(doseLogService.getAllDoseLogs).not.toHaveBeenCalled();
  });

  it('should fetch dose logs successfully', async () => {
    const mockLogs = [{ id: 'log-1', amountGiven: 1 }];
    vi.mocked(doseLogService.getAllDoseLogs).mockResolvedValue(
      mockLogs as unknown as DoseLog[]
    );

    await useDoseLogStore.getState().fetchDoseLogs(petId);

    expect(doseLogService.getAllDoseLogs).toHaveBeenCalledWith(
      'test-user',
      petId
    );
    const state = useDoseLogStore.getState();
    expect(state.doseLogs[petId]).toEqual(mockLogs);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMsg = 'Fetch failed';
    vi.mocked(doseLogService.getAllDoseLogs).mockRejectedValue(
      new Error(errorMsg)
    );

    await useDoseLogStore.getState().fetchDoseLogs(petId);

    const state = useDoseLogStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMsg);
  });

  it('should add dose log successfully', async () => {
    const newLog = { id: 'new-log', amountGiven: 2 };
    vi.mocked(doseLogService.addDoseLog).mockResolvedValue(
      newLog as unknown as DoseLog
    );

    await useDoseLogStore.getState().addDoseLog(petId, {
      amountGiven: 2,
    } as unknown as DoseLogCreateInput);

    expect(doseLogService.addDoseLog).toHaveBeenCalled();
    const state = useDoseLogStore.getState();
    expect(state.doseLogs[petId]).toContainEqual(newLog);
    expect(state.isLoading).toBe(false);
  });

  it('should handle add dose log error', async () => {
    const errorMsg = 'Add failed';
    vi.mocked(doseLogService.addDoseLog).mockRejectedValue(new Error(errorMsg));

    await expect(
      useDoseLogStore
        .getState()
        .addDoseLog(petId, {} as unknown as DoseLogCreateInput)
    ).rejects.toThrow(errorMsg);

    const state = useDoseLogStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMsg);
  });

  it('should not update if user is not logged in', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
    } as unknown as AuthState);
    await useDoseLogStore.getState().updateDoseLog(petId, 'log-1', {});
    expect(doseLogService.updateDoseLog).not.toHaveBeenCalled();
  });

  it('should update dose log successfully', async () => {
    const doseLogId = 'log-1';
    const updates = { amountGiven: 3 };
    const updatedLog = { id: doseLogId, amountGiven: 3 };

    useDoseLogStore.setState({
      doseLogs: { [petId]: [{ id: doseLogId, amountGiven: 1 } as DoseLog] },
    });

    vi.mocked(doseLogService.updateDoseLog).mockResolvedValue(
      updatedLog as unknown as DoseLog
    );

    await useDoseLogStore.getState().updateDoseLog(petId, doseLogId, updates);

    expect(doseLogService.updateDoseLog).toHaveBeenCalledWith(
      'test-user',
      petId,
      doseLogId,
      updates
    );
    const state = useDoseLogStore.getState();
    expect(state.doseLogs[petId]).toContainEqual(updatedLog);
    expect(state.isLoading).toBe(false);
  });

  it('should handle update dose log error', async () => {
    const doseLogId = 'log-1';
    const errorMsg = 'Update failed';
    vi.mocked(doseLogService.updateDoseLog).mockRejectedValue(
      new Error(errorMsg)
    );

    await expect(
      useDoseLogStore.getState().updateDoseLog(petId, doseLogId, {})
    ).rejects.toThrow(errorMsg);

    const state = useDoseLogStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMsg);
  });

  it('should not delete if user is not logged in', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
    } as unknown as AuthState);
    await useDoseLogStore.getState().deleteDoseLog(petId, 'log-1');
    expect(doseLogService.deleteDoseLog).not.toHaveBeenCalled();
  });

  it('should delete dose log successfully', async () => {
    const doseLogId = 'log-1';

    useDoseLogStore.setState({
      doseLogs: { [petId]: [{ id: doseLogId, amountGiven: 1 } as DoseLog] },
    });

    vi.mocked(doseLogService.deleteDoseLog).mockResolvedValue(undefined);

    await useDoseLogStore.getState().deleteDoseLog(petId, doseLogId);

    expect(doseLogService.deleteDoseLog).toHaveBeenCalledWith(
      'test-user',
      petId,
      doseLogId
    );
    const state = useDoseLogStore.getState();
    expect(state.doseLogs[petId]).toHaveLength(0);
    expect(state.isLoading).toBe(false);
  });

  it('should handle delete when no logs exist for pet', async () => {
    const doseLogId = 'log-1';

    useDoseLogStore.setState({
      doseLogs: {},
    });

    vi.mocked(doseLogService.deleteDoseLog).mockResolvedValue(undefined);

    await useDoseLogStore.getState().deleteDoseLog(petId, doseLogId);

    const state = useDoseLogStore.getState();
    expect(state.doseLogs[petId]).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should handle delete dose log error', async () => {
    const doseLogId = 'log-1';
    const errorMsg = 'Delete failed';
    vi.mocked(doseLogService.deleteDoseLog).mockRejectedValue(
      new Error(errorMsg)
    );

    await expect(
      useDoseLogStore.getState().deleteDoseLog(petId, doseLogId)
    ).rejects.toThrow(errorMsg);

    const state = useDoseLogStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMsg);
  });
});
