import { create } from 'zustand';
import type { Pet } from '@features/petManagement/types';

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
      // Mocked async fetch, swap with Firebase logic later
      const mockPets: Pet[] = [
        { id: '1', name: 'Fido', breed: 'Labrador' },
        { id: '2', name: 'Bella', breed: 'Beagle' },
      ];
      // Removed artificial delay for faster dev/test loops
      set({ pets: mockPets, loading: false });
    } catch (err) {
      set({ error: err ?? new Error('Failed to load pets.'), loading: false });
    }
  },
}));
