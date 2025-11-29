import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DoseLogRepository } from '@repositories/DoseLogRepository';
import type {
  DoseLog,
  DoseLogCreateInput,
  DoseLogUpdateInput,
} from '@features/medications/types';
import { useAuthStore } from '@store/auth.store';

export interface DoseLogState {
  doseLogs: Record<string, DoseLog[]>; // Keyed by petId
  isLoading: boolean;
  error: string | null;
  fetchDoseLogs: (petId: string) => Promise<void>;
  addDoseLog: (petId: string, input: DoseLogCreateInput) => Promise<void>;
  updateDoseLog: (
    petId: string,
    doseLogId: string,
    updates: DoseLogUpdateInput
  ) => Promise<void>;
  deleteDoseLog: (petId: string, doseLogId: string) => Promise<void>;
}

export const useDoseLogStore = create(
  devtools<DoseLogState>((set) => ({
    doseLogs: {},
    isLoading: false,
    error: null,

    fetchDoseLogs: async (petId) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const repository = new DoseLogRepository(userId, petId);
        const logs = await repository.getAllDoseLogs();
        set((state) => ({
          doseLogs: {
            ...state.doseLogs,
            [petId]: logs,
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch dose logs',
          isLoading: false,
        });
      }
    },

    addDoseLog: async (petId, input) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const repository = new DoseLogRepository(userId, petId);
        const newLog = await repository.createDoseLog(input);
        set((state) => ({
          doseLogs: {
            ...state.doseLogs,
            [petId]: [newLog, ...(state.doseLogs[petId] || [])], // Prepend new log
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to add dose log',
          isLoading: false,
        });
        throw error;
      }
    },

    updateDoseLog: async (petId, doseLogId, updates) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const repository = new DoseLogRepository(userId, petId);
        const updatedLog = await repository.updateDoseLog(doseLogId, updates);
        set((state) => ({
          doseLogs: {
            ...state.doseLogs,
            [petId]: (state.doseLogs[petId] || []).map((log) =>
              log.id === doseLogId ? updatedLog : log
            ),
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update dose log',
          isLoading: false,
        });
        throw error;
      }
    },

    deleteDoseLog: async (petId, doseLogId) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const repository = new DoseLogRepository(userId, petId);
        await repository.delete(doseLogId);
        set((state) => ({
          doseLogs: {
            ...state.doseLogs,
            [petId]: (state.doseLogs[petId] || []).filter(
              (log) => log.id !== doseLogId
            ),
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete dose log',
          isLoading: false,
        });
        throw error;
      }
    },
  }))
);
