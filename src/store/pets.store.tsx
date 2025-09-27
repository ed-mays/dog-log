import { create } from 'zustand';
import type { Pet } from '@features/petManagement/types';
import { useUiStore } from './ui.store';

interface PetsState {
  pets: Pet[];
  fetchPets: () => Promise<void>;
  addPet: (pet: Pet) => void;
}

export const usePetsStore = create<PetsState>((set) => ({
  pets: [],
  addPet: (pet: Pet) => set((state) => ({ pets: [...state.pets, pet] })),
  fetchPets: async () => {
    const { setLoading, setError } = useUiStore.getState();
    setLoading(true);
    setError(null);
    try {
      // Delegate to service layer
      const pets = [];
      set({ pets });
    } catch (err) {
      setError(err as Error ?? new Error('Failed to load pets.'));
    } finally {
      setLoading(false);
    }
  },
}));
