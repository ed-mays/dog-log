import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePetsStore } from './pets.store';
import { useAuthStore } from './auth.store';
import { petService } from '@services/petService';
import type { Pet, PetCreateInput } from '@features/pets/types';

// Mock the petService with a factory that defines its mock functions internally
vi.mock('@services/petService', () => ({
  petService: {
    fetchActivePets: vi.fn(),
    addPet: vi.fn(),
    editPet: vi.fn(),
    archivePet: vi.fn(),
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

  // Use vi.mocked to get a typed mocked version of petService and useAuthStore
  const mockedPetService = vi.mocked(petService);
  const mockedAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    // Reset the store state before each test
    usePetsStore.setState({ pets: [], isFetching: false, fetchError: null });
    // Clear all mocks before each test to reset call counts and return values
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('fetchPets (errors)', () => {
    it('sets fetchError and clears isFetching when service rejects; preserves pets', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      const existing = [{ id: 'e1', name: 'Existing' }];
      usePetsStore.setState({
        pets: existing as unknown as Pet[],
        isFetching: false,
        fetchError: null,
      });
      const err = new Error('load failed');
      mockedPetService.fetchActivePets.mockRejectedValueOnce(err);

      await usePetsStore.getState().fetchPets();

      expect(usePetsStore.getState().isFetching).toBe(false);
      expect(usePetsStore.getState().fetchError).toBe(err);
      expect(usePetsStore.getState().pets).toEqual(existing);
    });

    it('uses fallback error when service rejects with undefined (nullish coalescing branch)', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      usePetsStore.setState({ pets: [], isFetching: false, fetchError: null });
      // reject with undefined to trigger the fallback new Error('Failed to load pets.')
      mockedPetService.fetchActivePets.mockRejectedValueOnce(
        undefined as unknown as Error
      );

      await usePetsStore.getState().fetchPets();

      expect(usePetsStore.getState().isFetching).toBe(false);
      expect(usePetsStore.getState().fetchError).toBeInstanceOf(Error);
      expect(usePetsStore.getState().fetchError?.message).toBe(
        'Failed to load pets.'
      );
    });
  });

  describe('updatePet', () => {
    it('throws if user not authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: null });
      await expect(
        usePetsStore.getState().updatePet('1', { name: 'New' })
      ).rejects.toThrow('User is not authenticated.');
      expect(mockedPetService.editPet).not.toHaveBeenCalled();
    });

    it('updates an existing pet when service resolves', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      const initialPet = {
        id: 'p1',
        name: 'Old',
        breed: 'Hound',
        birthDate: new Date('2020-01-01'),
      } as unknown as Pet;
      usePetsStore.setState({
        pets: [initialPet],
        isFetching: false,
        fetchError: null,
      });
      const updated = {
        name: 'New',
        breed: 'Mix',
        birthDate: new Date('2021-01-01'),
      };
      mockedPetService.editPet.mockResolvedValueOnce(
        updated as unknown as Partial<Pet>
      );

      await usePetsStore.getState().updatePet('p1', { name: 'New' });

      const [saved] = usePetsStore.getState().pets as unknown as Array<{
        id: string;
        name: string;
        breed: string;
      }>;
      expect(saved.id).toBe('p1');
      expect(saved.name).toBe('New');
      expect(saved.breed).toBe('Mix');
      expect(mockedPetService.editPet).toHaveBeenCalledWith(
        mockUser.uid,
        'p1',
        expect.objectContaining({ name: 'New' })
      );
    });
  });

  describe('deletePet', () => {
    it('throws if user not authenticated', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: null });
      await expect(usePetsStore.getState().deletePet('p1')).rejects.toThrow(
        'User is not authenticated.'
      );
      expect(mockedPetService.archivePet).not.toHaveBeenCalled();
    });

    it('removes a pet when service resolves', async () => {
      mockedAuthStore.getState.mockReturnValue({ user: mockUser });
      const p1 = { id: 'p1', name: 'A' } as unknown as Pet;
      const p2 = { id: 'p2', name: 'B' } as unknown as Pet;
      usePetsStore.setState({
        pets: [p1, p2],
        isFetching: false,
        fetchError: null,
      });
      mockedPetService.archivePet.mockResolvedValueOnce(undefined);

      await usePetsStore.getState().deletePet('p1');

      const ids = (
        usePetsStore.getState().pets as unknown as Array<{ id: string }>
      ).map((p) => p.id);
      expect(ids).toEqual(['p2']);
      expect(mockedPetService.archivePet).toHaveBeenCalledWith(
        mockUser.uid,
        'p1'
      );
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

  describe('reset', () => {
    it('restores initial state (pets=[], isFetching=false, fetchError=null)', () => {
      // set non-initial state
      usePetsStore.setState({
        pets: [{ id: 'p1', name: 'X' }] as unknown as Pet[],
        isFetching: true,
        fetchError: new Error('x'),
      });
      // call reset
      usePetsStore.getState().reset();
      const { pets, isFetching, fetchError } = usePetsStore.getState();
      expect(pets).toEqual([]);
      expect(isFetching).toBe(false);
      expect(fetchError).toBeNull();
    });
  });
});
