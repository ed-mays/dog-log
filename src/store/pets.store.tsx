import { create } from 'zustand';
import type { Pet } from '@features/petManagement/types';
import { PetService } from '@/services/petService';

interface PetsState {
  pets: Pet[];
  loading: boolean;
  error: unknown | string | null;
  fetchPets: () => Promise<void>;
  addPet: (pet: Pet) => void;
}

export const usePetsStore = create<PetsState>((set) => ({
  pets: [],
  loading: false,
  error: null,
  addPet: (pet: Pet) => set((state) => ({ pets: [...state.pets, pet] })),
  fetchPets: async () => {
    set({ loading: true, error: null });
    try {
      // Delegate to service layer
      const pets = [];
      set({ pets, loading: false });
    } catch (err) {
      set({ error: err ?? new Error('Failed to load pets.'), loading: false });
    }
  },
}));
