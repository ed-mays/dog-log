import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePetsStore } from './pets.store';
import { useAuthStore } from './auth.store';
import { PetRepository } from '@repositories/petRepository';

// Mock the PetRepository
vi.mock('@repositories/petRepository');

// Mock the auth store
vi.mock('./auth.store');

describe('usePetsStore', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    // Reset the store state before each test
    usePetsStore.setState({ pets: [], isFetching: false, fetchError: null });
    vi.clearAllMocks();
  });

  describe('fetchPets', () => {
    it('should do nothing if user is not authenticated', async () => {
      (useAuthStore.getState as vi.Mock).mockReturnValue({ user: null });

      await usePetsStore.getState().fetchPets();

      expect(PetRepository.prototype.getActivePets).not.toHaveBeenCalled();
      expect(usePetsStore.getState().isFetching).toBe(false);
    });

    it('should fetch pets if user is authenticated', async () => {
      (useAuthStore.getState as vi.Mock).mockReturnValue({ user: mockUser });
      const mockPets = [{ id: '1', name: 'Fido' }];
      (PetRepository.prototype.getActivePets as vi.Mock).mockResolvedValue(
        mockPets
      );

      await usePetsStore.getState().fetchPets();

      expect(PetRepository.prototype.getActivePets).toHaveBeenCalledWith();
      expect(usePetsStore.getState().pets).toEqual(mockPets);
      expect(usePetsStore.getState().isFetching).toBe(false);
    });
  });

  describe('addPet', () => {
    const newPetInput = { name: 'Rex', species: 'Dog' };

    it('should throw an error if user is not authenticated', async () => {
      (useAuthStore.getState as vi.Mock).mockReturnValue({ user: null });

      await expect(usePetsStore.getState().addPet(newPetInput)).rejects.toThrow(
        'User is not authenticated.'
      );
      expect(PetRepository.prototype.createPet).not.toHaveBeenCalled();
    });

    it('should add a pet if user is authenticated', async () => {
      (useAuthStore.getState as vi.Mock).mockReturnValue({ user: mockUser });
      const newPet = { id: 'new id', ...newPetInput };
      (PetRepository.prototype.createPet as vi.Mock).mockResolvedValue(newPet);

      await usePetsStore.getState().addPet(newPetInput);

      expect(PetRepository.prototype.createPet).toHaveBeenCalledWith(
        newPetInput
      );
      expect(usePetsStore.getState().pets).toContainEqual(newPet);
    });
  });
});
