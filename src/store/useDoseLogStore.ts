import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { doseLogService } from '@services/doseLogService';
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
        const logs = await doseLogService.getAllDoseLogs(userId, petId);
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
        const newLog = await doseLogService.addDoseLog(userId, petId, input);
        set((state) => ({
          doseLogs: {
            ...state.doseLogs,
            [petId]: [newLog, ...(state.doseLogs[petId] || [])],
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
        const updatedLog = await doseLogService.updateDoseLog(
          userId,
          petId,
          doseLogId,
          updates
        );
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
        await doseLogService.deleteDoseLog(userId, petId, doseLogId);
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
