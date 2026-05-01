import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { petMedicationService } from '@services/petMedicationService';
import type {
  PetMedication,
  PetMedicationCreateInput,
  PetMedicationUpdateInput,
} from '@features/medications/types';
import { useAuthStore } from '@store/auth.store';

export interface PetMedicationState {
  petMedications: Record<string, PetMedication[]>; // Keyed by petId
  isLoading: boolean;
  error: string | null;
  fetchPetMedications: (petId: string) => Promise<void>;
  addPetMedication: (
    petId: string,
    input: PetMedicationCreateInput
  ) => Promise<void>;
  updatePetMedication: (
    petId: string,
    medicationId: string,
    updates: PetMedicationUpdateInput
  ) => Promise<void>;
  deactivatePetMedication: (
    petId: string,
    medicationId: string
  ) => Promise<void>;
}

export const usePetMedicationStore = create(
  devtools<PetMedicationState>((set) => ({
    petMedications: {},
    isLoading: false,
    error: null,

    fetchPetMedications: async (petId) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const medications = await petMedicationService.getActivePetMedications(
          userId,
          petId
        );
        set((state) => ({
          petMedications: {
            ...state.petMedications,
            [petId]: medications,
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch pet medications',
          isLoading: false,
        });
      }
    },

    addPetMedication: async (petId, input) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const newMedication = await petMedicationService.addPetMedication(
          userId,
          petId,
          input
        );
        set((state) => ({
          petMedications: {
            ...state.petMedications,
            [petId]: [...(state.petMedications[petId] || []), newMedication],
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to add pet medication',
          isLoading: false,
        });
        throw error;
      }
    },

    updatePetMedication: async (petId, medicationId, updates) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        const updatedMedication =
          await petMedicationService.updatePetMedication(
            userId,
            petId,
            medicationId,
            updates
          );
        set((state) => ({
          petMedications: {
            ...state.petMedications,
            [petId]: (state.petMedications[petId] || []).map((med) =>
              med.id === medicationId ? updatedMedication : med
            ),
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update pet medication',
          isLoading: false,
        });
        throw error;
      }
    },

    deactivatePetMedication: async (petId, medicationId) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      set({ isLoading: true, error: null });
      try {
        await petMedicationService.deactivatePetMedication(
          userId,
          petId,
          medicationId
        );
        set((state) => ({
          petMedications: {
            ...state.petMedications,
            [petId]: (state.petMedications[petId] || []).filter(
              (med) => med.id !== medicationId
            ),
          },
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to deactivate pet medication',
          isLoading: false,
        });
        throw error;
      }
    },
  }))
);
