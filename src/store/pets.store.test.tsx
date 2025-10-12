import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePetsStore } from './pets.store';
import { useAuthStore } from './auth.store';
import { petService } from '@services/petService';
import type { PetCreateInput } from '@features/pets/types';

// Mock the petService with a factory
vi.mock('@services/petService', () => ({
  petService: {
    fetchActivePets: vi.fn(),
    addPet: vi.fn(),
  },
}));

// Mock the auth store with a factory to replicate the store's structure
vi.mock('@store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

describe('usePetsStore', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  // Cast the mocked services to be able to attach mock implementations
  const mockedPetService = petService as vi.Mocked<typeof petService>;
  const mockedAuthStore = useAuthStore as vi.Mocked<typeof useAuthStore>;

  beforeEach(() => {
    // Reset the store state before each test
    usePetsStore.setState({ pets: [], isFetching: false, fetchError: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchPets', () => {
    it('should do nothing if user is not authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: null });

      await usePetsStore.getState().fetchPets();

      expect(mockedPetService.fetchActivePets).not.toHaveBeenCalled();
      expect(usePetsStore.getState().isFetching).toBe(false);
    });

    it('should fetch pets if user is authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      const mockPets = [{ id: '1', name: 'Fido' }];
      mockedPetService.fetchActivePets.mockResolvedValue(mockPets);

      await usePetsStore.getState().fetchPets();

      expect(mockedPetService.fetchActivePets).toHaveBeenCalledWith(
        mockUser.uid
      );
      expect(usePetsStore.getState().pets).toEqual(mockPets);
      expect(usePetsStore.getState().isFetching).toBe(false);
    });
  });

  describe('addPet', () => {
    const newPetInput: PetCreateInput = {
      name: 'Rex',
      breed: 'Dog',
      birthDate: new Date(),
    };

    it('should throw an error if user is not authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: null });

      await expect(usePetsStore.getState().addPet(newPetInput)).rejects.toThrow(
        'User is not authenticated.'
      );
      expect(mockedPetService.addPet).not.toHaveBeenCalled();
    });

    it('should add a pet if user is authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      const newPet = {
        id: 'new-id',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUser.uid,
        ...newPetInput,
      };
      mockedPetService.addPet.mockResolvedValue(newPet);

      await usePetsStore.getState().addPet(newPetInput);

      expect(mockedPetService.addPet).toHaveBeenCalledWith(
        mockUser.uid,
        newPetInput
      );
      expect(usePetsStore.getState().pets).toContainEqual(newPet);
    });
  });
});
