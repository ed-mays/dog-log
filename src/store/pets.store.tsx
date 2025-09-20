import { create } from 'zustand';
import type { Pet } from '@features/petManagement/types';

interface PetsState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
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
      await new Promise((res) => setTimeout(res, 2000));
      set({ pets: mockPets, loading: false });
    } catch {
      set({ error: 'Failed to load pets.', loading: false });
    }
  },
}));
