import { create } from 'zustand';
import type { Pet, PetCreateInput } from '@features/petManagement/types';
import { PetRepository } from '@repositories/petRepository';
import { useAuthStore } from './auth.store';

interface PetsState {
  pets: Pet[];
  isFetching: boolean;
  fetchError: Error | null;
  fetchPets: () => Promise<void>;
  addPet: (pet: PetCreateInput) => Promise<void>;
}

const petRepository = new PetRepository();

export const usePetsStore = create<PetsState>((set) => ({
  pets: [],
  isFetching: false,
  fetchError: null,
  addPet: async (pet: PetCreateInput) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    const newPet = await petRepository.createPet(pet);
    set((state) => ({ pets: [...state.pets, newPet] }));
  },
  fetchPets: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      // Do nothing if user is not authenticated
      return;
    }
    set({ isFetching: true, fetchError: null });
    try {
      const pets: Pet[] = await petRepository.getActivePets();
      set({ pets, isFetching: false });
    } catch (err) {
      const error = (err as Error) ?? new Error('Failed to load pets.');
      set({ fetchError: error, isFetching: false });
    }
  },
}));
