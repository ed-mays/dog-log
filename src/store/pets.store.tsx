import { create } from 'zustand';
import type {
  Pet,
  PetCreateInput,
  PetUpdateInput,
} from '@features/petManagement/types';
import { petService } from '@services/petService';
import { useAuthStore } from './auth.store';

interface PetsState {
  pets: Pet[];
  isFetching: boolean;
  fetchError: Error | null;
  fetchPets: () => Promise<void>;
  addPet: (pet: PetCreateInput) => Promise<void>;
  updatePet: (
    id: string,
    updates: Partial<Pick<Pet, 'name' | 'breed' | 'birthDate'>>
  ) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
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
  updatePet: async (id, updates) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User is not authenticated.');
    const updated = await petService.editPet(
      user.uid,
      id,
      updates as PetUpdateInput
    );
    set((state) => ({
      pets: state.pets.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },
  deletePet: async (id) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User is not authenticated.');
    await petService.archivePet(user.uid, id);
    set((state) => ({ pets: state.pets.filter((p) => p.id !== id) }));
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
