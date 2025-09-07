import { create } from 'zustand';
// Import the Dog type from your DogList module to keep type definitions DRY
import type { Dog } from '@components/DogList';

interface DogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
  fetchDogs: () => Promise<void>;
}

export const useDogsStore = create<DogsState>((set) => ({
  dogs: [],
  loading: false,
  error: null,
  fetchDogs: async () => {
    set({ loading: true, error: null });
    try {
      // Mocked async fetch, swap with Firebase logic later
      const mockDogs: Dog[] = [
        { id: '1', name: 'Fido', breed: 'Labrador' },
        { id: '2', name: 'Bella', breed: 'Beagle' },
      ];
      await new Promise((res) => setTimeout(res, 100));
      set({ dogs: mockDogs, loading: false });
    } catch {
      set({ error: 'Failed to load dogs.', loading: false });
    }
  },
}));
