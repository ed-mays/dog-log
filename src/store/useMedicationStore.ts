import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MedicationRepository } from '@repositories/MedicationRepository';
import type {
  MedicationDefinition,
  MedicationDefinitionCreateInput,
  MedicationDefinitionUpdateInput,
} from '@features/medications/types';

interface MedicationState {
  medications: MedicationDefinition[];
  isLoading: boolean;
  error: string | null;
  fetchMedications: () => Promise<void>;
  addMedication: (input: MedicationDefinitionCreateInput) => Promise<void>;
  updateMedication: (
    id: string,
    updates: MedicationDefinitionUpdateInput
  ) => Promise<void>;
  archiveMedication: (id: string) => Promise<void>;
}

const repository = new MedicationRepository();

export const useMedicationStore = create(
  devtools<MedicationState>((set) => ({
    medications: [],
    isLoading: false,
    error: null,

    fetchMedications: async () => {
      set({ isLoading: true, error: null });
      try {
        const medications = await repository.getActiveList({
          orderBy: 'name',
        });
        set({ medications, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch medications',
          isLoading: false,
        });
      }
    },

    addMedication: async (input) => {
      set({ isLoading: true, error: null });
      try {
        const newMedication = await repository.createMedication(input);
        set((state) => ({
          medications: [...state.medications, newMedication].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to add medication',
          isLoading: false,
        });
        throw error;
      }
    },

    updateMedication: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        const updatedMedication = await repository.updateMedication(
          id,
          updates
        );
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? updatedMedication : med
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update medication',
          isLoading: false,
        });
        throw error;
      }
    },

    archiveMedication: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await repository.archive(id);
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to archive medication',
          isLoading: false,
        });
        throw error;
      }
    },
  }))
);
