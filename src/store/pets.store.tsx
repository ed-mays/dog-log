import { create } from 'zustand';
import type { Pet, PetCreateInput } from '@features/petManagement/types';
import { petService } from '@services/petService';
import { useAuthStore } from './auth.store';

interface PetsState {
  pets: Pet[];
  isFetching: boolean;
  fetchError: Error | null;
  fetchPets: () => Promise<void>;
  addPet: (pet: PetCreateInput) => Promise<void>;
  reset: () => void;
}

const initialState = {
  pets: [],
  isFetching: false,
  fetchError: null,
};

export const usePetsStore = create<PetsState>((set) => ({
  ...initialState,
  addPet: async (pet: PetCreateInput) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    const newPet = await petService.addPet(user.uid, pet);
    set((state) => ({ pets: [...state.pets, newPet] }));
  },
  fetchPets: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ pets: [], isFetching: false, fetchError: null });
      return;
    }
    set({ isFetching: true, fetchError: null });
    try {
      const pets: Pet[] = await petService.fetchActivePets(user.uid);
      set({ pets, isFetching: false });
    } catch (err) {
      const error = (err as Error) ?? new Error('Failed to load pets.');
      set({ fetchError: error, isFetching: false });
    }
  },
  reset: () => {
    set(initialState);
  },
}));
