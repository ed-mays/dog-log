import { create } from 'zustand';
import type { Pet, PetCreateInput } from '@features/petManagement/types';
import { useUiStore } from './ui.store';
import { PetRepository } from '@repositories/petRepository';

interface PetsState {
  pets: Pet[];
  fetchPets: () => Promise<void>;
  addPet: (pet: PetCreateInput) => Promise<void>;
}

const petRepository = new PetRepository();

export const usePetsStore = create<PetsState>((set) => ({
  pets: [],
  addPet: async (pet: PetCreateInput) => {
    const newPet = await petRepository.createPet(pet);
    set((state) => ({ pets: [...state.pets, newPet] }));
  },
  fetchPets: async () => {
    const { setLoading, setError } = useUiStore.getState();
    setLoading(true);
    setError(null);
    try {
      const pets: Pet[] = await petRepository.getActivePets();
      set({ pets });
    } catch (err) {
      setError((err as Error) ?? new Error('Failed to load pets.'));
    } finally {
      setLoading(false);
    }
  },
}));
